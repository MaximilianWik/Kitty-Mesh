export type FacePoseId =
  | 'blank'
  | 'profile'
  | 'tongue'
  | 'happy'
  | 'kiss'
  | 'angry'

export type BodyPoseId = 'hands'

export type HandGestureId =
  | 'fist'
  | 'point'
  | 'peace'
  | 'rock'
  | 'thumbs-up'

export type GestureId = 'idle' | FacePoseId | BodyPoseId | HandGestureId

export type FingerId = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'

export interface HandObservation {
  handedness: 'Left' | 'Right' | 'Unknown'
  gesture: HandGestureId | 'unclassified'
  confidence: number
  fingers: Record<FingerId, boolean>
}

export type TrackingStatus =
  | 'idle'
  | 'loading'
  | 'requesting'
  | 'running'
  | 'error'

export interface GestureScores {
  blank: number
  profile: number
  tongue: number
  happy: number
  kiss: number
  angry: number
  hands: number
  fist: number
  point: number
  peace: number
  rock: number
  'thumbs-up': number
}

export interface VisionSnapshot {
  gesture: GestureId
  candidate: GestureId
  confidence: number
  scores: GestureScores
  faceTracked: boolean
  poseTracked: boolean
  handTracked: boolean
  hands: HandObservation[]
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
  handCalls: number
  classifications: number
  transitions: number
}

export type RuntimeStepId =
  | 'camera.read'
  | 'face.detect'
  | 'pose.detect'
  | 'hand.detect'
  | 'signals.extract'
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
  hands: LandmarkPoint[][]
}

export const EMPTY_SCORES: GestureScores = {
  blank: 0,
  profile: 0,
  tongue: 0,
  happy: 0,
  kiss: 0,
  angry: 0,
  hands: 0,
  fist: 0,
  point: 0,
  peace: 0,
  rock: 0,
  'thumbs-up': 0,
}

export const INITIAL_SNAPSHOT: VisionSnapshot = {
  gesture: 'idle',
  candidate: 'idle',
  confidence: 0,
  scores: EMPTY_SCORES,
  faceTracked: false,
  poseTracked: false,
  handTracked: false,
  hands: [],
  fps: 0,
  latencyMs: 0,
  frame: 0,
  activeStep: 'camera.read',
  counters: {
    frames: 0,
    faceCalls: 0,
    poseCalls: 0,
    handCalls: 0,
    classifications: 0,
    transitions: 0,
  },
}
