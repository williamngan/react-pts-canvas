/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */
import React, { ComponentProps } from 'react';
import { CanvasSpace, Bound, CanvasForm, Group, Tempo } from 'pts';
export declare type HandleStartFn = (bound: Bound, space: CanvasSpace, form: CanvasForm) => void;
export declare type HandleAnimateFn = (space: CanvasSpace, form: CanvasForm, time: number, ftime: number) => void;
export declare type HandleResizeFn = (space: CanvasSpace, form: CanvasForm, size: Group, evt: Event) => void;
export declare type HandleActionFn = (space: CanvasSpace, form: CanvasForm, type: string, px: number, py: number, evt: Event) => void;
export declare type PtsCanvasProps = {
    name?: string;
    background?: string;
    resize?: boolean;
    retina?: boolean;
    play?: boolean;
    touch?: boolean;
    style?: object;
    canvasStyle?: object;
    onStart?: HandleStartFn;
    onAnimate: HandleAnimateFn;
    onResize?: HandleResizeFn;
    onAction?: HandleActionFn;
    tempo?: Tempo;
} & ComponentProps<'canvas'>;
export declare const PtsCanvas: React.ForwardRefExoticComponent<Pick<PtsCanvasProps, "name" | "background" | "resize" | "retina" | "play" | "touch" | "canvasStyle" | "onStart" | "onAnimate" | "onResize" | "onAction" | "tempo" | "key" | keyof React.CanvasHTMLAttributes<HTMLCanvasElement>> & React.RefAttributes<HTMLCanvasElement>>;
export { PtsCanvas as PtsCanvasLegacy, QuickStartCanvas as QuickStartCanvasLegacy, PtsCanvasLegacyProps, QuickStartProps } from './legacy';
//# sourceMappingURL=index.d.ts.map