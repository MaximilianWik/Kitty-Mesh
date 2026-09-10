import { useCallback, useEffect, useRef, useState } from 'react'
import { GestureRail } from './components/GestureRail'
import { LandmarkLayer } from './components/LandmarkLayer'
import { MatchOutput } from './components/MatchOutput'
import { RuntimePanel } from './components/RuntimePanel'
import { playReactionTone, unlockAudio } from './lib/audio'
import { REACTION_BY_ID } from './lib/reactions'
import type {
  FrameLandmarks,
  GestureId,
  RuntimeEvent,
  TrackingStatus,
  VisionSnapshot,
} from './lib/types'
import { INITIAL_SNAPSHOT } from './lib/types'
import { describeCameraError, stopMediaStream, VisionRuntime } from './lib/vision'

const EMPTY_LANDMARKS: FrameLandmarks = { face: [], pose: [] }
type AppView = 'camera' | 'output'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runtimeRef = useRef<VisionRuntime | null>(null)
  const startingRef = useRef(false)
  const previousGesture = useRef<GestureId>('idle')
  const [view, setView] = useState<AppView>('camera')
  const [lastMatch, setLastMatch] = useState<Exclude<GestureId, 'idle'> | null>(null)
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('Camera stopped')
  const [snapshot, setSnapshot] = useState<VisionSnapshot>(INITIAL_SNAPSHOT)
  const [landmarks, setLandmarks] = useState<FrameLandmarks>(EMPTY_LANDMARKS)
  const [events, setEvents] = useState<RuntimeEvent[]>([])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [showMesh, setShowMesh] = useState(true)
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })

  const handleSnapshot = useCallback((next: VisionSnapshot, points: FrameLandmarks) => {
    setSnapshot(next)
    setLandmarks(points)
    if (next.gesture !== 'idle') setLastMatch(next.gesture)
  }, [])

  const handleEvent = useCallback((event: RuntimeEvent) => {
    setEvents((current) => [...current.slice(-15), event])
  }, [])

  useEffect(() => {
    const runtime = new VisionRuntime(handleSnapshot, handleEvent)
    runtimeRef.current = runtime
    return () => {
      runtime.close()
      stopMediaStream(streamRef.current)
    }
  }, [handleEvent, handleSnapshot])

  useEffect(() => {
    if (!audioEnabled || snapshot.gesture === 'idle' || snapshot.gesture === previousGesture.current) {
      previousGesture.current = snapshot.gesture
      return
    }
    playReactionTone(REACTION_BY_ID[snapshot.gesture].tone)
    previousGesture.current = snapshot.gesture
  }, [audioEnabled, snapshot.gesture])

  const startCamera = async () => {
    if (startingRef.current || status === 'running') return
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setStatusMessage('Camera API unavailable')
      return
    }

    startingRef.current = true
    setStatus('loading')
    setStatusMessage('Loading models')

    try {
      await runtimeRef.current!.load()
      setStatus('requesting')
      setStatusMessage('Waiting for camera permission')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
        await new Promise<void>((resolve) => {
          video.addEventListener('loadedmetadata', () => resolve(), { once: true })
        })
      }
      await video.play()
      setVideoSize({ width: video.videoWidth, height: video.videoHeight })
      runtimeRef.current!.start(video)
      setStatus('running')
      setStatusMessage('Tracking')
    } catch (error) {
      stopMediaStream(streamRef.current)
      streamRef.current = null
      setStatus('error')
      setStatusMessage(describeCameraError(error))
    } finally {
      startingRef.current = false
    }
  }

  const stopCamera = () => {
    runtimeRef.current?.stop()
    stopMediaStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
    setSnapshot(INITIAL_SNAPSHOT)
    setLandmarks(EMPTY_LANDMARKS)
    setEvents([])
    setStatusMessage('Camera stopped')
  }

  const toggleAudio = async () => {
    if (!audioEnabled) await unlockAudio()
    setAudioEnabled((enabled) => !enabled)
  }

  const isWorking = status === 'loading' || status === 'requesting'
  const activeLabel = snapshot.gesture === 'idle' ? 'none' : REACTION_BY_ID[snapshot.gesture].label

  return (
    <main className="ide-app">
      <header className="os-titlebar">
        <span>Kitty Mesh 0.2</span>
        <span>[ browser process ]</span>
      </header>

      <nav className="menu-bar" aria-label="Application menu">
        <span>File</span><span>View</span><span>Camera</span><span>Help</span>
        <div className="menu-bar__actions">
          <button type="button" onClick={() => setShowMesh((value) => !value)} aria-pressed={showMesh}>Mesh: {showMesh ? 'on' : 'off'}</button>
          <button type="button" onClick={toggleAudio} aria-pressed={audioEnabled}>Sound: {audioEnabled ? 'on' : 'off'}</button>
        </div>
      </nav>

      <div className="tab-bar" role="tablist" aria-label="Views">
        <button type="button" id="camera-tab" role="tab" aria-selected={view === 'camera'} aria-controls="camera-panel" onClick={() => setView('camera')}>camera.ts</button>
        <button type="button" id="output-tab" role="tab" aria-selected={view === 'output'} aria-controls="output-panel" onClick={() => setView('output')}>match-output.txt{lastMatch ? ' *' : ''}</button>
      </div>

      <div className="ide-workspace">
        <aside className="explorer" aria-label="Project files">
          <header>EXPLORER</header>
          <div>FACE-MESH</div>
          <button type="button" className={view === 'camera' ? 'is-active' : ''} onClick={() => setView('camera')}>├─ camera.ts</button>
          <button type="button" className={view === 'output' ? 'is-active' : ''} onClick={() => setView('output')}>├─ match-output.txt</button>
          <span>├─ gesture-engine.ts</span>
          <span>└─ vision.ts</span>
          <footer>camera frames stay local</footer>
        </aside>

        <div className="editor-area">
          <div id="camera-panel" role="tabpanel" aria-labelledby="camera-tab" className={view === 'camera' ? 'view-pane' : 'view-pane view-pane--hidden'} aria-hidden={view !== 'camera'}>
            <section className="camera-pane" aria-labelledby="camera-pane-title">
              <header className="pane-titlebar">
                <span id="camera-pane-title">camera.ts</span>
                <span>{videoSize.width ? `${videoSize.width}x${videoSize.height}` : 'no input'}</span>
              </header>
              <div className="camera-viewport">
                <video
                  ref={videoRef}
                  className="camera-video"
                  playsInline
                  muted
                  onLoadedMetadata={(event) => setVideoSize({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight })}
                />
                {showMesh && <LandmarkLayer landmarks={landmarks} {...videoSize} />}
                {status !== 'running' && (
                  <div className="camera-dialog">
                    <pre aria-hidden="true">{`CAMERA DEVICE\n-------------\nstatus: ${status}`}</pre>
                    <p>{statusMessage}</p>
                    <button type="button" onClick={startCamera} disabled={isWorking}>
                      {isWorking ? 'Starting...' : status === 'error' ? 'Retry camera' : 'Start camera'}
                    </button>
                  </div>
                )}
                {status === 'running' && (
                  <div className="camera-readout">
                    <span>match: {activeLabel}</span>
                    <span>face: {snapshot.faceTracked ? 'yes' : 'no'}</span>
                    <span>pose: {snapshot.poseTracked ? 'yes' : 'no'}</span>
                    <span>confidence: {Math.round(snapshot.confidence * 100)}%</span>
                  </div>
                )}
              </div>
              <div className="camera-toolbar">
                <span>{statusMessage}</span>
                {status === 'running' && <button type="button" onClick={stopCamera}>Stop camera</button>}
                <button type="button" onClick={() => setView('output')}>Open match output</button>
              </div>
            </section>

            <RuntimePanel snapshot={snapshot} events={events} />
            <GestureRail active={snapshot.gesture} candidate={snapshot.candidate} scores={snapshot.scores} spinStage={snapshot.spinStage} spinProgress={snapshot.spinProgress} />
          </div>

          <div id="output-panel" role="tabpanel" aria-labelledby="output-tab" className={view === 'output' ? 'view-pane' : 'view-pane view-pane--hidden'} aria-hidden={view !== 'output'}>
            <MatchOutput active={snapshot.gesture} lastMatch={lastMatch} confidence={snapshot.confidence} onSelectCamera={() => setView('camera')} />
          </div>
        </div>
      </div>

      <footer className="status-bar">
        <span>{status.toUpperCase()}</span>
        <span>match: {activeLabel}</span>
        <span>fps: {snapshot.fps.toFixed(0)}</span>
        <span>latency: {snapshot.latencyMs.toFixed(0)}ms</span>
        <span>MediaPipe / local</span>
      </footer>
    </main>
  )
}

export default App
