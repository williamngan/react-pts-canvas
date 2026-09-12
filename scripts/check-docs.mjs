import { execFileSync } from "node:child_process";
import {
  access,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const externalUrls = new Set();
const typedCodeFences = [];
const typeCheckedCodeFences = [];
const ignoredDirectories = new Set([
  ".git",
  ".vitest-attachments",
  "dist",
  "node_modules",
]);
const requiredDocumentation = [
  "README.md",
  "API.md",
  "MIGRATION.md",
  "CHANGELOG.md",
  "AGENTS.md",
  "llms.txt",
];

function report(message) {
  failures.push(message);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectFiles(join(directory, entry.name))));
      }
    } else {
      files.push(join(directory, entry.name));
    }
  }
  return files;
}

function markdownAnchors(contents) {
  const anchors = new Set();
  const duplicates = new Map();
  for (const match of contents.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const heading = match[1]
      .replace(/<[^>]*>/g, "")
      .replace(/[`*_~]/g, "")
      .trim()
      .toLowerCase();
    const base = heading.replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
    const duplicate = duplicates.get(base) ?? 0;
    duplicates.set(base, duplicate + 1);
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }
  return anchors;
}

function normalizeLinkTarget(rawTarget) {
  const target = rawTarget.trim();
  if (target.startsWith("<") && target.endsWith(">")) {
    return target.slice(1, -1);
  }
  return target.split(/\s+["']/u, 1)[0] ?? target;
}

async function checkLocalLink(sourcePath, rawTarget) {
  const target = normalizeLinkTarget(rawTarget);
  if (
    target.startsWith("http://") ||
    target.startsWith("https://") ||
    target.startsWith("mailto:")
  ) {
    if (target.startsWith("https://")) externalUrls.add(target);
    return;
  }

  const [rawPath = "", rawAnchor] = target.split("#", 2);
  const decodedPath = decodeURIComponent(rawPath);
  const targetPath = decodedPath
    ? resolve(dirname(sourcePath), decodedPath)
    : sourcePath;
  if (!(await exists(targetPath))) {
    report(
      `${relative(repository, sourcePath)} links to missing ${decodedPath || target}`,
    );
    return;
  }

  if (rawAnchor && extname(targetPath).toLowerCase() === ".md") {
    const targetContents = await readFile(targetPath, "utf8");
    const anchor = decodeURIComponent(rawAnchor).toLowerCase();
    if (!markdownAnchors(targetContents).has(anchor)) {
      report(
        `${relative(repository, sourcePath)} links to missing anchor #${rawAnchor} in ${relative(repository, targetPath)}`,
      );
    }
  }
}

function collectExternalUrls(contents) {
  for (const match of contents.matchAll(/https:\/\/[^\s<>)"']+/g)) {
    externalUrls.add(match[0].replace(/[.,;:]$/u, ""));
  }
}

function repositoryPathForUrl(url) {
  const prefixes = [
    "https://github.com/williamngan/react-pts-canvas/blob/master/",
    "https://github.com/williamngan/react-pts-canvas/raw/master/",
    "https://raw.githubusercontent.com/williamngan/react-pts-canvas/master/",
  ];
  for (const prefix of prefixes) {
    if (url.startsWith(prefix))
      return join(repository, url.slice(prefix.length));
  }

  const treePrefix =
    "https://github.com/williamngan/react-pts-canvas/tree/master/";
  if (url.startsWith(treePrefix)) {
    return join(repository, url.slice(treePrefix.length));
  }
  return undefined;
}

async function checkExternalUrl(url) {
  const localRepositoryPath = repositoryPathForUrl(url);
  if (localRepositoryPath) {
    if (!(await exists(localRepositoryPath))) {
      report(`Repository URL maps to missing path: ${url}`);
    }
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Range: "bytes=0-0",
        "User-Agent": "react-pts-canvas-doc-check",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    await response.body?.cancel();
    if (response.status === 404 || response.status === 410) {
      report(`External documentation link returned ${response.status}: ${url}`);
    } else if (response.status >= 500) {
      report(`External documentation link returned ${response.status}: ${url}`);
    }
  } catch (error) {
    report(
      `Could not reach external documentation link ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function checkCodeFences(path, contents) {
  const fenceCount = contents.match(/^```/gm)?.length ?? 0;
  if (fenceCount % 2 !== 0) {
    report(`${relative(repository, path)} has an unclosed code fence`);
  }

  let index = 0;
  for (const match of contents.matchAll(/```(ts|tsx)\n([\s\S]*?)```/g)) {
    index += 1;
    typedCodeFences.push({
      code: match[2],
      extension: match[1],
      name: `${relative(repository, path).replaceAll(/[^a-zA-Z0-9]/g, "-")}-${index}`,
    });
  }

  for (const match of contents.matchAll(
    /<!--\s*docs-typecheck\s*-->\s*```tsx\n([\s\S]*?)```/g,
  )) {
    typeCheckedCodeFences.push(match[1]);
  }
}

async function checkTypedCodeFences() {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "react-pts-canvas-docs-"),
  );
  try {
    const paths = [];
    for (const fence of typedCodeFences) {
      const path = join(temporaryDirectory, `${fence.name}.${fence.extension}`);
      await writeFile(path, fence.code);
      paths.push(path);
    }

    execFileSync(
      join(repository, "node_modules/.bin/tsc"),
      [
        "--ignoreConfig",
        "--noEmit",
        "--noCheck",
        "--noResolve",
        "--skipLibCheck",
        "--target",
        "ES2022",
        "--module",
        "ESNext",
        "--jsx",
        "preserve",
        ...paths,
      ],
      { cwd: repository, encoding: "utf8", stdio: "pipe" },
    );
  } catch (error) {
    const output = [error?.stdout, error?.stderr].filter(Boolean).join("\n");
    report(`TypeScript documentation fences did not parse:\n${output}`);
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

async function typeCheckSelectedCodeFences() {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "react-pts-canvas-doc-types-"),
  );
  try {
    await symlink(
      join(repository, "node_modules"),
      join(temporaryDirectory, "node_modules"),
      "dir",
    );
    const files = [];
    for (const [index, code] of typeCheckedCodeFences.entries()) {
      const path = join(temporaryDirectory, `example-${index + 1}.tsx`);
      await writeFile(path, code);
      files.push(path);
    }
    await writeFile(
      join(temporaryDirectory, "tsconfig.json"),
      `${JSON.stringify(
        {
          compilerOptions: {
            jsx: "react-jsx",
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            module: "ESNext",
            moduleResolution: "Bundler",
            noEmit: true,
            paths: {
              "react-pts-canvas": [
                relative(temporaryDirectory, join(repository, "src/index.tsx")),
              ],
            },
            skipLibCheck: false,
            strict: true,
            target: "ES2022",
          },
          files,
        },
        null,
        2,
      )}\n`,
    );
    execFileSync(
      join(repository, "node_modules/.bin/tsc"),
      ["--project", join(temporaryDirectory, "tsconfig.json")],
      { cwd: repository, encoding: "utf8", stdio: "pipe" },
    );
  } catch (error) {
    const output = [error?.stdout, error?.stderr].filter(Boolean).join("\n");
    report(`Selected documentation examples did not type-check:\n${output}`);
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

for (const documentation of requiredDocumentation) {
  if (!(await exists(join(repository, documentation)))) {
    report(`Missing required documentation: ${documentation}`);
  }
}

const allFiles = await collectFiles(repository);
const documentationFiles = allFiles.filter((path) =>
  [".md", ".txt"].includes(extname(path).toLowerCase()),
);
for (const path of documentationFiles) {
  const contents = await readFile(path, "utf8");
  checkCodeFences(path, contents);
  collectExternalUrls(contents);
  for (const match of contents.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    await checkLocalLink(path, match[1]);
  }
}

await checkTypedCodeFences();
await typeCheckSelectedCodeFences();

for (const relativePath of [
  "examples/gallery/index.html",
  "examples/gallery/src/App.tsx",
]) {
  const contents = await readFile(join(repository, relativePath), "utf8");
  collectExternalUrls(contents);
}

const source = await readFile(join(repository, "src/index.tsx"), "utf8");
const api = await readFile(join(repository, "API.md"), "utf8");
const propsBlock = source.match(
  /export type PtsCanvasProps = NativeCanvasProps & \{([\s\S]*?)^\};/m,
);
if (!propsBlock) {
  report("Could not locate PtsCanvasProps for API coverage");
} else {
  for (const match of propsBlock[1].matchAll(/^\s{2}(\w+)\?:/gm)) {
    if (!api.includes(`\`${match[1]}\``)) {
      report(`API.md does not name public prop ${match[1]}`);
    }
  }
}

const publicExports = new Set([
  ...[...source.matchAll(/^export type (\w+)/gm)].map((match) => match[1]),
  ...[...source.matchAll(/^export const (\w+)/gm)].map((match) => match[1]),
]);
for (const exportedName of publicExports) {
  if (!api.includes(`\`${exportedName}\``)) {
    report(`API.md does not name public export ${exportedName}`);
  }
}

const packageMetadata = JSON.parse(
  await readFile(join(repository, "package.json"), "utf8"),
);
for (const packagedDocumentation of [
  "API.md",
  "CHANGELOG.md",
  "MIGRATION.md",
  "llms.txt",
]) {
  if (!packageMetadata.files?.includes(packagedDocumentation)) {
    report(`package.json does not publish ${packagedDocumentation}`);
  }
}

for (const plan of [
  "plans/MODERNIZATION-PLAN.md",
  "plans/MONOREPO-MIGRATION-PLAN.md",
]) {
  const contents = await readFile(join(repository, plan), "utf8");
  if (!contents.includes("Status: completed")) {
    report(`${plan} is not marked as a completed historical record`);
  }
}

const galleryApp = await readFile(
  join(repository, "examples/gallery/src/App.tsx"),
  "utf8",
);
if (galleryApp.includes("onReady={loadSound}")) {
  report("The displayed sound example incorrectly loads audio in onReady");
}
if (!galleryApp.match(/const soundCode = `[\s\S]*?useEffect\(\(\) =>/u)) {
  report("The displayed sound example does not show React effect ownership");
}

if (process.env.SANDBOX_OFFLINE === "1") {
  console.log(
    "Skipping external documentation links because SANDBOX_OFFLINE=1.",
  );
} else {
  await Promise.all([...externalUrls].sort().map(checkExternalUrl));
}

if (failures.length > 0) {
  throw new Error(`Documentation checks failed:\n- ${failures.join("\n- ")}`);
}

console.log(
  `Checked ${documentationFiles.length} documentation files, ${typeCheckedCodeFences.length} typed examples, ${publicExports.size} public exports, and ${externalUrls.size} external links.`,
);
