import { spawn } from "node:child_process";
import { resolve } from "node:path";

import { chromium } from "playwright";

const host = "127.0.0.1";
const port = 4173;
const address = `http://${host}:${port}`;
const vite = resolve(import.meta.dirname, "../node_modules/vite/bin/vite.js");
const serverOutput = [];
const server = spawn(
  process.execPath,
  [vite, "preview", "--host", host, "--port", String(port), "--strictPort"],
  {
    cwd: resolve(import.meta.dirname, ".."),
    stdio: ["ignore", "pipe", "pipe"],
  },
);

for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => serverOutput.push(chunk.toString()));
}

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Vite preview exited early:\n${serverOutput.join("")}`);
    }

    try {
      const response = await fetch(address);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }

  throw new Error(`Timed out waiting for ${address}`);
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));

  await page.goto(address, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("canvas");
  await page.waitForFunction(() => {
    const canvases = [...document.querySelectorAll("canvas")];
    return (
      canvases.length === 4 &&
      canvases.every((canvas) => canvas.width > 100 && canvas.height > 100)
    );
  });
  await page.waitForFunction(() =>
    [...document.querySelectorAll("canvas")].every((canvas) => {
      const context = canvas.getContext("2d");
      if (!context) return false;
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      for (let index = 3; index < pixels.length; index += 4) {
        if ((pixels[index] ?? 0) > 0) return true;
      }
      return false;
    }),
  );

  const painted = await page.locator("canvas").evaluateAll((canvases) =>
    canvases.map((canvas) => {
      const context = canvas.getContext("2d");
      if (!context) return false;
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      for (let index = 3; index < pixels.length; index += 4) {
        if ((pixels[index] ?? 0) > 0) return true;
      }
      return false;
    }),
  );
  if (!painted.every(Boolean)) {
    throw new Error(`Expected every canvas to paint a background: ${painted}`);
  }

  await page.getByRole("button", { name: "Pause animation" }).click();
  await page.getByRole("button", { name: "Resume animation" }).waitFor();
  await page.getByLabel("Gaussian variance").fill("0.5");
  await page
    .locator("canvas")
    .first()
    .hover({ position: { x: 80, y: 80 } });

  if (errors.length > 0) {
    throw new Error(`Browser errors:\n${errors.join("\n")}`);
  }

  console.log(
    `Rendered ${painted.length} interactive Pts canvases with no browser errors.`,
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
