import { useCallback, useEffect, useRef, useState } from "react";
import {
  Const,
  Create,
  Geom,
  Group,
  Line,
  type CanvasSpace,
  type Noise,
  Pt,
  Sound,
  Triangle,
} from "pts";
import {
  PtsCanvas,
  type HandleActionFn,
  type HandleAnimateFn,
  type PtsCanvasImperative,
} from "react-pts-canvas";

type ExampleProps = {
  background: string;
  classPrefix: string;
};

type ChartExampleProps = ExampleProps & {
  data: readonly number[];
};

type AnimationExampleProps = ExampleProps & {
  play: boolean;
};

type SoundExampleProps = ExampleProps & {
  credit: string;
  file: string;
};

export function ChartExample({
  data,
  background,
  classPrefix,
}: ChartExampleProps) {
  const canvas = useRef<PtsCanvasImperative>(null);

  const draw = useCallback<HandleAnimateFn>(
    (space, form) => {
      const width = space.size.x / data.length;
      const bars = data.map(
        (value, index) =>
          new Group(
            new Pt(index * width, space.size.y),
            new Pt(index * width, space.size.y - value * space.size.y - 1),
          ),
      );
      const pointerLine = new Group(
        new Pt(0, space.pointer.y),
        new Pt(space.size.x, space.pointer.y),
      );

      form.stroke("#fff", 2).line(pointerLine);
      const intersections = bars.flatMap((bar) => {
        form.stroke("#163a32", Math.max(1, width - 1)).line(bar);
        const point = Line.intersectLine2D(bar, pointerLine);
        return point ? [point] : [];
      });
      form.fillOnly("#ff7ab8").points(intersections, width / 2, "circle");
    },
    [data],
  );

  useEffect(() => {
    canvas.current?.getSpace()?.playOnce();
  }, [data]);

  return (
    <PtsCanvas
      ref={canvas}
      background={background}
      canvasProps={{ "aria-label": "Interactive Gaussian bar chart" }}
      classPrefix={classPrefix}
      onAnimate={draw}
      onReady={(space) => space.playOnce()}
      play={false}
    />
  );
}

export function AnimationExample({
  classPrefix,
  background,
  play,
}: AnimationExampleProps) {
  const noiseGrid = useRef<Noise[]>([]);

  const createGrid = useCallback((space: CanvasSpace) => {
    const points = Create.gridPts(space.innerBound, 20, 20);
    noiseGrid.current = Array.from(
      Create.noisePts(points, 0.05, 0.1, 20, 20),
      (point) => point as Noise,
    );
  }, []);

  const draw = useCallback<HandleAnimateFn>((space, form) => {
    const center = space.center.$max(1);
    const speed = space.pointer.$subtract(center).divide(center).abs();

    for (const point of noiseGrid.current) {
      point.step(0.01 * (1 - speed.x), 0.01 * (1 - speed.y));
      form
        .fillOnly("#10283c")
        .point(point, Math.abs((point.noise2D() * space.size.x) / 18));
    }
  }, []);

  return (
    <PtsCanvas
      background={background}
      canvasProps={{ "aria-label": "Animated Perlin noise grid" }}
      classPrefix={classPrefix}
      onAnimate={draw}
      onPtsResize={createGrid}
      onReady={createGrid}
      play={play}
    />
  );
}

export function SoundExample({
  background,
  classPrefix,
  file,
  credit,
}: SoundExampleProps) {
  const sound = useRef<Sound | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let active = true;
    setStatus("loading");

    void Sound.load(file)
      .then((loaded) => {
        if (!active) return;
        sound.current = loaded.analyze(256);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });

    return () => {
      active = false;
      if (sound.current?.playing) sound.current.stop();
      sound.current = null;
    };
  }, [file]);

  const draw = useCallback<HandleAnimateFn>(
    (space, form) => {
      const current = sound.current;
      if (current?.playing) {
        const colors = ["#ff5f8f", "#7868ff", "#fff", "#ffe55c", "#25dca2"];
        current.freqDomainTo(space.size).forEach((point, index) => {
          form
            .fillOnly(colors[index % colors.length] ?? "#fff")
            .point(point, 24);
        });
      }

      form.fillOnly("rgba(8, 30, 50, .72)").rect([
        [0, 0],
        [56, 56],
      ]);

      if (status === "loading") {
        form.fillOnly("#fff").text([72, 34], "Loading audio…");
      } else if (status === "error") {
        form.fillOnly("#fff").text([72, 34], "Audio unavailable");
      } else if (!current?.playing) {
        form
          .fillOnly("#fff")
          .polygon(
            Triangle.fromCenter([28, 28], 11).rotate2D(Const.half_pi, [28, 28]),
          );
      } else {
        form.fillOnly("#fff").rect([
          [20, 18],
          [25, 38],
        ]);
        form.fillOnly("#fff").rect([
          [31, 18],
          [36, 38],
        ]);
      }

      form
        .fillOnly("rgba(255, 255, 255, .75)")
        .text([20, space.size.y - 20], credit);
    },
    [credit, status],
  );

  const toggleSound = useCallback<HandleActionFn>(
    (space, _form, type, x, y) => {
      if (type !== "up" || !Geom.withinBound([x, y], [0, 0], [56, 56])) return;
      const current = sound.current;
      if (!current) return;

      if (current.playing) current.stop();
      else current.start();
      space.replay();
    },
    [],
  );

  return (
    <PtsCanvas
      background={background}
      canvasProps={{ "aria-label": "Audio frequency visualization" }}
      classPrefix={classPrefix}
      onAction={toggleSound}
      onAnimate={draw}
    />
  );
}
