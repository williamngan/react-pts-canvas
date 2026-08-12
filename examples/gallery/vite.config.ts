import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, type Alias } from "vite";

function localAliases(): Alias[] {
  const aliases: Alias[] = [
    {
      find: /^react-pts-canvas$/,
      replacement: resolve(import.meta.dirname, "../../src/index.tsx"),
    },
  ];
  const ptsPath = process.env.PTS_PATH;

  if (ptsPath) {
    aliases.push({
      find: /^pts$/,
      replacement: resolve(
        import.meta.dirname,
        "../..",
        ptsPath,
        "src/_module.ts",
      ),
    });
  }

  return aliases;
}

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: localAliases(),
    dedupe: ["pts", "react", "react-dom"],
  },
});
