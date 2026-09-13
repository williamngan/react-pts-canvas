import { useEffect, useMemo, useState } from "react";

import apiSections from "../../../API.md?sections";
import { highlight } from "./highlight";
import {
  AnimationExample,
  BasicExample,
  ChartExample,
  HeroExample,
  QuickStartExample,
  SoundExample,
} from "./PtsExamples";
import "./App.css";

const repository = "https://github.com/williamngan/react-pts-canvas";

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

/** A code panel in the cli.ptsjs.org style: language label, copy button. */
function CodeBlock({
  children,
  language,
}: {
  children: string;
  language: "bash" | "css" | "tsx";
}) {
  return (
    <div className="code-panel">
      <div className="panel-head">
        <span>{language}</span>
        <button className="copy-button" type="button" aria-label="Copy code">
          Copy
        </button>
      </div>
      <pre tabIndex={0}>
        <code
          dangerouslySetInnerHTML={{
            __html: highlight(children.trim(), language),
          }}
        />
      </pre>
    </div>
  );
}

/** Same strategy as cli.ptsjs.org: execCommand first, clipboard API second. */
async function copyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (copied) return;
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Copy command was unavailable");
}

/** One delegated handler serves both site and Markdown-rendered panels. */
function useCopyButtons() {
  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLElement>(
        ".copy-button",
      );
      const code = button?.closest(".code-panel")?.querySelector("pre");
      if (!button || !code) return;
      const original = button.textContent;
      try {
        await copyText(code.innerText);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Copy failed";
      }
      window.setTimeout(() => {
        button.textContent = original;
      }, 1600);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

/** Keep this block identical to the README quick start. */
const quickStartCode = `
import { PtsCanvas } from "react-pts-canvas";

export function Drawing() {
  return (
    <PtsCanvas
      background="#f1f3f9"
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
`;

const installCode = `
npm install react-pts-canvas pts
`;

const sizingCode = `
.drawing {
  width: 100%;
  height: 24rem;
}
`;

const lifecycleCode = `
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
`;

const imperativeCode = `
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
`;

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
const canvas = useRef<PtsCanvasImperative>(null);

useEffect(() => {
  canvas.current?.getSpace()?.playOnce();
}, [data]);

<PtsCanvas
  ref={canvas}
  background="#25dca2"
  onAnimate={drawChart}
  onReady={(space) => space.playOnce()}
  onPtsResize={(space) => space.playOnce()}
  play={false}
/>
`;

const soundCode = `
const sound = useRef<Sound | null>(null);
const [status, setStatus] = useState("loading");

useEffect(() => {
  let active = true;
  setStatus("loading");
  void Sound.load(file)
    .then((loaded) => {
      if (!active) {
        loaded.dispose();
        return;
      }
      sound.current = loaded;
      loaded.analyze(256);
      setStatus("ready");
    })
    .catch(() => {
      if (active) {
        sound.current?.dispose();
        sound.current = null;
        setStatus("error");
      }
    });
  return () => {
    active = false;
    sound.current?.dispose();
    sound.current = null;
  };
}, [file]);

<PtsCanvas
  background="#42c7f5"
  onAnimate={drawFrequencyDomain}
  onAction={toggleSound}
/>
`;

type MenuEntry = { id: string; title: string; children?: MenuEntry[] };

const menu: MenuEntry[] = [
  { id: "overview", title: "Overview" },
  { id: "install", title: "Install" },
  { id: "examples", title: "Examples" },
  { id: "quick-start", title: "Quick start" },
  { id: "lifecycle", title: "Lifecycle" },
  {
    id: "reference",
    title: "Reference",
    children: apiSections.map(({ id, title }) => ({ id, title })),
  },
  { id: "resources", title: "Resources" },
];

/**
 * Sections render after the document loads, so a deep link such as
 * `/#quick-start` needs one scroll once its target exists.
 */
function useInitialHashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    document.getElementById(id)?.scrollIntoView();
  }, []);
}

/** Tracks which top-level section is closest to the top of the viewport. */
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    const update = () => {
      const offset = 120;
      let current = ids[0] ?? "";
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= offset) {
          current = id;
        }
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="react-pts-canvas home">
          <strong>Pts.</strong>
          <span>react</span>
        </a>
        <a href="https://ptsjs.org">Pts.js</a>
        <a href="https://www.npmjs.com/package/react-pts-canvas">npm</a>
        <a href={repository}>GitHub</a>
      </nav>
    </header>
  );
}

function SideMenu({ active }: { active: string }) {
  return (
    <nav id="menu" aria-label="Page sections">
      <ol>
        {menu.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={active === entry.id ? "location" : undefined}
            >
              {entry.title}
            </a>
            {entry.children && (
              <ul>
                {entry.children.map((child) => (
                  <li key={child.id}>
                    <a href={`#${child.id}`}>{child.title}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Example({
  id,
  index,
  title,
  children,
  canvas,
  code,
}: {
  id: string;
  index: string;
  title: string;
  children: React.ReactNode;
  canvas: React.ReactNode;
  code: string;
}) {
  return (
    <article className="example" id={id}>
      <h3>
        <span className="index">{index}</span>
        <br />
        {title}
      </h3>
      {children}
      <div className="canvas-frame">{canvas}</div>
      <CodeBlock language="tsx">{code}</CodeBlock>
    </article>
  );
}

export default function App() {
  const [variance, setVariance] = useState(0.2);
  const [animationPlaying, setAnimationPlaying] = useState(true);
  const data = useMemo(() => gaussianData(variance), [variance]);
  const soundFile = `${import.meta.env.BASE_URL}spacetravel.mp3`;
  const topLevelIds = useMemo(() => menu.map((entry) => entry.id), []);
  const active = useActiveSection(topLevelIds);
  useInitialHashScroll();
  useCopyButtons();

  return (
    <>
      <SiteHeader />

      <div id="board" className="hero">
        <div className="hero-canvas">
          <HeroExample classPrefix="pts-hero" />
        </div>
        <div className="hero-copy">
          <h1>react-pts-canvas</h1>
          <p>Use this component to integrate Pts.js into your React app.</p>
        </div>
      </div>

      <SideMenu active={active} />

      <main id="post">
        <section id="overview">
          <h2>Overview</h2>
          <p>
            <code>react-pts-canvas</code> is a small React component for drawing
            with <a href="https://ptsjs.org">Pts</a>. It renders one wrapper{" "}
            <code>&lt;div&gt;</code> containing one <code>&lt;canvas&gt;</code>,
            creates a Pts <code>CanvasSpace</code> for that canvas, and passes
            the current space and form to typed callbacks. React owns the
            lifecycle; Pts owns the drawing.
          </p>
          <p>
            It requires Pts <code>^1.0.0</code>, React <code>^18.2.0</code> or
            React 19, and the matching React DOM version.
          </p>
        </section>

        <section id="install">
          <h2>Install</h2>
          <p>
            Install the component and its Pts peer dependency in an existing
            React app:
          </p>
          <CodeBlock language="bash">{installCode}</CodeBlock>
          <p>
            The package publishes ESM, CommonJS, and TypeScript declarations
            with a preserved <code>&quot;use client&quot;</code> directive.
            React and Pts stay external peer dependencies rather than bundled
            code.
          </p>
          <p>
            Upgrading from <code>react-pts-canvas@0.5.2</code>? Move Pts from
            0.12 to 1.0 at the same time and read the{" "}
            <a href={`${repository}/blob/master/MIGRATION.md`}>
              migration guide
            </a>
            .
          </p>
        </section>

        <section id="examples">
          <h2>Examples</h2>

          <Example
            id="example-pointer"
            index="1. Pointer"
            title="Start with one callback"
            canvas={<BasicExample background="#9ab" classPrefix="pts-basic" />}
            code={basicCode}
          >
            <p>
              <code>onAnimate</code> receives the live Pts space and form. Move
              across the canvas to redraw a field of rectangles.
            </p>
          </Example>

          <Example
            id="example-animation"
            index="2. Animation"
            title="Keep mutable drawing state outside React"
            canvas={
              <AnimationExample
                background="#ffe55c"
                classPrefix="pts-animation"
                play={animationPlaying}
              />
            }
            code={animationCode}
          >
            <p>
              Pts owns the high-frequency noise points while React controls the
              animation lifecycle through the <code>play</code> prop.
            </p>
            <button
              type="button"
              className="cta"
              onClick={() => setAnimationPlaying((value) => !value)}
            >
              {animationPlaying ? "Pause animation" : "Resume animation"}
            </button>
          </Example>

          <Example
            id="example-data"
            index="3. Data"
            title="Render only when data changes"
            canvas={
              <ChartExample
                background="#25dca2"
                classPrefix="pts-chart"
                data={data}
              />
            }
            code={chartCode}
          >
            <p>
              This chart keeps continuous playback off and calls{" "}
              <code>playOnce</code> after React calculates a new Gaussian
              distribution and when its wrapper resizes.
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
          </Example>

          <Example
            id="example-sound"
            index="4. Sound"
            title="Turn frequency data into points"
            canvas={
              <SoundExample
                background="#42c7f5"
                classPrefix="pts-sound"
                credit="Space Travel Cliché — MrGreenH"
                file={soundFile}
              />
            }
            code={soundCode}
          >
            <p>
              Select the play icon in the canvas. Audio starts from that user
              gesture and Pts maps its frequency domain into the drawing space.
              The audio resource is acquired and released in a React effect; the
              Pts callbacks only draw and handle input.
            </p>
          </Example>
        </section>

        <section id="quick-start">
          <h2>Quick start</h2>
          <p>
            Render <code>PtsCanvas</code> with an <code>onAnimate</code>{" "}
            callback. It receives the live space and form on every frame while
            the space is playing.
          </p>
          <div className="example">
            <div className="canvas-frame quick-start-frame">
              <QuickStartExample />
            </div>
            <CodeBlock language="tsx">{quickStartCode}</CodeBlock>
          </div>
          <p>
            Give the wrapper an explicit size. Pts measures the wrapper and
            sizes the canvas to match it; canvas <code>width</code> and{" "}
            <code>height</code> attributes are not layout controls.
          </p>
          <CodeBlock language="css">{sizingCode}</CodeBlock>

          <h5>
            The quick start above, running live. Move across it. The drawing
            methods belong to Pts; start with the{" "}
            <a href="https://ptsjs.org/guide/Get-started-0100.html">
              Pts guide
            </a>{" "}
            if the <code>space</code>, <code>form</code>, or <code>Pt</code>{" "}
            APIs are new to you.
          </h5>
        </section>

        <section id="lifecycle">
          <h2>Lifecycle</h2>
          <p>
            <code>PtsCanvas</code> creates one <code>CanvasSpace</code> for the
            mounted canvas. Callback props always use their latest functions
            without replacing that space. Background, input, playback, and
            player changes update the existing space as well; only
            rendering-context options such as <code>retina</code> and{" "}
            <code>offscreen</code> replace it.
          </p>
          <CodeBlock language="tsx">{lifecycleCode}</CodeBlock>
          <p>
            The initial Pts resize callback normally runs before{" "}
            <code>onReady</code>. If <code>onReady</code> returns a function,
            the component treats it as owned cleanup. On replacement or unmount
            the order is <code>onReady</code> cleanup, then{" "}
            <code>onDispose</code>, then <code>CanvasSpace.dispose</code>.
          </p>
          <p>
            Pts dispatches pointer, touch, and keyboard actions only while the
            space is playing, so <code>play={"{false}"}</code> also suspends{" "}
            <code>onAction</code>. An external React control can still use the
            imperative ref:
          </p>
          <CodeBlock language="tsx">{imperativeCode}</CodeBlock>
        </section>

        <section id="reference">
          <h2>Reference</h2>
          {apiSections.map((section) => (
            <section key={section.id} id={section.id} className="api-section">
              <h3>{section.title}</h3>
              <div dangerouslySetInnerHTML={{ __html: section.html }} />
            </section>
          ))}
        </section>

        <section id="resources">
          <h2>Resources</h2>
          <ul>
            <li>
              <a href={`${repository}`}>react-pts-canvas Github</a>: Setup and
              API documentations in the github repo.
            </li>
            <li>
              <a href={`${repository}/blob/master/llms.txt`}>llms.txt</a>: Quick
              start for your AI agents
            </li>
            <li>
              <a href={`${repository}/blob/master/MIGRATION.md`}>
                Migration guide
              </a>
              : upgrading from 0.5.2 and replacing deprecated props
            </li>
            <li>
              <a href="https://ptsjs.org/">Pts.js</a> documentation
            </li>
            <li>
              <a href="https://ptsjs.org/guide/Ecosystem-8000">Pts ecosystem</a>{" "}
              which offers other options like{" "}
              <a href="https://cli.ptsjs.org/">CLI</a> and{" "}
              <a href="https://ptspy.org">Python</a>.
            </li>
          </ul>
        </section>
      </main>

      <footer id="footer">
        Copyright © 2019-current by{" "}
        <a href="https://github.com/williamngan">William Ngan</a> and
        contributors. <code>react-pts-canvas</code> is an{" "}
        <a href={repository}>open source project</a> under Apache License 2.0.
        Music in the sound example by MrGreenH.
      </footer>
    </>
  );
}
