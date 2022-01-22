import React, { Component } from "react";

// import { PtsCanvas, QuickStartCanvas } from "react-pts-canvas";
// import { Rectangle, Group, Geom, Create, Num, Shaping } from "pts/dist/es5";
import "./App.css";

// class ExampleComponent extends PtsCanvas {
//   start() {
//     this.grid = Create.gridCells(
//       this.space.innerBound,
//       Math.floor(this.space.width / 50),
//       Math.floor(this.space.height / 50)
//     );
//   }

//   _innerRect(rectPts, t, d) {
//     let lines = rectPts.map((r, i) =>
//       i >= 3 ? new Group(r, rectPts[0]) : new Group(r, rectPts[i + 1])
//     );
//     return lines.map(ln =>
//       Geom.interpolate(ln[d > 0 ? 0 : 1], ln[d > 0 ? 1 : 0], t)
//     );
//   }

//   animate(time, ftime) {
//     let t = Shaping.cubicInOut((time % 3000) / 3000, 1);
//     let colors = ["#fff", "#62f", "#f03"];
//     let d = this.space.pointer.x > this.space.center.x ? 1 : -1;
//     this.grid.forEach((g, i) => {
//       let r = this._innerRect(
//         Rectangle.corners(g),
//         Num.boundValue(t + i * d * 0.004, 0, 1),
//         d
//       );
//       this.form.fillOnly(colors[i % colors.length]).polygon(r);
//     });
//   }
// }

//var radius = 50;

export default class App extends Component {
  render() {
    return (
      <div>
        <h1>Hello.</h1>
        {/** 
        <div className="leftExample">
          <ExampleComponent background="#0c9" name="pts-tester" style={{opacity: 0.95}} />
          <div className="label">
            <strong>PtsCanvas example</strong>
            <br />Cursor position determines rotate direction
          </div>
        </div>
        <div className="rightExample">
          <QuickStartCanvas background="#62e" name="quickstart-tester" 
            onAnimate={ (space, form, t, ft) => {
              form.point( space.pointer, radius, "circle" );
              if (radius > 20) radius -= 1;
            }}
            onAction={ (space, form, type, px, py, evt) => {
              if (type === 'up') radius += 20;

            }}
          />
          <div className="label">
            <strong>QuickStartCanvas example</strong>
            <br />Click to change radius
          </div>
        </div>
        */}
      </div>
    );
  }
}
