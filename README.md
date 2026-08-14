# react-pts-canvas

[![npm](https://img.shields.io/npm/v/react-pts-canvas.svg)](https://www.npmjs.com/package/react-pts-canvas)

`react-pts-canvas` is a small React component for drawing with
[Pts](https://ptsjs.org). It owns a `CanvasSpace`, connects it to React's
lifecycle, and passes the current space and form to typed callback props.

![react-pts-canvas example](https://github.com/williamngan/react-pts-canvas/raw/master/cover.png)

## Install

```bash
pnpm add react-pts-canvas pts
```

React 18.2 and React 19 are supported. The package ships ESM, CommonJS, and
TypeScript declarations; React, React DOM, and Pts remain peer dependencies.
The published entries include React's `"use client"` boundary and can be
imported by React Server Component frameworks.

## Quick start

```tsx
import { PtsCanvas } from "react-pts-canvas";

export function Drawing() {
  return (
    <PtsCanvas
      background="#182034"
      containerProps={{ className: "drawing" }}
      canvasProps={{ "aria-label": "Interactive point drawing" }}
      input={{ pointer: true, touch: true }}
      onAnimate={(space, form) => {
        form.fillOnly("#f6c").point(space.pointer, 12);
      }}
    >
      This drawing requires canvas support.
    </PtsCanvas>
  );
}
```

The wrapper needs an explicit size:

```css
.drawing {
  width: 100%;
  height: 24rem;
}
```

## Lifecycle callbacks

```tsx
<PtsCanvas
  onReady={(space, form, bound) => {
    // CanvasSpace is initialized and sized.
    return () => {
      // Optional cleanup for resources created here.
    };
  }}
  onAnimate={(space, form, time, frameTime) => {
    // Called by Pts for every active animation frame.
  }}
  onPtsResize={(space, form, bound, event) => {
    // Called when Pts resizes the CanvasSpace.
  }}
  onAction={(space, form, type, x, y, event) => {
    // Receives enabled pointer, touch, and keyboard actions.
  }}
  onDispose={(space, form) => {
    // Called immediately before the owned CanvasSpace is disposed.
  }}
  onError={(error, { phase, space, form }) => {
    // Handles errors from async Pts callbacks and consumer cleanup.
  }}
/>
```

When `onError` is provided, callback errors are reported and swallowed so the
application can decide how to recover. Without it, errors retain their normal
throwing behavior. This is important because React error boundaries do not
catch errors from animation frames or native event handlers.

Callback props can change without replacing the `CanvasSpace`. `background`,
`resize`, input bindings, `play`, `refresh`, `minFrameTime`, `players`, and
`tempo` also update in place. Rendering-context options (`retina`, `offscreen`,
and the effective pixel density) recreate the space and run `onReady` cleanup
followed by `onDispose`.

## Input

Pointer and touch input remain enabled by default for compatibility. Prefer the
explicit input API in new code:

```tsx
<PtsCanvas
  input={{
    pointer: true,
    touch: true,
    touchPassive: false,
    keyboard: true,
    keyboardTarget: "canvas",
  }}
/>
```

Canvas keyboard input is focus-scoped and automatically gives the canvas
`tabIndex={0}` unless `canvasProps.tabIndex` overrides it. Set
`keyboardTarget: "document"` only when global shortcuts are intentional.

## DOM elements and refs

`containerProps` targets the wrapper and `canvasProps` targets the canvas.
Native canvas props supplied at the top level remain supported; matching values
inside `canvasProps` take precedence. Children are rendered as accessible
canvas fallback content.

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const containerRef = useRef<HTMLDivElement>(null);

<PtsCanvas
  classPrefix="sketch"
  containerProps={{ className: "frame", "aria-label": "Drawing region" }}
  canvasProps={{ className: "surface", "aria-label": "Generative drawing" }}
  canvasRef={canvasRef}
  containerRef={containerRef}
/>;
```

The older `name`, `className`, `style`, `canvasClassName`, `canvasStyle`, and
`touch` props remain functional but are deprecated in favor of `classPrefix`,
the element prop objects, and `input`.

## Players and playback

Additional Pts players can be managed declaratively:

```tsx
<PtsCanvas players={[player, tempo]} play={running} refresh={false} />
```

The component adds and removes players by identity without reconstructing the
space. `tempo` remains as a convenience prop. A player object should be owned by
one mounted canvas at a time.

`play={false}` stops the animation loop; returning it to `true` replays the
space. Use `minFrameTime` to limit frame frequency.

## Performance controls

```tsx
<PtsCanvas
  maxPixelDensity={2}
  minFrameTime={1000 / 30}
  pauseWhenHidden
  pauseWhenOffscreen
/>
```

- `maxPixelDensity` caps either the device pixel ratio or an explicit
  `pixelDensity` to control canvas memory and fill cost.
- `minFrameTime` delegates to Pts frame throttling.
- `pauseWhenHidden` stops while the document is hidden.
- `pauseWhenOffscreen` uses `IntersectionObserver` to stop outside the viewport.

These controls are opt-in except for the existing retina default.

## Imperative access

The forwarded ref exposes the owned objects without transferring lifecycle
ownership:

```tsx
import { useRef } from "react";
import { PtsCanvas, type PtsCanvasImperative } from "react-pts-canvas";

export function ControlledDrawing() {
  const ref = useRef<PtsCanvasImperative>(null);

  return (
    <>
      <button onClick={() => ref.current?.getSpace()?.playOnce(500)}>
        Draw one burst
      </button>
      <PtsCanvas ref={ref} play={false} />
    </>
  );
}
```

The getters are `getSpace`, `getForm`, `getPlayer`, `getCanvas`, and
`getContainer`. They return `undefined` or `null` before mount and after
cleanup.

## Example gallery

The maintained React 19 and Vite gallery lives in
[`examples/gallery`](https://github.com/williamngan/react-pts-canvas/tree/master/examples/gallery)
and always imports this workspace's local component source. It covers pointer
drawing, animation control, data visualization, and sound.

[Open the live gallery](https://williamngan.github.io/react-pts-canvas/)

## Development

This repository requires Node 20.19 or newer for Vite 8 and uses pnpm:

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the private gallery in `examples/gallery`. The gallery's Vite
and TypeScript configurations resolve `react-pts-canvas` directly to
`src/index.tsx`, rather than to the generated `dist` package. Changes in either
`src/` or `examples/gallery/src/` therefore appear through Vite's hot reload;
you do **not** need to rebuild the library during normal development.

Use the commands below from the repository root:

| Command               | Use it for                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm dev`            | Develop the component and gallery together with hot reload.                                                |
| `pnpm test:watch`     | Rerun the library's browser tests while editing.                                                           |
| `pnpm test`           | Run the library's browser tests once.                                                                      |
| `pnpm build`          | Generate the publishable library files in root `dist/`. This is needed for packaging, not for `pnpm dev`.  |
| `pnpm build:examples` | Generate the gallery site in `examples/gallery/dist/`.                                                     |
| `pnpm preview`        | Preview the already-built gallery; run `pnpm build:examples` first.                                        |
| `pnpm check:library`  | Validate only the publishable library: lint, types, tests, builds, packed consumers, and package metadata. |
| `pnpm check:examples` | Check formatting, then validate and smoke-test the gallery.                                                |
| `pnpm check`          | Run the complete library and gallery validation before committing.                                         |

The library check includes Oxlint, strict TypeScript, ten Playwright-backed
browser tests, ESM/CommonJS builds, packed JavaScript and TypeScript consumer
tests, and package validation. CI exercises the library under React 18.2 and
React 19, then deploys the React 19 gallery separately.

## License

Apache License 2.0. Copyright © 2019-current William Ngan and contributors.
