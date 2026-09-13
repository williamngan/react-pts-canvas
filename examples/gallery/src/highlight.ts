/**
 * Minimal syntax highlighter shared by the site's code blocks and the
 * build-time Markdown renderer. It produces the same `tok-*` classes that
 * cli.ptsjs.org uses, so code panels look alike across the Pts sites.
 */

const keywords = new Set([
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "of",
  "readonly",
  "return",
  "satisfies",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
]);

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const scriptToken =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/g;

function highlightScript(code: string): string {
  let html = "";
  let last = 0;
  for (const match of code.matchAll(scriptToken)) {
    const [text, comment, string, number, call, word] = match;
    html += escapeHtml(code.slice(last, match.index));
    last = match.index + text.length;
    const escaped = escapeHtml(text);
    if (comment) html += `<span class="tok-comment">${escaped}</span>`;
    else if (string) html += `<span class="tok-string">${escaped}</span>`;
    else if (number) html += `<span class="tok-number">${escaped}</span>`;
    else if (call && keywords.has(call))
      html += `<span class="tok-key">${escaped}</span>`;
    else if (call) html += `<span class="tok-function">${escaped}</span>`;
    else if (word && keywords.has(word))
      html += `<span class="tok-key">${escaped}</span>`;
    else html += escaped;
  }
  return html + escapeHtml(code.slice(last));
}

function highlightShell(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const escaped = escapeHtml(line);
      return escaped.startsWith("$ ")
        ? `<span class="tok-prompt">$</span>${escaped.slice(1)}`
        : escaped;
    })
    .join("\n");
}

const cssToken =
  /(\/\*[\s\S]*?\*\/)|("[^"\n]*"|'[^'\n]*')|(-?\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms)?\b)|([\w-]+)(?=\s*:)/g;

function highlightCss(code: string): string {
  let html = "";
  let last = 0;
  for (const match of code.matchAll(cssToken)) {
    const [text, comment, string, number, property] = match;
    html += escapeHtml(code.slice(last, match.index));
    last = match.index + text.length;
    const escaped = escapeHtml(text);
    if (comment) html += `<span class="tok-comment">${escaped}</span>`;
    else if (string) html += `<span class="tok-string">${escaped}</span>`;
    else if (number) html += `<span class="tok-number">${escaped}</span>`;
    else if (property) html += `<span class="tok-function">${escaped}</span>`;
    else html += escaped;
  }
  return html + escapeHtml(code.slice(last));
}

/** Return HTML for `code` in the given language, or escaped text otherwise. */
export function highlight(code: string, language: string): string {
  switch (language) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "json":
      return highlightScript(code);
    case "css":
      return highlightCss(code);
    case "bash":
    case "sh":
    case "shell":
      return highlightShell(code);
    default:
      return escapeHtml(code);
  }
}

/** Markup for one code panel; shared by the site and the Markdown renderer. */
export function codePanel(code: string, language: string): string {
  const label = language
    ? `<span>${escapeHtml(language)}</span>`
    : "<span></span>";
  return (
    `<div class="code-panel"><div class="panel-head">${label}` +
    `<button class="copy-button" type="button" aria-label="Copy code">Copy</button></div>` +
    `<pre tabindex="0"><code>${highlight(code, language)}</code></pre></div>`
  );
}
