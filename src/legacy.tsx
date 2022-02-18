/* eslint-disable react/prop-types */
import React from 'react'
import { CanvasSpace, CanvasForm, Bound, Group, IPlayer } from 'pts'

export type PtsCanvasLegacyProps = {
  name?: string
  background?: string
  resize?: boolean
  retina?: boolean
  play?: boolean
  touch?: boolean
  style?: object
  canvasStyle?: object
}

export type QuickStartProps = PtsCanvasLegacyProps & {
  onStart?: (bound?: Bound, space?: CanvasSpace) => void
  onAnimate?: (
    space?: CanvasSpace,
    form?: CanvasForm,
    time?: number,
    ftime?: number
  ) => void
  onResize?: (
    space?: CanvasSpace,
    form?: CanvasForm,
    size?: Group,
    evt?: Event
  ) => void
  onAction?: (
    space?: CanvasSpace,
    form?: CanvasForm,
    type?: string,
    px?: number,
    py?: number,
    evt?: Event
  ) => void
}

export class PtsCanvas<T> extends React.Component<PtsCanvasLegacyProps & T> {
  canvRef: React.RefObject<Element>
  space: CanvasSpace | null
  form: CanvasForm | null
  _touch: boolean

  static defaultProps = {
    name: 'pts-react', // maps to className of the container div
    background: '#9ab',
    resize: true,
    retina: true,
    play: true,
    touch: true,
    style: {},
    canvasStyle: {}
  }

  constructor(props: T) {
    super(props)
    this.canvRef = React.createRef()
    this.space = null
    this.form = null
    this._touch = false
  }

  componentDidMount() {
    this.init()
    this._update()
  }

  componentDidUpdate() {
    this._update()
  }

  componentWillUnmount() {
    if (!this.space) return
    this.space.dispose()
  }

  _update() {
    if (!this.space) return
    if (this.props.play) {
      this.space.play()
    } else {
      this.space.playOnce(0)
    }

    if (this._touch !== this.props.touch) {
      this._touch = this.props.touch || false
      this.space.bindMouse(this._touch).bindTouch(this._touch)
    }
  }

  // Required: Override this to use Pts' player `animate` callback
  // See guide: https://ptsjs.org/guide/space-0500
  animate(time: number, ftime: number) {
    if (!this.form || !this.space) return
    this.form.point(this.space.pointer, 20, 'circle')
  }

  // Optional: Override this to use Pts' player `start` callback
  start(bound: Bound, space: CanvasSpace) { console.log('Start callback') }

  // Optional: Override this to use Pts' player `resize` callback
  resize(size: Group, evt: Event) { console.log('Resize callback') }

  // Optional: Override this to use Pts' player `action` callback
  action(type: string, px: number, py: number, evt: Event) { console.log('Action callback') }

  init() {
    if (!this.canvRef.current) return
    this.space = new CanvasSpace(this.canvRef.current).setup({
      bgcolor: this.props.background,
      resize: this.props.resize,
      retina: this.props.retina
    })

    this.form = this.space.getForm()
    this.space.add(this as IPlayer)
  }

  render() {
    return (
      <div className={this.props.name || ''} style={this.props.style}>
        <canvas
          className={this.props.name ? this.props.name + '-canvas' : ''}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          ref={this.canvRef}
          style={this.props.canvasStyle}
        />
      </div>
    )
  }
}

export class QuickStartCanvas extends PtsCanvas<QuickStartProps> {
  static defaultProps = {
    name: 'pts-react', // maps to className of the container div
    background: '#9ab',
    resize: true,
    retina: true,
    play: true,
    touch: true,
    style: {},
    canvasStyle: {},
    onStart: undefined,
    onAnimate: undefined,
    onResize: undefined,
    onAction: undefined
  }

  override animate(time: number, ftime: number) {
    if (!this.space || !this.form) return
    if (this.props.onAnimate) {
      this.props.onAnimate(this.space, this.form, time, ftime)
    }
  }

  override start(bound: Bound, space: CanvasSpace) {
    if (this.props.onStart) this.props.onStart(bound, space)
  }

  override resize(size: Group, evt: Event) {
    if (this.props.onResize) {
      this.props.onResize(this.space || undefined, this.form || undefined, size, evt)
    }
  }

  override action(type: string, px: number, py: number, evt: Event) {
    if (this.props.onAction) {
      this.props.onAction(this.space || undefined, this.form || undefined, type, px, py, evt)
    }
  }
}
