import { describe, expect, it } from 'vitest'
import { GestureStabilizer, analyzeHands, extractSignals } from '../lib/gesture-engine'
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

function rockHand(): LandmarkPoint[] {
  const hand = Array.from({ length: 21 }, () => point(0.5, 0.5))
  hand[0] = point(0.5, 0.85)
  ;[[5, 6, 8, 0.38], [17, 18, 20, 0.62]].forEach(([mcp, pip, tip, x]) => {
    hand[mcp] = point(x, 0.65)
    hand[pip] = point(x, 0.48)
    hand[tip] = point(x, 0.22)
  })
  return hand
}

function pointHand(withThumb = false): LandmarkPoint[] {
  const hand = Array.from({ length: 21 }, () => point(0.5, 0.5))
  hand[0] = point(0.5, 0.85)
  hand[5] = point(0.38, 0.65)
  hand[6] = point(0.38, 0.48)
  hand[8] = point(0.38, 0.22)
  if (withThumb) {
    hand[2] = point(0.43, 0.68)
    hand[3] = point(0.35, 0.6)
    hand[4] = point(0.25, 0.5)
  }
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
  it('does not classify all five fingers extended as a gesture (open palm removed)', () => {
    const result = analyzeHands([openHand()], ['Right'])

    expect(result.observations[0].gesture).toBe('unclassified')
    expect(Object.values(result.observations[0].fingers).every(Boolean)).toBe(true)
  })

  it('detects the rock sign with index and pinky extended', () => {
    const result = analyzeHands([rockHand()], ['Right'])

    expect(result.observations[0].gesture).toBe('rock')
    expect(result.scores.rock).toBeGreaterThan(0.9)
  })

  it('detects point with only the index finger extended', () => {
    const result = analyzeHands([pointHand(false)], ['Right'])

    expect(result.observations[0].gesture).toBe('point')
    expect(result.observations[0].fingers.thumb).toBe(false)
    expect(result.scores.point).toBeGreaterThan(0.9)
  })

  it('still detects point when the thumb is also extended', () => {
    const result = analyzeHands([pointHand(true)], ['Right'])

    expect(result.observations[0].gesture).toBe('point')
    expect(result.observations[0].fingers.thumb).toBe(true)
    expect(result.scores.point).toBeGreaterThan(0.8)
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
