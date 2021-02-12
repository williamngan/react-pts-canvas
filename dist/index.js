'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var pts = require('pts');

/* eslint-disable react/prop-types */


var PtsCanvas = function PtsCanvas(props) {
  var canvRef = React.useRef(null);
  var spaceRef = React.useRef(null);
  var formRef = React.useRef(null);

  /**
   * When canvRef Updates (ready for space)
   */
  React.useEffect(function () {
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
      start: function start(bound) {
        props.onStart && props.onStart(bound, spaceRef.current, formRef.current);
      },
      animate: function animate(time, ftime) {
        props.onAnimate && props.onAnimate(spaceRef.current, formRef.current, time, ftime);
      },
      resize: function resize(bound, event) {
        // eslint-disable-line no-undef
        props.onResize && props.onResize(spaceRef.current, formRef.current, bound, event);
      },
      action: function action(type, px, py, evt) {
        // eslint-disable-line no-undef
        props.onAction && props.onAction(spaceRef.current, formRef.current, type, px, py, evt);
      }
    });

    // Add tempo if provided
    if (props.tempo) {
      spaceRef.current.add(props.tempo);
    }

    // Return the cleanup function (similar to ComponentWillUnmount)
    return function () {
      spaceRef.current.dispose();
    };
  }, [canvRef]);

  /**
   * When Touch updates
   */
  React.useEffect(function () {
    spaceRef.current && spaceRef.current.bindMouse(props.touch).bindTouch(props.touch);
  }, [props.touch]);

  /**
   * When anything updates
   */
  React.useEffect(function () {
    maybePlay();
  });

  /**
   * Play or stop based on play prop
   * */
  var maybePlay = function maybePlay() {
    if (props.play) {
      spaceRef.current && spaceRef.current.play();
    } else {
      spaceRef.current && spaceRef.current.playOnce(0);
    }
  };

  return React__default.createElement(
    'div',
    { className: props.name || '', style: props.style },
    React__default.createElement('canvas', {
      className: props.name ? props.name + '-canvas' : '',
      ref: canvRef,
      style: props.canvasStyle
    })
  );
};

PtsCanvas.defaultProps = {
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
};

exports.PtsCanvas = PtsCanvas;
//# sourceMappingURL=index.js.map
