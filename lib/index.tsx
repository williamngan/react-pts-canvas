/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CanvasHTMLAttributes,
  type CSSProperties,
  type ForwardedRef,
} from "react";
import {
  CanvasSpace,
  type Bound,
  type CanvasForm,
  type IPlayer,
  type Tempo,
} from "pts";

import { useIsomorphicLayoutEffect } from "./hooks";

export type PtsCanvasImperative = {
  getSpace: () => CanvasSpace | undefined;
  getForm: () => CanvasForm | undefined;
  getPlayer: () => IPlayer | undefined;
  getCanvas: () => HTMLCanvasElement | null;
};

export type HandleReadyFn = (
  space: CanvasSpace,
  form: CanvasForm,
  bound: Bound,
) => void;

export type HandleAnimateFn = (
  space: CanvasSpace,
  form: CanvasForm,
  time: number,
  frameTime: number,
) => void;

export type HandleResizeFn = (
  space: CanvasSpace,
  form: CanvasForm,
  bound: Bound,
  event?: Event,
) => void;

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
  | "all";

export type HandleActionFn = (
  space: CanvasSpace,
  form: CanvasForm,
  type: ActionType,
  x: number,
  y: number,
  event: Event,
) => void;

type NativeCanvasProps = Omit<
  CanvasHTMLAttributes<HTMLCanvasElement>,
  "children" | "className" | "style"
>;

export type PtsCanvasProps = NativeCanvasProps & {
  /** Base class name for the wrapper and, with `-canvas`, the canvas. */
  name?: string;
  /** Additional class names for the wrapper element. */
  className?: string;
  /** Additional class names for the canvas element. */
  canvasClassName?: string;
  /** Inline styles for the wrapper element. */
  style?: CSSProperties;
  /** Inline styles for the canvas element. */
  canvasStyle?: CSSProperties;
  background?: string;
  resize?: boolean;
  retina?: boolean;
  offscreen?: boolean;
  pixelDensity?: number;
  play?: boolean;
  touch?: boolean;
  refresh?: boolean;
  onReady?: HandleReadyFn;
  onAnimate?: HandleAnimateFn;
  onPtsResize?: HandleResizeFn;
  onAction?: HandleActionFn;
  tempo?: Tempo;
};

type CallbackProps = Pick<
  PtsCanvasProps,
  "onReady" | "onAnimate" | "onPtsResize" | "onAction"
>;

function PtsCanvasComponent(
  {
    name = "pts-react",
    className,
    canvasClassName,
    background = "#9ab",
    resize = true,
    retina = true,
    offscreen = false,
    pixelDensity,
    play = true,
    touch = true,
    refresh = true,
    style,
    canvasStyle,
    onReady,
    onAnimate,
    onPtsResize,
    onAction,
    tempo,
    ...canvasElementProps
  }: PtsCanvasProps,
  ref: ForwardedRef<PtsCanvasImperative>,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spaceRef = useRef<CanvasSpace | undefined>(undefined);
  const formRef = useRef<CanvasForm | undefined>(undefined);
  const playerRef = useRef<IPlayer | undefined>(undefined);
  const activeTempoRef = useRef<Tempo | undefined>(undefined);
  const behaviorRef = useRef({ play, refresh, tempo });
  const callbacksRef = useRef<CallbackProps>({
    onReady,
    onAnimate,
    onPtsResize,
    onAction,
  });

  useIsomorphicLayoutEffect(() => {
    behaviorRef.current = { play, refresh, tempo };
  }, [play, refresh, tempo]);

  useIsomorphicLayoutEffect(() => {
    callbacksRef.current = {
      onReady,
      onAnimate,
      onPtsResize,
      onAction,
    };
  }, [onReady, onAnimate, onPtsResize, onAction]);

  useImperativeHandle(
    ref,
    () => ({
      getSpace: () => spaceRef.current,
      getForm: () => formRef.current,
      getPlayer: () => playerRef.current,
      getCanvas: () => canvasRef.current,
    }),
    [],
  );

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const space = new CanvasSpace(canvas).setup({
      bgcolor: background,
      resize,
      retina,
      offscreen,
      pixelDensity,
    });
    const form = space.getForm();
    const player: IPlayer = {
      start: (bound) => {
        callbacksRef.current.onReady?.(space, form, bound);
      },
      animate: (time, frameTime) => {
        callbacksRef.current.onAnimate?.(space, form, time, frameTime);
      },
      resize: (bound, event) => {
        callbacksRef.current.onPtsResize?.(space, form, bound, event);
      },
      action: (type, x, y, event) => {
        callbacksRef.current.onAction?.(
          space,
          form,
          type as ActionType,
          x,
          y,
          event,
        );
      },
    };

    spaceRef.current = space;
    formRef.current = form;
    playerRef.current = player;

    const initialBehavior = behaviorRef.current;
    space.add(player).refresh(initialBehavior.refresh);
    if (touch) space.bindMouse().bindTouch();

    if (initialBehavior.tempo) {
      space.add(initialBehavior.tempo);
      activeTempoRef.current = initialBehavior.tempo;
    }

    if (initialBehavior.play) space.replay();
    else space.stop();

    return () => {
      if (touch) space.bindMouse(false).bindTouch(false);
      space.dispose();

      if (spaceRef.current === space) {
        spaceRef.current = undefined;
        formRef.current = undefined;
        playerRef.current = undefined;
        activeTempoRef.current = undefined;
      }
    };
  }, [background, resize, retina, offscreen, pixelDensity, touch]);

  useEffect(() => {
    spaceRef.current?.refresh(refresh);
  }, [refresh]);

  useEffect(() => {
    const space = spaceRef.current;
    if (!space || activeTempoRef.current === tempo) return;

    if (activeTempoRef.current) space.remove(activeTempoRef.current);
    if (tempo) space.add(tempo);
    activeTempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    const space = spaceRef.current;
    if (!space) return;

    if (play) space.replay();
    else space.stop();
  }, [play]);

  const wrapperClassName = [name, className].filter(Boolean).join(" ");
  const resolvedCanvasClassName = [
    name ? `${name}-canvas` : undefined,
    canvasClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName || undefined} style={style}>
      <canvas
        {...canvasElementProps}
        className={resolvedCanvasClassName || undefined}
        ref={canvasRef}
        style={canvasStyle}
      />
    </div>
  );
}

export const PtsCanvas = forwardRef<PtsCanvasImperative, PtsCanvasProps>(
  PtsCanvasComponent,
);

PtsCanvas.displayName = "PtsCanvas";
