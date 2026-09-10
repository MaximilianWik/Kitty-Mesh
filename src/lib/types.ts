export type GestureId =
  | 'idle'
  | 'blank'
  | 'profile'
  | 'tongue'
  | 'spin'
  | 'angry'
  | 'hands'

export type TrackingStatus =
  | 'idle'
  | 'loading'
  | 'requesting'
  | 'running'
  | 'error'

export type SpinStage = 'ready' | 'first-side' | 'away' | 'opposite-side' | 'complete'

export interface GestureScores {
  blank: number
  profile: number
  tongue: number
  angry: number
  hands: number
  spin: number
}

export interface VisionSnapshot {
  gesture: GestureId
  candidate: GestureId
  confidence: number
  scores: GestureScores
  spinStage: SpinStage
  spinProgress: number
  faceTracked: boolean
  poseTracked: boolean
  fps: number
  latencyMs: number
  frame: number
  activeStep: RuntimeStepId
  counters: RuntimeCounters
}

export interface RuntimeCounters {
  frames: number
  faceCalls: number
  poseCalls: number
  classifications: number
  transitions: number
}

export type RuntimeStepId =
  | 'camera.read'
  | 'face.detect'
  | 'pose.detect'
  | 'signals.extract'
  | 'spin.update'
  | 'gesture.rank'
  | 'gesture.stabilize'
  | 'reaction.dispatch'

export interface RuntimeEvent {
  id: number
  step: RuntimeStepId
  label: string
  value: string
  at: number
}

export interface LandmarkPoint {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface FrameLandmarks {
  face: LandmarkPoint[]
  pose: LandmarkPoint[]
}

export const EMPTY_SCORES: GestureScores = {
  blank: 0,
  profile: 0,
  tongue: 0,
  angry: 0,
  hands: 0,
  spin: 0,
}

export const INITIAL_SNAPSHOT: VisionSnapshot = {
  gesture: 'idle',
  candidate: 'idle',
  confidence: 0,
  scores: EMPTY_SCORES,
  spinStage: 'ready',
  spinProgress: 0,
  faceTracked: false,
  poseTracked: false,
  fps: 0,
  latencyMs: 0,
  frame: 0,
  activeStep: 'camera.read',
  counters: {
    frames: 0,
    faceCalls: 0,
    poseCalls: 0,
    classifications: 0,
    transitions: 0,
  },
}
