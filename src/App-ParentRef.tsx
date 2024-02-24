import { CanvasForm, CanvasSpace } from 'pts';
import React, { createRef, useEffect } from 'react';
import {
  PtsCanvas,
  HandleAnimateFn,
  HandleActionFn,
  HandleReadyFn
} from '../lib/main';
import './App-ParentRef.css';

/**
 * Brief example of passing refs down to pointsCanvas for access in parent component
 */
const App: React.FC = () => {
  const canvRef = createRef<HTMLCanvasElement>();
  let radius = 50;
  let spaceRef: CanvasSpace;
  let formRef: CanvasForm;
  let canvasSize = 100;
  let listenerAdded = false;

  function handleCanvasClick(e: MouseEvent) {
    console.log(`X: ${e.clientX} Y: ${e.clientY}`);
  }

  useEffect(() => {
    if (!listenerAdded && canvRef.current) {
      canvRef.current.addEventListener('click', handleCanvasClick);
      listenerAdded = true;
    }
  });

  useEffect(() => {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && canvRef.current) {
        canvRef.current.click();
      }
    });
  }, []);

  const handleStart: HandleReadyFn = (space, form) => {
    spaceRef = space;
    formRef = form;
  };

  const handleAnimate: HandleAnimateFn = (space, form) => {
    form.point(space.pointer, radius, 'circle');
    if (radius > 20) radius--;
  };

  const handleAction: HandleActionFn = (_space, _form, type) => {
    if (type === 'up') {
      radius += 20;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh'
      }}
    >
      <PtsCanvas
        background="#62e"
        name="quickstart-tester"
        onReady={handleStart}
        onAnimate={handleAnimate}
        onAction={handleAction}
        ref={canvRef}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          textAlign: 'center'
        }}
      >
        <button
          onClick={() => {
            const ctx = canvRef.current?.getContext('2d');
            if (canvRef.current) {
              canvasSize -= 10;
              canvRef.current.setAttribute(
                'style',
                `
                width:${canvasSize}%;
                height:${canvasSize}%;
                margin: 0 auto;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                `
              );
            }
            if (ctx) {
              console.log('ctx', ctx);
            }

            console.log('canvas', canvRef.current);
          }}
        >
          Log / Shrink Canvas
        </button>
        <button
          onClick={() => {
            console.log('space', spaceRef);
          }}
        >
          Log Space
        </button>
        <button
          onClick={() => {
            console.log('form', formRef);
          }}
        >
          Log Form
        </button>
      </div>
    </div>
  );
};

export default App;
