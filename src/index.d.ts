import * as React from "react";
import {CanvasSpace, Bound, Group, CanvasForm} from "pts";

export interface PtsCanvasProps extends React.Props {
  name?:string,
  background?:string,
  resize?:boolean,
  retina?:boolean,
  play?:boolean,
  touch?:boolean,
  style?:object,
  canvasStyle?:object
}

export interface QuickStartProps extends PtsCanvasProps {
  onStart: (bound?:Bound, space?:CanvasSpace) => void,
  onAnimate: (space?:CanvasSpace, form?:CanvasForm, time?:number, ftime?:number) => void,
  onResize: (space?:CanvasSpace, form?:CanvasForm, size?:Group, evt?:Event) => void,
  onAction: (space?:CanvasSpace, form?:CanvasForm, type:string, px:number, py:number, evt:Event) => void
}

export class PtsCanvas<T = any> extends React.Component<PtsCanvasProps & T, any> {
  canvRef: React.RefObject;
  space: CanvasSpace;
  form: CanvasForm;
  _touch: boolean;

  constructor( props: Readonly<PtsCanvasProps> & Readonly<T> );
  animate( time:number, ftime:number ): void;
  start( bound:Bound, space:CanvasSpace ): void;
  resize( size:Group, evt:Event ): void;
  action( type:string, px:number, py:number, evt:Event ): void;
  init(): void;
  _update(): void;
}

export class QuickStartCanvas<T = any> extends React.Component<QuickStartCanvasProps & T, any> {}

export type HandleStartFn = (bound?: Bound, space?: CanvasSpace, form?: CanvasForm) => void

export type HandleAnimateFn = (
  space?: CanvasSpace,
  form?: CanvasForm,
  time?: number,
  ftime?: number
) => void

export type HandleResizeFn = (
  space?: CanvasSpace,
  form?: CanvasForm,
  size?: Group,
  evt?: Event // eslint-disable-line no-undef
) => void

export type HandleActionFn = (
  space?: CanvasSpace,
  form?: CanvasForm,
  type?: string,
  px?: number,
  py?: number,
  evt?: Event // eslint-disable-line no-undef
) => void

export interface PtsCanvasFCProps {
  name?: string,
  background?: string,
  resize?: boolean,
  retina?: boolean,
  play?: boolean,
  touch?: boolean,
  style?: object, // eslint-disable-line no-undef
  canvasStyle?: object, // eslint-disable-line no-undef
  onStart?: HandleStartFn,
  onAnimate: HandleAnimateFn,
  onResize?: HandleResizeFn,
  onAction?: HandleActionFn,
  tempo?: Tempo
}
