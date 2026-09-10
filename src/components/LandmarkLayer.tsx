import { useEffect, useRef } from 'react'
import { FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { FrameLandmarks } from '../lib/types'

interface LandmarkLayerProps {
  landmarks: FrameLandmarks
  width: number
  height: number
  mirrored?: boolean
}

export function LandmarkLayer({ landmarks, width, height, mirrored = true }: LandmarkLayerProps) {
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

    context.strokeStyle = 'rgba(208, 122, 255, 0.2)'
    context.lineWidth = 0.65
    context.beginPath()
    for (const connection of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
      const from = landmarks.face[connection.start]
      const to = landmarks.face[connection.end]
      if (!from || !to) continue
      context.moveTo(x(from.x), y(from.y))
      context.lineTo(x(to.x), y(to.y))
    }
    context.stroke()

    context.strokeStyle = 'rgba(84, 217, 245, 0.72)'
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

    context.fillStyle = 'rgba(121, 232, 255, 0.9)'
    for (const point of landmarks.pose) {
      if ((point.visibility ?? 1) < 0.55) continue
      context.beginPath()
      context.arc(x(point.x), y(point.y), 2.4, 0, Math.PI * 2)
      context.fill()
    }
  }, [height, landmarks, mirrored, width])

  return <canvas ref={canvasRef} className="landmark-layer" aria-hidden="true" />
}
