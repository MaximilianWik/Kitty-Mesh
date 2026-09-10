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
    <section className="gesture-rail" aria-labelledby="gesture-title">
      <div className="gesture-rail__heading">
        <div>
          <span className="section-label">SIGNAL MAP</span>
          <h2 id="gesture-title">Try a state</h2>
        </div>
        <span>{candidate === 'idle' ? 'searching' : `candidate: ${candidate}`}</span>
      </div>

      <div className="gesture-list">
        {REACTIONS.map((reaction) => {
          const score = scores[reaction.id]
          const selected = active === reaction.id
          return (
            <article className={`gesture-row${selected ? ' is-selected' : ''}`} key={reaction.id}>
              <span className="gesture-row__symbol" aria-hidden="true">{reaction.symbol}</span>
              <div className="gesture-row__copy">
                <strong>{reaction.label}</strong>
                <span>{reaction.prompt}</span>
              </div>
              <div className="gesture-row__meter" aria-label={`${reaction.label} ${Math.round(score * 100)} percent`}>
                <i style={{ '--score-number': Math.round(score * 100) } as React.CSSProperties} />
              </div>
              <output>{Math.round(score * 100)}</output>
            </article>
          )
        })}
      </div>

      <div className="spin-sequence">
        <div>
          <span>360 sequence</span>
          <strong>{spinStage.replaceAll('-', ' ')}</strong>
        </div>
        <div className="spin-track" aria-label={`360 turn ${Math.round(spinProgress * 100)} percent complete`}>
          <i style={{ '--progress-number': spinProgress * 100 } as React.CSSProperties} />
        </div>
        <small>Front → first side → back/hidden → opposite side → front</small>
      </div>
    </section>
  )
}
