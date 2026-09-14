# react-pts-canvas API reference

This file is the canonical public contract for the current version of
`react-pts-canvas`, which targets Pts 1.0. It is intentionally explicit enough
for people, IDEs, and language models to use without reading the
implementation.

For a first example, start with the [README](./README.md). For upgrading from
npm 0.5.2, see [MIGRATION.md](./MIGRATION.md).

## Import

```tsx
import {
  PtsCanvas,
  type ActionType,
  type HandleActionFn,
  type HandleAnimateFn,
  type HandleDisposeFn,
  type HandleErrorFn,
  type HandleReadyFn,
  type HandleResizeFn,
  type PtsCanvasCleanup,
  type PtsCanvasErrorContext,
  type PtsCanvasErrorPhase,
  type PtsCanvasImperative,
  type PtsCanvasInputOptions,
  type PtsCanvasProps,
} from "react-pts-canvas";
```

`PtsCanvas` is the only runtime export. Every other public export is a
TypeScript type.

## Runtime environment

The package requires the Pts `^1.0.0` peer dependency. Client-side
initialization requires an HTML canvas 2D context, `requestAnimationFrame`,
`queueMicrotask`, and—while automatic resizing is enabled—`ResizeObserver`. Pointer input
requires `PointerEvent`; touch and keyboard bindings use their corresponding
DOM events. `IntersectionObserver` is optional and only affects
`pauseWhenOffscreen`.

The automated component and gallery suites run in Chromium. The project does
not currently publish a broader browser-version matrix. Server rendering does
not require DOM globals because `CanvasSpace` initialization is deferred until
the browser mounts the canvas.

## Update categories

The prop tables use these terms:

- **Render:** React applies the value to DOM output without replacing the Pts
  space.
- **Live:** the component updates the existing `CanvasSpace`.
- **Replace:** a changed effective value disposes the existing space and creates
  a new one.
- **Callback:** the latest function is used without rerunning `onReady` or
  replacing the space.
- **Membership:** players are reconciled by object identity.

## Space and playback props

| Prop                 | Type      | Default     | Update                               | Contract                                                                                                                                               |
| -------------------- | --------- | ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `background`         | `string`  | `"#9ab"`    | Live                                 | Pts canvas background. Changing it updates `space.background` and clears a ready canvas once.                                                          |
| `resize`             | `boolean` | `true`      | Live                                 | Enables Pts `ResizeObserver` sizing after the initial measurement. The initial canvas size still comes from its wrapper.                               |
| `retina`             | `boolean` | `true`      | Replace                              | Enables Pts device-pixel-ratio scaling unless an explicit `pixelDensity` wins.                                                                         |
| `offscreen`          | `boolean` | `false`     | Replace                              | Creates the Pts offscreen drawing buffer used by `form.useOffscreen()` and `form.renderOffscreen()`. It is unrelated to viewport visibility.           |
| `pixelDensity`       | `number`  | Pts-derived | Replace when effective value changes | Explicit positive pixel scale. It overrides the scale selected by `retina`.                                                                            |
| `maxPixelDensity`    | `number`  | none        | Replace when effective value changes | Positive cap applied to explicit density, device pixel ratio, or `1` when retina scaling is disabled.                                                  |
| `play`               | `boolean` | `true`      | Live                                 | Requests continuous playback. `false` stops the space; changing back to `true` replays it.                                                             |
| `refresh`            | `boolean` | `true`      | Live                                 | When true, Pts clears the canvas with its background before each frame. Set false to accumulate or manually clear frames.                              |
| `minFrameTime`       | `number`  | `0`         | Live                                 | Minimum non-negative elapsed milliseconds required before Pts advances a frame.                                                                        |
| `pauseWhenHidden`    | `boolean` | `false`     | Live                                 | Stops requested playback while `document.hidden` is true and replays it when visible.                                                                  |
| `pauseWhenOffscreen` | `boolean` | `false`     | Live                                 | Uses `IntersectionObserver` on the wrapper to stop requested playback outside the viewport. It is a no-op where `IntersectionObserver` is unavailable. |

`pixelDensity` and `maxPixelDensity` must be finite and greater than zero.
`minFrameTime` must be finite and non-negative. Invalid values throw a
`RangeError` during React rendering and are not sent to `onError`.

Playback and input are connected by Pts: a stopped space does not update
`space.pointer` or dispatch pointer, touch, or keyboard actions. Therefore
`play={false}` and either automatic pause option suspend `onAction` as well as
animation. External React controls can still call `getSpace()?.playOnce()`.

## Input props

### `input`

Type: `PtsCanvasInputOptions`

| Field            | Type                     | Default                         | Contract                                                                 |
| ---------------- | ------------------------ | ------------------------------- | ------------------------------------------------------------------------ |
| `pointer`        | `boolean`                | legacy `touch`, normally `true` | Binds Pts pointer events to the canvas.                                  |
| `touch`          | `boolean`                | legacy `touch`, normally `true` | Binds Pts touch events to the canvas.                                    |
| `touchPassive`   | `boolean`                | `false`                         | Uses passive touch listeners so touch handling does not block scrolling. |
| `keyboard`       | `boolean`                | `false`                         | Binds Pts keyboard actions.                                              |
| `keyboardTarget` | `"canvas" \| "document"` | `"canvas"`                      | Scopes keyboard listeners to the focusable canvas or the whole document. |

`input` fields update independently on the existing space. An explicit
`input.pointer` or `input.touch` value wins over the deprecated top-level
`touch` fallback.

With canvas-scoped keyboard input, the component supplies `tabIndex={0}`.
`canvasProps.tabIndex` is the supported override. For keyboard actions, `x` is
`1` when Shift is held and `0` otherwise; `y` is `1` when Alt is held and `0`
otherwise. The original `KeyboardEvent` remains available as the final
argument.

### `touch` (deprecated)

Type: `boolean`; default: `true`; update: Live.

This legacy prop is the fallback for both `input.pointer` and `input.touch`.
Replace `touch={false}` with:

```tsx
<PtsCanvas input={{ pointer: false, touch: false }} />
```

## Lifecycle callback props

All callback props are optional and update without replacing the space. Each
callback receives the `CanvasSpace` and `CanvasForm` owned by the component.

### `onReady`

```ts
type HandleReadyFn = (
  space: CanvasSpace,
  form: CanvasForm,
  bound: Bound,
) => unknown;
```

Called once after each newly created `CanvasSpace` is initialized, measured,
and its form is ready. The initial `onPtsResize` normally occurs first. Changing
the `onReady` prop does not rerun it for the existing space.

If the return value is a function, the component stores it as
`PtsCanvasCleanup` and calls it before that space is replaced or unmounted. All
other return values are ignored. Returning Pts chain results such as
`space.playOnce()` is therefore safe.

### `onAnimate`

```ts
type HandleAnimateFn = (
  space: CanvasSpace,
  form: CanvasForm,
  time: number,
  frameTime: number,
) => void;
```

Called for each Pts frame that advances while the space is playing. `time` is
the animation timestamp and `frameTime` is elapsed time since the previous
advanced frame. Zero is a valid value for either argument.

### `onPtsResize`

```ts
type HandleResizeFn = (
  space: CanvasSpace,
  form: CanvasForm,
  bound: Bound,
  event?: Event,
) => void;
```

Called during the initial measurement and later Pts resize operations. The
initial call can have no event and normally precedes `onReady`. Pts reports a
missing event as `null`; the component normalizes it to `undefined`. This prop
is named `onPtsResize` to avoid colliding with React's native canvas `onResize`
attribute.

Automatic resizing resets the canvas pixel buffer. For a drawing with
`play={false}`, call `space.playOnce()` from `onPtsResize` to repaint after a
wrapper resize; also request a frame when drawing data changes.

### `onAction`

```ts
type HandleActionFn = (
  space: CanvasSpace,
  form: CanvasForm,
  type: ActionType,
  x: number,
  y: number,
  event: Event,
) => void;
```

Called for enabled Pts actions while the space is playing. Pointer and touch
coordinates are relative to the Pts space. Keyboard values encode Shift in `x`
and Alt in `y` as described above.

Known `ActionType` values are:

```text
up, down, move, drag, uidrag, drop, uidrop, over, out, enter, leave,
click, keydown, keyup, pointerdown, pointerup, contextmenu, all
```

The type also accepts other strings so it remains compatible with Pts custom or
future actions.

### `onDispose`

```ts
type HandleDisposeFn = (space: CanvasSpace, form: CanvasForm) => void;
```

Called after `onReady` cleanup and immediately before the component unbinds
input and calls `CanvasSpace.dispose()`. It runs for normal replacement and
unmount of a successfully created space. Do not dispose the supplied space
yourself.

### `onError`

```ts
type HandleErrorFn = (error: unknown, context: PtsCanvasErrorContext) => void;

type PtsCanvasErrorContext = {
  phase: PtsCanvasErrorPhase;
  space?: CanvasSpace;
  form?: CanvasForm;
};
```

When provided, receives owned lifecycle errors and prevents the original error
from being rethrown by the component. If `onError` itself throws, that error
propagates. Without `onError`, the original error keeps its normal throwing
behavior.

| Phase        | Source                                                             |
| ------------ | ------------------------------------------------------------------ |
| `initialize` | Creating or configuring the space, form, input, or initial players |
| `ready`      | `onReady`                                                          |
| `animate`    | `onAnimate`                                                        |
| `resize`     | `onPtsResize`                                                      |
| `action`     | `onAction`                                                         |
| `cleanup`    | A function returned by `onReady`                                   |
| `dispose`    | `onDispose`, input teardown, or `CanvasSpace.dispose()`            |

The context can contain partially initialized `space` or `form` values during
`initialize`. Unavailable main or requested offscreen 2D contexts are reported
through this phase, and any created space is disposed when initialization
fails. Render-time prop validation is outside this error channel.

## Player props

| Prop      | Type                 | Default | Update     | Contract                                                                                          |
| --------- | -------------------- | ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `players` | `readonly IPlayer[]` | empty   | Membership | Adds and removes Pts players by object identity. Duplicate identities collapse to one membership. |
| `tempo`   | `Tempo`              | none    | Membership | Convenience membership for one Pts `Tempo`; it can also appear in `players`.                      |

Treat `players` as an immutable React value. Mutating the same array instance in
place does not trigger reconciliation; pass a new array when membership changes.
An `IPlayer` should belong to only one mounted canvas at a time because Pts
assigns and uses identity state on the player.

Players present during initialization participate in the normal Pts start
lifecycle. Automatic playback begins after their `start` callbacks finish.
Explicit imperative playback calls inside `onReady` still run immediately, so
avoid those calls when other players need their `start` callbacks first.

Pts does not call a late-added player's `start` method automatically;
initialize late player state before adding it or in its resize callback.

## DOM output and prop precedence

The rendered structure is:

```html
<div class="pts-react ...">
  <canvas class="pts-react-canvas ...">fallback content</canvas>
</div>
```

The default prefix is `pts-react`. Set `classPrefix=""` to omit both generated
classes.

### Preferred DOM props

| Prop             | Type                                                | Target             | Composition                                                                                                                                                                                   |
| ---------------- | --------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classPrefix`    | `string`                                            | Wrapper and canvas | Generates `prefix` and `prefix-canvas`. Wins over deprecated `name`, including when empty.                                                                                                    |
| `containerProps` | `HTMLAttributes<HTMLDivElement>` without `children` | Wrapper            | Generic attributes apply directly. Class is appended; style properties override deprecated wrapper style.                                                                                     |
| `canvasProps`    | `CanvasHTMLAttributes<HTMLCanvasElement>`           | Canvas             | Generic attributes override duplicate top-level native attributes. Class is appended; style properties override `canvasStyle`; owned `children` and `tabIndex` have special precedence below. |
| `containerRef`   | `Ref<HTMLDivElement>`                               | Wrapper            | Receives the element on mount and `null` on unmount.                                                                                                                                          |
| `canvasRef`      | `Ref<HTMLCanvasElement>`                            | Canvas             | Receives the element on mount and `null` on unmount.                                                                                                                                          |
| `children`       | `ReactNode`                                         | Canvas fallback    | Used unless `canvasProps` has its own `children` key.                                                                                                                                         |

Top-level native canvas attributes are accepted except `className`, `style`, and
`onError`, which have component meanings. Prefer `canvasProps` when the target
would otherwise be unclear. To listen for the native canvas error event, use
`canvasProps.onError`; top-level `onError` is the lifecycle error channel. Put
`tabIndex` in `canvasProps` because the component owns the canvas's final focus
value.

Class order is deterministic:

```text
wrapper: generated prefix, deprecated className, containerProps.className
canvas:  generated prefix-canvas, deprecated canvasClassName,
         canvasProps.className
```

Classes are concatenated rather than deduplicated. Wrapper styles merge as
`{...style, ...containerProps.style}`. Canvas styles merge as
`{...canvasStyle, ...canvasProps.style}`.

`canvasProps.children` wins when the key exists, even if its value is
`undefined`. When canvas-scoped keyboard input is active,
`canvasProps.tabIndex` wins over the automatic `0`. A top-level `tabIndex` is not
a supported override; use `canvasProps.tabIndex` whether or not keyboard input
is enabled.

Pts writes the canvas pixel-buffer `width` and `height` during initial sizing
and resize. Size the wrapper with CSS or `containerProps.style`; do not rely on
canvas `width` or `height` attributes for component layout.

Canvas drawings need application-specific accessible semantics. Supply an
accessible name or description through `canvasProps`, keep useful fallback
children, and provide focus instructions when keyboard input is enabled. The
component makes canvas-scoped keyboard input focusable but does not choose a
role, description, or focus styling for the application.

### Deprecated DOM aliases

| Deprecated prop   | Replacement                | Legacy behavior                              |
| ----------------- | -------------------------- | -------------------------------------------- |
| `name`            | `classPrefix`              | Prefix fallback when `classPrefix` is absent |
| `className`       | `containerProps.className` | Additional wrapper class                     |
| `style`           | `containerProps.style`     | Wrapper style                                |
| `canvasClassName` | `canvasProps.className`    | Additional canvas class                      |
| `canvasStyle`     | `canvasProps.style`        | Canvas style                                 |

There is no announced removal release, but new code should use the preferred
props.

## Imperative ref

```ts
type PtsCanvasImperative = {
  getSpace: () => CanvasSpace | undefined;
  getForm: () => CanvasForm | undefined;
  getPlayer: () => IPlayer | undefined;
  getCanvas: () => HTMLCanvasElement | null;
  getContainer: () => HTMLDivElement | null;
};
```

Pass a React ref to `PtsCanvas` to receive this object. The component ref is not
the canvas DOM ref; use `canvasRef` for the element itself.

- `getSpace()` returns the owned Pts `CanvasSpace`.
- `getForm()` returns the form passed to callbacks.
- `getPlayer()` returns the internal player that bridges component callbacks.
  Treat it as read-only.
- `getCanvas()` and `getContainer()` return the rendered DOM elements.

Space, form, and player getters return `undefined` before initialization and
after disposal. A retained handle can still inspect the old objects during
returned cleanup and `onDispose`. DOM getters return `null` when their elements
are unavailable. The forwarded React ref itself becomes `null` after unmount.

The component owns input binding, player membership, playback synchronization,
and disposal. Do not dispose the space or mutate the internal player. A later
prop or visibility update can override conflicting imperative changes.

## Replacement and cleanup sequence

The effective `retina`, `offscreen`, or pixel-density setup changing causes:

```text
old onReady cleanup
→ old onDispose
→ input unbinding and old CanvasSpace.dispose()
→ new CanvasSpace and CanvasForm
→ initial new onPtsResize
→ new onReady
```

Unmount stops after disposal. Callback, background, resize, refresh, input,
playback, frame timing, visibility, player, and tempo changes do not replace the
space.

React Strict Mode can mount, clean up, and remount effects during development.
The component prevents a disposed space from delivering a stale `onReady`, but
consumer cleanup should still be idempotent.

## Server rendering and React Server Components

Both package entries begin with `"use client"`. Server rendering produces the
wrapper, canvas, attributes, classes, styles, and fallback content without
constructing a `CanvasSpace`. Initialization happens in the browser after the
canvas mounts.

An RSC framework can recognize `PtsCanvas` as a Client Component, but function
props are not serializable from a Server Component. Define any component that
creates `onReady`, `onAnimate`, `onAction`, or other functions in a module with
`"use client"`, then render that component from the server tree.

## Public exports

| Export                  | Kind              | Purpose                                    |
| ----------------------- | ----------------- | ------------------------------------------ |
| `PtsCanvas`             | Runtime component | The React component                        |
| `PtsCanvasProps`        | Type              | Complete component props                   |
| `PtsCanvasImperative`   | Type              | Forwarded-ref interface                    |
| `PtsCanvasInputOptions` | Type              | `input` object                             |
| `PtsCanvasCleanup`      | Type              | Cleanup function recognized from `onReady` |
| `HandleReadyFn`         | Type              | `onReady` callback                         |
| `HandleAnimateFn`       | Type              | `onAnimate` callback                       |
| `HandleResizeFn`        | Type              | `onPtsResize` callback                     |
| `HandleActionFn`        | Type              | `onAction` callback                        |
| `HandleErrorFn`         | Type              | `onError` callback                         |
| `HandleDisposeFn`       | Type              | `onDispose` callback                       |
| `ActionType`            | Type              | Known and extensible Pts action names      |
| `PtsCanvasErrorPhase`   | Type              | Error phase union                          |
| `PtsCanvasErrorContext` | Type              | `onError` context                          |

Pts types such as `CanvasSpace`, `CanvasForm`, `Bound`, `IPlayer`, and `Tempo`
remain owned and exported by the `pts` package. They are referenced by this
package's declarations but are not re-exported.
