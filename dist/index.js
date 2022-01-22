'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var pts = require('pts');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

/* eslint-disable react/prop-types */
class PtsCanvas$1 extends React__default["default"].Component {
    constructor(props) {
        super(props);
        this.canvRef = React__default["default"].createRef();
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
        this.space = new pts.CanvasSpace(this.canvRef.current).setup({
            bgcolor: this.props.background,
            resize: this.props.resize,
            retina: this.props.retina
        });
        this.form = this.space.getForm();
        this.space.add(this);
    }
    render() {
        return (React__default["default"].createElement("div", { className: this.props.name || '', style: this.props.style },
            React__default["default"].createElement("canvas", { className: this.props.name ? this.props.name + '-canvas' : '', 
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ref: this.canvRef, style: this.props.canvasStyle })));
    }
}
PtsCanvas$1.defaultProps = {
    name: 'pts-react',
    background: '#9ab',
    resize: true,
    retina: true,
    play: true,
    touch: true,
    style: {},
    canvasStyle: {}
};
class QuickStartCanvas extends PtsCanvas$1 {
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
QuickStartCanvas.defaultProps = {
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

/* eslint-disable react/prop-types */
const PtsCanvas = props => {
    const canvRef = props.canvRef || React.useRef(null);
    const spaceRef = props.spaceRef || React.useRef();
    const formRef = props.formRef || React.useRef();
    /**
     * When canvRef Updates (ready for space)
     */
    React.useEffect(() => {
        // Create CanvasSpace with the canvRef and assign to spaceRef
        // Add animation, tempo, and play when ready (call back on CanvasSpace constructor)
        spaceRef.current = new pts.CanvasSpace(canvRef.current).setup({
            bgcolor: props.background,
            resize: props.resize,
            retina: props.retina
        });
        // Assign formRef
        formRef.current = spaceRef.current.getForm();
        // By having individual handler props, we can expose what we need to the
        // underlying functions, like our Form instance
        spaceRef.current.add({
            start: (bound) => {
                props.onStart && props.onStart(bound, spaceRef.current, formRef.current);
            },
            animate: (time, ftime) => {
                props.onAnimate &&
                    props.onAnimate(spaceRef.current, formRef.current, time, ftime);
            },
            resize: (bound, event) => {
                // eslint-disable-line no-undef
                props.onResize &&
                    props.onResize(spaceRef.current, formRef.current, bound, event);
            },
            action: (type, px, py, evt) => {
                // eslint-disable-line no-undef
                props.onAction &&
                    props.onAction(spaceRef.current, formRef.current, type, px, py, evt);
            }
        });
        // Add tempo if provided
        if (props.tempo) {
            spaceRef.current.add(props.tempo);
        }
        // Return the cleanup function (similar to ComponentWillUnmount)
        return () => {
            spaceRef.current && spaceRef.current.dispose();
        };
    }, [canvRef]);
    /**
     * When Touch updates
     */
    React.useEffect(() => {
        spaceRef.current &&
            spaceRef.current.bindMouse(props.touch).bindTouch(props.touch);
    }, [props.touch]);
    /**
     * When anything updates
     */
    React.useEffect(() => {
        maybePlay();
    });
    /**
     * Play or stop based on play prop
     * */
    const maybePlay = () => {
        if (props.play) {
            spaceRef.current && spaceRef.current.play();
        }
        else {
            spaceRef.current && spaceRef.current.playOnce(0);
        }
    };
    return (React__default["default"].createElement("div", { className: props.name || '', style: props.style },
        React__default["default"].createElement("canvas", { className: props.name ? props.name + '-canvas' : '', ref: canvRef, style: props.canvasStyle })));
};
PtsCanvas.defaultProps = {
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
    onAction: undefined,
    tempo: undefined,
    canvRef: undefined,
    spaceRef: undefined,
    formRef: undefined
};

exports.PtsCanvas = PtsCanvas;
exports.PtsCanvasLegacy = PtsCanvas$1;
exports.QuickStartCanvasLegacy = QuickStartCanvas;
//# sourceMappingURL=index.js.map
