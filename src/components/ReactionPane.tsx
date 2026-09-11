import { REACTION_BY_ID } from '../lib/reactions'
import { mediaUrl, type ReactionMediaMap } from '../lib/reaction-media'
import type { GestureId } from '../lib/types'

interface ReactionPaneProps {
  gesture: GestureId
  media: ReactionMediaMap | null
  personDetected: boolean
}

export function ReactionPane({ gesture, media, personDetected }: ReactionPaneProps) {
  const reaction = gesture === 'idle' ? null : REACTION_BY_ID[gesture]
  const imageUrl = mediaUrl(reaction ? media?.[reaction.id]?.image ?? null : null)

  return (
    <section className="reaction-pane" aria-label="Reaction preview">
      <div className="reaction-media-slot">
        {imageUrl ? (
          <img src={imageUrl} alt="" />
        ) : !personDetected ? (
          <pre aria-hidden="true">[ NO PERSON DETECTED ]</pre>
        ) : null}
      </div>
    </section>
  )
}
