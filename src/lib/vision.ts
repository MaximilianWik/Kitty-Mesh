import {
  FaceLandmarker,
  FilesetResolver,
  PoseLandmarker,
  type FaceLandmarkerResult,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision'
import { GestureEngine, extractSignals } from './gesture-engine'
import type {
  FrameLandmarks,
  RuntimeCounters,
  RuntimeEvent,
  RuntimeStepId,
  VisionSnapshot,
} from './types'
import { INITIAL_SNAPSHOT } from './types'

const MEDIAPIPE_VERSION = '0.10.22-rc.20250304'
const WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const POSE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const FRAME_INTERVAL = 1000 / 20
const POSE_INTERVAL = 1000 / 12

type SnapshotListener = (snapshot: VisionSnapshot, landmarks: FrameLandmarks) => void
type EventListener = (event: RuntimeEvent) => void

export class VisionRuntime {
  private face?: FaceLandmarker
  private pose?: PoseLandmarker
  private engine = new GestureEngine()
  private frameRequest = 0
  private loaded = false
  private lastVideoTime = -1
  private lastFrameAt = 0
  private lastPoseAt = 0
  private previousFrameAt = 0
  private eventId = 0
  private running = false
  private counters: RuntimeCounters = { ...INITIAL_SNAPSHOT.counters }
  private latestPose: PoseLandmarkerResult | undefined
  private lastSnapshot: VisionSnapshot = INITIAL_SNAPSHOT

  constructor(
    private readonly onSnapshot: SnapshotListener,
    private readonly onEvent: EventListener,
  ) {}

  async load() {
    if (this.loaded) return
    this.emit('camera.read', 'Loading WASM', MEDIAPIPE_VERSION)
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)

    this.emit('face.detect', 'Loading face model', 'float16 / v1')
    this.face = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: FACE_MODEL,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: true,
    })

    this.emit('pose.detect', 'Loading pose model', 'lite / float16 / v1')
    this.pose = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: POSE_MODEL,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.48,
      minPosePresenceConfidence: 0.48,
      minTrackingConfidence: 0.48,
      outputSegmentationMasks: false,
    })
  }

  start(video: HTMLVideoElement) {
    if (!this.face || !this.pose) throw new Error('Vision models are not loaded yet.')
    this.running = true
    this.previousFrameAt = performance.now()
    this.loop(video)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.frameRequest)
    this.lastVideoTime = -1
  }

  close() {
    this.stop()
    this.face?.close()
    this.pose?.close()
  }

  private loop = (video: HTMLVideoElement) => {
    if (!this.running) return
    const now = performance.now()

    if (
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.currentTime !== this.lastVideoTime &&
      now - this.lastFrameAt >= FRAME_INTERVAL
    ) {
      this.processFrame(video, now)
      this.lastVideoTime = video.currentTime
      this.lastFrameAt = now
    }

    this.frameRequest = requestAnimationFrame(() => this.loop(video))
  }

  private processFrame(video: HTMLVideoElement, now: number) {
    const startedAt = performance.now()
    this.counters.frames += 1
    this.emit('camera.read', 'Camera frame', `#${this.counters.frames}`)

    this.emit('face.detect', 'FaceLandmarker.detectForVideo', `${Math.round(now)} ms`)
    const faceResult = this.face!.detectForVideo(video, now)
    this.counters.faceCalls += 1

    if (now - this.lastPoseAt >= POSE_INTERVAL) {
      this.emit('pose.detect', 'PoseLandmarker.detectForVideo', `${Math.round(now)} ms`)
      this.latestPose = this.pose!.detectForVideo(video, now)
      this.lastPoseAt = now
      this.counters.poseCalls += 1
    }

    const face = faceResult.faceLandmarks[0]
    const pose = this.latestPose?.landmarks[0]
    this.emit('signals.extract', 'Extract landmarks and blendshapes', `${face?.length ?? 0} face points`)
    const signals = extractSignals(faceResult.faceBlendshapes[0], face, pose)

    this.emit('spin.update', 'Advance rotation sequence', `${this.lastSnapshot.spinStage}`)
    const classified = this.engine.update(signals, now)
    this.counters.classifications += 1
    this.emit('gesture.rank', 'Rank gesture scores', classified.candidate)
    this.emit('gesture.stabilize', 'Apply hold and cooldown', `${Math.round(classified.confidence * 100)}%`)

    if (classified.changed) {
      this.counters.transitions += 1
      this.emit('reaction.dispatch', 'Dispatch reaction', classified.gesture)
    }

    const elapsed = performance.now() - startedAt
    const delta = Math.max(now - this.previousFrameAt, 1)
    const snapshot: VisionSnapshot = {
      gesture: classified.gesture,
      candidate: classified.candidate,
      confidence: classified.confidence,
      scores: classified.scores,
      spinStage: classified.spinStage,
      spinProgress: classified.spinProgress,
      faceTracked: signals.faceTracked,
      poseTracked: signals.poseTracked,
      fps: 1000 / delta,
      latencyMs: elapsed,
      frame: this.counters.frames,
      activeStep: classified.activeStep,
      counters: { ...this.counters },
    }
    this.previousFrameAt = now
    this.lastSnapshot = snapshot
    this.onSnapshot(snapshot, {
      face: face ? [...face] : [],
      pose: pose ? [...pose] : [],
    })
  }

  private emit(step: RuntimeStepId, label: string, value: string) {
    this.onEvent({
      id: ++this.eventId,
      step,
      label,
      value,
      at: performance.now(),
    })
  }
}

export function describeCameraError(error: unknown) {
  if (!(error instanceof DOMException)) return 'The vision system could not start. Try again.'
  if (error.name === 'NotAllowedError') return 'Camera access was blocked. Allow it in your browser settings, then retry.'
  if (error.name === 'NotFoundError') return 'No camera was found on this device.'
  if (error.name === 'NotReadableError') return 'The camera is already in use by another application.'
  return `Camera error: ${error.message}`
}

export function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export type { FaceLandmarkerResult }
