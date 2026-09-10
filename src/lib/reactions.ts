import type { GestureId } from './types'

export interface ReactionDefinition {
  id: Exclude<GestureId, 'idle'>
  label: string
  prompt: string
  symbol: string
  caption: string
  className: string
  tone: [number, number]
}

export const REACTIONS: ReactionDefinition[] = [
  {
    id: 'blank',
    label: 'Blank stare',
    prompt: 'Relax your face and look forward',
    symbol: '·_·',
    caption: 'NEUTRAL SIGNAL',
    className: 'reaction--blank',
    tone: [196, 246],
  },
  {
    id: 'profile',
    label: 'Side profile',
    prompt: 'Turn your head clearly to either side',
    symbol: '◖',
    caption: 'EDGE DETECTED',
    className: 'reaction--profile',
    tone: [220, 330],
  },
  {
    id: 'tongue',
    label: 'Tongue out',
    prompt: 'Open wide and stick your tongue out',
    symbol: ':P',
    caption: 'BLEP CONFIRMED',
    className: 'reaction--tongue',
    tone: [294, 392],
  },
  {
    id: 'spin',
    label: 'Full 360',
    prompt: 'Show both shoulders, then turn through each side',
    symbol: '↻',
    caption: 'ORBIT COMPLETE',
    className: 'reaction--spin',
    tone: [164, 440],
  },
  {
    id: 'angry',
    label: 'Angry face',
    prompt: 'Lower your brows and scrunch your nose',
    symbol: '>:(',
    caption: 'PRESSURE RISING',
    className: 'reaction--angry',
    tone: [110, 82],
  },
  {
    id: 'hands',
    label: 'Hands up',
    prompt: 'Step back and lift both wrists above your shoulders',
    symbol: '\\o/',
    caption: 'SIGNAL RECEIVED',
    className: 'reaction--hands',
    tone: [246, 493],
  },
]

export const REACTION_BY_ID = Object.fromEntries(
  REACTIONS.map((reaction) => [reaction.id, reaction]),
) as Record<Exclude<GestureId, 'idle'>, ReactionDefinition>
