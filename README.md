# react-pts-canvas

[![NPM](https://img.shields.io/npm/v/react-pts-canvas.svg)](https://www.npmjs.com/package/react-pts-canvas)

![cover](./example/cover.png)

This is a React Component for canvas drawing using [Pts](https://ptsjs.org). Pts is a javascript library for visualization and creative-coding. You may use Pts by itself, or with React and other frameworks.

## Install

```bash
npm install --save react-pts-canvas
```

## Examples

- The [example](./example) folder provides a quick example of using PtsCanvas in a React app
- Take a look at more examples in [pts-react-example](https://github.com/williamngan/pts-react-example) repo.

## PtsCanvas

`PtsCanvas` is a function component replacement for both `QuickStartCanvas` and the previous class based implementation

Instead of extending the PtsCanvas class or using the quickstart component, you can pass your handler functions as props.

`PtsCanvas` makes use of the `useEffect` hook to handle lifecycle events, and the `useRef` hook to maintain reference to the space, form, and canvas elements.

```jsx
<PtsCanvas
  onStart={ (bound, space, form) => {...} }
  onAnimate={ (space, form, time, ftime) => {...} }
  onResize={ (space, form, size, evt) => {...} }
  onAction={ (space, form, type, px, py, evt) => {...} }
/>
```

`PtsCanvas` component provides the following props:

- `background`
  - background fill color of the canvas. Default value is "#9ab".
- `resize`
  - A boolean value to indicate whether the canvas should auto resize. Default is `true`.
- `retina`
  - A boolean value to indicate whether the canvas should support retina resolution. Default is `true`.
- `play`
  - A boolean value to set whether the canvas should animate. Default is `true`.
- `touch`
  - A boolean value to set whether the canvas should track mouse and touch events. Default is `true`.
- `name`
  - The css class name of the container `<div>`. Default value is "pts-react". Use this class name to set custom styles in your .css file.
- `style`
  - Optionally override css styles of the container `<div>`.
- `canvasStyle`
  - Optionally override css styles of the `<canvas>` itself. Avoid using this except for special use cases.
- `onStart`
  - onStart handler function
- `onAnimate`
  - onAnimate handler function
- `onResize`
  - onResize handler function
- `onAction`
  - onAction handler function
- `tempo`
  - a `Tempo` object. In a parent component, you can create a ref to a tempo object, add functions to it via `Tempo.every` in your onStart handler, then pass that `Tempo`'s ref.current as this prop. The `tempo` will be added to the space with the other handlers.
- `spaceRef`
  - a ref returned from `useRef(null)` if you need reference to the space in your parent component
- `formRef`
  - a ref returned from `useRef(null)` if you need reference to the form in your parent component

`PtsCanvas` is wrapped with `forwardRef`, so you can pass a ref to the component itself if you need
access to the canvas ref within your parent component:

```jsx
import React, {createRef} from 'react'

const ParentComponent = () => {
  const ref = createRef<HTMLCanvasElement>()

  return (
    <PtsCanvas
      ref={ref}
      onAnimate={() => {...}}
    >
  )
}
```

See `example/src/App-ParentRef.tsx`

#

---

#

## Legacy Components

## QuickStartCanvasLegacy component

If you are getting started with **Pts**, take a look at the [demos](https://ptsjs.org/demo) and read the [guides](https://ptsjs.org/guide).

`<QuickStartCanvas>` helps you get started quickly. Here is a minimal example that draws a point the follows the cursor, by passing a callback function to `onAnimate` property:

```jsx
import React from 'react'
import { QuickStartCanvasLegacy } from 'react-pts-canvas'

// ...
;<QuickStartCanvasLegacy
  onAnimate={(space, form, time) => form.point(space.pointer, 10)}
/>
// ...
```

In addition to the props in `PtsCanvas` (see below), `QuickStartCanvas` provides 4 callback props that correspond to the [player functions](https://ptsjs.org/guide/space-0500) in Pts. The `space` and `form` instances are also passed as parameters.

```jsx
<QuickStartCanvasLegacy
onStart={ (bound, space) => {...} }
onAnimate={ (space, form, time, ftime) => {...} }
onResize={ (space, form, size, evt) => {...} }
onAction={ (space, form, type, px, py, evt) => {...} }
/>
```

## PtsCanvasLegacy

`PtsCanvasLegacy` is a component that you may extend to implement your own drawings and animations on canvas using Pts. Like this:

```jsx
class MyCanvas extends PtsCanvasLegacy {

  animate (time, ftime, space) {
    // your code for drawing and animation
  }

  start (bound, space) {
    // Optional code for canvas init
  }

  action: (type, x, y, event) {
    // Optional code for interaction
  }

  resize (size, event) {
    // Optional code for resize
  }
}
```

There are 4 functions in Pts that you can (optionally) overrides: `animate`, `start`, `resize`, and `action`. [See this guide](https://ptsjs.org/guide/space-0500) to learn more about how these functions work.

Once you have implemented your own canvas, you can use it as a component like this:

```jsx
import React from 'react'
import { PtsCanvas } from 'react-pts-canvas'

class Example extends React.Component {
  render() {
    return <MyCanvas background="#abc" play={true} />
  }
}
```

`PtsCanvasLegacy` component provides the following props:

- `background`
  - background fill color of the canvas. Default value is "#9ab".
- `resize`
  - A boolean value to indicate whether the canvas should auto resize. Default is `true`.
- `retina`
  - A boolean value to indicate whether the canvas should support retina resolution. Default is `true`.
- `play`
  - A boolean value to set whether the canvas should animate. Default is `true`.
- `touch`
  - A boolean value to set whether the canvas should track mouse and touch events. Default is `true`.
- `name`
  - The css class name of the container `<div>`. Default value is "pts-react". Use this class name to set custom styles in your .css file.
- `style`
  - Optionally override css styles of the container `<div>`.
- `canvasStyle`
  - Optionally override css styles of the `<canvas>` itself. Avoid using this except for special use cases.

## License

Apache License 2.0. See LICENSE file for details.
Copyright © 2017-2021 by [William Ngan](https://williamngan.com) and contributors.
