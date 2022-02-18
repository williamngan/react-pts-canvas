import React, { Component } from 'react'

import {
  PtsCanvasLegacy,
  QuickStartCanvasLegacy,
  PtsCanvasLegacyProps
} from 'react-pts-canvas'
import {
  Rectangle,
  Group,
  Geom,
  Create,
  Num,
  Shaping,
  Pt,
  CanvasSpace,
  CanvasForm
} from 'pts'
import './App.css'

class ExampleComponent extends PtsCanvasLegacy<PtsCanvasLegacyProps> {
  grid: Group[] | undefined

  start() {
    if (!this.space) return
    this.grid = Create.gridCells(
      this.space.innerBound,
      Math.floor(this.space.width / 50),
      Math.floor(this.space.height / 50)
    )
  }

  _innerRect(rectPts: Pt[], t: number, d: number) {
    const lines = rectPts.map((r, i) =>
      i >= 3 ? new Group(r, rectPts[0]) : new Group(r, rectPts[i + 1])
    )
    return lines.map(ln =>
      Geom.interpolate(ln[d > 0 ? 0 : 1], ln[d > 0 ? 1 : 0], t)
    )
  }

  animate(time: number) {
    if (!this.form || !this.space || !this.grid) return
    const t = Shaping.cubicInOut((time % 3000) / 3000, 1)
    const colors = ['#fff', '#62f', '#f03']
    const d = this.space.pointer.x > this.space.center.x ? 1 : -1
    this.grid.forEach((g, i) => {
      const r = this._innerRect(
        Rectangle.corners(g),
        Num.boundValue(t + i * d * 0.004, 0, 1),
        d
      )
      this.form && this.form.fillOnly(colors[i % colors.length]).polygon(r)
    })
  }
}

let radius = 50

export default class App extends Component {
  render() {
    return (
      <div>
        <div className='leftExample'>
          <ExampleComponent
            background='#0c9'
            name='pts-tester'
            style={{ opacity: 0.95 }}
          />
          <div className='label'>
            <strong>PtsCanvas example</strong>
            <br />
            Cursor position determines rotate direction
          </div>
        </div>
        <div className='rightExample'>
          <QuickStartCanvasLegacy
            background='#62e'
            name='quickstart-tester'
            onAnimate={(
              space: CanvasSpace | undefined,
              form: CanvasForm | undefined
            ) => {
              if (!form || !space) return
              form.point(space.pointer, radius, 'circle')
              if (radius > 20) radius -= 1
            }}
            onAction={(_space, _form, type) => {
              if (type === 'up') radius += 20
            }}
          />
          <div className='label'>
            <strong>QuickStartCanvas example</strong>
            <br />
            Click to change radius
          </div>
        </div>
      </div>
    )
  }
}
