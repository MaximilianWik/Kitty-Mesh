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
    <section className="runtime-pane" aria-labelledby="runtime-title">
      <header className="pane-titlebar">
        <span id="runtime-title">{activeModule.path}</span>
        <span>{snapshot.fps.toFixed(0)} fps</span>
      </header>
      <div className="source-window" aria-label="Current source path">
        {activeModule.lines.map((line) => (
          <div className={line.step === displayedStep ? 'is-active' : ''} key={line.number}>
            <span>{line.number}</span>
            <code>{line.code}</code>
            <i aria-hidden="true">{line.step === displayedStep ? '>' : ''}</i>
          </div>
        ))}
      </div>
      <div className="runtime-footer">
        <span>frame {snapshot.counters.frames}</span>
        <span>face {snapshot.counters.faceCalls}</span>
        <span>pose {snapshot.counters.poseCalls}</span>
        <span>state {snapshot.counters.transitions}</span>
        <span>{snapshot.latencyMs.toFixed(0)} ms</span>
      </div>
      <div className="event-log" aria-label="Recent events">
        {events.slice(-4).reverse().map((event) => (
          <div key={event.id}>
            <span>{String(event.id).padStart(4, '0')}</span>
            <span>{event.label}</span>
            <output>{event.value}</output>
          </div>
        ))}
      </div>
    </section>
  )
}
