# Changelog

Notable changes to `react-pts-canvas` are recorded here. The project follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) categories. A release
version is assigned by the maintainer before publication.

## Unreleased

These changes exist in the repository but are not part of npm 0.5.2.

### Added

- React 19 support while retaining React 18.2 compatibility.
- ESM and CommonJS conditional exports with `.d.ts` and `.d.cts` declarations.
- `containerProps`, `canvasProps`, `containerRef`, and `canvasRef` for explicit
  DOM targeting.
- Structured pointer, touch, passive-touch, and keyboard input controls.
- Declarative `players`, visibility-aware playback, frame throttling, and a
  pixel-density cap.
- `onReady` cleanup, `onDispose`, and phase-aware `onError` lifecycle hooks.
- `getContainer()` on the imperative ref.
- Browser, packed-consumer, package-metadata, and gallery smoke validation.
- A local React 19 example gallery under `examples/gallery`.

### Changed

- **Breaking:** the Pts peer range is now `^1.0.0`. Install Pts 1.0 alongside
  this release; 0.5.2 accepted Pts `^0.12.8`.
- Callback functions, background, resizing, input, playback, refresh, frame
  timing, players, and tempo now update without reconstructing `CanvasSpace`.
- Rendering-context changes reconstruct the space with deterministic cleanup.
- Pts and React remain external instead of being included in the runtime bundle.
- `HandleResizeFn` now uses Pts `Bound` and an optional event.
- The package entry preserves React's `"use client"` directive.
- The example gallery moved into the package repository as a private workspace.
- Legacy DOM and `touch` props are deprecated in favor of explicit nested APIs.

### Fixed

- Animation callbacks now receive legitimate zero-valued timestamps.
- Strict Mode no longer delivers stale ready callbacks or leaks owned spaces.
- Callback changes no longer require a new canvas lifecycle.
- Player, input, readiness, and disposal cleanup is deterministic.
- `onPtsResize` receives `undefined` rather than `null` when Pts 1.0 reports a
  resize without a DOM event.

## 0.5.2 - 2024-05-03

Last published release before the current modernization. It supports React 18
and Pts `^0.12.8`; consult that release's package declarations for its exact
contract.

Earlier release history is available in the repository's Git history.
