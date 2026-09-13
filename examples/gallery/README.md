# Documentation site

This private Vite application is the documentation site published at
[react.ptsjs.org](https://react.ptsjs.org). It demonstrates the local
`react-pts-canvas` workspace package with an overview, install and quick-start
guidance, a reference section, and live examples. Its source and tooling are
intentionally separate from the publishable package at the repository root.

The reference section is generated at build time from the root
[`API.md`](../../API.md) by the `markdown-sections` plugin in `vite.config.ts`,
so the site never carries a hand-maintained copy of the props tables. The
displayed quick start mirrors the README. Example code blocks are condensed
from the maintained components in `src/`; resource acquisition such as audio
loading belongs in React effects with cleanup rather than in a Pts drawing
callback.

The visual design follows [ptsjs.org](https://ptsjs.org): the same system font
stack, 12px base size, `#123` text, `#42e` accent, guide-style section menu,
and a cover canvas drawn by `PtsCanvas` itself, running the
`circle.withinBound` demo from ptsjs.org.

Run it from the repository root:

```bash
pnpm dev
pnpm check:examples
```

Vite and TypeScript resolve `react-pts-canvas` directly to `../../src`, so app
development always exercises unpublished component changes. Edits in the root
`src/` directory are hot-reloaded by `pnpm dev`; rebuilding the library first
is not necessary. Run root `pnpm build` only when you need to generate or check
the publishable `dist` package. The root packed-package checks independently
verify those public exports.

To test an unpublished sibling Pts checkout, set `PTS_PATH` to its repository
root:

```bash
PTS_PATH=../pts pnpm dev
```

The production build is deployed to GitHub Pages by the root workflow and
served at the `react.ptsjs.org` custom domain declared in `public/CNAME`. Build
output in `dist/` is generated and is not committed or published to npm.
