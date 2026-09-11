import { REACTIONS, REACTION_BY_ID } from '../lib/reactions'
import { mediaUrl, type ReactionMediaMap } from '../lib/reaction-media'
import type { GestureId, GestureScores, HandObservation, SpinStage } from '../lib/types'

interface ReactionPaneProps {
  gesture: GestureId
  confidence: number
  media: ReactionMediaMap | null
  candidate: GestureId
  scores: GestureScores
  spinStage: SpinStage
  spinProgress: number
  hands: HandObservation[]
  onClose: () => void
}

function SegmentedBar({ value }: { value: number }) {
  const blocks = 10
  const filled = Math.round(value * blocks)
  return (
    <span className="segmented-bar" aria-label={`${Math.round(value * 100)} percent`}>
      {Array.from({ length: blocks }, (_, index) => <i className={index < filled ? 'is-filled' : ''} key={index} />)}
    </span>
  )
}

export function ReactionPane({ gesture, confidence, media, candidate, scores, spinStage, spinProgress, hands, onClose }: ReactionPaneProps) {
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
      <section className="signals-pane" aria-labelledby="signals-title">
        <header className="pane-titlebar"><span id="signals-title">signals.watch</span><span>candidate: {candidate}</span></header>
        <div className="signal-table">
          <div className="signal-table__head"><span>state</span><span>score</span><span>level</span></div>
          {REACTIONS.map((item) => {
            const score = scores[item.id]
            return <div className={gesture === item.id ? 'is-active' : ''} key={item.id}><span>{item.id}</span><output>{score.toFixed(2)}</output><SegmentedBar value={score} /></div>
          })}
        </div>
        <footer className="spin-status"><span>360: {spinStage}</span><SegmentedBar value={spinProgress} /><span>hands: {hands.length ? hands.map((hand) => `${hand.handedness} ${hand.gesture}`).join(' / ') : 'none'}</span></footer>
      </section>
    </section>
  )
}
