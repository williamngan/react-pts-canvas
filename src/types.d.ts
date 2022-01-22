import * as React from 'react'
import { CanvasSpace, Bound, Group, CanvasForm, Tempo } from 'pts'

export interface PtsCanvasLegacyProps {
  name?: string
  background?: string
  resize?: boolean
  retina?: boolean
  play?: boolean
  touch?: boolean
  style?: object
  canvasStyle?: object
}

export interface QuickStartProps extends PtsCanvasLegacyProps {
  onStart: (bound?: Bound, space?: CanvasSpace) => void
  onAnimate: (
    space?: CanvasSpace,
    form?: CanvasForm,
    time?: number,
    ftime?: number
  ) => void
  onResize: (
    space?: CanvasSpace,
    form?: CanvasForm,
    size?: Group,
    evt?: Event
  ) => void
  onAction: (
    space?: CanvasSpace,
    form?: CanvasForm,
    type?: string,
    px?: number,
    py?: number,
    evt?: Event
  ) => void
}

export interface PtsCanvasLegacy<T> extends React.Component<T> {
  canvRef: React.RefObject<Element>
  space: CanvasSpace | null
  form: CanvasForm | null
  _touch: boolean

  animate(time: number, ftime: number): void
  start(bound: Bound, space: CanvasSpace): void
  resize(size: Group, evt: Event): void
  action(type: string, px: number, py: number, evt: Event): void
  init(): void
  _update(): void
}

export class QuickStartCanvasLegacy<T> extends PtsCanvasLegacy<T> {}

export type HandleStartFn = (
  bound?: Bound,
  space?: CanvasSpace,
  form?: CanvasForm
) => void

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
  name?: string
  background?: string
  resize?: boolean
  retina?: boolean
  play?: boolean
  touch?: boolean
  style?: object // eslint-disable-line no-undef
  canvasStyle?: object // eslint-disable-line no-undef
  onStart?: HandleStartFn
  onAnimate: HandleAnimateFn
  onResize?: HandleResizeFn
  onAction?: HandleActionFn
  tempo?: Tempo
  canvRef?: React.MutableRefObject<null>
  spaceRef?: React.MutableRefObject<null>
  formRef?: React.MutableRefObject<null>
}
