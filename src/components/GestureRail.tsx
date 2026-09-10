import { REACTIONS } from '../lib/reactions'
import type { GestureId, GestureScores, SpinStage } from '../lib/types'

interface GestureRailProps {
  active: GestureId
  candidate: GestureId
  scores: GestureScores
  spinStage: SpinStage
  spinProgress: number
}

export function GestureRail({ active, candidate, scores, spinStage, spinProgress }: GestureRailProps) {
  return (
    <section className="signals-pane" aria-labelledby="signals-title">
      <header className="pane-titlebar">
        <span id="signals-title">signals.watch</span>
        <span>candidate: {candidate}</span>
      </header>
      <div className="signal-table">
        <div className="signal-table__head"><span>state</span><span>score</span><span>level</span></div>
        {REACTIONS.map((reaction) => {
          const score = scores[reaction.id]
          return (
            <div className={active === reaction.id ? 'is-active' : ''} key={reaction.id}>
              <span>{reaction.id}</span>
              <output>{score.toFixed(2)}</output>
              <meter min="0" max="1" value={score}>{Math.round(score * 100)}%</meter>
            </div>
          )
        })}
      </div>
      <footer className="spin-status">
        <span>360: {spinStage}</span>
        <progress max="1" value={spinProgress}>{Math.round(spinProgress * 100)}%</progress>
      </footer>
    </section>
  )
}
