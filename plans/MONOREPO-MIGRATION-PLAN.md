# Example workspace migration plan

## Objective

Move the maintained `react-pts-canvas-examples` gallery into the
`react-pts-canvas` repository while keeping library code, application code,
validation, publishing, and deployment clearly separated.

The npm package remains rooted at the repository root. Its name, version,
exports, package files, and publishing commands must not be changed by this
migration. The example becomes a private pnpm workspace package and must always
consume the local library source during development and validation.

## Target layout

```text
react-pts-canvas/
├── src/                         # publishable library source
├── test/                        # library browser tests
├── examples/
│   └── gallery/                 # private Vite application
│       ├── public/
│       ├── scripts/
│       └── src/
├── scripts/                     # package-level validation
├── plans/
├── package.json                 # published npm package
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.lib.json
└── vite.config.ts               # library build and tests
```

The old small root demo is removed rather than maintained alongside the larger
gallery. The library's existing `lib/` implementation moves to `src/`, and its
test moves to `test/`, so the two top-level concerns are unambiguous.

## Workspace and dependency policy

- Add only `examples/*` to `pnpm-workspace.yaml`; the root package is already a
  workspace project.
- Declare `react-pts-canvas: "workspace:*"` in the private gallery. This makes a
  registry fallback impossible and rewrites to the package version if the
  private application is ever packed for inspection.
- Keep React, React DOM, Pts, and application tooling declared in the gallery's
  own `package.json`. Hoisting may share storage, but package boundaries remain
  explicit.
- Use a source alias in the gallery's Vite configuration for fast HMR and for
  testing unpublished changes. Packed-package tests remain the authority for
  npm exports, ESM/CommonJS, declarations, SSR, and externalization.
- Keep a single root lockfile and one package-manager version.

## Commands and validation boundaries

Root commands will be organized by responsibility:

- `dev`, `build:examples`, and `preview` target the gallery.
- `build`, `test`, `typecheck`, `lint`, and `check:package` validate the library.
- `check:library` runs the complete publishable-package validation.
- `check:examples` runs formatting, linting, type checking, production build,
  and the Chromium gallery smoke test.
- `check` runs formatting followed by both compartments.

Formatting is orchestrated once from the root. The gallery inherits the root
Prettier and Oxlint policy, with the library test plugin enabled only for the
root library check.

## Continuous integration and Pages

Use one repository workflow with separate jobs:

1. Run library validation for React 19 and React 18.2.
2. Run the gallery check once with React 19 and upload its production output on
   non-pull-request runs.
3. Deploy that artifact through the protected `github-pages` environment after
   the gallery job succeeds.

The gallery must be built from `examples/gallery` and the uploaded artifact
must be `examples/gallery/dist`. The old repository and its Pages settings are
not modified from this checkout; it can later be archived or replaced with a
redirect after the new site is enabled.

## Migration sequence

1. Move `lib/index.tsx` and `lib/hooks.ts` into `src/`; move the browser spec to
   `test/`; update Vite and TypeScript paths.
2. Remove the root demo entry, HTML, and app styles.
3. Import the maintained gallery source, public assets, smoke script, and app
   configuration into `examples/gallery`.
4. Add workspace metadata and convert the gallery dependency to `workspace:*`.
5. Consolidate scripts, ignores, formatter/linter configuration, CI, and Pages.
6. Update README paths, development instructions, live-site expectations, and
   the modernization record.
7. Regenerate the lockfile and run library checks, isolated React 18 checks,
   gallery build/smoke tests, and package analysis.

## Acceptance criteria

- `pnpm install --frozen-lockfile` succeeds from the repository root.
- The root npm tarball still contains only `dist`, license, package metadata,
  and README files; no example source or assets are published.
- The library passes formatting, Oxlint, strict TypeScript, ten Chromium tests,
  ESM/CommonJS builds, packed consumer tests, `publint`, and `attw`.
- The same library source type-checks and passes browser tests under React 18.2.
- The gallery resolves the local workspace package, builds four canvases, and
  passes its Playwright smoke test without browser errors.
- CI keeps library compatibility testing independent from gallery deployment.
- Package versions remain unchanged for the maintainer's manual release step.

## Implementation result

The root remains the `react-pts-canvas@0.5.2` publishable package. Its source
now lives in `src/`, its ten-test Browser Mode suite lives in `test/`, and the
redundant root Vite demo has been removed. The maintained four-canvas app and
its assets are under the private `@react-pts-canvas/gallery` package in
`examples/gallery`.

The two projects share one pnpm lockfile. The gallery declares
`react-pts-canvas: "workspace:*"`, while Vite and TypeScript resolve the local
source for immediate development feedback. Root scripts expose explicit
library and gallery checks, and the GitHub workflow validates React 18.2 and 19
for the library independently from the React 19 gallery and Pages deployment.

Validation passed for a frozen workspace install, formatting, Oxlint, strict
TypeScript 7, all ten library browser tests under React 18.2 and 19, both
library formats, packed ESM/CommonJS/TypeScript consumers, `publint`, `attw`,
the gallery production build, and its four-canvas Chromium smoke test. The npm
tarball contains no gallery code or assets. The old examples checkout was left
unchanged for a later archive or redirect decision.
