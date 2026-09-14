"use client";

/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CanvasHTMLAttributes,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type Ref,
} from "react";
import {
  CanvasSpace,
  type Bound,
  type CanvasForm,
  type IPlayer,
  type Tempo,
} from "pts";

import { useIsomorphicLayoutEffect } from "./hooks";

/**
 * Read-only access to objects owned by {@link PtsCanvas}.
 *
 * Do not dispose the returned space or mutate the internal callback player.
 * Values are unavailable before initialization and after disposal. A retained
 * handle can still inspect the old objects during cleanup and `onDispose`.
 */
export type PtsCanvasImperative = {
  /** Return the owned Pts space, or `undefined` while unavailable. */
  getSpace: () => CanvasSpace | undefined;
  /** Return the form passed to lifecycle callbacks. */
  getForm: () => CanvasForm | undefined;
  /** Return the internal callback bridge. Treat it as read-only. */
  getPlayer: () => IPlayer | undefined;
  /** Return the rendered canvas element, or `null` while unavailable. */
  getCanvas: () => HTMLCanvasElement | null;
  /** Return the rendered wrapper element, or `null` while unavailable. */
  getContainer: () => HTMLDivElement | null;
};

/** Cleanup recognized when returned from `onReady`. */
export type PtsCanvasCleanup = () => void;

/**
 * Called once after a new CanvasSpace and form are initialized and sized.
 * Returning a function registers cleanup for replacement or unmount; other
 * return values are ignored.
 */
export type HandleReadyFn = (
  space: CanvasSpace,
  form: CanvasForm,
  bound: Bound,
) => unknown;

/** Called for each Pts frame that advances while the space is playing. */
export type HandleAnimateFn = (
  space: CanvasSpace,
  form: CanvasForm,
  time: number,
  frameTime: number,
) => void;

/**
 * Called for the initial Pts measurement and later resize operations. The
 * initial call normally precedes `onReady` and can have no event.
 * Stopped drawings can request a repaint with `space.playOnce()` here.
 */
export type HandleResizeFn = (
  space: CanvasSpace,
  form: CanvasForm,
  bound: Bound,
  event?: Event,
) => void;

/** Known Pts actions plus custom or future string action names. */
export type ActionType =
  | "up"
  | "down"
  | "move"
  | "drag"
  | "uidrag"
  | "drop"
  | "uidrop"
  | "over"
  | "out"
  | "enter"
  | "leave"
  | "click"
  | "keydown"
  | "keyup"
  | "pointerdown"
  | "pointerup"
  | "contextmenu"
  | "all"
  | (string & {});

/**
 * Called for enabled Pts input while the space is playing. Keyboard actions
 * encode Shift as `x` and Alt as `y`, using `1` when held and `0` otherwise.
 */
export type HandleActionFn = (
  space: CanvasSpace,
  form: CanvasForm,
  type: ActionType,
  x: number,
  y: number,
  event: Event,
) => void;

/** Owned lifecycle phase that produced an `onError` report. */
export type PtsCanvasErrorPhase =
  | "initialize"
  | "ready"
  | "animate"
  | "resize"
  | "action"
  | "cleanup"
  | "dispose";

/** Context passed to `onError`; initialization can provide partial objects. */
export type PtsCanvasErrorContext = {
  phase: PtsCanvasErrorPhase;
  space?: CanvasSpace;
  form?: CanvasForm;
};

/**
 * Handles owned lifecycle errors. Providing this callback prevents the
 * original error from being rethrown unless this callback itself throws.
 */
export type HandleErrorFn = (
  error: unknown,
  context: PtsCanvasErrorContext,
) => void;

/** Called after ready cleanup and immediately before owned space disposal. */
export type HandleDisposeFn = (space: CanvasSpace, form: CanvasForm) => void;

/** Declarative Pts input bindings. */
export type PtsCanvasInputOptions = {
  /** Bind Pts pointer events to the canvas. Defaults to legacy `touch` (`true`). */
  pointer?: boolean;
  /** Bind Pts touch events to the canvas. Defaults to legacy `touch` (`true`). */
  touch?: boolean;
  /** Use passive touchstart/touchmove listeners. Defaults to `false`. */
  touchPassive?: boolean;
  /**
   * Bind Pts keyboard events. Defaults to `false`. The canvas receives
   * `tabIndex={0}` when targeted unless `canvasProps.tabIndex` overrides it.
   */
  keyboard?: boolean;
  /**
   * Bind keyboard events to the focusable canvas or globally to `document`.
   * Defaults to `"canvas"`.
   */
  keyboardTarget?: "canvas" | "document";
};

type NativeCanvasProps = Omit<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  "className" | "onError" | "style"
>;

/** Props for {@link PtsCanvas}. See `API.md` for the complete lifecycle contract. */
export type PtsCanvasProps = NativeCanvasProps & {
  /**
   * Class prefix for the wrapper and canvas. Defaults to `"pts-react"` and
   * generates `prefix` / `prefix-canvas`. Empty string disables both.
   */
  classPrefix?: string;
  /** @deprecated Use `classPrefix`. Acts as its fallback when absent. */
  name?: string;
  /** @deprecated Use `containerProps.className`. Classes are concatenated. */
  className?: string;
  /** @deprecated Use `canvasProps.className`. Classes are concatenated. */
  canvasClassName?: string;
  /** @deprecated Use `containerProps.style`, whose properties win when merged. */
  style?: CSSProperties;
  /** @deprecated Use `canvasProps.style`, whose properties win when merged. */
  canvasStyle?: CSSProperties;
  /**
   * Props for the wrapper. Generic attributes apply directly, class names are
   * concatenated, and style properties override deprecated wrapper style.
   */
  containerProps?: Omit<HTMLAttributes<HTMLDivElement>, "children">;
  /**
   * Canvas props. Generic attributes override duplicate top-level native
   * props; class names concatenate and style properties override canvasStyle.
   * Its children and tabIndex also override component-provided values.
   */
  canvasProps?: CanvasHTMLAttributes<HTMLCanvasElement>;
  /** Receive the underlying wrapper element and `null` on unmount. */
  containerRef?: Ref<HTMLDivElement>;
  /** Receive the underlying canvas element and `null` on unmount. */
  canvasRef?: Ref<HTMLCanvasElement>;
  /** Canvas background. Defaults to `"#9ab"`; updates the current space. */
  background?: string;
  /** Enable Pts automatic wrapper resizing. Defaults to `true`; updates live. */
  resize?: boolean;
  /** Enable device-pixel-ratio scaling. Defaults to `true`; changes replace the space. */
  retina?: boolean;
  /**
   * Create a Pts offscreen drawing buffer. Defaults to `false`; changes replace
   * the space. This is unrelated to viewport visibility.
   */
  offscreen?: boolean;
  /**
   * Explicit positive finite pixel scale. Overrides retina-derived scale;
   * effective changes replace the space.
   */
  pixelDensity?: number;
  /**
   * Positive finite cap for device or explicit pixel density. Effective
   * changes replace the space.
   */
  maxPixelDensity?: number;
  /**
   * Request continuous playback. Defaults to `true`; stopped spaces do not
   * dispatch Pts actions or update the pointer.
   */
  play?: boolean;
  /**
   * @deprecated Use `input.pointer` and `input.touch`. Defaults to `true` and
   * remains the fallback for both fields.
   */
  touch?: boolean;
  /** Explicit pointer, touch, passive-touch, and keyboard bindings. */
  input?: PtsCanvasInputOptions;
  /** Clear before each frame. Defaults to `true`; updates the current space. */
  refresh?: boolean;
  /**
   * Minimum finite, non-negative milliseconds between advanced Pts frames.
   * Defaults to `0` and updates live.
   */
  minFrameTime?: number;
  /** Stop requested playback while the document is hidden. Defaults to `false`. */
  pauseWhenHidden?: boolean;
  /**
   * Stop requested playback while outside the viewport. Defaults to `false`
   * and requires IntersectionObserver.
   */
  pauseWhenOffscreen?: boolean;
  /** Called once for each initialized space; may return owned cleanup. */
  onReady?: HandleReadyFn;
  /** Called for each advanced frame while playing. */
  onAnimate?: HandleAnimateFn;
  /** Called for initial measurement and later Pts resizes. */
  onPtsResize?: HandleResizeFn;
  /** Called for enabled Pts input while playing. */
  onAction?: HandleActionFn;
  /** Report and swallow owned lifecycle errors. */
  onError?: HandleErrorFn;
  /** Called after ready cleanup and before owned space disposal. */
  onDispose?: HandleDisposeFn;
  /**
   * Additional Pts players reconciled by identity. Defaults to empty. Replace
   * the array rather than mutating it in place. Automatic playback waits for
   * the initial players' start callbacks to finish.
   */
  players?: readonly IPlayer[];
  /** Convenience Tempo membership. Prefer `players` for multiple players. */
  tempo?: Tempo;
};

type CallbackProps = Pick<
  PtsCanvasProps,
  "onReady" | "onAnimate" | "onPtsResize" | "onAction" | "onError" | "onDispose"
>;

type LiveBehavior = {
  background: string;
  input: Required<PtsCanvasInputOptions>;
  minFrameTime: number;
  pauseWhenHidden: boolean;
  pauseWhenOffscreen: boolean;
  play: boolean;
  players: readonly IPlayer[];
  refresh: boolean;
  resize: boolean;
  tempo?: Tempo;
};

const EMPTY_PLAYERS: readonly IPlayer[] = [];

// Pts normally enables initial wrapper measurement only for canvases it
// creates. React supplies an existing canvas, but its wrapper still owns size.
class MountedCanvasSpace extends CanvasSpace {
  protected override _initialResize = true;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

function checkedPositiveOption(name: string, value: number | undefined) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than zero`);
  }
  return value;
}

function checkedFrameTime(value: number | undefined) {
  if (value === undefined) return 0;
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("minFrameTime must be a finite non-negative number");
  }
  return value;
}

function PtsCanvasComponent(
  {
    classPrefix,
    name,
    className,
    canvasClassName,
    background = "#9ab",
    resize = true,
    retina = true,
    offscreen = false,
    pixelDensity,
    maxPixelDensity,
    play = true,
    touch = true,
    input,
    refresh = true,
    minFrameTime,
    pauseWhenHidden = false,
    pauseWhenOffscreen = false,
    style,
    canvasStyle,
    containerProps,
    canvasProps,
    containerRef,
    canvasRef: forwardedCanvasRef,
    children,
    onReady,
    onAnimate,
    onPtsResize,
    onAction,
    onError,
    onDispose,
    players = EMPTY_PLAYERS,
    tempo,
    ...canvasElementProps
  }: PtsCanvasProps,
  ref: ForwardedRef<PtsCanvasImperative>,
) {
  const checkedPixelDensity = checkedPositiveOption(
    "pixelDensity",
    pixelDensity,
  );
  const checkedMaxPixelDensity = checkedPositiveOption(
    "maxPixelDensity",
    maxPixelDensity,
  );
  const resolvedPixelDensity = (() => {
    const requestedDensity =
      checkedPixelDensity ??
      (retina && typeof window !== "undefined"
        ? Math.max(1, window.devicePixelRatio || 1)
        : 1);
    return checkedMaxPixelDensity === undefined
      ? requestedDensity
      : Math.min(requestedDensity, checkedMaxPixelDensity);
  })();
  const resolvedMinFrameTime = checkedFrameTime(minFrameTime);
  const resolvedInput: Required<PtsCanvasInputOptions> = {
    pointer: input?.pointer ?? touch,
    touch: input?.touch ?? touch,
    touchPassive: input?.touchPassive ?? false,
    keyboard: input?.keyboard ?? false,
    keyboardTarget: input?.keyboardTarget ?? "canvas",
  };

  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const internalContainerRef = useRef<HTMLDivElement | null>(null);
  const spaceRef = useRef<CanvasSpace | undefined>(undefined);
  const formRef = useRef<CanvasForm | undefined>(undefined);
  const playerRef = useRef<IPlayer | undefined>(undefined);
  const activePlayersRef = useRef(new Set<IPlayer>());
  const appliedInputRef = useRef<
    | {
        input: Required<PtsCanvasInputOptions>;
        space: CanvasSpace;
      }
    | undefined
  >(undefined);
  const readyCleanupRef = useRef<PtsCanvasCleanup | undefined>(undefined);
  const requestedPlaybackRef = useRef<boolean | undefined>(undefined);
  const startedSpaceRef = useRef<CanvasSpace | undefined>(undefined);
  const visibilityRef = useRef({
    documentHidden: typeof document !== "undefined" ? document.hidden : false,
    offscreen: false,
  });
  const behaviorRef = useRef<LiveBehavior>({
    background,
    input: resolvedInput,
    minFrameTime: resolvedMinFrameTime,
    pauseWhenHidden,
    pauseWhenOffscreen,
    play,
    players,
    refresh,
    resize,
    tempo,
  });
  const callbacksRef = useRef<CallbackProps>({
    onReady,
    onAnimate,
    onPtsResize,
    onAction,
    onError,
    onDispose,
  });

  const setCanvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      internalCanvasRef.current = canvas;
      assignRef(forwardedCanvasRef, canvas);
    },
    [forwardedCanvasRef],
  );
  const setContainerRef = useCallback(
    (container: HTMLDivElement | null) => {
      internalContainerRef.current = container;
      assignRef(containerRef, container);
    },
    [containerRef],
  );

  useIsomorphicLayoutEffect(() => {
    behaviorRef.current = {
      background,
      input: resolvedInput,
      minFrameTime: resolvedMinFrameTime,
      pauseWhenHidden,
      pauseWhenOffscreen,
      play,
      players,
      refresh,
      resize,
      tempo,
    };
  }, [
    background,
    pauseWhenHidden,
    pauseWhenOffscreen,
    play,
    players,
    refresh,
    resize,
    resolvedInput.keyboard,
    resolvedInput.keyboardTarget,
    resolvedInput.pointer,
    resolvedInput.touch,
    resolvedInput.touchPassive,
    resolvedMinFrameTime,
    tempo,
  ]);

  useIsomorphicLayoutEffect(() => {
    callbacksRef.current = {
      onReady,
      onAnimate,
      onPtsResize,
      onAction,
      onError,
      onDispose,
    };
  }, [onReady, onAnimate, onPtsResize, onAction, onError, onDispose]);

  useImperativeHandle(
    ref,
    () => ({
      getSpace: () => spaceRef.current,
      getForm: () => formRef.current,
      getPlayer: () => playerRef.current,
      getCanvas: () => internalCanvasRef.current,
      getContainer: () => internalContainerRef.current,
    }),
    [],
  );

  const reportError = useCallback(
    (
      error: unknown,
      phase: PtsCanvasErrorPhase,
      space?: CanvasSpace,
      form?: CanvasForm,
    ) => {
      const handler = callbacksRef.current.onError;
      if (handler) handler(error, { phase, space, form });
      else throw error;
    },
    [],
  );

  const syncPlayers = useCallback(
    (
      space: CanvasSpace,
      nextPlayers: readonly IPlayer[],
      nextTempo?: Tempo,
    ) => {
      const desired = new Set(nextPlayers);
      if (nextTempo) desired.add(nextTempo);

      for (const player of activePlayersRef.current) {
        if (!desired.has(player)) {
          space.remove(player);
          activePlayersRef.current.delete(player);
        }
      }
      for (const player of desired) {
        if (!activePlayersRef.current.has(player)) {
          space.add(player);
          activePlayersRef.current.add(player);
        }
      }
    },
    [],
  );

  const syncInput = useCallback(
    (
      space: CanvasSpace,
      canvas: HTMLCanvasElement,
      nextInput: Required<PtsCanvasInputOptions>,
    ) => {
      const previous =
        appliedInputRef.current?.space === space
          ? appliedInputRef.current.input
          : undefined;
      if (previous?.pointer !== nextInput.pointer) {
        space.bindMouse(nextInput.pointer);
      }
      if (
        previous?.touch !== nextInput.touch ||
        previous?.touchPassive !== nextInput.touchPassive
      ) {
        if (previous?.touch) space.bindTouch(false, previous.touchPassive);
        if (nextInput.touch) space.bindTouch(true, nextInput.touchPassive);
      }
      if (
        previous?.keyboard === nextInput.keyboard &&
        previous?.keyboardTarget === nextInput.keyboardTarget
      ) {
        appliedInputRef.current = { input: nextInput, space };
        return;
      }

      space.bindKeyboard(false);
      appliedInputRef.current = { input: nextInput, space };

      if (!nextInput.keyboard) return;
      space.bindKeyboard(
        true,
        nextInput.keyboardTarget === "canvas" ? canvas : undefined,
      );
    },
    [],
  );

  const syncPlayback = useCallback(() => {
    const space = spaceRef.current;
    if (!space) return;

    const behavior = behaviorRef.current;
    const visibility = visibilityRef.current;
    const shouldPlay =
      behavior.play &&
      (!behavior.pauseWhenHidden || !visibility.documentHidden) &&
      (!behavior.pauseWhenOffscreen || !visibility.offscreen);

    if (shouldPlay && (!space.ready || startedSpaceRef.current !== space)) {
      requestedPlaybackRef.current = undefined;
      return;
    }
    if (requestedPlaybackRef.current === shouldPlay) return;

    requestedPlaybackRef.current = shouldPlay;
    if (shouldPlay) space.replay();
    else space.stop();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const canvas = internalCanvasRef.current;
    if (!canvas) return;

    let space: CanvasSpace | undefined;
    let form: CanvasForm | undefined;
    try {
      const initialBehavior = behaviorRef.current;
      startedSpaceRef.current = undefined;
      space = new MountedCanvasSpace(canvas);
      if (!space.ctx) throw new Error("Canvas 2D context is unavailable");
      space.setup({
        bgcolor: initialBehavior.background,
        resize: initialBehavior.resize,
        retina,
        offscreen,
        pixelDensity: resolvedPixelDensity,
      });
      if (offscreen && !space.offscreenCtx) {
        throw new Error("Offscreen canvas 2D context is unavailable");
      }
      form = space.getForm();
      const ownedSpace = space;
      const ownedForm = form;
      const player: IPlayer = {
        start: (bound) => {
          try {
            const cleanup = callbacksRef.current.onReady?.(
              ownedSpace,
              ownedForm,
              bound,
            );
            if (typeof cleanup === "function") {
              readyCleanupRef.current = cleanup as PtsCanvasCleanup;
            }
          } catch (error) {
            reportError(error, "ready", ownedSpace, ownedForm);
          }
          // Pts calls players' start methods in registration order. Its
          // replay() draws synchronously, so let all initial players start
          // before automatic playback can reach their animate methods.
          queueMicrotask(() => {
            if (spaceRef.current === ownedSpace) {
              startedSpaceRef.current = ownedSpace;
              syncPlayback();
            }
          });
        },
        animate: (time, frameTime) => {
          try {
            callbacksRef.current.onAnimate?.(
              ownedSpace,
              ownedForm,
              time,
              frameTime,
            );
          } catch (error) {
            reportError(error, "animate", ownedSpace, ownedForm);
          }
        },
        resize: (bound, event) => {
          try {
            callbacksRef.current.onPtsResize?.(
              ownedSpace,
              ownedForm,
              bound,
              event ?? undefined,
            );
          } catch (error) {
            reportError(error, "resize", ownedSpace, ownedForm);
          }
        },
        action: (type, x, y, event) => {
          try {
            callbacksRef.current.onAction?.(
              ownedSpace,
              ownedForm,
              type,
              x,
              y,
              event,
            );
          } catch (error) {
            reportError(error, "action", ownedSpace, ownedForm);
          }
        },
      };

      spaceRef.current = space;
      formRef.current = form;
      playerRef.current = player;
      requestedPlaybackRef.current = undefined;

      space
        .add(player)
        .refresh(initialBehavior.refresh)
        .minFrameTime(initialBehavior.minFrameTime);
      syncInput(space, canvas, initialBehavior.input);
      syncPlayers(space, initialBehavior.players, initialBehavior.tempo);
      syncPlayback();
    } catch (error) {
      try {
        try {
          space?.bindMouse(false).bindTouch(false).bindKeyboard(false);
        } finally {
          space?.dispose();
        }
      } catch {
        // Preserve the initialization error; teardown is best-effort here.
      }
      appliedInputRef.current = undefined;
      activePlayersRef.current.clear();
      requestedPlaybackRef.current = undefined;
      if (spaceRef.current === space) {
        spaceRef.current = undefined;
        formRef.current = undefined;
        playerRef.current = undefined;
      }
      reportError(error, "initialize", space, form);
      return;
    }

    const ownedSpace = space;
    const ownedForm = form;
    return () => {
      let pendingError: unknown;
      let hasPendingError = false;
      const cleanup = readyCleanupRef.current;
      readyCleanupRef.current = undefined;

      if (cleanup) {
        try {
          cleanup();
        } catch (error) {
          try {
            reportError(error, "cleanup", ownedSpace, ownedForm);
          } catch (reportedError) {
            pendingError = reportedError;
            hasPendingError = true;
          }
        }
      }
      try {
        callbacksRef.current.onDispose?.(ownedSpace, ownedForm);
      } catch (error) {
        try {
          reportError(error, "dispose", ownedSpace, ownedForm);
        } catch (reportedError) {
          if (!hasPendingError) pendingError = reportedError;
          hasPendingError = true;
        }
      }

      try {
        try {
          ownedSpace.bindMouse(false).bindTouch(false).bindKeyboard(false);
        } finally {
          ownedSpace.dispose();
        }
      } catch (error) {
        try {
          reportError(error, "dispose", ownedSpace, ownedForm);
        } catch (reportedError) {
          if (!hasPendingError) pendingError = reportedError;
          hasPendingError = true;
        }
      } finally {
        appliedInputRef.current = undefined;
        activePlayersRef.current.clear();
        requestedPlaybackRef.current = undefined;

        if (spaceRef.current === ownedSpace) {
          startedSpaceRef.current = undefined;
          spaceRef.current = undefined;
          formRef.current = undefined;
          playerRef.current = undefined;
        }
      }
      if (hasPendingError) throw pendingError;
    };
  }, [
    offscreen,
    reportError,
    resolvedPixelDensity,
    retina,
    syncInput,
    syncPlayback,
    syncPlayers,
  ]);

  useIsomorphicLayoutEffect(() => {
    const space = spaceRef.current;
    if (!space) return;
    space.background = background;
    if (space.ready) space.clear();
  }, [background]);

  useIsomorphicLayoutEffect(() => {
    const space = spaceRef.current;
    if (space && space.autoResize !== resize) space.autoResize = resize;
  }, [resize]);

  useIsomorphicLayoutEffect(() => {
    spaceRef.current?.refresh(refresh);
  }, [refresh]);

  useIsomorphicLayoutEffect(() => {
    spaceRef.current?.minFrameTime(resolvedMinFrameTime);
  }, [resolvedMinFrameTime]);

  useIsomorphicLayoutEffect(() => {
    const space = spaceRef.current;
    const canvas = internalCanvasRef.current;
    if (space && canvas) syncInput(space, canvas, resolvedInput);
  }, [
    resolvedInput.keyboard,
    resolvedInput.keyboardTarget,
    resolvedInput.pointer,
    resolvedInput.touch,
    resolvedInput.touchPassive,
    syncInput,
  ]);

  useIsomorphicLayoutEffect(() => {
    const space = spaceRef.current;
    if (space) syncPlayers(space, players, tempo);
  }, [players, syncPlayers, tempo]);

  useIsomorphicLayoutEffect(() => {
    syncPlayback();
  }, [play, pauseWhenHidden, pauseWhenOffscreen, syncPlayback]);

  useEffect(() => {
    const visibility = visibilityRef.current;
    visibility.documentHidden = document.hidden;
    syncPlayback();
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      visibility.documentHidden = document.hidden;
      syncPlayback();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      visibility.documentHidden = false;
    };
  }, [pauseWhenHidden, syncPlayback]);

  useEffect(() => {
    const visibility = visibilityRef.current;
    visibility.offscreen = false;
    syncPlayback();
    if (!pauseWhenOffscreen || typeof IntersectionObserver === "undefined") {
      return;
    }

    const target = internalContainerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      visibility.offscreen = entry ? !entry.isIntersecting : false;
      syncPlayback();
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      visibility.offscreen = false;
    };
  }, [pauseWhenOffscreen, syncPlayback]);

  const {
    className: containerClassName,
    style: containerStyle,
    ...containerElementProps
  } = containerProps ?? {};
  const {
    className: nestedCanvasClassName,
    style: nestedCanvasStyle,
    children: nestedCanvasChildren,
    ...nestedCanvasProps
  } = canvasProps ?? {};
  const resolvedClassPrefix = classPrefix ?? name ?? "pts-react";
  const wrapperClassName = [
    resolvedClassPrefix || undefined,
    className,
    containerClassName,
  ]
    .filter(Boolean)
    .join(" ");
  const resolvedCanvasClassName = [
    resolvedClassPrefix ? `${resolvedClassPrefix}-canvas` : undefined,
    canvasClassName,
    nestedCanvasClassName,
  ]
    .filter(Boolean)
    .join(" ");
  const resolvedContainerStyle =
    style || containerStyle ? { ...style, ...containerStyle } : undefined;
  const resolvedCanvasStyle =
    canvasStyle || nestedCanvasStyle
      ? { ...canvasStyle, ...nestedCanvasStyle }
      : undefined;
  const canvasChildren =
    canvasProps && Object.hasOwn(canvasProps, "children")
      ? nestedCanvasChildren
      : children;
  const keyboardTabIndex =
    resolvedInput.keyboard && resolvedInput.keyboardTarget === "canvas"
      ? 0
      : undefined;

  return (
    <div
      {...containerElementProps}
      className={wrapperClassName || undefined}
      ref={setContainerRef}
      style={resolvedContainerStyle}
    >
      <canvas
        {...canvasElementProps}
        {...nestedCanvasProps}
        className={resolvedCanvasClassName || undefined}
        ref={setCanvasRef}
        style={resolvedCanvasStyle}
        tabIndex={nestedCanvasProps.tabIndex ?? keyboardTabIndex}
      >
        {canvasChildren}
      </canvas>
    </div>
  );
}

/**
 * React component that owns a Pts CanvasSpace for one rendered canvas.
 *
 * Size its wrapper explicitly and use the forwarded imperative ref only for
 * inspection or scoped commands; the component retains lifecycle ownership.
 */
export const PtsCanvas = forwardRef<PtsCanvasImperative, PtsCanvasProps>(
  PtsCanvasComponent,
);

PtsCanvas.displayName = "PtsCanvas";
