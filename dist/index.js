'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var pts = require('pts');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? React.useLayoutEffect : React.useEffect;

/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */
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

/*!
 * react-pts-canvas - Copyright © 2019-current William Ngan and contributors.
 * Licensed under Apache 2.0 License.
 * See https://github.com/williamngan/react-pts-canvas for details.
 */
const PtsCanvasComponent = (_a, ref) => {
    var { name = 'pts-react', // maps to className of the container div
    background = '#9ab', resize = true, retina = true, play = true, touch = true, style = {}, canvasStyle = {}, onStart = undefined, onAnimate = () => {
        console.log('animating');
    }, onResize = undefined, onAction = undefined, tempo = undefined } = _a, otherProps = __rest(_a, ["name", "background", "resize", "retina", "play", "touch", "style", "canvasStyle", "onStart", "onAnimate", "onResize", "onAction", "tempo"]);
    // Set canvRef to be either the forwarded ref if its a MutableRefObject, or our own local ref otherwise
    const canvRef = ref && typeof ref !== 'function' ? ref : React.useRef(null);
    const spaceRef = React.useRef();
    const formRef = React.useRef();
    const playerRef = React.useRef();
    /**
     * When canvRef Updates (ready for space)
     */
    useIsomorphicLayoutEffect(() => {
        if (!canvRef || !canvRef.current)
            return;
        // Create CanvasSpace with the canvRef and assign to spaceRef
        // Add animation, tempo, and play when ready (call back on CanvasSpace constructor)
        spaceRef.current = new pts.CanvasSpace(canvRef.current).setup({
            bgcolor: background,
            resize,
            retina
        });
        // Assign formRef
        formRef.current = spaceRef.current.getForm();
        // Player object
        playerRef.current = {
            start: (bound) => {
                if (onStart && spaceRef.current && formRef.current) {
                    onStart(bound, spaceRef.current, formRef.current);
                }
            },
            animate: (time, ftime) => {
                if (time && ftime && spaceRef.current && formRef.current) {
                    onAnimate(spaceRef.current, formRef.current, time, ftime);
                }
            },
            resize: (bound, event) => {
                if (onResize && spaceRef.current && formRef.current) {
                    onResize(spaceRef.current, formRef.current, bound, event);
                }
            },
            action: (type, px, py, evt) => {
                if (onAction && spaceRef.current && formRef.current) {
                    onAction(spaceRef.current, formRef.current, type, px, py, evt);
                }
            }
        };
        // By having individual handler props, we can expose what we need to the
        // underlying functions, like our Form instance
        spaceRef.current.add(playerRef.current);
        // Add tempo if provided
        if (tempo) {
            spaceRef.current.add(tempo);
        }
        // Return the cleanup function (similar to ComponentWillUnmount)
        return () => {
            spaceRef.current && spaceRef.current.dispose();
        };
    }, [canvRef]);
    /**
     * When onStart callback updates
     */
    React.useEffect(() => {
        if (playerRef.current) {
            playerRef.current.start = (bound) => {
                if (onStart && spaceRef.current && formRef.current) {
                    onStart(bound, spaceRef.current, formRef.current);
                }
            };
        }
    }, [onStart]);
    /**
     * When onAnimate callback updates
     */
    React.useEffect(() => {
        if (playerRef.current) {
            playerRef.current.animate = (time, ftime) => {
                if (time && ftime && spaceRef.current && formRef.current) {
                    onAnimate(spaceRef.current, formRef.current, time, ftime);
                }
            };
        }
    }, [onAnimate]);
    /**
     * When onResize callback updates
     */
    React.useEffect(() => {
        if (playerRef.current) {
            playerRef.current.resize = (bound, event) => {
                if (onResize && spaceRef.current && formRef.current) {
                    onResize(spaceRef.current, formRef.current, bound, event);
                }
            };
        }
    }, [onResize]);
    /**
     * When onAction callback updates
     */
    React.useEffect(() => {
        if (playerRef.current) {
            playerRef.current.action = (type, px, py, evt) => {
                if (onAction && spaceRef.current && formRef.current) {
                    onAction(spaceRef.current, formRef.current, type, px, py, evt);
                }
            };
        }
    }, [onAction]);
    /**
     * When Touch updates
     */
    React.useEffect(() => {
        spaceRef.current && spaceRef.current.bindMouse(touch).bindTouch(touch);
    }, [touch]);
    /**
     * Play or stop based on play prop
     * */
    const maybePlay = () => {
        const space = spaceRef.current;
        if (!space)
            return;
        if (play) {
            if (space.isPlaying) {
                space.resume();
            }
            else {
                space.replay(); // if space has stopped, replay
            }
        }
        else {
            space.pause(true);
        }
    };
    /**
     * When anything updates
     */
    React.useEffect(() => {
        maybePlay();
    });
    return (React__default["default"].createElement("div", { className: name || '', style: style },
        React__default["default"].createElement("canvas", Object.assign({}, otherProps, { className: name ? name + '-canvas' : '', ref: canvRef, style: canvasStyle }))));
};
const PtsCanvas = React.forwardRef(PtsCanvasComponent);

exports.PtsCanvas = PtsCanvas;
exports.PtsCanvasLegacy = PtsCanvas$1;
exports.QuickStartCanvasLegacy = QuickStartCanvas;
//# sourceMappingURL=index.js.map
