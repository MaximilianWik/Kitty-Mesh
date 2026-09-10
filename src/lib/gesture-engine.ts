import type { Classifications } from '@mediapipe/tasks-vision'
import type {
  FingerId,
  GestureId,
  GestureScores,
  HandGestureId,
  HandObservation,
  LandmarkPoint,
  RuntimeStepId,
  SpinStage,
} from './types'

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const average = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const distance = (a: LandmarkPoint, b: LandmarkPoint) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

const scoreOf = (blendshapes: Classifications | undefined, name: string) =>
  blendshapes?.categories.find((category) => category.categoryName === name)?.score ?? 0

export interface ExtractedSignals {
  faceTracked: boolean
  poseTracked: boolean
  handTracked: boolean
  hands: HandObservation[]
  yaw: number
  shouldersVisible: boolean
  scores: Omit<GestureScores, 'spin'>
}

const FINGER_POINTS: Record<Exclude<FingerId, 'thumb'>, [number, number, number]> = {
  index: [5, 6, 8],
  middle: [9, 10, 12],
  ring: [13, 14, 16],
  pinky: [17, 18, 20],
}

function jointAngle(a: LandmarkPoint, joint: LandmarkPoint, c: LandmarkPoint) {
  const ab = { x: a.x - joint.x, y: a.y - joint.y, z: a.z - joint.z }
  const cb = { x: c.x - joint.x, y: c.y - joint.y, z: c.z - joint.z }
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z
  const length = Math.hypot(ab.x, ab.y, ab.z) * Math.hypot(cb.x, cb.y, cb.z)
  return length ? Math.acos(clamp(dot / length, -1, 1)) * (180 / Math.PI) : 0
}

export function analyzeHands(
  handLandmarks: LandmarkPoint[][] = [],
  handedness: string[] = [],
): { observations: HandObservation[]; scores: Pick<GestureScores, HandGestureId> } {
  const scores: Pick<GestureScores, HandGestureId> = {
    'open-palm': 0,
    fist: 0,
    point: 0,
    peace: 0,
    'thumbs-up': 0,
  }

  const observations = handLandmarks.flatMap((points, handIndex): HandObservation[] => {
    if (points.length < 21) return []
    const wrist = points[0]
    const palmCenter = points[9]
    const fingers = {} as Record<FingerId, boolean>

    for (const [finger, [mcpIndex, pipIndex, tipIndex]] of Object.entries(FINGER_POINTS) as Array<
      [Exclude<FingerId, 'thumb'>, [number, number, number]]
    >) {
      const mcp = points[mcpIndex]
      const pip = points[pipIndex]
      const tip = points[tipIndex]
      fingers[finger] =
        jointAngle(mcp, pip, tip) > 150 &&
        distance(tip, wrist) > distance(pip, wrist) * 1.08
    }

    const thumbMcp = points[2]
    const thumbIp = points[3]
    const thumbTip = points[4]
    fingers.thumb =
      jointAngle(thumbMcp, thumbIp, thumbTip) > 145 &&
      distance(thumbTip, palmCenter) > distance(thumbIp, palmCenter) * 1.12

    const extended = Object.values(fingers).filter(Boolean).length
    let gesture: HandObservation['gesture'] = 'unclassified'
    let confidence = 0.5

    if (extended === 5) {
      gesture = 'open-palm'
      confidence = 0.95
    } else if (extended === 0) {
      gesture = 'fist'
      confidence = 0.9
    } else if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky && !fingers.thumb) {
      gesture = 'point'
      confidence = 0.92
    } else if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
      gesture = 'peace'
      confidence = fingers.thumb ? 0.76 : 0.94
    } else if (fingers.thumb && !fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky && thumbTip.y < wrist.y) {
      gesture = 'thumbs-up'
      confidence = 0.93
    }

    if (gesture !== 'unclassified') scores[gesture] = Math.max(scores[gesture], confidence)

    const label = handedness[handIndex]
    return [{
      handedness: label === 'Left' || label === 'Right' ? label : 'Unknown',
      gesture,
      confidence,
      fingers,
    }]
  })

  return { observations, scores }
}

export function extractSignals(
  blendshapes: Classifications | undefined,
  face: LandmarkPoint[] | undefined,
  pose: LandmarkPoint[] | undefined,
  handLandmarks: LandmarkPoint[][] = [],
  handedness: string[] = [],
): ExtractedSignals {
  const faceTracked = Boolean(face?.length)
  const poseTracked = Boolean(pose?.length)
  const handAnalysis = analyzeHands(handLandmarks, handedness)

  const leftEye = face?.[33]
  const rightEye = face?.[263]
  const nose = face?.[1]
  const eyeDistance = leftEye && rightEye ? Math.abs(rightEye.x - leftEye.x) : 0
  const eyeCenter = leftEye && rightEye ? (leftEye.x + rightEye.x) / 2 : 0.5
  const yaw = nose && eyeDistance > 0.04 ? clamp((nose.x - eyeCenter) / (eyeDistance * 0.48), -1, 1) : 0
  const profile = faceTracked ? clamp((Math.abs(yaw) - 0.32) / 0.48) : 0

  const jawOpen = scoreOf(blendshapes, 'jawOpen')
  const mouthLower = average(
    scoreOf(blendshapes, 'mouthLowerDownLeft'),
    scoreOf(blendshapes, 'mouthLowerDownRight'),
  )
  const mouthUpper = average(
    scoreOf(blendshapes, 'mouthUpperUpLeft'),
    scoreOf(blendshapes, 'mouthUpperUpRight'),
  )
  const mouthClose = scoreOf(blendshapes, 'mouthClose')
  const tongue = clamp(jawOpen * 0.78 + mouthLower * 0.24 + mouthUpper * 0.16 - mouthClose * 0.2)

  const smile = average(
    scoreOf(blendshapes, 'mouthSmileLeft'),
    scoreOf(blendshapes, 'mouthSmileRight'),
  )
  const cheekSquint = average(
    scoreOf(blendshapes, 'cheekSquintLeft'),
    scoreOf(blendshapes, 'cheekSquintRight'),
  )
  const happy = clamp(smile * 0.82 + cheekSquint * 0.18 - jawOpen * 0.08)
  const kiss = clamp(
    scoreOf(blendshapes, 'mouthPucker') * 0.64 +
    scoreOf(blendshapes, 'mouthFunnel') * 0.28 +
    scoreOf(blendshapes, 'mouthShrugLower') * 0.08 - jawOpen * 0.12,
  )

  const browDown = average(
    scoreOf(blendshapes, 'browDownLeft'),
    scoreOf(blendshapes, 'browDownRight'),
  )
  const noseSneer = average(
    scoreOf(blendshapes, 'noseSneerLeft'),
    scoreOf(blendshapes, 'noseSneerRight'),
  )
  const squint = average(
    scoreOf(blendshapes, 'eyeSquintLeft'),
    scoreOf(blendshapes, 'eyeSquintRight'),
  )
  const mouthPress = average(
    scoreOf(blendshapes, 'mouthPressLeft'),
    scoreOf(blendshapes, 'mouthPressRight'),
  )
  const angry = clamp(browDown * 0.48 + noseSneer * 0.28 + squint * 0.16 + mouthPress * 0.08)

  const expressiveActivity = Math.max(
    jawOpen,
    browDown,
    noseSneer,
    squint,
    smile,
    scoreOf(blendshapes, 'eyeWideLeft'),
    scoreOf(blendshapes, 'eyeWideRight'),
  )
  const blank = faceTracked ? clamp(1 - expressiveActivity * 1.55 - profile * 0.45) : 0

  const leftShoulder = pose?.[11]
  const rightShoulder = pose?.[12]
  const leftWrist = pose?.[15]
  const rightWrist = pose?.[16]
  const visible = (point: LandmarkPoint | undefined) => Boolean(point && (point.visibility ?? 1) > 0.55)
  const shouldersVisible = visible(leftShoulder) && visible(rightShoulder)
  const hands =
    shouldersVisible && visible(leftWrist) && visible(rightWrist) &&
    leftWrist!.y < leftShoulder!.y - 0.025 && rightWrist!.y < rightShoulder!.y - 0.025
      ? clamp(((leftShoulder!.y - leftWrist!.y) + (rightShoulder!.y - rightWrist!.y)) / 0.42)
      : 0

  return {
    faceTracked,
    poseTracked,
    handTracked: handAnalysis.observations.length > 0,
    hands: handAnalysis.observations,
    yaw,
    shouldersVisible,
    scores: {
      blank,
      profile,
      tongue,
      happy,
      kiss,
      angry,
      hands,
      ...handAnalysis.scores,
    },
  }
}

interface SpinResult {
  stage: SpinStage
  progress: number
  complete: boolean
}

export class SpinTracker {
  private stage: SpinStage = 'ready'
  private direction = 0
  private startedAt = 0
  private faceMissingSince = 0
  private completedAt = 0

  update(yaw: number, faceTracked: boolean, poseTracked: boolean, now: number): SpinResult {
    if (this.stage !== 'ready' && this.stage !== 'complete' && now - this.startedAt > 12_000) this.reset()

    if (this.stage === 'complete') {
      if (now - this.completedAt > 1_600) this.reset()
      return { stage: this.stage, progress: 1, complete: true }
    }

    if (this.stage === 'ready' && faceTracked && Math.abs(yaw) > 0.7) {
      this.stage = 'first-side'
      this.direction = Math.sign(yaw) || 1
      this.startedAt = now
    } else if (this.stage === 'first-side') {
      if (!faceTracked && poseTracked) {
        this.faceMissingSince ||= now
        if (now - this.faceMissingSince > 180) this.stage = 'away'
      } else {
        this.faceMissingSince = 0
      }
    } else if (this.stage === 'away' && faceTracked && Math.sign(yaw) === -this.direction && Math.abs(yaw) > 0.55) {
      this.stage = 'opposite-side'
    } else if (this.stage === 'opposite-side' && faceTracked && Math.abs(yaw) < 0.28) {
      this.stage = 'complete'
      this.completedAt = now
    }

    const progressByStage: Record<SpinStage, number> = {
      ready: 0,
      'first-side': 0.25,
      away: 0.56,
      'opposite-side': 0.82,
      complete: 1,
    }
    return { stage: this.stage, progress: progressByStage[this.stage], complete: this.stage === 'complete' }
  }

  reset() {
    this.stage = 'ready'
    this.direction = 0
    this.startedAt = 0
    this.faceMissingSince = 0
    this.completedAt = 0
  }
}

interface StableGesture {
  gesture: GestureId
  changed: boolean
}

export class GestureStabilizer {
  private stable: GestureId = 'idle'
  private candidate: GestureId = 'idle'
  private candidateSince = 0
  private lastChangeAt = 0

  push(candidate: GestureId, confidence: number, now: number): StableGesture {
    if (candidate !== this.candidate) {
      this.candidate = candidate
      this.candidateSince = now
    }

    const requiredHold = candidate === 'blank' ? 420 : candidate === 'spin' ? 100 : 120
    const leavingHold = candidate === 'idle' ? 150 : requiredHold
    const canChange = now - this.lastChangeAt > 160

    if (
      candidate !== this.stable &&
      now - this.candidateSince >= leavingHold &&
      canChange &&
      (candidate === 'idle' || confidence >= 0.25)
    ) {
      this.stable = candidate
      this.lastChangeAt = now
      return { gesture: this.stable, changed: true }
    }

    return { gesture: this.stable, changed: false }
  }
}

export class GestureEngine {
  private spinTracker = new SpinTracker()
  private stabilizer = new GestureStabilizer()
  private smoothed: GestureScores = {
    blank: 0,
    profile: 0,
    tongue: 0,
    happy: 0,
    kiss: 0,
    angry: 0,
    hands: 0,
    spin: 0,
    'open-palm': 0,
    fist: 0,
    point: 0,
    peace: 0,
    'thumbs-up': 0,
  }

  update(signals: ExtractedSignals, now: number) {
    const spin = this.spinTracker.update(signals.yaw, signals.faceTracked, signals.poseTracked, now)
    const incoming: GestureScores = { ...signals.scores, spin: spin.complete ? 1 : spin.progress * 0.42 }

    for (const key of Object.keys(incoming) as Array<keyof GestureScores>) {
      this.smoothed[key] = this.smoothed[key] * 0.52 + incoming[key] * 0.48
    }

    const ranked: Array<[GestureId, number, number]> = [
      ['spin', spin.complete ? 1 : 0, 0.9],
      ['hands', this.smoothed.hands, 0.52],
      ['peace', this.smoothed.peace, 0.62],
      ['thumbs-up', this.smoothed['thumbs-up'], 0.62],
      ['point', this.smoothed.point, 0.62],
      ['fist', this.smoothed.fist, 0.62],
      ['open-palm', this.smoothed['open-palm'], 0.62],
      ['tongue', this.smoothed.tongue, 0.25],
      ['kiss', this.smoothed.kiss, 0.38],
      ['happy', this.smoothed.happy, 0.38],
      ['angry', this.smoothed.angry, 0.4],
      ['profile', this.smoothed.profile, 0.52],
      ['blank', this.smoothed.blank, 0.3],
    ]
    const winner = ranked.find(([, score, threshold]) => score >= threshold)
    const candidate = winner?.[0] ?? 'idle'
    const confidence = winner?.[1] ?? Math.max(...Object.values(this.smoothed))
    const stable = this.stabilizer.push(candidate, confidence, now)

    return {
      ...stable,
      candidate,
      confidence,
      scores: { ...this.smoothed },
      spinStage: spin.stage,
      spinProgress: spin.progress,
      activeStep: (stable.changed ? 'reaction.dispatch' : 'gesture.stabilize') as RuntimeStepId,
    }
  }
}
