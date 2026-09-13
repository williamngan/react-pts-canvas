declare module "*.md?sections" {
  /** One `##` section of a Markdown document rendered to HTML at build time. */
  export type MarkdownSection = { id: string; title: string; html: string };
  const sections: MarkdownSection[];
  export default sections;
}
