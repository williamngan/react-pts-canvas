import React, { useRef } from 'react'

import {
  PtsCanvas,
  HandleStartFn,
  HandleAnimateFn,
  HandleActionFn
} from 'react-pts-canvas'
import { Pt, Rectangle, Group, Geom, Create, Num, Shaping } from 'pts'
import './App.css'

const ExampleComponent: React.FC = () => {
  const gridRef = useRef<Group[] | null>(null)
  const handleStart: HandleStartFn = (_bound, space) => {
    if (!space) return
    gridRef.current = Create.gridCells(
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
    if (!form || !space || !gridRef.current || time === undefined) return
    const t = Shaping.cubicInOut((time % 3000) / 3000, 1)
    const colors = ['#fff', '#62f', '#f03']
    const d = space.pointer.x > space.center.x ? 1 : -1
    gridRef.current.forEach((g, i) => {
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
      style={{ opacity: 0.95 }}
      onStart={handleStart}
      onAnimate={handleAnimate}
    />
  )
}

const ExampleComponent2: React.FC = () => {
  // Use a useRef instead of useState hook here as the canvas
  // Doesn't re-render based on the radius, it only affects the handleAnimate
  const radiusRef = useRef(50)

  const handleAnimate: HandleAnimateFn = (space, form) => {
    if (!space || !form) return
    form.point(space.pointer, radiusRef.current, 'circle')
    if (radiusRef.current > 20) radiusRef.current--
  }

  const handleAction: HandleActionFn = (_space, _form, type) => {
    if (type === 'up') {
      radiusRef.current += 20
    }
  }

  return (
    <PtsCanvas
      background="#62e"
      name="quickstart-tester"
      onAnimate={(space, form) => handleAnimate(space, form)}
      onAction={(space, form, type) => handleAction(space, form, type)}
    />
  )
}

const App: React.FC = () => (
  <div>
    <div className="leftExample">
      <ExampleComponent />
      <div className="label">
        <strong>PtsCanvas example</strong>
        <br />
        Cursor position determines rotate direction
      </div>
    </div>
    <div className="rightExample">
      <ExampleComponent2 />
      <div className="label">
        <strong>QuickStartCanvas example</strong>
        <br />
        Click to change radius
      </div>
    </div>
  </div>
)

export default App
