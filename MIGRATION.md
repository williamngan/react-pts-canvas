# Migration guide

This guide covers the unreleased repository version relative to the current npm
release, `react-pts-canvas@0.5.2`. The eventual release version has not been
selected. Use [CHANGELOG.md](./CHANGELOG.md) to confirm whether these changes
have been published before applying them to an installed package.

The component remains source-compatible with most 0.5.2 usage. The main work is
replacing deprecated DOM/input aliases and adopting the documented lifecycle
ownership rules.

## Peer and tool versions

The unreleased package expects:

- `pts@^0.12.9`
- `react@^18.2.0` or React 19
- a matching `react-dom` version
- Node 18 or newer when package engines are evaluated by consumer tooling

Repository development has a narrower toolchain requirement: Node `^20.19.0`
or `>=22.12.0` and pnpm. That contributor requirement does not change the
browser component API.

## Replace legacy DOM props

Legacy props still work and have no announced removal release, but declarations
mark them deprecated.

| Before                           | After                                         |
| -------------------------------- | --------------------------------------------- |
| `name="drawing"`                 | `classPrefix="drawing"`                       |
| `className="frame"`              | `containerProps={{ className: "frame" }}`     |
| `style={{ height: 320 }}`        | `containerProps={{ style: { height: 320 } }}` |
| `canvasClassName="surface"`      | `canvasProps={{ className: "surface" }}`      |
| `canvasStyle={{ opacity: 0.8 }}` | `canvasProps={{ style: { opacity: 0.8 } }}`   |

The old props compose with the new props while both are present. Classes are
concatenated; style objects are merged with new nested style properties winning.
See [DOM output and prop precedence](./API.md#dom-output-and-prop-precedence)
for exact order.

## Replace `touch`

The old `touch` prop controlled both pointer and touch bindings:

```tsx
<PtsCanvas touch={false} />
```

Use explicit input fields instead:

```tsx
<PtsCanvas input={{ pointer: false, touch: false }} />
```

If both APIs are present, an explicit `input.pointer` or `input.touch` value
wins over the `touch` fallback. Keyboard input and passive touch listeners are
available only through `input`.

## Use `onPtsResize`, not `onResize`

Some older README examples incorrectly showed `onResize`. The component's Pts
lifecycle prop was and remains `onPtsResize`:

```tsx
<PtsCanvas
  onPtsResize={(space, form, bound, event) => {
    // Recompute drawing state for the new Pts bound.
  }}
/>
```

Top-level `onResize` is a native React canvas event attribute and does not
receive `(space, form, bound, event)`. Using it for Pts lifecycle work can type
check incorrectly when arguments are omitted but will not provide the expected
runtime values.

The resize callback now correctly types its third argument as Pts `Bound`, not
`Group`. Its `event` is optional because the initial measurement has no native
resize event. The initial resize normally runs before `onReady`.

## Use the forwarded ref for Pts objects

Older documentation listed nonexistent `spaceRef` and `formRef` props. Use the
component's imperative ref:

```tsx
import { useRef } from "react";
import { PtsCanvas, type PtsCanvasImperative } from "react-pts-canvas";

const canvas = useRef<PtsCanvasImperative>(null);

<PtsCanvas ref={canvas} />;

canvas.current?.getSpace();
canvas.current?.getForm();
```

The existing getters remain, and the new interface also exposes
`getContainer()`. Use `canvasRef` and `containerRef` when the DOM elements,
rather than Pts objects, are required.

## Adopt cleanup ownership

`onReady` can return a cleanup function:

```tsx
<PtsCanvas
  onReady={(space) => {
    const resource = acquireResource(space);
    return () => resource.dispose();
  }}
/>
```

Cleanup runs on unmount and whenever rendering-context options replace the
space. It runs before `onDispose`, which runs before the component disposes the
space. Do not call `space.dispose()` from either consumer callback.

Rendering-context replacements are triggered by:

- `retina`
- `offscreen`
- a changed effective `pixelDensity` or `maxPixelDensity`

Background, resize, input, playback, refresh, frame timing, players, tempo, and
callback props update without replacement.

## Handle lifecycle errors explicitly

The new `onError` prop receives errors from initialization, callbacks, returned
cleanup, and disposal:

```tsx
<PtsCanvas
  onError={(error, context) => {
    reportDrawingError(error, context.phase);
  }}
/>
```

Providing `onError` swallows the original owned-lifecycle error after reporting
it. Without `onError`, it is rethrown normally. Invalid density and frame-time
props throw while React renders and therefore do not use this channel.

## Account for stopped input

Pts only updates its pointer and dispatches action callbacks while a space is
playing. `play={false}`, document-hidden suspension, and offscreen suspension
therefore pause input behavior as well as frames.

For a drawing that normally remains stopped, trigger a frame from an external
React control:

```tsx
<>
  <button onClick={() => canvas.current?.getSpace()?.playOnce()}>
    Render once
  </button>
  <PtsCanvas ref={canvas} play={false} />
</>
```

Do not rely on `onAction` to wake a stopped space because Pts will not dispatch
that action.

## Treat player arrays as immutable

The new `players` prop reconciles Pts `IPlayer` objects by identity. Replace the
array when membership changes:

```tsx
<PtsCanvas players={enabled ? [gridPlayer] : []} />
```

Do not mutate and reuse the same array, and do not share one player object
between mounted canvases. `tempo` remains as a convenience prop and participates
in the same identity set.

## React Server Component applications

The package now publishes a preserved `"use client"` entry. Interactive drawing
callbacks still need to originate in a Client Component because functions are
not serializable across an RSC boundary:

```tsx
"use client";

import { PtsCanvas } from "react-pts-canvas";

export function Drawing() {
  return <PtsCanvas onAnimate={(space, form) => draw(space, form)} />;
}
```

The package can render wrapper and fallback markup on the server, but it does
not create `CanvasSpace` until the browser mounts the canvas.

## Validate an upgrade

After replacing deprecated APIs, run the consuming application's type check and
browser tests. For this repository itself, the complete validation command is:

```bash
pnpm check
```

The package check covers ESM, CommonJS, strict declarations, server rendering,
React 18.2 and React 19 CI, and real-browser lifecycle behavior.
