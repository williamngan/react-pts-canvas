import { useState } from 'react';
import { PtsCanvas } from '../lib/main';
import './App.css';
import { CanvasSpace, Num } from 'pts';

function App() {
  const [space, setSpace] = useState<CanvasSpace>();

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
          }}
          onAnimate={(space, form) => {
            form.fillOnly('#fe9').point(Num.randomPt(space.size), 10, 'circle');
          }}
        />
      </div>
    </>
  );
}

export default App;
