import React, { ComponentProps } from 'react';
import { Bound, CanvasSpace, CanvasForm, Group, Tempo } from 'pts';

/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */

declare type PtsCanvasLegacyProps = {
    name?: string;
    background?: string;
    resize?: boolean;
    retina?: boolean;
    play?: boolean;
    touch?: boolean;
    style?: object;
    canvasStyle?: object;
};
declare type QuickStartProps = PtsCanvasLegacyProps & {
    onStart?: (bound?: Bound, space?: CanvasSpace) => void;
    onAnimate?: (space?: CanvasSpace, form?: CanvasForm, time?: number, ftime?: number) => void;
    onResize?: (space?: CanvasSpace, form?: CanvasForm, size?: Group, evt?: Event) => void;
    onAction?: (space?: CanvasSpace, form?: CanvasForm, type?: string, px?: number, py?: number, evt?: Event) => void;
};
declare class PtsCanvas$1<T> extends React.Component<PtsCanvasLegacyProps & T> {
    canvRef: React.RefObject<Element>;
    space: CanvasSpace | null;
    form: CanvasForm | null;
    _touch: boolean;
    static defaultProps: {
        name: string;
        background: string;
        resize: boolean;
        retina: boolean;
        play: boolean;
        touch: boolean;
        style: {};
        canvasStyle: {};
    };
    constructor(props: T);
    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    _update(): void;
    animate(time: number, ftime: number): void;
    start(bound: Bound, space: CanvasSpace): void;
    resize(size: Group, evt: Event): void;
    action(type: string, px: number, py: number, evt: Event): void;
    init(): void;
    render(): JSX.Element;
}
declare class QuickStartCanvas extends PtsCanvas$1<QuickStartProps> {
    static defaultProps: {
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
    };
    animate(time: number, ftime: number): void;
    start(bound: Bound, space: CanvasSpace): void;
    resize(size: Group, evt: Event): void;
    action(type: string, px: number, py: number, evt: Event): void;
}

/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */

declare type HandleStartFn = (bound: Bound, space: CanvasSpace, form: CanvasForm) => void;
declare type HandleAnimateFn = (space: CanvasSpace, form: CanvasForm, time: number, ftime: number) => void;
declare type HandleResizeFn = (space: CanvasSpace, form: CanvasForm, size: Group, evt: Event) => void;
declare type HandleActionFn = (space: CanvasSpace, form: CanvasForm, type: string, px: number, py: number, evt: Event) => void;
declare type PtsCanvasProps = {
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
declare const PtsCanvas: React.ForwardRefExoticComponent<Pick<PtsCanvasProps, "name" | "background" | "resize" | "retina" | "play" | "touch" | "canvasStyle" | "onStart" | "onAnimate" | "onResize" | "onAction" | "tempo" | "key" | keyof React.CanvasHTMLAttributes<HTMLCanvasElement>> & React.RefAttributes<HTMLCanvasElement>>;

export { HandleActionFn, HandleAnimateFn, HandleResizeFn, HandleStartFn, PtsCanvas, PtsCanvas$1 as PtsCanvasLegacy, PtsCanvasLegacyProps, PtsCanvasProps, QuickStartCanvas as QuickStartCanvasLegacy, QuickStartProps };
