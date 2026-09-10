import { useCallback, useEffect, useRef, useState } from 'react'
import { DesktopWindow } from './components/DesktopWindow'
import { GestureRail } from './components/GestureRail'
import { LandmarkLayer } from './components/LandmarkLayer'
import { MatchOutput } from './components/MatchOutput'
import { RuntimePanel } from './components/RuntimePanel'
import { playReactionTone, unlockAudio } from './lib/audio'
import { loadReactionMedia, mediaUrl, type ReactionMediaMap } from './lib/reaction-media'
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

const EMPTY_LANDMARKS: FrameLandmarks = { face: [], pose: [], hands: [] }
type WindowId = 'camera' | 'output'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runtimeRef = useRef<VisionRuntime | null>(null)
  const startingRef = useRef(false)
  const previousGesture = useRef<GestureId>('idle')
  const [activeWindow, setActiveWindow] = useState<WindowId>('camera')
  const [floating, setFloating] = useState<Record<WindowId, boolean>>({ camera: false, output: false })
  const [zOrder, setZOrder] = useState<Record<WindowId, number>>({ camera: 20, output: 21 })
  const [lastMatch, setLastMatch] = useState<Exclude<GestureId, 'idle'> | null>(null)
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('Camera stopped')
  const [snapshot, setSnapshot] = useState<VisionSnapshot>(INITIAL_SNAPSHOT)
  const [landmarks, setLandmarks] = useState<FrameLandmarks>(EMPTY_LANDMARKS)
  const [events, setEvents] = useState<RuntimeEvent[]>([])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [reactionMedia, setReactionMedia] = useState<ReactionMediaMap | null>(null)
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
    void loadReactionMedia().then(setReactionMedia)
  }, [])

  useEffect(() => {
    if (!audioEnabled || snapshot.gesture === 'idle' || snapshot.gesture === previousGesture.current) {
      previousGesture.current = snapshot.gesture
      return
    }
    const reaction = REACTION_BY_ID[snapshot.gesture]
    const audioUrl = mediaUrl(reactionMedia?.[snapshot.gesture]?.audio ?? null)
    if (audioUrl) {
      const player = new Audio(audioUrl)
      void player.play().catch(() => undefined)
    } else {
      playReactionTone(reaction.tone)
    }
    previousGesture.current = snapshot.gesture
  }, [audioEnabled, reactionMedia, snapshot.gesture])

  const startCamera = async () => {
    if (startingRef.current || status === 'running') return
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setStatusMessage('Camera API unavailable')
      return
    }

    startingRef.current = true
    setStatus('loading')
    setStatusMessage('Loading face, pose, and hand models')

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

  const raiseWindow = (id: WindowId) => {
    setActiveWindow(id)
    setZOrder((current) => ({ ...current, [id]: Math.max(...Object.values(current)) + 1 }))
  }

  const selectWindow = (id: WindowId) => {
    setActiveWindow(id)
    if (floating[id]) raiseWindow(id)
  }

  const toggleFloating = (id: WindowId) => {
    setFloating((current) => ({ ...current, [id]: !current[id] }))
    raiseWindow(id)
  }

  const isWorking = status === 'loading' || status === 'requesting'
  const activeLabel = snapshot.gesture === 'idle' ? 'none' : REACTION_BY_ID[snapshot.gesture].label

  const cameraContent = (
    <div className="camera-workspace">
      <section className="camera-pane" aria-labelledby="camera-pane-title">
        <header className="pane-titlebar">
          <span id="camera-pane-title">camera feed</span>
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
          {showMesh && <LandmarkLayer landmarks={landmarks} hands={snapshot.hands} {...videoSize} />}
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
              <span>hands: {snapshot.hands.length}</span>
              <span>confidence: {Math.round(snapshot.confidence * 100)}%</span>
            </div>
          )}
        </div>
        <div className="camera-toolbar">
          <span>{statusMessage}</span>
          {status === 'running' && <button type="button" onClick={stopCamera}>Stop camera</button>}
          <button type="button" onClick={() => selectWindow('output')}>Open match output</button>
        </div>
      </section>
      <RuntimePanel snapshot={snapshot} events={events} />
      <GestureRail
        active={snapshot.gesture}
        candidate={snapshot.candidate}
        scores={snapshot.scores}
        spinStage={snapshot.spinStage}
        spinProgress={snapshot.spinProgress}
        hands={snapshot.hands}
      />
    </div>
  )

  return (
    <main className="ide-app">
      <header className="os-titlebar"><span>Kitty Mesh 0.3</span><span>[ browser process ]</span></header>
      <nav className="menu-bar" aria-label="Application menu">
        <span>File</span><span>View</span><span>Camera</span><span>Help</span>
        <div className="menu-bar__actions">
          <button type="button" onClick={() => setShowMesh((value) => !value)} aria-pressed={showMesh}>Mesh: {showMesh ? 'on' : 'off'}</button>
          <button type="button" onClick={toggleAudio} aria-pressed={audioEnabled}>Sound: {audioEnabled ? 'on' : 'off'}</button>
        </div>
      </nav>

      <div className="tab-bar" role="tablist" aria-label="Views">
        <button type="button" role="tab" aria-selected={activeWindow === 'camera'} onClick={() => selectWindow('camera')}>camera.ts{floating.camera ? ' [float]' : ''}</button>
        <button type="button" role="tab" aria-selected={activeWindow === 'output'} onClick={() => selectWindow('output')}>match-output.txt{floating.output ? ' [float]' : ''}</button>
      </div>

      <div className="ide-workspace">
        <aside className="explorer" aria-label="Project files">
          <header>EXPLORER</header>
          <div>KITTY-MESH</div>
          <button type="button" className={activeWindow === 'camera' ? 'is-active' : ''} onClick={() => selectWindow('camera')}>├─ camera.ts</button>
          <button type="button" className={activeWindow === 'output' ? 'is-active' : ''} onClick={() => selectWindow('output')}>├─ match-output.txt</button>
          <span>├─ hand-landmarks</span><span>├─ gesture-engine.ts</span><span>└─ vision.ts</span>
          <footer>camera frames stay local</footer>
        </aside>

        <div className="desktop">
          <p className="desktop__hint">Use ↗ to float a window. Drag its title bar to move it. Click a window to bring it forward.</p>
          <DesktopWindow
            id="camera-window"
            title="camera.ts"
            floating={floating.camera}
            visible={floating.camera || activeWindow === 'camera'}
            zIndex={zOrder.camera}
            initialPosition={{ x: 205, y: 110, width: 780, height: 650 }}
            onActivate={() => raiseWindow('camera')}
            onToggleFloating={() => toggleFloating('camera')}
          >
            {cameraContent}
          </DesktopWindow>
          <DesktopWindow
            id="output-window"
            title="match-output.txt"
            floating={floating.output}
            visible={floating.output || activeWindow === 'output'}
            zIndex={zOrder.output}
            initialPosition={{ x: 470, y: 155, width: 670, height: 570 }}
            onActivate={() => raiseWindow('output')}
            onToggleFloating={() => toggleFloating('output')}
          >
            <MatchOutput active={snapshot.gesture} lastMatch={lastMatch} confidence={snapshot.confidence} media={reactionMedia} onSelectCamera={() => selectWindow('camera')} />
          </DesktopWindow>
        </div>
      </div>

      <footer className="status-bar">
        <span>{status.toUpperCase()}</span><span>match: {activeLabel}</span><span>fps: {snapshot.fps.toFixed(0)}</span>
        <span>hands: {snapshot.hands.length}</span><span>latency: {snapshot.latencyMs.toFixed(0)}ms</span><span>MediaPipe / local</span>
      </footer>
    </main>
  )
}

export default App
