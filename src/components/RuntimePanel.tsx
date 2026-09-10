import { useEffect, useRef, useState } from 'react'
import { RUNTIME_MODULES, STEP_MODULE } from '../lib/runtime-source'
import type { RuntimeEvent, RuntimeStepId, VisionSnapshot } from '../lib/types'

interface RuntimePanelProps {
  snapshot: VisionSnapshot
  events: RuntimeEvent[]
}

export function RuntimePanel({ snapshot, events }: RuntimePanelProps) {
  const eventQueue = useRef<RuntimeStepId[]>([])
  const lastQueuedId = useRef(0)
  const [displayedStep, setDisplayedStep] = useState<RuntimeStepId>('camera.read')

  useEffect(() => {
    const unseen = events.filter((event) => event.id > lastQueuedId.current)
    if (!unseen.length) return
    lastQueuedId.current = unseen.at(-1)!.id
    eventQueue.current = [...eventQueue.current, ...unseen.map((event) => event.step)].slice(-18)
  }, [events])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = eventQueue.current.shift()
      if (next) setDisplayedStep(next)
    }, 110)
    return () => window.clearInterval(timer)
  }, [])

  const activeModule = STEP_MODULE.get(displayedStep) ?? RUNTIME_MODULES[0]

  return (
    <aside className="runtime" aria-label="Mapped runtime visualization">
      <header className="runtime__header">
        <div>
          <span className="runtime__live"><i /> MAPPED RUNTIME</span>
          <h2>{activeModule.path}</h2>
        </div>
        <span className="runtime__rate">{snapshot.fps.toFixed(0)} FPS</span>
      </header>

      <p className="runtime__disclosure">
        Source map of real app events, not a JavaScript interpreter or debugger.
      </p>

      <div className="source-window" aria-live="off">
        {activeModule.lines.map((line) => {
          const active = line.step === displayedStep
          return (
            <div className={`source-line${active ? ' is-active' : ''}`} key={line.number}>
              <span className="source-line__number">{line.number}</span>
              <code>{line.code}</code>
              {active && <span className="source-line__pulse" aria-label="Executing now" />}
            </div>
          )
        })}
      </div>

      <div className="runtime__metrics" aria-label="Runtime counters">
        <Metric label="frame" value={snapshot.counters.frames} />
        <Metric label="face" value={snapshot.counters.faceCalls} />
        <Metric label="pose" value={snapshot.counters.poseCalls} />
        <Metric label="state" value={snapshot.counters.transitions} />
        <Metric label="latency" value={`${snapshot.latencyMs.toFixed(0)}ms`} />
        <Metric label="candidate" value={snapshot.candidate} />
      </div>

      <div className="event-log" aria-label="Recent runtime events">
        {events.slice(-5).reverse().map((event) => (
          <div className="event-log__row" key={event.id}>
            <span>{String(event.id).padStart(4, '0')}</span>
            <b>{event.label}</b>
            <output>{event.value}</output>
          </div>
        ))}
      </div>
    </aside>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
