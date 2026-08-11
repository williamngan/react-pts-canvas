import {
  createRef,
  StrictMode,
  type ReactElement,
  type RefObject,
} from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Tempo } from "pts";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PtsCanvas,
  type HandleActionFn,
  type HandleAnimateFn,
  type HandleReadyFn,
  type PtsCanvasImperative,
  type PtsCanvasProps,
} from "./index";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

type MountedCanvas = {
  container: HTMLDivElement;
  ref: RefObject<PtsCanvasImperative | null>;
  render: (props: PtsCanvasProps, strict?: boolean) => Promise<void>;
  root: Root;
};

const mountedRoots: MountedCanvas[] = [];

async function mountCanvas(
  props: PtsCanvasProps,
  strict = false,
): Promise<MountedCanvas> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const ref = createRef<PtsCanvasImperative>();

  const render = async (nextProps: PtsCanvasProps, useStrictMode = strict) => {
    const canvas = <PtsCanvas {...nextProps} ref={ref} />;
    const element: ReactElement = useStrictMode ? (
      <StrictMode>{canvas}</StrictMode>
    ) : (
      canvas
    );
    await act(async () => root.render(element));
  };

  const mounted = { container, ref, render, root };
  mountedRoots.push(mounted);
  await render(props);
  return mounted;
}

async function waitUntilReady(ref: MountedCanvas["ref"]) {
  await vi.waitFor(
    () => {
      expect(ref.current?.getSpace()?.ready).toBe(true);
    },
    { timeout: 2_000 },
  );
}

afterEach(async () => {
  while (mountedRoots.length > 0) {
    const mounted = mountedRoots.pop();
    if (!mounted) continue;
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
});

describe("PtsCanvas", () => {
  it("creates a real Pts space and exposes its imperative handles", async () => {
    const onReady = vi.fn<HandleReadyFn>();
    const { container, ref } = await mountCanvas({
      "aria-label": "interactive drawing",
      canvasClassName: "surface",
      canvasStyle: { opacity: 0.9 },
      className: "demo",
      name: "art",
      onReady,
      play: false,
      style: { width: 320, height: 180 },
    });

    await waitUntilReady(ref);

    const wrapper = container.firstElementChild as HTMLDivElement;
    const canvas = ref.current?.getCanvas();
    expect(wrapper.className).toBe("art demo");
    expect(canvas?.className).toBe("art-canvas surface");
    expect(canvas?.getAttribute("aria-label")).toBe("interactive drawing");
    expect(canvas?.style.opacity).toBe("0.9");
    expect(ref.current?.getSpace()).toBeDefined();
    expect(ref.current?.getForm()?.ctx).toBeInstanceOf(
      CanvasRenderingContext2D,
    );
    expect(ref.current?.getPlayer()).toBeDefined();
    expect(onReady).toHaveBeenCalledOnce();
  });

  it("dispatches current callbacks and preserves zero animation times", async () => {
    const firstAnimate = vi.fn<HandleAnimateFn>();
    const secondAnimate = vi.fn<HandleAnimateFn>();
    const onAction = vi.fn<HandleActionFn>();
    const mounted = await mountCanvas({
      onAction,
      onAnimate: firstAnimate,
      play: false,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);

    const player = mounted.ref.current?.getPlayer();
    player?.animate?.(0, 0, mounted.ref.current?.getSpace());
    expect(firstAnimate).toHaveBeenCalledWith(
      mounted.ref.current?.getSpace(),
      mounted.ref.current?.getForm(),
      0,
      0,
    );

    await mounted.render({
      onAction,
      onAnimate: secondAnimate,
      play: false,
      style: { width: 200, height: 120 },
    });
    player?.animate?.(16, 16, mounted.ref.current?.getSpace());
    expect(firstAnimate).toHaveBeenCalledOnce();
    expect(secondAnimate).toHaveBeenCalledOnce();

    player?.action?.("move", 12, 34, new Event("pointermove"));
    expect(onAction).toHaveBeenCalledWith(
      mounted.ref.current?.getSpace(),
      mounted.ref.current?.getForm(),
      "move",
      12,
      34,
      expect.any(Event),
    );
  });

  it("updates refresh, playback, and tempo without rebuilding the space", async () => {
    const firstTempo = new Tempo(60);
    const secondTempo = new Tempo(120);
    const mounted = await mountCanvas({
      play: false,
      refresh: true,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);

    const space = mounted.ref.current?.getSpace();
    if (!space) throw new Error("Expected CanvasSpace");
    const refresh = vi.spyOn(space, "refresh");
    const replay = vi.spyOn(space, "replay");
    const stop = vi.spyOn(space, "stop");
    const add = vi.spyOn(space, "add");
    const remove = vi.spyOn(space, "remove");

    await mounted.render({
      play: true,
      refresh: false,
      style: { width: 200, height: 120 },
      tempo: firstTempo,
    });
    expect(mounted.ref.current?.getSpace()).toBe(space);
    expect(refresh).toHaveBeenCalledWith(false);
    expect(replay).toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith(firstTempo);

    await mounted.render({
      play: false,
      refresh: false,
      style: { width: 200, height: 120 },
      tempo: secondTempo,
    });
    expect(remove).toHaveBeenCalledWith(firstTempo);
    expect(add).toHaveBeenCalledWith(secondTempo);
    expect(stop).toHaveBeenCalled();
  });

  it("rebuilds for immutable setup options and disposes every owned space", async () => {
    const mounted = await mountCanvas({
      background: "#123",
      play: false,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);

    const firstSpace = mounted.ref.current?.getSpace();
    if (!firstSpace) throw new Error("Expected CanvasSpace");
    const dispose = vi.spyOn(firstSpace, "dispose");

    await mounted.render({
      background: "#456",
      play: false,
      style: { width: 200, height: 120 },
    });

    expect(dispose).toHaveBeenCalledOnce();
    expect(mounted.ref.current?.getSpace()).not.toBe(firstSpace);
    await waitUntilReady(mounted.ref);

    const secondSpace = mounted.ref.current?.getSpace();
    if (!secondSpace) throw new Error("Expected replacement CanvasSpace");
    const secondDispose = vi.spyOn(secondSpace, "dispose");
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
    mountedRoots.splice(mountedRoots.indexOf(mounted), 1);
    expect(secondDispose).toHaveBeenCalledOnce();
    expect(mounted.ref.current).toBeNull();
  });

  it("survives React Strict Mode without delivering stale ready callbacks", async () => {
    const onReady = vi.fn<HandleReadyFn>();
    const mounted = await mountCanvas(
      {
        onReady,
        play: false,
        style: { width: 200, height: 120 },
      },
      true,
    );

    await waitUntilReady(mounted.ref);
    expect(onReady).toHaveBeenCalledOnce();
    expect(mounted.container.querySelectorAll("canvas")).toHaveLength(1);
  });
});
