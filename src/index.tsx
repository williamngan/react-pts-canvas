// /* eslint-disable react/prop-types */
// import React, { useEffect, useRef } from 'react'
// import { CanvasSpace, Bound, CanvasForm, Group, Tempo } from 'pts'

// export type HandleStartFn = (
//   bound?: Bound,
//   space?: CanvasSpace,
//   form?: CanvasForm
// ) => void

// export type HandleAnimateFn = (
//   space?: CanvasSpace,
//   form?: CanvasForm,
//   time?: number,
//   ftime?: number
// ) => void

// export type HandleResizeFn = (
//   space?: CanvasSpace,
//   form?: CanvasForm,
//   size?: Group,
//   evt?: Event // eslint-disable-line no-undef
// ) => void

// export type HandleActionFn = (
//   space?: CanvasSpace,
//   form?: CanvasForm,
//   type?: string,
//   px?: number,
//   py?: number,
//   evt?: Event // eslint-disable-line no-undef
// ) => void

// export interface PtsCanvasFCProps {
//   name?: string
//   background?: string
//   resize?: boolean
//   retina?: boolean
//   play?: boolean
//   touch?: boolean
//   style?: object // eslint-disable-line no-undef
//   canvasStyle?: object // eslint-disable-line no-undef
//   onStart?: HandleStartFn
//   onAnimate: HandleAnimateFn
//   onResize?: HandleResizeFn
//   onAction?: HandleActionFn
//   tempo?: Tempo
//   canvRef?: React.MutableRefObject<null>
//   spaceRef?: React.MutableRefObject<null>
//   formRef?: React.MutableRefObject<null>
// }

// export const PtsCanvasFC: React.FC<PtsCanvasFCProps> = props => {
//   const canvRef = props.canvRef || useRef(null)
//   const spaceRef = props.spaceRef || useRef(null)
//   const formRef = props.formRef || useRef(null)

//   /**
//    * When canvRef Updates (ready for space)
//    */
//   useEffect(() => {
//     // Create CanvasSpace with the canvRef and assign to spaceRef
//     // Add animation, tempo, and play when ready (call back on CanvasSpace constructor)
//     spaceRef.current = new CanvasSpace(canvRef.current).setup({
//       bgcolor: props.background,
//       resize: props.resize,
//       retina: props.retina
//     })

//     // Assign formRef
//     formRef.current = spaceRef.current.getForm()

//     // By having individual handler props, we can expose what we need to the
//     // underlying functions, like our Form instance
//     spaceRef.current.add({
//       start: (bound: Bound) => {
//         props.onStart && props.onStart(bound, spaceRef.current, formRef.current)
//       },
//       animate: (time: number, ftime: number) => {
//         props.onAnimate &&
//           props.onAnimate(spaceRef.current, formRef.current, time, ftime)
//       },
//       resize: (bound: Bound, event: Event) => {
//         // eslint-disable-line no-undef
//         props.onResize &&
//           props.onResize(spaceRef.current, formRef.current, bound, event)
//       },
//       action: (type: string, px: number, py: number, evt: Event) => {
//         // eslint-disable-line no-undef
//         props.onAction &&
//           props.onAction(spaceRef.current, formRef.current, type, px, py, evt)
//       }
//     })

//     // Add tempo if provided
//     if (props.tempo) {
//       spaceRef.current.add(props.tempo)
//     }

//     // Return the cleanup function (similar to ComponentWillUnmount)
//     return () => {
//       spaceRef.current.dispose()
//     }
//   }, [canvRef])

//   /**
//    * When Touch updates
//    */
//   useEffect(() => {
//     spaceRef.current &&
//       spaceRef.current.bindMouse(props.touch).bindTouch(props.touch)
//   }, [props.touch])

//   /**
//    * When anything updates
//    */
//   useEffect(() => {
//     maybePlay()
//   })

//   /**
//    * Play or stop based on play prop
//    * */
//   const maybePlay = () => {
//     if (props.play) {
//       spaceRef.current && spaceRef.current.play()
//     } else {
//       spaceRef.current && spaceRef.current.playOnce(0)
//     }
//   }

//   return (
//     <div className={props.name || ''} style={props.style}>
//       <canvas
//         className={props.name ? props.name + '-canvas' : ''}
//         ref={canvRef}
//         style={props.canvasStyle}
//       />
//     </div>
//   )
// }

// PtsCanvasFC.defaultProps = {
//   name: 'pts-react', // maps to className of the container div
//   background: '#9ab',
//   resize: true,
//   retina: true,
//   play: true,
//   touch: true,
//   style: {},
//   canvasStyle: {},
//   onStart: undefined,
//   onAnimate: undefined,
//   onResize: undefined,
//   onAction: undefined,
//   tempo: null,
//   canvRef: null,
//   spaceRef: null,
//   formRef: null
// }

export {
  PtsCanvas as PtsCanvasLegacy,
  QuickStartCanvas as QuickStartCanvasLegacy,
  PtsCanvasLegacyProps,
  QuickStartProps
} from './legacy'
