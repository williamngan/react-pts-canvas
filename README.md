# react-pts-canvas

[![npm](https://img.shields.io/npm/v/react-pts-canvas.svg)](https://www.npmjs.com/package/react-pts-canvas)

`react-pts-canvas` is a small React component for drawing with
[Pts](https://ptsjs.org). It owns a Pts `CanvasSpace`, connects that space to
React's lifecycle, and passes the current space and form to typed callbacks.

![react-pts-canvas example](https://github.com/williamngan/react-pts-canvas/raw/master/cover.png)

The repository can contain changes newer than the npm release. See the
[changelog](./CHANGELOG.md) for version status and the
[migration guide](./MIGRATION.md) before upgrading.

## Install

Install the wrapper and its Pts peer dependency in an existing React app:

```bash
pnpm add react-pts-canvas pts
```

```bash
npm install react-pts-canvas pts
```

The package requires Pts `^1.0.0`, React `^18.2.0` or React 19, and the
matching React DOM version. It publishes ESM, CommonJS, and TypeScript
declarations. React, React DOM, and Pts are peer dependencies rather than
bundled code. Projects on `react-pts-canvas@0.5.2` must also move from Pts 0.12
to Pts 1.0; see the [migration guide](./MIGRATION.md#upgrade-pts-to-10).

## Quick start

<!-- docs-typecheck -->

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

Give the wrapper an explicit size. Pts measures the wrapper and sizes the canvas
to match it; canvas `width` and `height` attributes are not layout controls.

```css
.drawing {
  width: 100%;
  height: 24rem;
}
```

The drawing methods in this example belong to Pts. Start with the
[Pts guide](https://ptsjs.org/guide/) and
[CanvasSpace documentation](https://ptsjs.org/docs/?p=CanvasSpace) if the
`space`, `form`, or `Pt` APIs are new to you.

## Lifecycle

`PtsCanvas` creates one `CanvasSpace` for the mounted canvas. Callback props
always use their latest functions without replacing that space.

```tsx
<PtsCanvas
  onReady={(space, form, bound) => {
    // The CanvasSpace is initialized and sized.
    const resource = createDrawingResource(bound);

    return () => {
      // Runs before onDispose when this space is replaced or unmounted.
      resource.dispose();
    };
  }}
  onAnimate={(space, form, time, frameTime) => {
    // Runs for each rendered Pts frame while the space is playing.
  }}
  onPtsResize={(space, form, bound, event) => {
    // Runs for the initial size and later Pts resize operations.
  }}
  onAction={(space, form, type, x, y, event) => {
    // Receives enabled pointer, touch, and keyboard actions while playing.
  }}
  onDispose={(space, form) => {
    // Runs immediately before the component disposes its CanvasSpace.
  }}
  onError={(error, { phase, space, form }) => {
    // Handles initialization, callback, cleanup, and disposal errors.
  }}
/>
```

The initial Pts resize callback normally runs before `onReady`. If `onReady`
returns a function, the component treats it as owned cleanup. On replacement or
unmount the order is: `onReady` cleanup, `onDispose`, then `CanvasSpace.dispose`.

With `onError`, errors from the owned lifecycle are reported and swallowed so
the application can choose how to recover. Without it, they keep their normal
throwing behavior. React error boundaries do not catch errors from animation
frames or native event handlers. Invalid numeric props throw during React
rendering and do not go through `onError`.

Most behavior updates the existing space. `retina`, `offscreen`, and changes to
the effective pixel density replace it. Replacement runs the same cleanup and
disposal sequence before calling `onReady` for the new space.

## Input and playback

Pointer and touch input are enabled by default for compatibility. New code
should use the explicit input object:

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

Canvas-scoped keyboard input adds `tabIndex={0}` unless
`canvasProps.tabIndex` is supplied. Use `keyboardTarget: "document"` only for
intentional global shortcuts.

Pts dispatches pointer, touch, and keyboard actions only while the space is
playing. Consequently, `play={false}`, `pauseWhenHidden`, and
`pauseWhenOffscreen` also suspend `onAction` and pointer tracking. An external
React control can still use the imperative ref to call `playOnce()`.

```tsx
<PtsCanvas play={running} minFrameTime={1000 / 30} />
```

`play={false}` requests a stopped space. Returning it to `true` replays the
space. `minFrameTime` limits frame frequency, while `refresh={false}` preserves
the previous frame instead of clearing the canvas before every frame.

## DOM props and accessibility

`PtsCanvas` renders a wrapper `<div>` containing one `<canvas>`:

```text
containerProps, containerRef
└── canvasProps, canvasRef, fallback children
```

Top-level native canvas attributes are supported, but `canvasProps` is the
clearest API and wins for duplicate attributes. Classes are concatenated and
styles are merged rather than replaced. Top-level `children` become accessible
canvas fallback content; `canvasProps.children` takes precedence when present.

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const containerRef = useRef<HTMLDivElement>(null);

<PtsCanvas
  classPrefix="sketch"
  containerProps={{ className: "frame", "aria-label": "Drawing region" }}
  canvasProps={{ className: "surface", "aria-label": "Generative drawing" }}
  canvasRef={canvasRef}
  containerRef={containerRef}
>
  A generative drawing.
</PtsCanvas>;
```

The legacy `name`, `className`, `style`, `canvasClassName`, `canvasStyle`, and
`touch` props remain functional but are deprecated. See the
[migration guide](./MIGRATION.md) for direct replacements and the
[API reference](./API.md#dom-output-and-prop-precedence) for exact precedence.

## Players and performance

Additional Pts players can be managed declaratively:

```tsx
<PtsCanvas players={[player, tempo]} play={running} refresh={false} />
```

Players are added and removed by object identity without replacing the space.
Treat the `players` array as immutable and replace it when membership changes.
A player object should belong to only one mounted canvas at a time. The `tempo`
prop is a convenience for one Pts `Tempo` player.

The optional performance controls are:

```tsx
<PtsCanvas
  maxPixelDensity={2}
  minFrameTime={1000 / 30}
  pauseWhenHidden
  pauseWhenOffscreen
/>
```

- `maxPixelDensity` caps device or explicit pixel density to limit canvas memory
  and fill cost.
- `minFrameTime` delegates frame throttling to Pts.
- `pauseWhenHidden` stops while the document is hidden.
- `pauseWhenOffscreen` uses `IntersectionObserver` to stop outside the viewport.

These controls are opt-in. Retina scaling remains enabled by default.

## Imperative access

The forwarded ref exposes owned objects without transferring their lifecycle:

<!-- docs-typecheck -->

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
      <PtsCanvas
        ref={ref}
        play={false}
        containerProps={{ style: { width: "100%", height: 320 } }}
      />
    </>
  );
}
```

The getters are `getSpace`, `getForm`, `getPlayer`, `getCanvas`, and
`getContainer`. Do not call `dispose()` on the returned space; the component
owns it. Declarative props may override conflicting imperative playback or input
changes on a later render.

## React Server Components

The package entry has a `"use client"` boundary and its initial wrapper/canvas
markup can be server-rendered. Drawing, refs, effects, and callbacks run only in
the browser. Functions cannot be passed from a Server Component across the
client boundary, so put interactive usage in a Client Component:

<!-- docs-typecheck -->

```tsx
"use client";

import { PtsCanvas } from "react-pts-canvas";

export function ClientDrawing() {
  return (
    <PtsCanvas
      containerProps={{ style: { width: "100%", height: 320 } }}
      onAnimate={(space, form) => {
        form.fillOnly("#f6c").point(space.pointer, 12);
      }}
    />
  );
}
```

A Server Component can import and render `ClientDrawing`; it should not create
the drawing callbacks itself.

## Documentation

- [API reference](./API.md): every prop, default, callback, exported type, and
  update rule
- [Migration guide](./MIGRATION.md): upgrading from npm 0.5.2 and replacing
  deprecated props
- [`llms.txt`](./llms.txt): compact machine-oriented index and core invariants

The maintained React 19 gallery is in
[`examples/gallery`](https://github.com/williamngan/react-pts-canvas/tree/master/examples/gallery).
Run `pnpm dev` to view it locally. CI builds and deploys the gallery from the
default branch; a public URL should only be advertised after that deployment is
available.

## Development

Consumers need Node 18 or newer when a package manager evaluates this package's
engine declaration. Repository development uses Node `^20.19.0` or `>=22.12.0`
and pnpm `11.21.0`.

### Setup

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

On a minimal Linux machine, install Playwright's operating-system dependencies
with `pnpm exec playwright install --with-deps chromium`.

Start the gallery with hot reload for both the library and examples:

```bash
pnpm dev
```

To test an unpublished sibling Pts checkout, pass its repository path from this
repository root: `PTS_PATH=../pts pnpm dev`. The gallery runtime uses that path;
TypeScript continues to check against the installed Pts package.

### Repository map

```text
src/                  Public component source and types
test/                 Real-browser component tests
scripts/              Package and documentation validation
examples/gallery/     Private React 19 + Vite gallery
API.md                Canonical public API contract
MIGRATION.md          Upgrade and deprecation guidance
CHANGELOG.md          Release updates
llms.txt              Machine-oriented documentation index
plans/                Completed historical implementation records
dist/                 Generated, ignored package output
```

`src/index.tsx` is the runtime and type source of truth. `pnpm build` generates
`dist/`; do not edit generated files. The gallery resolves the package directly
to `src/index.tsx`, so gallery development does not require a library build.

### Commands

Run commands from the repository root.

| Command               | Purpose                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`            | Develop the component and gallery together                                      |
| `pnpm test:watch`     | Watch the browser component tests                                               |
| `pnpm test`           | Run the Chromium component tests once                                           |
| `pnpm build`          | Generate ESM, CommonJS, source maps, and declarations                           |
| `pnpm test:package`   | Pack and exercise runtime formats, SSR, types, directives, externals, and size  |
| `pnpm check:package`  | Run `publint` and `attw` against a packed package                               |
| `pnpm check:docs`     | Check documentation structure, links, API coverage, snippets, and packaged docs |
| `pnpm check:library`  | Validate the publishable library and documentation                              |
| `pnpm check:examples` | Format-check, lint, type-check, build, and smoke-test the gallery               |
| `pnpm check`          | Run the complete repository validation                                          |

Run focused checks while editing and `pnpm check` before handing off a change.
CI tests the library with React 18.2 and React 19 separately, then validates the
React 19 gallery.

### Maintenance rules

- Update public JSDoc and [API.md](./API.md) together when behavior, defaults,
  precedence, or lifecycle semantics change.
- Update [MIGRATION.md](./MIGRATION.md) for compatibility or deprecation changes
  and record notable work
- Keep [`llms.txt`](./llms.txt) concise and pointed at canonical documents. Keep
  displayed gallery snippets consistent with their maintained implementations.
- Preserve the lifecycle and packaging invariants documented in
  [API.md](./API.md) and [AGENTS.md](./AGENTS.md), including the `"use client"`
  directive, peer externals, and React 18.2 compatibility.
- Version selection, npm publication, and GitHub Pages changes are explicit
  maintainer actions.

## License

Apache License 2.0. Copyright © 2019-current William Ngan and contributors.
