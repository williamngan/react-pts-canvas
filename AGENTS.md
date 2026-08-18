# Repository instructions for coding agents

These instructions apply to the entire `react-pts-canvas` repository.

## Read first

1. Read `llms.txt` for the compact project contract.
2. Read `API.md` before changing public props, callbacks, refs, DOM output, or
   lifecycle behavior.
3. Read `MIGRATION.md` before changing compatibility or deprecated APIs.
4. Treat files in `plans/` as completed implementation records unless a user
   explicitly asks to revive a plan.

## Sources of truth

- `src/index.tsx` owns runtime behavior and exported types.
- `API.md` is the canonical prose API contract.
- `test/PtsCanvas.spec.tsx` verifies browser lifecycle behavior.
- `scripts/check-packed-package.mjs` verifies the published artifact.
- `examples/gallery/src/PtsExamples.tsx` owns maintained example behavior.
- `dist/` and `examples/gallery/dist/` are generated and ignored; never
  hand-edit them.

## Invariants

- The component owns exactly one active `CanvasSpace` per mounted rendering
  context.
- Callback, background, resize, input, playback, refresh, timing, player, and
  tempo changes update live.
- `retina`, `offscreen`, and effective pixel-density changes replace the space.
- Replacement/unmount order is returned `onReady` cleanup, `onDispose`, input
  teardown, then `CanvasSpace.dispose()`.
- The component owns disposal; consumer-facing examples must not dispose the
  returned space.
- Pts actions only dispatch while the space is playing. Do not document
  `onAction` as a wake mechanism for `play={false}`.
- Preserve the `"use client"` boundary, ESM/CommonJS exports, external peers,
  and React 18.2/19 compatibility.
- Deprecated aliases remain supported until a documented release decision says
  otherwise.

## Workflow

- Use pnpm because the repository has `pnpm-lock.yaml`.
- Use Node `^20.19.0` or `>=22.12.0`.
- Run focused checks while editing and `pnpm check` before completion.
- Browser tests require Playwright Chromium; see `README.md#development` for
  setup.
- Do not change the package version or publish unless the user explicitly asks.
- Preserve user changes and avoid unrelated refactors.

## Documentation synchronization

When changing the public contract, update all affected surfaces in the same
change: source JSDoc, `API.md`, task-oriented README guidance, migration notes,
the Unreleased changelog, `llms.txt` if a core invariant changed, and any
displayed gallery snippet. Run `pnpm check:docs` to catch mechanical drift.
