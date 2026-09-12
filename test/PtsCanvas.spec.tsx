import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act as reactDomAct } from "react-dom/test-utils";
import { CanvasSpace, Tempo, type IPlayer } from "pts";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PtsCanvas,
  type HandleActionFn,
  type HandleAnimateFn,
  type HandleDisposeFn,
  type HandleErrorFn,
  type HandleReadyFn,
  type PtsCanvasImperative,
  type PtsCanvasProps,
} from "../src/index";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const act =
  (React as unknown as { act?: typeof reactDomAct }).act ?? reactDomAct;

type MountedCanvas = {
  container: HTMLDivElement;
  ref: React.RefObject<PtsCanvasImperative | null>;
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
  const ref = React.createRef<PtsCanvasImperative>();

  const render = async (nextProps: PtsCanvasProps, useStrictMode = strict) => {
    const canvas = <PtsCanvas {...nextProps} ref={ref} />;
    const element: React.ReactElement = useStrictMode ? (
      <React.StrictMode>{canvas}</React.StrictMode>
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

async function unmountCanvas(mounted: MountedCanvas) {
  await act(async () => mounted.root.unmount());
  mounted.container.remove();
  const index = mountedRoots.indexOf(mounted);
  if (index >= 0) mountedRoots.splice(index, 1);
}

afterEach(async () => {
  while (mountedRoots.length > 0) {
    const mounted = mountedRoots.pop();
    if (!mounted) continue;
    await act(async () => mounted.root.unmount());
    mounted.container.remove();
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("PtsCanvas", () => {
  it("exposes Pts and DOM handles and composes the new element props", async () => {
    const onReady = vi.fn<HandleReadyFn>();
    const canvasRef = React.createRef<HTMLCanvasElement>();
    const containerRef = React.createRef<HTMLDivElement>();
    const { container, ref } = await mountCanvas({
      "aria-label": "top-level canvas label",
      canvasClassName: "legacy-surface",
      canvasProps: {
        "aria-label": "nested canvas label",
        children: "Canvas fallback",
        className: "surface",
        style: { opacity: 0.8 },
      },
      canvasRef,
      canvasStyle: { display: "block", opacity: 0.5 },
      className: "legacy-container",
      classPrefix: "art",
      containerProps: {
        "aria-label": "drawing container",
        className: "container-api",
        style: { height: 180 },
      },
      containerRef,
      onReady,
      play: false,
      style: { width: 320 },
    });

    await waitUntilReady(ref);

    const wrapper = ref.current?.getContainer();
    const canvas = ref.current?.getCanvas();
    expect(wrapper).toBe(container.firstElementChild);
    expect(wrapper).toBe(containerRef.current);
    expect(wrapper?.className).toBe("art legacy-container container-api");
    expect(wrapper?.getAttribute("aria-label")).toBe("drawing container");
    expect(wrapper?.style.width).toBe("320px");
    expect(wrapper?.style.height).toBe("180px");
    expect(canvas).toBe(canvasRef.current);
    expect(canvas?.className).toBe("art-canvas legacy-surface surface");
    expect(canvas?.getAttribute("aria-label")).toBe("nested canvas label");
    expect(canvas?.style.display).toBe("block");
    expect(canvas?.style.opacity).toBe("0.8");
    expect(canvas?.textContent).toBe("Canvas fallback");
    expect(ref.current?.getSpace()).toBeDefined();
    expect(ref.current?.getForm()?.ctx).toBeInstanceOf(
      CanvasRenderingContext2D,
    );
    expect(ref.current?.getPlayer()).toBeDefined();
    expect(onReady).toHaveBeenCalledOnce();
  });

  it("dispatches current callbacks through real pointer and keyboard events", async () => {
    const firstAnimate = vi.fn<HandleAnimateFn>();
    const secondAnimate = vi.fn<HandleAnimateFn>();
    const onAction = vi.fn<HandleActionFn>();
    const mounted = await mountCanvas({
      input: { keyboard: true, pointer: true, touch: false },
      onAction,
      onAnimate: firstAnimate,
      play: false,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);

    const player = mounted.ref.current?.getPlayer();
    player?.animate?.(0, 0, mounted.ref.current!.getSpace()!);
    expect(firstAnimate).toHaveBeenCalledWith(
      mounted.ref.current?.getSpace(),
      mounted.ref.current?.getForm(),
      0,
      0,
    );

    await mounted.render({
      input: { keyboard: true, pointer: true, touch: false },
      onAction,
      onAnimate: secondAnimate,
      play: true,
      style: { width: 200, height: 120 },
    });
    await vi.waitFor(() => {
      expect(mounted.ref.current?.getSpace()?.isPlaying).toBe(true);
    });
    player?.animate?.(16, 16, mounted.ref.current!.getSpace()!);
    expect(firstAnimate).toHaveBeenCalledOnce();
    expect(secondAnimate).toHaveBeenCalled();

    const canvas = mounted.ref.current?.getCanvas();
    await act(async () => {
      canvas?.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: 12,
          clientY: 34,
        }),
      );
      canvas?.dispatchEvent(
        new KeyboardEvent("keydown", {
          altKey: true,
          bubbles: true,
          shiftKey: true,
        }),
      );
    });

    expect(onAction).toHaveBeenCalledWith(
      mounted.ref.current?.getSpace(),
      mounted.ref.current?.getForm(),
      "move",
      expect.any(Number),
      expect.any(Number),
      expect.any(PointerEvent),
    );
    expect(onAction).toHaveBeenCalledWith(
      mounted.ref.current?.getSpace(),
      mounted.ref.current?.getForm(),
      "keydown",
      1,
      1,
      expect.any(KeyboardEvent),
    );
    expect(canvas?.tabIndex).toBe(0);
  });

  it("updates live behavior and players without rebuilding the space", async () => {
    const firstPlayer: IPlayer = {
      animate: vi.fn<NonNullable<IPlayer["animate"]>>(),
    };
    const secondPlayer: IPlayer = {
      animate: vi.fn<NonNullable<IPlayer["animate"]>>(),
    };
    const tempo = new Tempo(120);
    const onReady = vi.fn<HandleReadyFn>();
    const mounted = await mountCanvas({
      background: "#123",
      input: { pointer: true, touch: true },
      onReady,
      play: false,
      players: [firstPlayer],
      resize: true,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);

    const space = mounted.ref.current?.getSpace();
    if (!space) throw new Error("Expected CanvasSpace");
    const clear = vi.spyOn(space, "clear");
    const refresh = vi.spyOn(space, "refresh");
    const replay = vi.spyOn(space, "replay");
    const minFrameTime = vi.spyOn(space, "minFrameTime");
    const bindMouse = vi.spyOn(space, "bindMouse");
    const bindTouch = vi.spyOn(space, "bindTouch");
    const add = vi.spyOn(space, "add");
    const remove = vi.spyOn(space, "remove");

    await mounted.render({
      background: "#456",
      input: { pointer: false, touch: false },
      minFrameTime: 33,
      onReady,
      play: true,
      players: [secondPlayer],
      refresh: false,
      resize: false,
      style: { width: 200, height: 120 },
      tempo,
    });

    expect(mounted.ref.current?.getSpace()).toBe(space);
    expect(space.background).toBe("#456");
    expect(space.autoResize).toBe(false);
    expect(clear).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledWith(false);
    expect(replay).toHaveBeenCalled();
    expect(minFrameTime).toHaveBeenCalledWith(33);
    expect(bindMouse).toHaveBeenCalledWith(false);
    expect(bindTouch).toHaveBeenCalledWith(false, false);
    expect(remove).toHaveBeenCalledWith(firstPlayer);
    expect(add).toHaveBeenCalledWith(secondPlayer);
    expect(add).toHaveBeenCalledWith(tempo);
    expect(onReady).toHaveBeenCalledOnce();
  });

  it("rebuilds only rendering-context options and runs owned cleanup", async () => {
    const cleanup = vi.fn<() => void>();
    const onDispose = vi.fn<HandleDisposeFn>();
    const onReady = vi.fn<HandleReadyFn>(() => cleanup);
    const mounted = await mountCanvas({
      offscreen: false,
      onDispose,
      onReady,
      play: false,
      retina: false,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);

    const firstSpace = mounted.ref.current?.getSpace();
    if (!firstSpace) throw new Error("Expected CanvasSpace");
    const dispose = vi.spyOn(firstSpace, "dispose");

    await mounted.render({
      offscreen: true,
      onDispose,
      onReady,
      play: false,
      retina: false,
      style: { width: 200, height: 120 },
    });

    expect(dispose).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(onDispose).toHaveBeenCalledWith(
      firstSpace,
      expect.objectContaining({ ctx: expect.any(CanvasRenderingContext2D) }),
    );
    expect(mounted.ref.current?.getSpace()).not.toBe(firstSpace);
    await waitUntilReady(mounted.ref);

    await unmountCanvas(mounted);
    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(onDispose).toHaveBeenCalledTimes(2);
  });

  it("reports asynchronous callback and disposal errors", async () => {
    const readyError = new Error("ready failed");
    const cleanupError = new Error("cleanup failed");
    const disposeError = new Error("dispose failed");
    const onError = vi.fn<HandleErrorFn>();
    const readyFailure = await mountCanvas({
      onError,
      onReady: () => {
        throw readyError;
      },
      play: false,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(readyFailure.ref);
    expect(onError).toHaveBeenCalledWith(
      readyError,
      expect.objectContaining({ phase: "ready" }),
    );
    await unmountCanvas(readyFailure);

    const mounted = await mountCanvas({
      onDispose: () => {
        throw disposeError;
      },
      onError,
      onReady: () => () => {
        throw cleanupError;
      },
      play: false,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);

    const animateError = new Error("animate failed");
    await mounted.render({
      onAnimate: () => {
        throw animateError;
      },
      onDispose: () => {
        throw disposeError;
      },
      onError,
      onReady: () => () => {
        throw cleanupError;
      },
      play: false,
      style: { width: 200, height: 120 },
    });
    mounted.ref.current
      ?.getPlayer()
      ?.animate?.(1, 1, mounted.ref.current.getSpace()!);
    expect(onError).toHaveBeenCalledWith(
      animateError,
      expect.objectContaining({ phase: "animate" }),
    );

    await unmountCanvas(mounted);
    expect(onError).toHaveBeenCalledWith(
      cleanupError,
      expect.objectContaining({ phase: "cleanup" }),
    );
    expect(onError).toHaveBeenCalledWith(
      disposeError,
      expect.objectContaining({ phase: "dispose" }),
    );
  });

  it("disposes partial resources after initialization errors", async () => {
    const initializationError = new Error("player setup failed");
    const onError = vi.fn<HandleErrorFn>();
    const dispose = vi.spyOn(CanvasSpace.prototype, "dispose");
    const player: IPlayer = { animate: () => undefined };
    Object.defineProperty(player, "animateID", {
      get() {
        throw initializationError;
      },
    });

    const mounted = await mountCanvas({
      onError,
      play: false,
      players: [player],
      style: { width: 200, height: 120 },
    });

    expect(onError).toHaveBeenCalledWith(
      initializationError,
      expect.objectContaining({ phase: "initialize" }),
    );
    expect(dispose).toHaveBeenCalledOnce();
    expect(mounted.ref.current?.getSpace()).toBeUndefined();
    expect(mounted.ref.current?.getForm()).toBeUndefined();
    expect(mounted.ref.current?.getPlayer()).toBeUndefined();
  });

  it("owns canvas keyboard listeners across live input changes", async () => {
    const mounted = await mountCanvas({
      input: { keyboard: false, pointer: false, touch: false },
      play: false,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);
    const canvas = mounted.ref.current?.getCanvas();
    if (!canvas) throw new Error("Expected canvas");
    const add = vi.spyOn(canvas, "addEventListener");
    const remove = vi.spyOn(canvas, "removeEventListener");

    await mounted.render({
      input: { keyboard: true, pointer: false, touch: false },
      play: false,
      style: { width: 200, height: 120 },
    });
    await mounted.render({
      input: { keyboard: false, pointer: false, touch: false },
      play: false,
      style: { width: 200, height: 120 },
    });

    for (const type of ["keydown", "keyup"]) {
      const added = add.mock.calls.find(([event]) => event === type);
      const removed = remove.mock.calls.find(([event]) => event === type);
      expect(removed?.[1], `listener for ${type}`).toBe(added?.[1]);
    }
  });

  it("delivers canvas-scoped keyboard actions to imperatively added players", async () => {
    const action = vi.fn<NonNullable<IPlayer["action"]>>();
    const mounted = await mountCanvas({
      input: {
        keyboard: true,
        keyboardTarget: "canvas",
        pointer: false,
        touch: false,
      },
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);
    const space = mounted.ref.current?.getSpace();
    if (!space) throw new Error("Expected CanvasSpace");
    space.add({ action });
    await vi.waitFor(() => expect(space.isPlaying).toBe(true));

    mounted.ref.current
      ?.getCanvas()
      ?.dispatchEvent(
        new KeyboardEvent("keyup", { bubbles: true, shiftKey: true }),
      );
    expect(action).toHaveBeenCalledWith(
      "keyup",
      1,
      0,
      expect.any(KeyboardEvent),
    );

    const onAction = vi.fn<HandleActionFn>();
    await mounted.render({
      input: {
        keyboard: true,
        keyboardTarget: "document",
        pointer: false,
        touch: false,
      },
      onAction,
      style: { width: 200, height: 120 },
    });
    document.dispatchEvent(new KeyboardEvent("keydown", { altKey: true }));
    expect(onAction).toHaveBeenCalledWith(
      space,
      mounted.ref.current?.getForm(),
      "keydown",
      0,
      1,
      expect.any(KeyboardEvent),
    );
    expect(action).toHaveBeenCalledWith(
      "keydown",
      0,
      1,
      expect.any(KeyboardEvent),
    );

    await mounted.render({
      input: { keyboard: false, pointer: false, touch: false },
      onAction,
      style: { width: 200, height: 120 },
    });
    document.dispatchEvent(new KeyboardEvent("keydown"));
    mounted.ref.current
      ?.getCanvas()
      ?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("pauses and resumes for document and viewport visibility", async () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    let intersect: IntersectionObserverCallback | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersect = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const mounted = await mountCanvas({
      pauseWhenHidden: true,
      pauseWhenOffscreen: true,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);
    const space = mounted.ref.current?.getSpace();
    if (!space) throw new Error("Expected CanvasSpace");
    const stop = vi.spyOn(space, "stop");
    const replay = vi.spyOn(space, "replay");

    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(stop).toHaveBeenCalled();
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(replay).toHaveBeenCalled();

    intersect?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(stop).toHaveBeenCalledTimes(2);
    intersect?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(replay).toHaveBeenCalledTimes(2);
  });

  it("caps effective pixel density", async () => {
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(3);
    const mounted = await mountCanvas({
      maxPixelDensity: 2,
      play: false,
      retina: true,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);
    expect(mounted.ref.current?.getSpace()?.pixelScale).toBe(2);

    await mounted.render({
      maxPixelDensity: 1.5,
      pixelDensity: 4,
      play: false,
      retina: true,
      style: { width: 200, height: 120 },
    });
    await waitUntilReady(mounted.ref);
    expect(mounted.ref.current?.getSpace()?.pixelScale).toBe(1.5);
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
