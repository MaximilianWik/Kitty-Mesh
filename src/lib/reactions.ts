import type { GestureId } from './types'

export interface ReactionDefinition {
  id: Exclude<GestureId, 'idle'>
  label: string
  prompt: string
  mediaBaseName: string
  tone: [number, number]
}

export const REACTIONS: ReactionDefinition[] = [
  { id: 'blank', label: 'Blank stare', prompt: 'Face forward and relax your expression.', mediaBaseName: 'blank', tone: [196, 246] },
  { id: 'profile', label: 'Side profile', prompt: 'Turn your head clearly to either side.', mediaBaseName: 'profile', tone: [220, 330] },
  { id: 'tongue', label: 'Tongue out', prompt: 'Open your mouth and stick out your tongue.', mediaBaseName: 'tongue', tone: [294, 392] },
  { id: 'happy', label: 'Happy face', prompt: 'Smile with both sides of your mouth.', mediaBaseName: 'happy', tone: [330, 440] },
  { id: 'kiss', label: 'Kiss face', prompt: 'Pucker your lips toward the camera.', mediaBaseName: 'kiss', tone: [392, 523] },
  { id: 'angry', label: 'Angry face', prompt: 'Lower your brows and scrunch your nose.', mediaBaseName: 'angry', tone: [110, 82] },
  { id: 'hands', label: 'Hands up', prompt: 'Step back and raise both wrists above your shoulders.', mediaBaseName: 'hands', tone: [246, 493] },
  { id: 'open-palm', label: 'Open palm', prompt: 'Hold one open hand toward the camera.', mediaBaseName: 'open-palm', tone: [262, 392] },
  { id: 'fist', label: 'Closed fist', prompt: 'Close all five fingers into a fist.', mediaBaseName: 'fist', tone: [131, 196] },
  { id: 'point', label: 'Point', prompt: 'Extend only your index finger.', mediaBaseName: 'point', tone: [294, 440] },
  { id: 'peace', label: 'Peace sign', prompt: 'Extend your index and middle fingers.', mediaBaseName: 'peace', tone: [349, 523] },
  { id: 'rock', label: 'Rock sign', prompt: 'Extend your index and pinky, with middle and ring fingers folded.', mediaBaseName: 'rock', tone: [196, 294] },
  { id: 'thumbs-up', label: 'Thumbs up', prompt: 'Raise your thumb and fold the other fingers.', mediaBaseName: 'thumbs-up', tone: [392, 587] },
]

export const REACTION_BY_ID = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.id, reaction]),
) as Record<Exclude<GestureId, 'idle'>, ReactionDefinition>
