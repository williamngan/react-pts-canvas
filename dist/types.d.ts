import type { CanvasSpace, Bound, CanvasForm, Group, Tempo } from 'pts'

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

export interface PtsCanvasProps {
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
