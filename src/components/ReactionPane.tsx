import { REACTION_BY_ID } from '../lib/reactions'
import { mediaUrl, type ReactionMediaMap } from '../lib/reaction-media'
import type { GestureId } from '../lib/types'

interface ReactionPaneProps {
  gesture: GestureId
  confidence: number
  media: ReactionMediaMap | null
  onClose: () => void
}

export function ReactionPane({ gesture, confidence, media, onClose }: ReactionPaneProps) {
  const reaction = gesture === 'idle' ? null : REACTION_BY_ID[gesture]
  const imageUrl = mediaUrl(reaction ? media?.[reaction.id]?.image ?? null : null)
  const audioUrl = mediaUrl(reaction ? media?.[reaction.id]?.audio ?? null : null)

  return (
    <section className="reaction-pane" aria-label="Reaction preview">
      <header className="pane-titlebar"><span>reaction.ts</span><button type="button" onClick={onClose}>close</button></header>
      <div className="reaction-pane__body">
        {reaction ? (
          <>
            {imageUrl ? <img src={imageUrl} alt={`${reaction.label} reaction media`} /> : <pre aria-hidden="true">{`[ ${reaction.id.toUpperCase()} ]`}</pre>}
            <h1>{reaction.label}</h1>
            <p>{reaction.prompt}</p>
            <dl><div><dt>confidence</dt><dd>{Math.round(confidence * 100)}%</dd></div><div><dt>image</dt><dd>{imageUrl ?? 'waiting for media'}</dd></div><div><dt>sound</dt><dd>{audioUrl ?? 'built-in tone'}</dd></div></dl>
          </>
        ) : (
          <><pre aria-hidden="true">[ WAITING ]</pre><h1>No reaction yet</h1><p>Kitty Mesh will show the next detected state here.</p></>
        )}
      </div>
    </section>
  )
}
