import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import MarkdownIt from "markdown-it";
import { defineConfig, type Alias, type Plugin } from "vite";

const repositoryUrl = "https://github.com/williamngan/react-pts-canvas";

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

/** Same heading slug rule as `scripts/check-docs.mjs`, so anchors match. */
function slugify(heading: string): string {
  return heading
    .replace(/<[^>]*>/g, "")
    .replace(/[`*_~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

type MarkdownSection = { id: string; title: string; html: string };

/**
 * Renders a Markdown file at build time and splits it on `##` headings.
 * `import sections from "../../../API.md?sections"` yields
 * `MarkdownSection[]`, so the site shows the canonical reference without a
 * runtime Markdown parser or a hand-maintained copy.
 */
function markdownSections(idPrefix: string): Plugin {
  const suffix = "?sections";
  const markdown = new MarkdownIt({ html: false, linkify: false });
  const defaultRender = markdown.renderer.rules.link_open;
  markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const href = token?.attrGet("href") ?? "";
    if (href.startsWith("#")) {
      token?.attrSet("href", `#${idPrefix}${href.slice(1)}`);
    } else if (/^\.\/[\w./-]+\.md(#.*)?$/.test(href)) {
      token?.attrSet("href", `${repositoryUrl}/blob/master/${href.slice(2)}`);
    }
    return defaultRender
      ? defaultRender(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
  };
  markdown.renderer.rules.heading_open = (
    tokens,
    index,
    options,
    _env,
    self,
  ) => {
    const inline = tokens[index + 1];
    tokens[index]?.attrSet(
      "id",
      `${idPrefix}${slugify(inline?.content ?? "")}`,
    );
    return self.renderToken(tokens, index, options);
  };
  markdown.renderer.rules.table_open = () =>
    '<div class="table-scroll"><table>';
  markdown.renderer.rules.table_close = () => "</table></div>";

  return {
    name: "markdown-sections",
    enforce: "pre",
    resolveId(source, importer) {
      if (!source.endsWith(suffix) || !importer) return null;
      return resolve(importer, "..", source);
    },
    // Editing the Markdown file re-renders its `?sections` module in place
    // instead of reloading the page, so `pnpm dev` stays instant for docs.
    hotUpdate({ file }) {
      if (!file.endsWith(".md")) return;
      const module = this.environment.moduleGraph.getModuleById(
        `${file}${suffix}`,
      );
      return module ? [module] : [];
    },
    load(id) {
      if (!id.endsWith(suffix)) return null;
      const path = id.slice(0, -suffix.length);
      this.addWatchFile(path);
      const source = readFileSync(path, "utf8");
      const sections: MarkdownSection[] = [];
      for (const chunk of source.split(/^(?=## )/m).slice(1)) {
        const newline = chunk.indexOf("\n");
        const title = chunk.slice(3, newline).trim();
        sections.push({
          id: `${idPrefix}${slugify(title)}`,
          title: title.replace(/`/g, ""),
          html: markdown.render(chunk.slice(newline + 1)),
        });
      }
      return `export default ${JSON.stringify(sections)};`;
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [markdownSections("api-"), react()],
  resolve: {
    alias: localAliases(),
    dedupe: ["pts", "react", "react-dom"],
  },
});
