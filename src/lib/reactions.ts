import type { GestureId } from './types'

export interface ReactionDefinition {
  id: Exclude<GestureId, 'idle'>
  label: string
  prompt: string
  tone: [number, number]
}

export const REACTIONS: ReactionDefinition[] = [
  {
    id: 'blank',
    label: 'Blank stare',
    prompt: 'Face forward and relax your expression.',
    tone: [196, 246],
  },
  {
    id: 'profile',
    label: 'Side profile',
    prompt: 'Turn your head clearly to either side.',
    tone: [220, 330],
  },
  {
    id: 'tongue',
    label: 'Tongue out',
    prompt: 'Open your mouth and stick out your tongue.',
    tone: [294, 392],
  },
  {
    id: 'spin',
    label: 'Full 360',
    prompt: 'Keep your shoulders visible and turn through both sides.',
    tone: [164, 440],
  },
  {
    id: 'angry',
    label: 'Angry face',
    prompt: 'Lower your brows and scrunch your nose.',
    tone: [110, 82],
  },
  {
    id: 'hands',
    label: 'Hands up',
    prompt: 'Step back and raise both wrists above your shoulders.',
    tone: [246, 493],
  },
]

export const REACTION_BY_ID = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.id, reaction]),
) as Record<Exclude<GestureId, 'idle'>, ReactionDefinition>
