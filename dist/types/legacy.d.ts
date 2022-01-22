import React from 'react';
import { CanvasSpace, CanvasForm, Bound, Group } from 'pts';
import { PtsCanvasLegacy, PtsCanvasLegacyProps, QuickStartProps } from './types';
export declare class PtsCanvas<T> extends React.Component<PtsCanvasLegacyProps & T> implements PtsCanvasLegacy<PtsCanvasLegacyProps & T> {
    canvRef: React.RefObject<Element>;
    space: CanvasSpace | null;
    form: CanvasForm | null;
    _touch: boolean;
    defaultProps: {
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
export declare class QuickStartCanvas extends PtsCanvas<QuickStartProps> implements PtsCanvasLegacy<QuickStartProps> {
    defaultProps: {
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
