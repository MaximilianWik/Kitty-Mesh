import { useEffect, useRef } from 'react'
import { FaceLandmarker, HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { FrameLandmarks, HandObservation } from '../lib/types'

interface LandmarkLayerProps {
  landmarks: FrameLandmarks
  hands: HandObservation[]
  width: number
  height: number
  mirrored?: boolean
}

const FINGER_TIPS = [4, 8, 12, 16, 20]

export function LandmarkLayer({ landmarks, hands, width, height, mirrored = true }: LandmarkLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width === 0 || height === 0) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * ratio
    canvas.height = height * ratio
    const context = canvas.getContext('2d')
    if (!context) return

    context.scale(ratio, ratio)
    context.clearRect(0, 0, width, height)
    context.lineCap = 'round'
    context.lineJoin = 'round'

    const x = (value: number) => (mirrored ? 1 - value : value) * width
    const y = (value: number) => value * height

    context.strokeStyle = 'rgba(94, 221, 112, 0.85)'
    context.lineWidth = 1.1
    context.beginPath()
    for (const connection of FaceLandmarker.FACE_LANDMARKS_CONTOURS) {
      const from = landmarks.face[connection.start]
      const to = landmarks.face[connection.end]
      if (!from || !to) continue
      context.moveTo(x(from.x), y(from.y))
      context.lineTo(x(to.x), y(to.y))
    }
    context.stroke()

    context.strokeStyle = 'rgba(84, 217, 245, 0.8)'
    context.lineWidth = 2
    context.beginPath()
    for (const connection of PoseLandmarker.POSE_CONNECTIONS) {
      const from = landmarks.pose[connection.start]
      const to = landmarks.pose[connection.end]
      if (!from || !to || (from.visibility ?? 1) < 0.45 || (to.visibility ?? 1) < 0.45) continue
      context.moveTo(x(from.x), y(from.y))
      context.lineTo(x(to.x), y(to.y))
    }
    context.stroke()

    landmarks.hands.forEach((points, handIndex) => {
      context.strokeStyle = handIndex === 0 ? '#66d982' : '#e0bd62'
      context.lineWidth = 2.2
      context.beginPath()
      for (const connection of HandLandmarker.HAND_CONNECTIONS) {
        const from = points[connection.start]
        const to = points[connection.end]
        if (!from || !to) continue
        context.moveTo(x(from.x), y(from.y))
        context.lineTo(x(to.x), y(to.y))
      }
      context.stroke()

      points.forEach((point, index) => {
        context.fillStyle = FINGER_TIPS.includes(index) ? '#ffffff' : context.strokeStyle
        context.beginPath()
        context.arc(x(point.x), y(point.y), FINGER_TIPS.includes(index) ? 3.6 : 2.2, 0, Math.PI * 2)
        context.fill()
      })

      const wrist = points[0]
      const observation = hands[handIndex]
      if (wrist && observation) {
        const fingers = Object.entries(observation.fingers)
          .filter(([, extended]) => extended)
          .map(([finger]) => finger)
          .join(', ')
        const label = `${observation.handedness} ${observation.gesture}${fingers ? ` [${fingers}]` : ''}`
        context.font = '12px "Lucida Console", monospace'
        const textWidth = context.measureText(label).width
        const labelX = Math.min(Math.max(x(wrist.x), 4), width - textWidth - 12)
        const labelY = Math.min(Math.max(y(wrist.y) + 24, 18), height - 8)
        context.fillStyle = '#101010'
        context.fillRect(labelX - 4, labelY - 14, textWidth + 8, 18)
        context.fillStyle = context.strokeStyle
        context.fillText(label, labelX, labelY)
      }
    })

    context.fillStyle = 'rgba(121, 232, 255, 0.9)'
    for (const point of landmarks.pose) {
      if ((point.visibility ?? 1) < 0.55) continue
      context.beginPath()
      context.arc(x(point.x), y(point.y), 2.4, 0, Math.PI * 2)
      context.fill()
    }
  }, [hands, height, landmarks, mirrored, width])

  return <canvas ref={canvasRef} className="landmark-layer" aria-hidden="true" />
}
