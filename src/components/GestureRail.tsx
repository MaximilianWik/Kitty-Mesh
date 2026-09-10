import { REACTIONS } from '../lib/reactions'
import type { GestureId, GestureScores, HandObservation, SpinStage } from '../lib/types'

interface GestureRailProps {
  active: GestureId
  candidate: GestureId
  scores: GestureScores
  spinStage: SpinStage
  spinProgress: number
  hands: HandObservation[]
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

export function GestureRail({ active, candidate, scores, spinStage, spinProgress, hands }: GestureRailProps) {
  return (
    <section className="signals-pane" aria-labelledby="signals-title">
      <header className="pane-titlebar"><span id="signals-title">signals.watch</span><span>candidate: {candidate}</span></header>
      <div className="signal-table">
        <div className="signal-table__head"><span>state</span><span>score</span><span>level</span></div>
        {REACTIONS.map((reaction) => {
          const score = scores[reaction.id]
          return <div className={active === reaction.id ? 'is-active' : ''} key={reaction.id}><span>{reaction.id}</span><output>{score.toFixed(2)}</output><SegmentedBar value={score} /></div>
        })}
      </div>
      <footer className="spin-status"><span>360: {spinStage}</span><SegmentedBar value={spinProgress} /><span>hands: {hands.length ? hands.map((hand) => `${hand.handedness} ${hand.gesture}`).join(' / ') : 'none'}</span></footer>
    </section>
  )
}
