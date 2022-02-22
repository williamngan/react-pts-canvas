import React, { useState } from 'react'
import {
  PtsCanvas,
  HandleStartFn,
  HandleAnimateFn,
  HandleActionFn
} from 'react-pts-canvas'
import { Pt, Rectangle, Group, Geom, Create, Num, Shaping } from 'pts'
import './App.css'

const ExampleComponent: React.FC<{ play: boolean }> = ({ play }) => {
  let grid: Group[]

  const handleStart: HandleStartFn = (_bound, space) => {
    grid = Create.gridCells(
      space.innerBound,
      Math.floor(space.width / 50),
      Math.floor(space.height / 50)
    )
  }

  const innerRect = (rectPts: Pt[], t: number, d: number) => {
    const lines = rectPts.map((r, i) =>
      i >= 3 ? new Group(r, rectPts[0]) : new Group(r, rectPts[i + 1])
    )
    return lines.map(ln =>
      Geom.interpolate(ln[d > 0 ? 0 : 1], ln[d > 0 ? 1 : 0], t)
    )
  }

  const handleAnimate: HandleAnimateFn = (space, form, time) => {
    if (!grid) return
    const t = Shaping.cubicInOut((time % 3000) / 3000, 1)
    const colors = ['#fff', '#62f', '#f03']
    const d = space.pointer.x > space.center.x ? 1 : -1
    grid.forEach((g, i) => {
      const r = innerRect(
        Rectangle.corners(g),
        Num.boundValue(t + i * d * 0.004, 0, 1),
        d
      )
      form.fillOnly(colors[i % colors.length]).polygon(r)
    })
  }

  return (
    <PtsCanvas
      background="#0c9"
      name="pts-tester"
      play={play}
      style={{ opacity: 0.95 }}
      onStart={handleStart}
      onAnimate={handleAnimate}
    />
  )
}

const ExampleComponent2: React.FC = () => {
  let radius = 50

  const handleAnimate: HandleAnimateFn = (space, form) => {
    form.point(space.pointer, radius, 'circle')
    if (radius > 20) radius--
  }

  const handleAction: HandleActionFn = (_space, _form, type) => {
    if (type === 'up') {
      radius += 20
    }
  }

  return (
    <PtsCanvas
      background="#62e"
      name="quickstart-tester"
      onAnimate={handleAnimate}
      onAction={handleAction}
    />
  )
}

const LeftExample = () => {
  const [pause, setPause] = useState(false)
  return (
    <div className="leftExample">
      <ExampleComponent play={!pause} />
      <div className="label">
        <strong>PtsCanvas example</strong>
        <br />
        <button onClick={() => setPause(!pause)}>
          {pause ? 'Play animation' : 'Stop animation'}
        </button>
      </div>
    </div>
  )
}

const RightExample = () => (
  <div className="rightExample">
    <ExampleComponent2 />
    <div className="label">
      <strong>QuickStartCanvas example</strong>
      <br />
      Click to change radius
    </div>
  </div>
)

const App: React.FC = () => {
  return (
    <div>
      <LeftExample />
      <RightExample />
    </div>
  )
}

export default App
