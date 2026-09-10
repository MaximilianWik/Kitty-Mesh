import { useCallback, useEffect, useRef, useState } from 'react'
import { GestureRail } from './components/GestureRail'
import { LandmarkLayer } from './components/LandmarkLayer'
import { ReactionOverlay } from './components/ReactionOverlay'
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

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runtimeRef = useRef<VisionRuntime | null>(null)
  const startingRef = useRef(false)
  const previousGesture = useRef<GestureId>('idle')
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('Camera is off. Nothing leaves this device.')
  const [snapshot, setSnapshot] = useState<VisionSnapshot>(INITIAL_SNAPSHOT)
  const [landmarks, setLandmarks] = useState<FrameLandmarks>(EMPTY_LANDMARKS)
  const [events, setEvents] = useState<RuntimeEvent[]>([])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [showMesh, setShowMesh] = useState(true)
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })

  const handleSnapshot = useCallback((next: VisionSnapshot, points: FrameLandmarks) => {
    setSnapshot(next)
    setLandmarks(points)
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
      setStatusMessage('This browser does not support camera access.')
      return
    }

    startingRef.current = true
    setStatus('loading')
    setStatusMessage('Loading face and pose models…')

    try {
      await runtimeRef.current!.load()
      setStatus('requesting')
      setStatusMessage('Waiting for camera permission…')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
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
      setStatusMessage('Tracking locally. Your camera frames are never uploaded.')
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
    setStatusMessage('Camera is off. Nothing leaves this device.')
  }

  const toggleAudio = async () => {
    if (!audioEnabled) await unlockAudio()
    setAudioEnabled((enabled) => !enabled)
  }

  const activeReaction = snapshot.gesture === 'idle' ? null : REACTION_BY_ID[snapshot.gesture]
  const isWorking = status === 'loading' || status === 'requesting'

  return (
    <main className={`app app--${status}`}>
      <div className="circuit-field" aria-hidden="true" />

      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Face Mesh home">
          <span className="wordmark__mark">FM</span>
          <span>FACE MESH <b>/ LIVE</b></span>
        </a>
        <div className="topbar__status">
          <span className={`status-dot status-dot--${status}`} />
          {statusMessage}
        </div>
        <div className="topbar__controls">
          <button className="control-button" type="button" onClick={() => setShowMesh((shown) => !shown)} aria-pressed={showMesh}>
            Mesh {showMesh ? 'on' : 'off'}
          </button>
          <button className="control-button" type="button" onClick={toggleAudio} aria-pressed={audioEnabled}>
            Sound {audioEnabled ? 'on' : 'off'}
          </button>
        </div>
      </header>

      <div className="workbench" id="top">
        <RuntimePanel snapshot={snapshot} events={events} />

        <section className="camera-column" aria-labelledby="camera-title">
          <header className="camera-heading">
            <div>
              <span className="section-label">ON-DEVICE VISION</span>
              <h1 id="camera-title">Make a signal.<br />Watch the code react.</h1>
            </div>
            <div className="privacy-chip">
              <span>LOCAL ONLY</span>
              No frames sent
            </div>
          </header>

          <div className="camera-shell">
            <div className="camera-shell__screw camera-shell__screw--tl" />
            <div className="camera-shell__screw camera-shell__screw--tr" />
            <div className="camera-shell__screw camera-shell__screw--bl" />
            <div className="camera-shell__screw camera-shell__screw--br" />
            <div className="camera-viewport">
              <video
                ref={videoRef}
                className="camera-video"
                playsInline
                muted
                onLoadedMetadata={(event) => setVideoSize({
                  width: event.currentTarget.videoWidth,
                  height: event.currentTarget.videoHeight,
                })}
              />
              {showMesh && <LandmarkLayer landmarks={landmarks} {...videoSize} />}
              <ReactionOverlay gesture={snapshot.gesture} />

              {status !== 'running' && (
                <div className="camera-gate">
                  <div className="camera-gate__aperture" aria-hidden="true"><i /></div>
                  <h2>{status === 'error' ? 'Camera unavailable' : 'Open the sensor'}</h2>
                  <p>{statusMessage}</p>
                  <button className="primary-button" type="button" onClick={startCamera} disabled={isWorking}>
                    {isWorking ? 'Starting vision…' : status === 'error' ? 'Retry camera' : 'Start camera'}
                  </button>
                  <small>Browser permission required. Processing stays on this device.</small>
                </div>
              )}

              {status === 'running' && (
                <div className="camera-hud">
                  <div className="camera-hud__mode">
                    <span>ACTIVE STATE</span>
                    <strong>{activeReaction?.label ?? 'Scanning'}</strong>
                  </div>
                  <div className="camera-hud__tracking">
                    <span className={snapshot.faceTracked ? 'is-on' : ''}>FACE</span>
                    <span className={snapshot.poseTracked ? 'is-on' : ''}>POSE</span>
                    <output>{Math.round(snapshot.confidence * 100)}%</output>
                  </div>
                </div>
              )}
            </div>

            <footer className="camera-footer">
              <div><span>INPUT</span><strong>{videoSize.width ? `${videoSize.width}×${videoSize.height}` : 'awaiting feed'}</strong></div>
              <div><span>MODE</span><strong>face + pose</strong></div>
              {status === 'running' && <button type="button" onClick={stopCamera}>Stop camera</button>}
            </footer>
          </div>
        </section>

        <GestureRail
          active={snapshot.gesture}
          candidate={snapshot.candidate}
          scores={snapshot.scores}
          spinStage={snapshot.spinStage}
          spinProgress={snapshot.spinProgress}
        />
      </div>

      <footer className="page-footer">
        <p><strong>Your image never leaves the browser.</strong> MediaPipe runs locally after model download.</p>
        <p>Tongue detection is an approximation. The 360 state follows a staged turn sequence with your shoulders in frame.</p>
      </footer>
    </main>
  )
}

export default App
