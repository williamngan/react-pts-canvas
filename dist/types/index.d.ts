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
export declare function PtsCanvas(props: PtsCanvasProps): JSX.Element;
export declare namespace PtsCanvas {
    var defaultProps: {
        name: string;
        background: string;
        resize: boolean;
        retina: boolean;
        play: boolean;
        touch: boolean;
        style: {};
        canvasStyle: {};
        onStart: undefined;
        onAnimate: undefined;
        onResize: undefined;
        onAction: undefined;
        tempo: undefined;
        canvRef: undefined;
        spaceRef: undefined;
        formRef: undefined;
    };
}
export { PtsCanvas as PtsCanvasLegacy, QuickStartCanvas as QuickStartCanvasLegacy, PtsCanvasLegacyProps, QuickStartProps } from './legacy';
//# sourceMappingURL=index.d.ts.map