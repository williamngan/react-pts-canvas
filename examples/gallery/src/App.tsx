import { useMemo, useState } from "react";
import { Line, Util } from "pts";
import { PtsCanvas } from "react-pts-canvas";

import { AnimationExample, ChartExample, SoundExample } from "./PtsExamples";
import "./App.css";

function gaussianData(variance: number): number[] {
  const points: number[] = [];
  for (let x = -5; x < 5; x += 0.1) {
    points.push(
      (1 / Math.sqrt(2 * Math.PI * variance)) *
        Math.exp(-(x * x) / (2 * variance)),
    );
  }
  return points;
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre>
      <code>{children.trim()}</code>
    </pre>
  );
}

const basicCode = `
<PtsCanvas
  canvasProps={{ "aria-label": "Pointer-controlled line study" }}
  onAnimate={(space, form) => {
    const lines = space.innerBound.map((point) =>
      Line.subpoints([point, space.pointer], 30),
    );
    form.strokeOnly("#ffd4e1", 2).rects(Util.zip(lines));
  }}
/>
`;

const animationCode = `
<PtsCanvas
  background="#ffe55c"
  onReady={createNoiseGrid}
  onPtsResize={createNoiseGrid}
  onAnimate={drawNoise}
  play={playing}
/>
`;

const chartCode = `
<PtsCanvas
  background="#25dca2"
  onAnimate={drawChart}
  onReady={(space) => space.playOnce()}
  play={false}
/>
`;

const soundCode = `
<PtsCanvas
  background="#42c7f5"
  onReady={loadSound}
  onAnimate={drawFrequencyDomain}
  onAction={toggleSound}
/>
`;

export default function App() {
  const [variance, setVariance] = useState(0.2);
  const [animationPlaying, setAnimationPlaying] = useState(true);
  const data = useMemo(() => gaussianData(variance), [variance]);
  const soundFile = `${import.meta.env.BASE_URL}spacetravel.mp3`;

  return (
    <main>
      <header className="hero">
        <h1>react-pts-canvas examples</h1>
        <nav aria-label="Project links">
          <a href="https://ptsjs.org">Pts</a>
          <a href="https://github.com/williamngan/react-pts-canvas">
            Component source
          </a>
          <a href="https://github.com/williamngan/react-pts-canvas/tree/master/examples/gallery">
            Example source
          </a>
        </nav>
      </header>

      <section className="examples" aria-label="PtsCanvas examples">
        <article className="example-card">
          <div className="canvas-frame">
            <PtsCanvas
              canvasProps={{
                "aria-label": "Pointer-controlled line study",
              }}
              classPrefix="pts-basic"
              onAnimate={(space, form) => {
                const lines = space.innerBound.map((point) =>
                  Line.subpoints([point, space.pointer], 30),
                );
                form.strokeOnly("#ffd4e1", 2).rects(Util.zip(lines));
              }}
            />
          </div>
          <div className="copy">
            <p className="index">01 / Pointer</p>
            <h2>Start with one callback</h2>
            <p>
              `onAnimate` receives the live Pts space and form. Move across the
              canvas to redraw a field of rectangles.
            </p>
            <CodeBlock>{basicCode}</CodeBlock>
          </div>
        </article>

        <article className="example-card reverse">
          <div className="canvas-frame">
            <AnimationExample
              background="#ffe55c"
              classPrefix="pts-animation"
              play={animationPlaying}
            />
          </div>
          <div className="copy">
            <p className="index">02 / Animation</p>
            <h2>Keep mutable drawing state outside React</h2>
            <p>
              Pts owns the high-frequency noise points while React controls the
              animation lifecycle.
            </p>
            <button
              type="button"
              onClick={() => setAnimationPlaying((value) => !value)}
            >
              {animationPlaying ? "Pause animation" : "Resume animation"}
            </button>
            <CodeBlock>{animationCode}</CodeBlock>
          </div>
        </article>

        <article className="example-card">
          <div className="canvas-frame">
            <ChartExample
              background="#25dca2"
              classPrefix="pts-chart"
              data={data}
            />
          </div>
          <div className="copy">
            <p className="index">03 / Data</p>
            <h2>Render only when data changes</h2>
            <p>
              This chart keeps continuous playback off and calls `playOnce`
              after React calculates a new Gaussian distribution.
            </p>
            <label>
              Variance <strong>{variance.toFixed(2)}</strong>
              <input
                aria-label="Gaussian variance"
                type="range"
                value={variance}
                min={0.1}
                max={2}
                step={0.05}
                onChange={(event) =>
                  setVariance(event.currentTarget.valueAsNumber)
                }
              />
            </label>
            <CodeBlock>{chartCode}</CodeBlock>
          </div>
        </article>

        <article className="example-card reverse">
          <div className="canvas-frame">
            <SoundExample
              background="#42c7f5"
              classPrefix="pts-sound"
              credit="Space Travel Cliché — MrGreenH"
              file={soundFile}
            />
          </div>
          <div className="copy">
            <p className="index">04 / Sound</p>
            <h2>Turn frequency data into points</h2>
            <p>
              Select the play icon in the canvas. Audio starts from that user
              gesture and Pts maps its frequency domain into the drawing space.
            </p>
            <CodeBlock>{soundCode}</CodeBlock>
          </div>
        </article>
      </section>

      <footer>
        Built with React, Vite, Pts, and `react-pts-canvas`. Music in the sound
        example by MrGreenH.
      </footer>
    </main>
  );
}
