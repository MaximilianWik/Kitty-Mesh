import { REACTION_BY_ID } from '../lib/reactions'
import type { GestureId } from '../lib/types'

interface ReactionOverlayProps {
  gesture: GestureId
}

export function ReactionOverlay({ gesture }: ReactionOverlayProps) {
  if (gesture === 'idle') return null
  const reaction = REACTION_BY_ID[gesture]

  return (
    <div className={`reaction ${reaction.className}`} key={gesture} role="status">
      <div className="reaction__orbit" aria-hidden="true" />
      <span className="reaction__symbol" aria-hidden="true">{reaction.symbol}</span>
      <div>
        <strong>{reaction.caption}</strong>
        <span>{reaction.label}</span>
      </div>
    </div>
  )
}
