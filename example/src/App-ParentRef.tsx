import { CanvasForm, CanvasSpace } from 'pts'
import React, { useRef, createRef } from 'react'
import { PtsCanvas, HandleAnimateFn, HandleActionFn } from 'react-pts-canvas'
import './App.css'

/**
 * Brief example of passing refs down to pointsCanvas for access in parent component
 */
const App: React.FC = () => {
  let radius = 50
  const canvRef = createRef<HTMLCanvasElement>()
  const spaceRef = useRef<CanvasSpace>()
  const formRef = useRef<CanvasForm>()
  const canvasSize = useRef(100)

  const handleAnimate: HandleAnimateFn = (space, form) => {
    if (!space || !form) return
    form.point(space.pointer, radius, 'circle')
    if (radius > 20) radius--
  }

  const handleAction: HandleActionFn = (_space, _form, type) => {
    if (type === 'up') {
      radius += 20
    }
  }

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
        onAnimate={handleAnimate}
        onAction={handleAction}
        ref={canvRef}
        spaceRef={spaceRef}
        formRef={formRef}
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
            const canvas = canvRef.current
            const ctx = canvas?.getContext('2d')
            if (canvas) {
              canvasSize.current -= 10
              canvas.setAttribute(
                'style',
                `
                width:${canvasSize.current}%;
                height:${canvasSize.current}%;
                margin: 0 auto;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                `
              )
            }
            if (ctx) {
              console.log('ctx', ctx)
            }

            console.log('canvas', canvRef.current)
          }}
        >
          Log / Shrink Canvas
        </button>
        <button
          onClick={() => {
            console.log('space', spaceRef.current)
          }}
        >
          Log Space
        </button>
        <button
          onClick={() => {
            console.log('form', formRef.current)
          }}
        >
          Log Form
        </button>
      </div>
    </div>
  )
}

export default App
