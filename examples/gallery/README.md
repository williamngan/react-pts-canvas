# Example gallery

This private Vite application demonstrates the local `react-pts-canvas`
workspace package. Its source and tooling are intentionally separate from the
publishable package at the repository root.

The gallery is a teaching surface, not the canonical API reference. Use the
root [`API.md`](../../API.md) for exact props, defaults, and lifecycle behavior.
Displayed code blocks are condensed from the maintained components in `src/`;
resource acquisition such as audio loading belongs in React effects with
cleanup rather than in a Pts drawing callback.

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

The production build is deployed to GitHub Pages by the root workflow. Build
output in `dist/` is generated and is not committed or published to npm.
