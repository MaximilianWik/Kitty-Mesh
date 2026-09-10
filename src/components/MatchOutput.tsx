import { PoseFigure } from './PoseFigure'
import { REACTIONS } from '../lib/reactions'
import type { GestureId } from '../lib/types'

interface MatchOutputProps {
  active: GestureId
  lastMatch: Exclude<GestureId, 'idle'> | null
  confidence: number
  onSelectCamera: () => void
}

export function MatchOutput({ active, lastMatch, confidence, onSelectCamera }: MatchOutputProps) {
  const displayed = active === 'idle' ? lastMatch : active
  const match = displayed ? REACTIONS.find((reaction) => reaction.id === displayed) : null

  return (
    <section className="output-view" aria-labelledby="output-title">
      <header className="pane-titlebar">
        <span id="output-title">match-output.txt</span>
        <span>{active === 'idle' ? 'WAITING' : 'LIVE'}</span>
      </header>

      <div className="output-view__main">
        {match ? (
          <>
            <div className="output-view__figure">
              <PoseFigure gesture={match.id} label={match.label} />
            </div>
            <div className="output-view__readout" role="status" aria-live="polite">
              <span>MATCH</span>
              <h1>{match.label}</h1>
              <p>{match.prompt}</p>
              <dl>
                <div><dt>state</dt><dd>{match.id}</dd></div>
                <div><dt>confidence</dt><dd>{Math.round(confidence * 100)}%</dd></div>
                <div><dt>source</dt><dd>{active === 'idle' ? 'last match' : 'live'}</dd></div>
              </dl>
            </div>
          </>
        ) : (
          <div className="output-empty">
            <pre aria-hidden="true">{`+------------------+\n|  NO MATCH YET    |\n+------------------+`}</pre>
            <h1>No pose matched</h1>
            <p>Start the camera and perform one of the six poses.</p>
            <button type="button" onClick={onSelectCamera}>Open camera</button>
          </div>
        )}
      </div>

      <div className="reference-strip" aria-label="Pose references">
        {REACTIONS.map((reaction) => (
          <div className={displayed === reaction.id ? 'is-current' : ''} key={reaction.id}>
            <PoseFigure gesture={reaction.id} label={reaction.label} />
            <span>{reaction.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
