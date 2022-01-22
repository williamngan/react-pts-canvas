import React from 'react';
import { CanvasSpace, Bound, CanvasForm, Group, Tempo } from 'pts';
export declare type HandleStartFn = (bound?: Bound, space?: CanvasSpace, form?: CanvasForm) => void;
export declare type HandleAnimateFn = (space?: CanvasSpace, form?: CanvasForm, time?: number, ftime?: number) => void;
export declare type HandleResizeFn = (space?: CanvasSpace, form?: CanvasForm, size?: Group, evt?: Event) => void;
export declare type HandleActionFn = (space?: CanvasSpace, form?: CanvasForm, type?: string, px?: number, py?: number, evt?: Event) => void;
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
    canvRef?: React.MutableRefObject<HTMLCanvasElement>;
    spaceRef?: React.MutableRefObject<CanvasSpace>;
    formRef?: React.MutableRefObject<CanvasForm>;
};
export declare const PtsCanvas: React.FC<PtsCanvasProps>;
export { PtsCanvas as PtsCanvasLegacy, QuickStartCanvas as QuickStartCanvasLegacy, PtsCanvasLegacyProps, QuickStartProps } from './legacy';
//# sourceMappingURL=index.d.ts.map