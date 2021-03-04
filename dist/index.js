'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var pts = require('pts');

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

/* eslint-disable react/prop-types */

var PtsCanvas = function (_React$Component) {
  inherits(PtsCanvas, _React$Component);

  function PtsCanvas(props) {
    classCallCheck(this, PtsCanvas);

    var _this = possibleConstructorReturn(this, (PtsCanvas.__proto__ || Object.getPrototypeOf(PtsCanvas)).call(this, props));

    _this.canvRef = React__default.createRef();
    _this.space = null;
    _this.form = null;
    _this._touch = false;
    return _this;
  }

  createClass(PtsCanvas, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.init();
      this._update();
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this._update();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.space.dispose();
    }
  }, {
    key: '_update',
    value: function _update() {
      if (this.props.play) {
        this.space.play();
      } else {
        this.space.playOnce(0);
      }

      if (this._touch !== this.props.touch) {
        this._touch = this.props.touch;
        this.space.bindMouse(this._touch).bindTouch(this._touch);
      }
    }

    // Required: Override this to use Pts' player `animate` callback
    // See guide: https://ptsjs.org/guide/space-0500

  }, {
    key: 'animate',
    value: function animate(time, ftime) {
      this.form.point(this.space.pointer, 20, "circle");
    }

    // Optional: Override this to use Pts' player `start` callback

  }, {
    key: 'start',
    value: function start(bound, space) {}

    // Optional: Override this to use Pts' player `resize` callback

  }, {
    key: 'resize',
    value: function resize(size, evt) {}

    // Optional: Override this to use Pts' player `action` callback

  }, {
    key: 'action',
    value: function action(type, px, py, evt) {}
  }, {
    key: 'init',
    value: function init() {
      this.space = new pts.CanvasSpace(this.canvRef).setup({
        bgcolor: this.props.background,
        resize: this.props.resize,
        retina: this.props.retina
      });

      this.form = this.space.getForm();
      this.space.add(this);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      return React__default.createElement(
        'div',
        { className: this.props.name || "", style: this.props.style },
        React__default.createElement('canvas', { className: this.props.name ? this.props.name + '-canvas' : '', ref: function ref(c) {
            return _this2.canvRef = c;
          }, style: this.props.canvasStyle })
      );
    }
  }]);
  return PtsCanvas;
}(React__default.Component);

PtsCanvas.defaultProps = {
  name: "pts-react", // maps to className of the container div
  background: "#9ab",
  resize: true,
  retina: true,
  play: true,
  touch: true,
  style: {},
  canvasStyle: {}
};

var QuickStartCanvas = function (_PtsCanvas) {
  inherits(QuickStartCanvas, _PtsCanvas);

  function QuickStartCanvas() {
    classCallCheck(this, QuickStartCanvas);
    return possibleConstructorReturn(this, (QuickStartCanvas.__proto__ || Object.getPrototypeOf(QuickStartCanvas)).apply(this, arguments));
  }

  createClass(QuickStartCanvas, [{
    key: 'animate',
    value: function animate(time, ftime) {
      if (this.props.onAnimate) this.props.onAnimate(this.space, this.form, time, ftime);
    }
  }, {
    key: 'start',
    value: function start(bound, space) {
      if (this.props.onStart) this.props.onStart(bound, space);
    }
  }, {
    key: 'resize',
    value: function resize(size, evt) {
      if (this.props.onResize) this.props.onResize(this.space, this.form, size, evt);
    }
  }, {
    key: 'action',
    value: function action(type, px, py, evt) {
      if (this.props.onAction) this.props.onAction(this.space, this.form, type, px, py, evt);
    }
  }]);
  return QuickStartCanvas;
}(PtsCanvas);

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

  /**
   * Functional implementation of the PtsCanvas component
   * @param props
   */
};var PtsCanvasFC = function PtsCanvasFC(props) {
  var canvRef = props.canvRef || React.useRef(null);
  var spaceRef = props.spaceRef || React.useRef(null);
  var formRef = props.formRef || React.useRef(null);

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
};

exports.PtsCanvas = PtsCanvas;
exports.QuickStartCanvas = QuickStartCanvas;
exports.PtsCanvasFC = PtsCanvasFC;
//# sourceMappingURL=index.js.map
