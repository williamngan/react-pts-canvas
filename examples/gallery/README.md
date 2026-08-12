# Example gallery

This private Vite application demonstrates the local `react-pts-canvas`
workspace package. Its source and tooling are intentionally separate from the
publishable package at the repository root.

Run it from the repository root:

```bash
pnpm dev
pnpm check:examples
```

Vite and TypeScript resolve `react-pts-canvas` directly to `../../src`, so app
development always exercises unpublished component changes. The root packed
package checks independently verify the public `dist` exports.

To test an unpublished sibling Pts checkout, set `PTS_PATH` to its repository
root:

```bash
PTS_PATH=../pts pnpm dev
```

The production build is deployed to GitHub Pages by the root workflow. Build
output in `dist/` is generated and is not committed or published to npm.
