import type { RuntimeStepId } from './types'

export interface RuntimeModule {
  name: string
  path: string
  lines: Array<{ number: number; step?: RuntimeStepId; code: string }>
}

export const RUNTIME_MODULES: RuntimeModule[] = [
  {
    name: 'frame-loop',
    path: 'src/lib/vision.ts',
    lines: [
      { number: 88, step: 'camera.read', code: 'if (video.currentTime === lastTime) return' },
      { number: 91, step: 'face.detect', code: 'faceResult = face.detectForVideo(video, now)' },
      { number: 94, step: 'pose.detect', code: 'poseResult = pose.detectForVideo(video, now)' },
      { number: 98, step: 'signals.extract', code: 'signals = extractSignals(faceResult, poseResult)' },
    ],
  },
  {
    name: 'classifier',
    path: 'src/lib/gesture-engine.ts',
    lines: [
      { number: 146, step: 'spin.update', code: 'spin = spinTracker.update(orientation, now)' },
      { number: 151, step: 'gesture.rank', code: 'candidate = rankSignals(scores, spin)' },
      { number: 155, step: 'gesture.stabilize', code: 'stable = stabilizer.push(candidate, confidence)' },
      { number: 161, step: 'reaction.dispatch', code: 'dispatchReaction(stable.gesture)' },
    ],
  },
]

export const STEP_MODULE = new Map<RuntimeStepId, RuntimeModule>()
for (const module of RUNTIME_MODULES) {
  for (const line of module.lines) {
    if (line.step) STEP_MODULE.set(line.step, module)
  }
}
