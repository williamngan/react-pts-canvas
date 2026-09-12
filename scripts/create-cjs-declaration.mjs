import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const distributionDirectory = resolve(import.meta.dirname, "../dist");

await copyFile(
  resolve(distributionDirectory, "index.d.ts"),
  resolve(distributionDirectory, "index.d.cts"),
);
