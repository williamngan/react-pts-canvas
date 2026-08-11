import { useCallback, useRef, useState } from "react";
import { Num, Pt } from "pts";

import {
  PtsCanvas,
  type HandleAnimateFn,
  type PtsCanvasImperative,
} from "../lib";
import "./App.css";

export default function App() {
  const canvas = useRef<PtsCanvasImperative>(null);
  const [playing, setPlaying] = useState(true);
  const [background, setBackground] = useState("#182034");

  const animate = useCallback<HandleAnimateFn>((space, form, time) => {
    const pulse = 14 + 6 * Math.sin(time / 350);
    const orbit = Num.cycle((time % 4_000) / 4_000) * Math.PI * 2;
    const satellite = new Pt(
      space.center.x + Math.cos(orbit) * space.size.x * 0.25,
      space.center.y + Math.sin(orbit) * space.size.y * 0.25,
    );

    form.fillOnly("#f6c").point(space.pointer, pulse);
    form
      .strokeOnly("rgba(255,255,255,.35)", 2)
      .line([space.center, space.pointer]);
    form.fillOnly("#7ef").point(satellite, 8);
  }, []);

  return (
    <main>
      <section className="intro">
        <p className="eyebrow">React 19 + Pts</p>
        <h1>react-pts-canvas</h1>
        <p>
          A small, typed React wrapper around Pts&apos;s CanvasSpace. Move your
          pointer over the canvas and use the controls to update it without
          replacing the component.
        </p>
        <div className="controls">
          <button type="button" onClick={() => setPlaying((value) => !value)}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={() =>
              setBackground((value) =>
                value === "#182034" ? "#321b43" : "#182034",
              )
            }
          >
            Change setup
          </button>
          <button
            type="button"
            onClick={() => canvas.current?.getSpace()?.playOnce(500)}
          >
            Play once
          </button>
        </div>
      </section>

      <PtsCanvas
        ref={canvas}
        aria-label="Interactive Pts canvas"
        background={background}
        className="demo-canvas"
        onAnimate={animate}
        play={playing}
      />
    </main>
  );
}
