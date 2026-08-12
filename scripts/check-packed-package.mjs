import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporaryDirectory = await mkdtemp(
  join(tmpdir(), "react-pts-canvas-package-"),
);

function run(command, arguments_, cwd = temporaryDirectory) {
  execFileSync(command, arguments_, { cwd, stdio: "inherit" });
}

async function linkDependency(name) {
  const source = await realpath(join(repository, "node_modules", name));
  const target = join(temporaryDirectory, "node_modules", name);
  await mkdir(dirname(target), { recursive: true });
  await symlink(source, target, "dir");
}

try {
  const archiveDirectory = join(temporaryDirectory, "archives");
  const modulesDirectory = join(temporaryDirectory, "node_modules");
  await mkdir(archiveDirectory);
  await mkdir(modulesDirectory);

  run("pnpm", ["pack", "--pack-destination", archiveDirectory], repository);
  const archive = (await readdir(archiveDirectory)).find((file) =>
    file.endsWith(".tgz"),
  );
  if (!archive) throw new Error("pnpm pack did not create an archive");

  run("tar", ["-xzf", join(archiveDirectory, archive), "-C", modulesDirectory]);
  const packageDirectory = join(modulesDirectory, "react-pts-canvas");
  await rename(join(modulesDirectory, "package"), packageDirectory);

  for (const dependency of [
    "react",
    "react-dom",
    "pts",
    "@types/react",
    "@types/react-dom",
  ]) {
    await linkDependency(dependency);
  }

  await writeFile(
    join(temporaryDirectory, "package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`,
  );
  await writeFile(
    join(temporaryDirectory, "check-esm.mjs"),
    `import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PtsCanvas } from "react-pts-canvas";

const markup = renderToStaticMarkup(
  React.createElement(PtsCanvas, {
    canvasProps: { "aria-label": "packed canvas" },
    classPrefix: "packed",
    input: { pointer: false, touch: false },
  }, "Canvas fallback"),
);
if (!markup.includes("packed-canvas") || !markup.includes("Canvas fallback")) {
  throw new Error(\`Unexpected server markup: \${markup}\`);
}
`,
  );
  await writeFile(
    join(temporaryDirectory, "check-cjs.cjs"),
    `const library = require("react-pts-canvas");
if (typeof library.PtsCanvas !== "object" && typeof library.PtsCanvas !== "function") {
  throw new Error("CommonJS entry did not export PtsCanvas");
}
`,
  );
  await writeFile(
    join(temporaryDirectory, "check-types.tsx"),
    `import { PtsCanvas, type PtsCanvasProps } from "react-pts-canvas";

const props = {
  classPrefix: "typed",
  containerProps: { "aria-label": "container" },
  input: { keyboard: true, keyboardTarget: "canvas" },
  maxPixelDensity: 2,
  pauseWhenHidden: true,
} satisfies PtsCanvasProps;
const canvas = <PtsCanvas {...props}>Canvas fallback</PtsCanvas>;
void canvas;
`,
  );
  await writeFile(
    join(temporaryDirectory, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          noEmit: true,
          skipLibCheck: false,
          strict: true,
          target: "ES2022",
        },
        include: ["check-types.tsx"],
      },
      null,
      2,
    )}\n`,
  );

  const esm = await readFile(join(packageDirectory, "dist/index.js"), "utf8");
  const commonjs = await readFile(
    join(packageDirectory, "dist/index.cjs"),
    "utf8",
  );
  if (!esm.startsWith('"use client";')) {
    throw new Error("ESM entry lost its React client boundary");
  }
  if (!commonjs.startsWith('"use client";')) {
    throw new Error("CommonJS entry lost its React client boundary");
  }
  if (!esm.includes('from "pts"') || !commonjs.includes('require("pts")')) {
    throw new Error("Pts must remain external in both runtime entries");
  }
  if (Buffer.byteLength(esm) > 15_000 || Buffer.byteLength(commonjs) > 15_000) {
    throw new Error("Runtime bundle exceeded the 15 kB package guardrail");
  }

  run(process.execPath, ["check-esm.mjs"]);
  run(process.execPath, ["check-cjs.cjs"]);
  run(join(repository, "node_modules/.bin/tsc"), [
    "--project",
    "tsconfig.json",
  ]);
} finally {
  await rm(temporaryDirectory, { force: true, recursive: true });
}
