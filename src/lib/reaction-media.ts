import type { GestureId } from './types'

export interface ReactionMedia {
  image: string | null
  audio: string | null
}

export type ReactionMediaMap = Record<Exclude<GestureId, 'idle'>, ReactionMedia>

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a']
let cachedManifest: ReactionMediaMap | null = null

function defaultMedia(): ReactionMediaMap {
  const ids: Exclude<GestureId, 'idle'>[] = [
    'blank', 'profile', 'tongue', 'happy', 'kiss', 'angry', 'hands',
    'open-palm', 'fist', 'point', 'peace', 'thumbs-up',
  ]
  return Object.fromEntries(ids.map((id) => [id, { image: null, audio: null }])) as ReactionMediaMap
}

async function firstAvailable(baseName: string, extensions: string[]) {
  for (const extension of extensions) {
    const path = `/reactions/${baseName}.${extension}`
    try {
      const response = await fetch(path, { method: 'HEAD' })
      if (response.ok) return `${baseName}.${extension}`
    } catch {
      return null
    }
  }
  return null
}

export async function loadReactionMedia() {
  if (cachedManifest) return cachedManifest
  const media = defaultMedia()

  try {
    const response = await fetch('/reactions/manifest.json')
    if (response.ok) Object.assign(media, await response.json() as Partial<ReactionMediaMap>)
  } catch {
    // No manifest is fine. The kitten checks conventional filenames below.
  }

  await Promise.all(Object.entries(media).map(async ([id, entry]) => {
    entry.image ??= await firstAvailable(id, IMAGE_EXTENSIONS)
    entry.audio ??= await firstAvailable(id, AUDIO_EXTENSIONS)
  }))

  cachedManifest = media
  return media
}

export function mediaUrl(filename: string | null) {
  return filename ? `/reactions/${filename}` : null
}
