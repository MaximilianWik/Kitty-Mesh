import { describe, expect, it } from 'vitest'
import { GestureStabilizer, SpinTracker, analyzeHands, extractSignals } from '../lib/gesture-engine'
import type { LandmarkPoint } from '../lib/types'

const point = (x: number, y: number, visibility = 1): LandmarkPoint => ({ x, y, z: 0, visibility })

function openHand(): LandmarkPoint[] {
  const hand = Array.from({ length: 21 }, () => point(0.5, 0.5))
  hand[0] = point(0.5, 0.85)
  hand[2] = point(0.43, 0.68)
  hand[3] = point(0.35, 0.6)
  hand[4] = point(0.25, 0.5)
  const fingers: Array<[number, number, number]> = [[5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20]]
  fingers.forEach(([mcp, pip, tip], index) => {
    const x = 0.38 + index * 0.08
    hand[mcp] = point(x, 0.65)
    hand[pip] = point(x, 0.48)
    hand[tip] = point(x, 0.22)
  })
  return hand
}

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

describe('analyzeHands', () => {
  it('detects all extended fingers as an open palm', () => {
    const result = analyzeHands([openHand()], ['Right'])

    expect(result.observations[0].gesture).toBe('open-palm')
    expect(Object.values(result.observations[0].fingers).every(Boolean)).toBe(true)
    expect(result.scores['open-palm']).toBeGreaterThan(0.9)
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

  it('accepts a sensitive tongue signal at 0.25 after the short hold', () => {
    const stabilizer = new GestureStabilizer()

    stabilizer.push('tongue', 0.25, 1000)
    expect(stabilizer.push('tongue', 0.25, 1140).gesture).toBe('tongue')
  })
})
