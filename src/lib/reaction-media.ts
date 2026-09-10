import type { GestureId } from './types'

export interface ReactionMedia {
  image: string | null
  audio: string | null
}

export type ReactionMediaMap = Record<Exclude<GestureId, 'idle'>, ReactionMedia>

let cachedManifest: ReactionMediaMap | null = null

export async function loadReactionMedia() {
  if (cachedManifest) return cachedManifest
  try {
    const response = await fetch('/reactions/manifest.json')
    if (!response.ok) return null
    cachedManifest = await response.json() as ReactionMediaMap
    return cachedManifest
  } catch {
    return null
  }
}

export function mediaUrl(filename: string | null) {
  return filename ? `/reactions/${filename}` : null
}
