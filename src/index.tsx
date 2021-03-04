/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from 'react'
import { CanvasSpace, Bound } from 'pts'

export class PtsCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.canvRef = React.createRef();
    this.space = null;
    this.form = null;
    this._touch = false;
  }

  componentDidMount() {
    this.init();
    this._update();
  }

  componentDidUpdate() {
    this._update();
  }

  componentWillUnmount() {
    this.space.dispose();
  }

  _update() {
    if (this.props.play) {
      this.space.play();
    } else {
      this.space.playOnce(0);
    }

    if (this._touch !== this.props.touch) {
      this._touch = this.props.touch;
      this.space.bindMouse( this._touch ).bindTouch( this._touch );
    }
  }


  // Required: Override this to use Pts' player `animate` callback
  // See guide: https://ptsjs.org/guide/space-0500
  animate( time, ftime) {
    this.form.point( this.space.pointer, 20, "circle" );
  }

  
  // Optional: Override this to use Pts' player `start` callback
  start( bound, space ) {}


  // Optional: Override this to use Pts' player `resize` callback
  resize( size, evt ) {}


  // Optional: Override this to use Pts' player `action` callback
  action ( type, px, py, evt ) {}


  init() {
    this.space = new CanvasSpace( this.canvRef ).setup({
      bgcolor: this.props.background, 
      resize: this.props.resize, 
      retina: this.props.retina
    });

    this.form = this.space.getForm();
    this.space.add( this );
  }

  render() {
    return (
      <div className={this.props.name || ""} style={this.props.style}>
        <canvas className={this.props.name ? this.props.name+'-canvas' : ''} ref={c => (this.canvRef=c)} style={this.props.canvasStyle} />
      </div>
    );
  }
}

PtsCanvas.defaultProps = {
  name: "pts-react", // maps to className of the container div
  background: "#9ab",
  resize: true,
  retina: true,
  play: true,
  touch: true,
  style: {},
  canvasStyle: {}
} 

export class QuickStartCanvas extends PtsCanvas {
  
  animate( time, ftime) {
    if (this.props.onAnimate) this.props.onAnimate( this.space, this.form, time, ftime );
  }

  start( bound, space ) {
    if (this.props.onStart) this.props.onStart( bound, space )
  }

  resize( size, evt ) {
    if (this.props.onResize) this.props.onResize( this.space, this.form, size, evt );
  }

  action ( type, px, py, evt ) {
    if (this.props.onAction) this.props.onAction( this.space, this.form, type, px, py, evt );
  }

}


QuickStartCanvas.defaultProps = {
  name: "pts-react", // maps to className of the container div
  background: "#9ab",
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

/**
 * Functional implementation of the PtsCanvas component
 * @param props
 */
export const PtsCanvasFC: React.FC<PtsCanvasFCProps> = (props) => {
  const canvRef = props.canvRef || useRef(null)
  const spaceRef = props.spaceRef || useRef(null)
  const formRef = props.formRef || useRef(null)

  /**
   * When canvRef Updates (ready for space)
   */
  useEffect(() => {
    // Create CanvasSpace with the canvRef and assign to spaceRef
    // Add animation, tempo, and play when ready (call back on CanvasSpace constructor)
    spaceRef.current = new CanvasSpace(canvRef.current).setup({
      bgcolor: props.background,
      resize: props.resize,
      retina: props.retina
    })

    // Assign formRef
    formRef.current = spaceRef.current.getForm()

    // By having individual handler props, we can expose what we need to the
    // underlying functions, like our Form instance
    spaceRef.current.add({
      start: (bound: Bound) => {
        props.onStart &&
          props.onStart(bound, spaceRef.current, formRef.current)
      },
      animate: (time: number, ftime: number) => {
        props.onAnimate &&
          props.onAnimate(spaceRef.current, formRef.current, time, ftime)
      },
      resize: (bound: Bound, event: Event) => { // eslint-disable-line no-undef
        props.onResize &&
          props.onResize(spaceRef.current, formRef.current, bound, event)
      },
      action: (type: string, px: number, py: number, evt: Event) => { // eslint-disable-line no-undef
        props.onAction &&
          props.onAction(
            spaceRef.current,
            formRef.current,
            type,
            px,
            py,
            evt
          )
      }
    })

    // Add tempo if provided
    if (props.tempo) {
      spaceRef.current.add(props.tempo)
    }

    // Return the cleanup function (similar to ComponentWillUnmount)
    return () => {
      spaceRef.current.dispose()
    }
  }, [canvRef])

  /**
   * When Touch updates
   */
  useEffect(() => {
    spaceRef.current &&
      spaceRef.current.bindMouse(props.touch).bindTouch(props.touch)
  }, [props.touch])

  /**
   * When anything updates
   */
  useEffect(() => {
    maybePlay()
  })

  /**
   * Play or stop based on play prop
   * */
  const maybePlay = () => {
    if (props.play) {
      spaceRef.current && spaceRef.current.play()
    } else {
      spaceRef.current && spaceRef.current.playOnce(0)
    }
  }

  return (
    <div className={props.name || ''} style={props.style}>
      <canvas
        className={props.name ? props.name + '-canvas' : ''}
        ref={canvRef}
        style={props.canvasStyle}
      />
    </div>
  )
}

PtsCanvasFC.defaultProps = {
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
  onAction: undefined,
  tempo: null,
  canvRef: null,
  spaceRef: null,
  formRef: null
}
