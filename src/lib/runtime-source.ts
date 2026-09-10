import gestureEngineSource from './gesture-engine.ts?raw'
import type { RuntimeStepId } from './types'
import visionSource from './vision.ts?raw'

export interface RuntimeModule {
  name: string
  path: string
  lines: Array<{ number: number; step: RuntimeStepId; code: string }>
}

interface SourceAnchor {
  step: RuntimeStepId
  includes: string
}

function mapSource(name: string, path: string, source: string, anchors: SourceAnchor[]): RuntimeModule {
  const sourceLines = source.split('\n')
  return {
    name,
    path,
    lines: anchors.map(({ step, includes }) => {
      const index = sourceLines.findIndex((line) => line.includes(includes))
      if (index < 0) throw new Error(`Runtime source anchor not found: ${includes}`)
      return { number: index + 1, step, code: sourceLines[index].trim() }
    }),
  }
}

export const RUNTIME_MODULES: RuntimeModule[] = [
  mapSource('frame-loop', 'src/lib/vision.ts', visionSource, [
    { step: 'camera.read', includes: "this.emit('camera.read', 'Camera frame'" },
    { step: 'face.detect', includes: 'const faceResult = this.face!.detectForVideo' },
    { step: 'hand.detect', includes: 'this.latestHands = this.hand!.detectForVideo' },
    { step: 'pose.detect', includes: 'this.latestPose = this.pose!.detectForVideo' },
    { step: 'signals.extract', includes: 'const signals = extractSignals' },
    { step: 'reaction.dispatch', includes: "this.emit('reaction.dispatch', 'Dispatch reaction'" },
  ]),
  mapSource('classifier', 'src/lib/gesture-engine.ts', gestureEngineSource, [
    { step: 'spin.update', includes: 'const spin = this.spinTracker.update' },
    { step: 'gesture.rank', includes: 'const winner = ranked.find' },
    { step: 'gesture.stabilize', includes: 'const stable = this.stabilizer.push' },
  ]),
]

export const STEP_MODULE = new Map<RuntimeStepId, RuntimeModule>()
for (const module of RUNTIME_MODULES) {
  for (const line of module.lines) STEP_MODULE.set(line.step, module)
}
