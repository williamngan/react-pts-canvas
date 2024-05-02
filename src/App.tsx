import { useState, useRef } from 'react';
import { PtsCanvas, PtsCanvasImperative } from '../lib/main';
import './App.css';
import { CanvasSpace, Num, Pt } from 'pts';

function App() {
  const [space, setSpace] = useState<CanvasSpace>();
  const ptsRef = useRef<PtsCanvasImperative>(null);

  return (
    <>
      <div className="row">
        <div className="info">
          <h3>Basic</h3>
          <p>
            The minimum code you need to make a <code>PtsCanvas</code> is to
            provide an <code>onAnimate</code> function. Here we just draw a
            point at the pointer's position.
          </p>
        </div>
        <PtsCanvas
          className="example"
          onAnimate={(space, form) => {
            form.point(space.pointer);
          }}
          onAction={(_space, _form, type) => {
            console.log(type);
          }}
        />
      </div>

      <div className="row reverse">
        <div className="info">
          <h3>Without animation</h3>
          <p>
            By default, the canvas will start animating as soon as it's ready.
            You can set the <code>play</code> property to false to prevent this,
            and use <code>space.playOnce()</code> to trigger a rendering when
            you need it.
          </p>
          <p>
            <button onClick={() => space?.playOnce()}>Play once</button>
          </p>
        </div>
        <PtsCanvas
          className="example"
          background="#123"
          play={false}
          onReady={(space) => {
            setSpace(space);
            console.log('ready');
          }}
          onAnimate={(space, form) => {
            form.fillOnly('#fe9').point(Num.randomPt(space.size), 10, 'circle');
          }}
        />
      </div>

      <div className="row">
        <div className="info">
          <h3>Custom</h3>
          <p>
            You can also get the <code>space</code> and <code>form</code>{' '}
            instances passed via <code>useImperativeHandle</code> ref. This let
            you keep the convenient setup of Pts while still having full control
            over the rendering and event handling.
          </p>
        </div>
        <PtsCanvas
          className="example"
          ref={ptsRef}
          refresh={false}
          play={false}
          onPtsResize={(space, form, _bound) => {
            space.clear();
            form.fillOnly('#fff').point(space.center, 5, 'circle');
          }}
          onPointerMove={(e) => {
            const space = ptsRef.current?.getSpace();
            const form = ptsRef.current?.getForm();
            if (space && form) {
              const rect = ptsRef.current?.getCanvas()?.getBoundingClientRect();
              const pos = new Pt(e.clientX, e.clientY).subtract(
                rect?.x || 0,
                rect?.y || 0
              );
              space.clear();
              form.fillOnly('#fff').point(space.center, 5, 'circle');
              form.fill('#f00').point(pos, 10);
            }
          }}
        />
      </div>
    </>
  );
}

export default App;
