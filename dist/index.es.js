import React from 'react';
import { CanvasSpace } from 'pts';

/* eslint-disable react/prop-types */
class PtsCanvas extends React.Component {
    constructor(props) {
        super(props);
        this.defaultProps = {
            name: 'pts-react',
            background: '#9ab',
            resize: true,
            retina: true,
            play: true,
            touch: true,
            style: {},
            canvasStyle: {}
        };
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
        if (!this.space)
            return;
        this.space.dispose();
    }
    _update() {
        if (!this.space)
            return;
        if (this.props.play) {
            this.space.play();
        }
        else {
            this.space.playOnce(0);
        }
        if (this._touch !== this.props.touch) {
            this._touch = this.props.touch || false;
            this.space.bindMouse(this._touch).bindTouch(this._touch);
        }
    }
    // Required: Override this to use Pts' player `animate` callback
    // See guide: https://ptsjs.org/guide/space-0500
    animate(time, ftime) {
        if (!this.form || !this.space)
            return;
        this.form.point(this.space.pointer, 20, 'circle');
    }
    // Optional: Override this to use Pts' player `start` callback
    start(bound, space) { console.log('Start callback'); }
    // Optional: Override this to use Pts' player `resize` callback
    resize(size, evt) { console.log('Resize callback'); }
    // Optional: Override this to use Pts' player `action` callback
    action(type, px, py, evt) { console.log('Action callback'); }
    init() {
        if (!this.canvRef.current)
            return;
        this.space = new CanvasSpace(this.canvRef.current).setup({
            bgcolor: this.props.background,
            resize: this.props.resize,
            retina: this.props.retina
        });
        this.form = this.space.getForm();
        this.space.add(this);
    }
    render() {
        return (React.createElement("div", { className: this.props.name || '', style: this.props.style },
            React.createElement("canvas", { className: this.props.name ? this.props.name + '-canvas' : '', 
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ref: this.canvRef, style: this.props.canvasStyle })));
    }
}
class QuickStartCanvas extends PtsCanvas {
    constructor() {
        super(...arguments);
        this.defaultProps = {
            name: 'pts-react',
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
        };
    }
    animate(time, ftime) {
        if (!this.space || !this.form)
            return;
        if (this.props.onAnimate) {
            this.props.onAnimate(this.space, this.form, time, ftime);
        }
    }
    start(bound, space) {
        if (this.props.onStart)
            this.props.onStart(bound, space);
    }
    resize(size, evt) {
        if (this.props.onResize) {
            this.props.onResize(this.space || undefined, this.form || undefined, size, evt);
        }
    }
    action(type, px, py, evt) {
        if (this.props.onAction) {
            this.props.onAction(this.space || undefined, this.form || undefined, type, px, py, evt);
        }
    }
}

export { PtsCanvas as PtsCanvasLegacy, QuickStartCanvas as QuickStartCanvasLegacy };
//# sourceMappingURL=index.es.js.map
