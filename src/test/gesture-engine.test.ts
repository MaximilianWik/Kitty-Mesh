import { describe, expect, it } from 'vitest'
import { GestureStabilizer, SpinTracker, extractSignals } from '../lib/gesture-engine'
import type { LandmarkPoint } from '../lib/types'

const point = (x: number, y: number, visibility = 1): LandmarkPoint => ({ x, y, z: 0, visibility })

describe('extractSignals', () => {
  it('detects both wrists above the shoulders', () => {
    const pose: LandmarkPoint[] = Array.from({ length: 33 }, () => point(0.5, 0.5, 0))
    pose[11] = point(0.35, 0.48)
    pose[12] = point(0.65, 0.48)
    pose[15] = point(0.3, 0.2)
    pose[16] = point(0.7, 0.2)

    const signals = extractSignals(undefined, undefined, pose)

    expect(signals.poseTracked).toBe(true)
    expect(signals.scores.hands).toBeGreaterThan(0.9)
  })
})

describe('SpinTracker', () => {
  it('completes a staged side-away-opposite-front turn', () => {
    const tracker = new SpinTracker()

    expect(tracker.update(0.8, true, true, 0).stage).toBe('first-side')
    tracker.update(0, false, true, 100)
    expect(tracker.update(0, false, true, 350).stage).toBe('away')
    expect(tracker.update(-0.75, true, true, 600).stage).toBe('opposite-side')
    expect(tracker.update(0.1, true, true, 850).complete).toBe(true)
  })
})

describe('GestureStabilizer', () => {
  it('requires a candidate to persist before changing state', () => {
    const stabilizer = new GestureStabilizer()

    expect(stabilizer.push('hands', 0.9, 1000).gesture).toBe('idle')
    expect(stabilizer.push('hands', 0.9, 1400).gesture).toBe('hands')
  })
})
