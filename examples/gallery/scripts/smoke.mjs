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

  // Invalid percent escapes must not crash the initial hash-scroll effect.
  await page.goto(`${address}/#%`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("canvas");
  await page.waitForFunction(() => {
    const canvases = [...document.querySelectorAll("canvas")];
    return (
      canvases.length === 6 &&
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

  // Documentation structure: hero, reference generated from API.md, and a
  // section menu whose every link resolves to an element on the page.
  await page
    .getByRole("heading", { level: 1, name: "react-pts-canvas" })
    .waitFor();
  for (const heading of [
    "Quick start",
    "Reference",
    "Space and playback props",
    "Lifecycle callback props",
    "Examples",
  ]) {
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
  }
  const danglingLinks = await page
    .locator("#menu a, #post a[href^='#']")
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href") ?? "")
        .filter(
          (href) =>
            href.startsWith("#") && !document.getElementById(href.slice(1)),
        ),
    );
  if (danglingLinks.length > 0) {
    throw new Error(
      `Menu or reference links without a target: ${danglingLinks.join(", ")}`,
    );
  }
  const propRows = await page
    .locator("#api-space-and-playback-props table tbody tr")
    .count();
  if (propRows < 10) {
    throw new Error(
      `Expected the props table from API.md, found ${propRows} rows`,
    );
  }

  await page.getByRole("button", { name: "Pause animation" }).click();
  await page.getByRole("button", { name: "Resume animation" }).waitFor();
  await page.getByLabel("Gaussian variance").fill("0.5");
  const chart = page.getByLabel("Interactive Gaussian bar chart", {
    exact: true,
  });
  const chartBeforeResize = await chart.evaluate((canvas) => canvas.width);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction((oldWidth) => {
    const canvas = document.querySelector(
      'canvas[aria-label="Interactive Gaussian bar chart"]',
    );
    if (!canvas || canvas.width === oldWidth) return false;
    const pixels = canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height).data;
    // A stopped chart must redraw its bars after ResizeObserver clears
    // the buffer. A background alone is not a successful chart render.
    for (let index = 0; index < pixels.length; index += 4) {
      if (
        pixels[index + 3] > 0 &&
        (pixels[index] !== 37 ||
          pixels[index + 1] !== 220 ||
          pixels[index + 2] !== 162)
      )
        return true;
    }
    return false;
  }, chartBeforeResize);
  await page
    .locator("canvas")
    .first()
    .hover({ position: { x: 80, y: 80 } });

  if (errors.length > 0) {
    throw new Error(`Browser errors:\n${errors.join("\n")}`);
  }

  console.log(
    `Rendered ${painted.length} interactive Pts canvases, ${propRows} documented props, and no browser errors.`,
  );
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
