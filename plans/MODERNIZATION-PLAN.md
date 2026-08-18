# React Pts Canvas modernization plan

> **Status: completed (August 2026).** This is a historical implementation
> record, not an active work queue. Use [`../API.md`](../API.md) for the current
> public contract and the [README development section](../README.md#development)
> for current repository instructions.

## Objective

Bring `react-pts-canvas` up to date with the rebuilt Pts package and the current
React/Vite toolchain while preserving its small public component API. The
published package must contain only the wrapper implementation and declarations;
React and Pts must remain peer dependencies rather than being copied into the
bundle.

The maintained example gallery is now a private workspace package under
`examples/gallery`. Release publishing and selecting the eventual npm version
are not part of this change.

## Audit findings

- The current Vite build externalizes React but bundles all of Pts, producing a
  roughly 260 kB library entry despite declaring Pts as a peer dependency.
- Package metadata has no `exports` map, no CommonJS entry, no `sideEffects`
  declaration, and no explicit supported Node range.
- The lifecycle effect captures initial callbacks, ignores legitimate animation
  frames where `time` or `frameTime` is zero, and does not rebuild when immutable
  CanvasSpace setup options change.
- Callback, tempo, input binding, play/pause, and cleanup behavior are spread
  across effects without automated tests. React Strict Mode can therefore hide
  leaked or duplicate Pts spaces.
- `HandleResizeFn` describes a `Group`, while current Pts passes a `Bound` to an
  `IPlayer.resize` callback.
- The README documents stale props and an incorrect forwarded-ref example.
- The repository has no tests or full validation command, and its pnpm lockfile
  predates the declared package-manager generation.

## Toolchain decisions

- Use React and React DOM 19.2 for development while accepting React 18.2 and
  React 19 as peers. Keep `forwardRef` so the package remains compatible with
  both React majors.
- Use Vite 8.2 and `@vitejs/plugin-react` 6 for the gallery and library build.
- Use TypeScript 7.0. The current `typescript-eslint` release supports only
  TypeScript versions below 6.1, so use Oxlint's native TypeScript/React rules
  rather than installing an unsupported parser/compiler combination.
- Use Vitest 4 Browser Mode with Playwright Chromium for component tests. A real
  browser is required because CanvasSpace depends on canvas, ResizeObserver,
  pointer events, and animation frames.
- Use Prettier for deterministic formatting and `publint` plus
  `@arethetypeswrong/cli` for packed-package validation.

## Implementation

1. Rework the component lifecycle around one owned CanvasSpace, stable callback
   dispatch, explicit setup-option reconstruction, tempo replacement, input
   binding, playback control, and complete cleanup.
2. Preserve existing wrapper props and imperative getters. Add explicit canvas
   styling/class props so wrapper styling no longer consumes the canvas's native
   `style` and `className` attributes ambiguously.
3. Correct resize callback typing to `Bound`, keep action types aligned with
   Pts, and make source/declaration exports intentional.
4. Produce ESM and CommonJS entries plus declarations. Externalize `react`,
   `react/jsx-runtime`, and `pts`, and add modern conditional package exports.
5. Add browser tests for mount/ready/animate/action, prop updates, play and input
   controls, setup reconstruction, tempo replacement, imperative access, Strict
   Mode, and unmount cleanup.
6. Refresh the gallery and README to demonstrate the supported API and remove
   stale Vite scaffolding.
7. Regenerate the pnpm lockfile with exact current tool versions.

## Acceptance criteria

- Formatting, linting, TypeScript checking, Browser Mode tests, and production
  builds all pass on Node 20.19+ (including the repository's Node 24 sandbox).
- The packed package passes `publint` and `attw` for both ESM and CommonJS.
- Packed JavaScript does not contain the Pts implementation and declares React
  and Pts only as peers.
- A consumer build using the rebuilt Pts package succeeds and renders a working
  CanvasSpace in Chromium.
- The private workspace gallery passes its own type, lint, build, and browser
  smoke checks against this implementation.

## Implementation result

The component now owns a single tested CanvasSpace lifecycle, dispatches current
callbacks without rebuilding, accepts zero-valued animation times, and updates
background, resize, input, players, tempo, playback, refresh, and frame
throttling in place. Only rendering-context options reconstruct the space.
Browser tests cover these contracts in Chromium and under React Strict Mode.

The follow-up lifecycle hardening added explicit `containerProps`, `canvasProps`,
DOM refs, input controls, additional players, callback cleanup/error reporting,
canvas fallback content, hidden/offscreen suspension, and a pixel-density cap.
The legacy DOM and `touch` aliases remain available with deprecation markers.
Pts itself now owns stable event callback identities, immediately cancels RAF
and readiness work during disposal, and makes input binding idempotent.

The package emits an approximately 9 kB ESM entry and 7 kB CommonJS entry,
compared with the previous roughly 260 kB Pts-inclusive entry. Pts and React are external peer
dependencies. Conditional exports provide `.d.ts` and `.d.cts` declarations,
and the packed artifact passes both `publint` and `attw` with no findings.

The final validation includes formatting, Oxlint, TypeScript 7, ten Browser
Mode tests, React 18.2/19 CI coverage, both library builds, package analysis,
packed ESM/CommonJS/TypeScript consumer checks, and the workspace gallery's
four-canvas Chromium smoke test.
