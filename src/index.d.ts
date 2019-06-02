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

export default class PtsCanvas extends React.Component<PtsCanvasProps, any> {
  canvRef: React.RefObject;
  space: CanvasSapce;
  form: CanvasForm;
  _touch: boolean;

  constructor( props: Readonly<PtsCanvasProps> );
  animate( time:number, ftime:number ): void;
  start( bound:Bound, space:CanvasSpace ): void;
  resize( size:Group, evt:Event ): void;
  action( type:string, px:number, py:number, evt:Event ): void;
  init(): void;
  _update(): void;
}

export default class QuickStartCanvas extends React.Component<QuickStartCanvasProps, any> {}