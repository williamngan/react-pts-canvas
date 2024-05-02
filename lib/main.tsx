/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */

import React, {
  useEffect,
  useRef,
  forwardRef,
  ForwardedRef,
  useImperativeHandle
} from 'react';
import { CanvasSpace, Bound, CanvasForm, Group, Tempo, IPlayer } from 'pts';
import { useIsomorphicLayoutEffect } from './hooks';

export type PtsCanvasImperative = {
  getSpace: () => CanvasSpace | undefined;
  getForm: () => CanvasForm | undefined;
  getPlayer: () => IPlayer | undefined;
  getCanvas: () => HTMLCanvasElement | null;
};

export type HandleReadyFn = (
  space: CanvasSpace,
  form: CanvasForm,
  bound: Bound
) => void;

export type HandleAnimateFn = (
  space: CanvasSpace,
  form: CanvasForm,
  time: number,
  ftime: number
) => void;

export type HandleResizeFn = (
  space: CanvasSpace,
  form: CanvasForm,
  size: Group,
  evt: Event // eslint-disable-line no-undef
) => void;

export type ActionType =
  | 'up'
  | 'down'
  | 'move'
  | 'drag'
  | 'uidrag'
  | 'drop'
  | 'uidrop'
  | 'over'
  | 'out'
  | 'enter'
  | 'leave'
  | 'click'
  | 'keydown'
  | 'keyup'
  | 'pointerdown'
  | 'pointerup'
  | 'contextmenu'
  | 'all';

export type HandleActionFn = (
  space: CanvasSpace,
  form: CanvasForm,
  type: ActionType,
  px: number,
  py: number,
  evt: Event // eslint-disable-line no-undef
) => void;

export type PtsCanvasProps = {
  name?: string;
  className?: string;
  background?: string;
  resize?: boolean;
  retina?: boolean;
  offscreen?: boolean;
  pixelDensity?: number;
  play?: boolean;
  touch?: boolean;
  refresh?: boolean;
  style?: React.CSSProperties;
  onReady?: HandleReadyFn;
  onAnimate?: HandleAnimateFn;
  onPtsResize?: HandleResizeFn;
  onAction?: HandleActionFn;
  tempo?: Tempo;
} & React.CanvasHTMLAttributes<HTMLCanvasElement>;

const PtsCanvasComponent = (
  {
    name = 'pts-react', // maps to className of the container div
    className = '',
    background = '#9ab',
    resize = true,
    retina = true,
    offscreen = false,
    pixelDensity = undefined,
    play = true,
    touch = true,
    refresh = true,
    style = {},
    onReady = undefined,
    onAnimate = undefined,
    onPtsResize = undefined,
    onAction = undefined,
    tempo = undefined,
    ...canvasElementProps
  }: PtsCanvasProps,
  ref: ForwardedRef<PtsCanvasImperative>
) => {
  // Set canvRef to be either the forwarded ref if its a MutableRefObject, or our own local ref otherwise
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spaceRef = useRef<CanvasSpace>();
  const formRef = useRef<CanvasForm>();
  const playerRef = useRef<IPlayer>();

  useImperativeHandle(
    ref,
    () => ({
      getSpace: () => spaceRef.current,
      getForm: () => formRef.current,
      getPlayer: () => playerRef.current,
      getCanvas: () => canvasRef.current
    }),
    []
  );

  /**
   * When canvRef Updates (ready for space)
   */
  useIsomorphicLayoutEffect(() => {
    if (!canvasRef || !canvasRef.current) return;
    // Create CanvasSpace with the canvRef and assign to spaceRef
    // Add animation, tempo, and play when ready (call back on CanvasSpace constructor)
    spaceRef.current = new CanvasSpace(canvasRef.current).setup({
      bgcolor: background,
      resize,
      retina,
      offscreen,
      pixelDensity
    });

    spaceRef.current.refresh(refresh);

    // Assign formRef
    formRef.current = spaceRef.current.getForm();

    // Player object
    playerRef.current = {
      start: !onReady
        ? undefined
        : (bound: Bound) => {
            if (spaceRef.current && formRef.current) {
              onReady(spaceRef.current, formRef.current, bound);
            }
          },
      animate: !onAnimate
        ? undefined
        : (time?: number, ftime?: number) => {
            if (time && ftime && spaceRef.current && formRef.current) {
              onAnimate(spaceRef.current, formRef.current, time, ftime);
            }
          },
      resize: !onPtsResize
        ? undefined
        : (bound: Bound, event: Event) => {
            if (spaceRef.current && formRef.current) {
              onPtsResize(spaceRef.current, formRef.current, bound, event);
            }
          },
      action: !onAction
        ? undefined
        : (type: ActionType, px: number, py: number, evt: Event) => {
            if (spaceRef.current && formRef.current) {
              onAction(spaceRef.current, formRef.current, type, px, py, evt);
            }
          }
    };

    // By having individual handler props, we can expose what we need to the
    // underlying functions, like our Form instance
    spaceRef.current.add(playerRef.current);

    // Add tempo if provided
    if (tempo) {
      spaceRef.current.add(tempo);
    }

    // Return the cleanup function (similar to ComponentWillUnmount)
    return () => {
      spaceRef.current && spaceRef.current.dispose();
    };
  }, [canvasRef]);

  useEffect(() => {
    if (spaceRef.current) {
      spaceRef.current.refresh(refresh);
    }
  }, [refresh, spaceRef]);

  /**
   * When onReady callback updates
   */
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.start = !onReady
        ? undefined
        : (bound: Bound) => {
            if (onReady && spaceRef.current && formRef.current) {
              onReady(spaceRef.current, formRef.current, bound);
            }
          };
    }
  }, [onReady]);

  /**
   * When onAnimate callback updates
   */
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.animate = !onAnimate
        ? undefined
        : (time?: number, ftime?: number) => {
            if (time && ftime && spaceRef.current && formRef.current?.ctx) {
              onAnimate(spaceRef.current, formRef.current, time, ftime);
            }
          };
    }
  }, [onAnimate]);

  /**
   * When onResize callback updates
   */
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.resize = !onPtsResize
        ? undefined
        : (bound: Bound, event: Event) => {
            if (onPtsResize && spaceRef.current && formRef.current?.ctx) {
              onPtsResize(spaceRef.current, formRef.current, bound, event);
            }
          };
    }
  }, [onPtsResize]);

  /**
   * When onAction callback updates
   */
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.action = !onAction
        ? undefined
        : (type: ActionType, px: number, py: number, evt: Event) => {
            if (onAction && spaceRef.current && formRef.current?.ctx) {
              onAction(spaceRef.current, formRef.current, type, px, py, evt);
            }
          };
    }
  }, [onAction]);

  /**
   * When Touch updates
   */
  useEffect(() => {
    spaceRef.current && spaceRef.current.bindMouse(touch).bindTouch(touch);
  }, [touch]);

  /**
   * Play or stop based on play prop
   * */
  const maybePlay = () => {
    const space = spaceRef.current;
    if (!space) return;
    if (play) {
      if (space.isPlaying) {
        space.resume();
      } else {
        space.replay(); // if space has stopped, replay
      }
    } else {
      space.stop();
    }
  };

  /**
   * When anything updates
   */
  useEffect(() => {
    maybePlay();
  });

  return (
    <div className={`${name} ${className || ''}`} style={style}>
      <canvas
        className={name ? name + '-canvas' : ''}
        ref={canvasRef}
        {...canvasElementProps}
      />
    </div>
  );
};

export const PtsCanvas = forwardRef<PtsCanvasImperative, PtsCanvasProps>(
  PtsCanvasComponent
);
