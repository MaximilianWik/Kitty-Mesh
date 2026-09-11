import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { DesktopWindow } from './components/DesktopWindow'
import { GestureRail } from './components/GestureRail'
import { PanelResizeHandle } from './components/PanelResizeHandle'
import { HelpPane, SourceViewer } from './components/SourceViewer'
import { LandmarkLayer } from './components/LandmarkLayer'
import { ReactionPane } from './components/ReactionPane'
import { RuntimePanel } from './components/RuntimePanel'
import { playReactionAudio, playReactionTone, stopReactionAudio, unlockAudio } from './lib/audio'
import { loadReactionMedia, mediaUrl, type ReactionMediaMap } from './lib/reaction-media'
import { REACTION_BY_ID } from './lib/reactions'
import type { FrameLandmarks, GestureId, RuntimeEvent, TrackingStatus, VisionSnapshot } from './lib/types'
import { INITIAL_SNAPSHOT } from './lib/types'
import { describeCameraError, stopMediaStream, VisionRuntime } from './lib/vision'
import appSource from './App.tsx?raw'
import desktopWindowSource from './components/DesktopWindow.tsx?raw'
import gestureRailSource from './components/GestureRail.tsx?raw'
import landmarkLayerSource from './components/LandmarkLayer.tsx?raw'
import panelResizeHandleSource from './components/PanelResizeHandle.tsx?raw'
import reactionPaneSource from './components/ReactionPane.tsx?raw'
import runtimePanelSource from './components/RuntimePanel.tsx?raw'
import sourceViewerSource from './components/SourceViewer.tsx?raw'
import audioSource from './lib/audio.ts?raw'
import engineSource from './lib/gesture-engine.ts?raw'
import reactionMediaSource from './lib/reaction-media.ts?raw'
import reactionsSource from './lib/reactions.ts?raw'
import runtimeSource from './lib/runtime-source.ts?raw'
import typesSource from './lib/types.ts?raw'
import visionSource from './lib/vision.ts?raw'
import mainSource from './main.tsx?raw'
import gestureEngineTestSource from './test/gesture-engine.test.ts?raw'
import viteEnvSource from './vite-env.d.ts?raw'
import stylesSource from './styles.css?raw'
import readmeSource from '../README.md?raw'

type WindowId = 'camera' | 'signals' | 'help'
type MenuId = 'file' | 'view' | 'camera' | 'help' | null

interface SourceTab {
  id: string
  fileName: (typeof SOURCE_FILES)[number][0]
  floating: boolean
  zIndex: number
}

const EMPTY_LANDMARKS: FrameLandmarks = { face: [], pose: [], hands: [] }
const SOURCE_FILES = [
  ['App.tsx', appSource],
  ['components/DesktopWindow.tsx', desktopWindowSource],
  ['components/GestureRail.tsx', gestureRailSource],
  ['components/LandmarkLayer.tsx', landmarkLayerSource],
  ['components/PanelResizeHandle.tsx', panelResizeHandleSource],
  ['components/ReactionPane.tsx', reactionPaneSource],
  ['components/RuntimePanel.tsx', runtimePanelSource],
  ['components/SourceViewer.tsx', sourceViewerSource],
  ['lib/audio.ts', audioSource],
  ['lib/gesture-engine.ts', engineSource],
  ['lib/reaction-media.ts', reactionMediaSource],
  ['lib/reactions.ts', reactionsSource],
  ['lib/runtime-source.ts', runtimeSource],
  ['lib/types.ts', typesSource],
  ['lib/vision.ts', visionSource],
  ['main.tsx', mainSource],
  ['test/gesture-engine.test.ts', gestureEngineTestSource],
  ['vite-env.d.ts', viteEnvSource],
  ['styles.css', stylesSource],
] as const

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const runtimeRef = useRef<VisionRuntime | null>(null)
  const startingRef = useRef(false)
  const previousGesture = useRef<GestureId>('idle')
  const menuRef = useRef<HTMLDivElement>(null)
  const sourceCounter = useRef(0)
  const [activeWindow, setActiveWindow] = useState<string>('camera')
  const [floating, setFloating] = useState<Record<WindowId, boolean>>({ camera: false, signals: false, help: false })
  const [zOrder, setZOrder] = useState<Record<WindowId, number>>({ camera: 20, signals: 21, help: 22 })
  const [sourceTabs, setSourceTabs] = useState<SourceTab[]>([])
  const [menu, setMenu] = useState<MenuId>(null)
  const [status, setStatus] = useState<TrackingStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('Camera stopped, nya.')
  const [snapshot, setSnapshot] = useState<VisionSnapshot>(INITIAL_SNAPSHOT)
  const [landmarks, setLandmarks] = useState<FrameLandmarks>(EMPTY_LANDMARKS)
  const [events, setEvents] = useState<RuntimeEvent[]>([])
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [reactionMedia, setReactionMedia] = useState<ReactionMediaMap | null>(null)
  const [showMesh, setShowMesh] = useState(true)
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [panelSplit, setPanelSplit] = useState({ column: 0.56, row: 0.58, stacked: 0.5 })

  const sourceByName = useMemo(() => new Map(SOURCE_FILES), [])

  const handleSnapshot = useCallback((next: VisionSnapshot, points: FrameLandmarks) => {
    setSnapshot(next)
    setLandmarks(points)
  }, [])

  const handleEvent = useCallback((event: RuntimeEvent) => {
    setEvents((current) => [...current.slice(-15), event])
  }, [])

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    setDevices((await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput'))
  }, [])

  useEffect(() => {
    const runtime = new VisionRuntime(handleSnapshot, handleEvent)
    runtimeRef.current = runtime
    void loadReactionMedia().then(setReactionMedia)
    void refreshDevices()
    return () => {
      runtime.close()
      stopMediaStream(streamRef.current)
    }
  }, [handleEvent, handleSnapshot, refreshDevices])

  useEffect(() => {
    const dismissMenus = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key === 'Escape') setMenu(null)
      if (event instanceof MouseEvent && menuRef.current && !menuRef.current.contains(event.target as Node)) setMenu(null)
    }
    document.addEventListener('mousedown', dismissMenus)
    document.addEventListener('keydown', dismissMenus)
    return () => {
      document.removeEventListener('mousedown', dismissMenus)
      document.removeEventListener('keydown', dismissMenus)
    }
  }, [])

  useEffect(() => {
    if (!audioEnabled || snapshot.gesture === 'idle') {
      stopReactionAudio()
      previousGesture.current = snapshot.gesture
      return
    }
    if (snapshot.gesture === previousGesture.current) return

    const reaction = REACTION_BY_ID[snapshot.gesture]
    const audioUrl = mediaUrl(reactionMedia?.[snapshot.gesture]?.audio ?? null)
    if (audioUrl) {
      void playReactionAudio(audioUrl).catch(() => undefined)
    } else {
      stopReactionAudio()
      playReactionTone(reaction.tone)
    }
    previousGesture.current = snapshot.gesture
  }, [audioEnabled, reactionMedia, snapshot.gesture])

  const startCamera = async (deviceId = selectedDeviceId, force = false) => {
    if (startingRef.current || (!force && status === 'running')) return
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setStatusMessage('Camera API unavailable.')
      return
    }
    startingRef.current = true
    await unlockAudio()
    setStatus('loading')
    setStatusMessage('Loading tracking models, /ᐠ - ˕ -マ')
    try {
      await runtimeRef.current!.load()
      setStatus('requesting')
      setStatusMessage('Waiting for camera permission.')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) await new Promise<void>((resolve) => video.addEventListener('loadedmetadata', () => resolve(), { once: true }))
      await video.play()
      setSelectedDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? deviceId)
      setVideoSize({ width: video.videoWidth, height: video.videoHeight })
      runtimeRef.current!.start(video)
      setStatus('running')
      setStatusMessage('Tracking locally.')
      await refreshDevices()
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
    setStatusMessage('Camera stopped, meow.')
  }

  const changeCamera = async (deviceId: string) => {
    setMenu(null)
    if (deviceId === selectedDeviceId && status === 'running') return
    if (status === 'running') stopCamera()
    setSelectedDeviceId(deviceId)
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
    await startCamera(deviceId, true)
  }

  const toggleAudio = async () => {
    if (!audioEnabled) await unlockAudio()
    setAudioEnabled((enabled) => !enabled)
  }

  const raiseWindow = (id: WindowId) => {
    setZOrder((current) => ({ ...current, [id]: Math.max(...Object.values(current)) + 1 }))
  }

  const selectWindow = (id: WindowId) => {
    if (floating[id]) {
      raiseWindow(id)
      return
    }
    setActiveWindow(id)
  }

  const toggleFloating = (id: WindowId) => {
    setFloating((current) => ({ ...current, [id]: !current[id] }))
    raiseWindow(id)
  }

  const openSource = (fileName: (typeof SOURCE_FILES)[number][0]) => {
    const existing = sourceTabs.find((tab) => tab.fileName === fileName)
    if (existing) {
      setActiveWindow(existing.id)
      setSourceTabs((tabs) => tabs.map((tab) => tab.id === existing.id ? { ...tab, zIndex: Math.max(...tabs.map((item) => item.zIndex)) + 1 } : tab))
    } else {
      const id = `source-${++sourceCounter.current}`
      setSourceTabs((tabs) => [...tabs, { id, fileName, floating: false, zIndex: 30 + sourceCounter.current }])
      setActiveWindow(id)
    }
    setMenu(null)
  }

  const toggleSourceFloating = (id: string) => {
    setSourceTabs((tabs) => tabs.map((tab) => tab.id === id ? { ...tab, floating: !tab.floating, zIndex: Math.max(...tabs.map((item) => item.zIndex)) + 1 } : tab))
  }

  const raiseSource = (id: string) => {
    setSourceTabs((tabs) => tabs.map((tab) => tab.id === id ? { ...tab, zIndex: Math.max(...tabs.map((item) => item.zIndex)) + 1 } : tab))
  }

  const selectSource = (id: string) => {
    const tab = sourceTabs.find((item) => item.id === id)
    if (tab?.floating) {
      raiseSource(id)
      return
    }
    setActiveWindow(id)
  }

  const closeSource = (id: string) => {
    setSourceTabs((tabs) => tabs.filter((tab) => tab.id !== id))
    setActiveWindow('camera')
  }

  const resetWindows = () => {
    setFloating({ camera: false, signals: false, help: false })
    setSourceTabs((tabs) => tabs.map((tab, index) => ({ ...tab, floating: false, zIndex: 30 + index })))
    setActiveWindow('camera')
    setZOrder({ camera: 20, signals: 21, help: 22 })
    setMenu(null)
  }

  const setColumnSplit = (position: number, stacked = false) => setPanelSplit((current) => stacked ? { ...current, stacked: Math.min(Math.max(position, 0.38), 0.72) } : { ...current, column: Math.min(Math.max(position, 0.38), 0.72) })
  const setRowSplit = (position: number) => setPanelSplit((current) => ({ ...current, row: Math.min(Math.max(position, 0.3), 0.76) }))
  const cameraLayoutStyle = {
    '--camera-column': `${panelSplit.column * 100}%`,
    '--camera-row': `${panelSplit.row * 100}%`,
    '--camera-stacked': `${panelSplit.stacked * 100}%`,
  } as CSSProperties

  const isWorking = status === 'loading' || status === 'requesting'
  const activeLabel = snapshot.gesture === 'idle' ? 'none' : REACTION_BY_ID[snapshot.gesture].label

  const cameraContent = (
    <div className="camera-workspace" style={cameraLayoutStyle}>
      <section className="camera-pane" aria-labelledby="camera-pane-title">
        <header className="pane-titlebar"><span id="camera-pane-title">camera feed</span><span>{videoSize.width ? `${videoSize.width}x${videoSize.height}` : 'no input'}</span></header>
        <div className="camera-viewport">
          <video ref={videoRef} className="camera-video" playsInline muted onLoadedMetadata={(event) => setVideoSize({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight })} />
          {showMesh && <LandmarkLayer landmarks={landmarks} hands={snapshot.hands} {...videoSize} />}
          {status !== 'running' && <div className="camera-dialog"><pre aria-hidden="true">{`CAMERA DEVICE\n-------------\nstatus: ${status}`}</pre><p>{statusMessage}</p><button type="button" onClick={() => startCamera()} disabled={isWorking}>{isWorking ? 'Starting...' : status === 'error' ? 'Retry camera' : 'Start camera'}</button></div>}
          {status === 'running' && <div className="camera-readout"><span>match: {activeLabel}</span><span>face: {snapshot.faceTracked ? 'yes' : 'no'}</span><span>pose: {snapshot.poseTracked ? 'yes' : 'no'}</span><span>hands: {snapshot.hands.length}</span><span>confidence: {Math.round(snapshot.confidence * 100)}%</span></div>}
        </div>
        <div className="camera-toolbar"><span>{statusMessage}</span>{status === 'running' && <button type="button" onClick={stopCamera}>Stop camera</button>}<button type="button" onClick={() => setMenu('camera')}>Camera menu</button></div>
      </section>
      <PanelResizeHandle direction="vertical" label="Resize camera and reaction panels" onResize={setColumnSplit} />
      <ReactionPane gesture={snapshot.gesture} media={reactionMedia} personDetected={snapshot.faceTracked || snapshot.poseTracked || snapshot.hands.length > 0} />
      <PanelResizeHandle direction="horizontal" label="Resize top feeds and gesture-engine panel" onResize={setRowSplit} />
      <RuntimePanel snapshot={snapshot} events={events} />
    </div>
  )

  return (
    <main className="ide-app">
      <header className="os-titlebar"><span>Kitty Mesh 0.4</span><span>[ browser process ]</span></header>
      <nav className="menu-bar" ref={menuRef} aria-label="Application menu">
        <div className="menu-group"><button type="button" aria-expanded={menu === 'file'} onClick={() => setMenu(menu === 'file' ? null : 'file')}>File</button>{menu === 'file' && <div className="menu-popup"><button type="button" onClick={() => selectWindow('camera')}>Open camera</button><button type="button" onClick={() => { setSourceTabs([]); setActiveWindow('camera'); setMenu(null) }}>Close source windows</button></div>}</div>
        <div className="menu-group"><button type="button" aria-expanded={menu === 'view'} onClick={() => setMenu(menu === 'view' ? null : 'view')}>View</button>{menu === 'view' && <div className="menu-popup"><button type="button" onClick={() => { setShowMesh((value) => !value); setMenu(null) }}>Mesh: {showMesh ? 'on' : 'off'}</button><button type="button" onClick={() => { void toggleAudio(); setMenu(null) }}>Sound: {audioEnabled ? 'on' : 'off'}</button><button type="button" onClick={resetWindows}>Reset windows</button></div>}</div>
        <div className="menu-group"><button type="button" aria-expanded={menu === 'camera'} onClick={() => { void refreshDevices(); setMenu(menu === 'camera' ? null : 'camera') }}>Camera</button>{menu === 'camera' && <div className="menu-popup menu-popup--wide"><button type="button" onClick={() => { if (status === 'running') stopCamera(); else void startCamera(); setMenu(null) }}>{status === 'running' ? 'Stop camera' : 'Start camera'}</button><button type="button" onClick={() => { if (status === 'running') { stopCamera(); window.setTimeout(() => void startCamera(selectedDeviceId, true), 80) } else { void startCamera() } setMenu(null) }}>Restart camera</button><span>Inputs</span>{devices.map((device, index) => <button type="button" className={device.deviceId === selectedDeviceId ? 'is-current' : ''} key={device.deviceId} onClick={() => void changeCamera(device.deviceId)}>{device.label || `Camera ${index + 1}`}</button>)}</div>}</div>
        <div className="menu-group"><button type="button" aria-expanded={menu === 'help'} onClick={() => setMenu(menu === 'help' ? null : 'help')}>Help</button>{menu === 'help' && <div className="menu-popup"><button type="button" onClick={() => { selectWindow('help'); setMenu(null) }}>About Kitty Mesh</button><button type="button" onClick={() => { window.open('https://github.com/MaximilianWik/Kitty-Mesh', '_blank', 'noopener,noreferrer'); setMenu(null) }}>Source repo ↗</button></div>}</div>
      </nav>

      <div className="tab-bar" role="tablist" aria-label="Open windows">
        <button type="button" role="tab" aria-selected={activeWindow === 'camera'} onClick={() => selectWindow('camera')}>camera.ts{floating.camera ? ' [float]' : ''}</button>
        <button type="button" role="tab" aria-selected={activeWindow === 'signals'} onClick={() => selectWindow('signals')}>signals.watch{floating.signals ? ' [float]' : ''}</button>
        {sourceTabs.map((tab) => <button type="button" role="tab" aria-selected={activeWindow === tab.id} key={tab.id} onClick={() => selectSource(tab.id)}>{tab.fileName}{tab.floating ? ' [float]' : ''}</button>)}
        <button type="button" role="tab" aria-selected={activeWindow === 'help'} onClick={() => selectWindow('help')}>about-kitty-mesh.txt{floating.help ? ' [float]' : ''}</button>
      </div>

      <div className="ide-workspace">
        <aside className="explorer" aria-label="Project files">
          <header>EXPLORER</header>
          <div className="explorer__root">KITTY-MESH</div>
          <div className="explorer__folder" aria-label="src folder">
            <span>▾ src</span>
            <button type="button" className={sourceTabs.some((tab) => tab.fileName === 'App.tsx') ? 'is-active' : ''} onClick={() => openSource('App.tsx')}>├─ App.tsx</button>
            <button type="button" className={sourceTabs.some((tab) => tab.fileName === 'main.tsx') ? 'is-active' : ''} onClick={() => openSource('main.tsx')}>├─ main.tsx</button>
            <button type="button" className={sourceTabs.some((tab) => tab.fileName === 'styles.css') ? 'is-active' : ''} onClick={() => openSource('styles.css')}>├─ styles.css</button>
            <button type="button" className={sourceTabs.some((tab) => tab.fileName === 'vite-env.d.ts') ? 'is-active' : ''} onClick={() => openSource('vite-env.d.ts')}>├─ vite-env.d.ts</button>
            <div className="explorer__folder">
              <span>├─ ▾ components</span>
              {SOURCE_FILES.filter(([name]) => name.startsWith('components/')).map(([fileName]) => <button type="button" className={sourceTabs.some((tab) => tab.fileName === fileName) ? 'is-active' : ''} key={fileName} onClick={() => openSource(fileName)}>│  ├─ {fileName.replace('components/', '')}</button>)}
            </div>
            <div className="explorer__folder">
              <span>├─ ▾ lib</span>
              {SOURCE_FILES.filter(([name]) => name.startsWith('lib/')).map(([fileName]) => <button type="button" className={sourceTabs.some((tab) => tab.fileName === fileName) ? 'is-active' : ''} key={fileName} onClick={() => openSource(fileName)}>│  ├─ {fileName.replace('lib/', '')}</button>)}
            </div>
            <div className="explorer__folder">
              <span>└─ ▾ test</span>
              {SOURCE_FILES.filter(([name]) => name.startsWith('test/')).map(([fileName]) => <button type="button" className={sourceTabs.some((tab) => tab.fileName === fileName) ? 'is-active' : ''} key={fileName} onClick={() => openSource(fileName)}>   └─ {fileName.replace('test/', '')}</button>)}
            </div>
          </div>
          <footer>frames stay local, =^..^=</footer>
        </aside>
        <div className="desktop">
          <p className="desktop__hint">Use ↗ to float, drag title bars to move, and resize from the lower-right corner.</p>
          <DesktopWindow id="camera-window" title="camera.ts" floating={floating.camera} visible={floating.camera || activeWindow === 'camera'} zIndex={zOrder.camera} initialPosition={{ x: 205, y: 110, width: 780, height: 650 }} onActivate={() => raiseWindow('camera')} onToggleFloating={() => toggleFloating('camera')}>{cameraContent}</DesktopWindow>
          <DesktopWindow id="signals-window" title="signals.watch" floating={floating.signals} visible={floating.signals || activeWindow === 'signals'} zIndex={zOrder.signals} initialPosition={{ x: 470, y: 155, width: 560, height: 460 }} onActivate={() => raiseWindow('signals')} onToggleFloating={() => toggleFloating('signals')}><GestureRail active={snapshot.gesture} candidate={snapshot.candidate} scores={snapshot.scores} hands={snapshot.hands} /></DesktopWindow>
          {sourceTabs.map((tab, index) => <DesktopWindow id={tab.id} title={tab.fileName} floating={tab.floating} visible={tab.floating || activeWindow === tab.id} zIndex={tab.zIndex} initialPosition={{ x: 420 + index * 24, y: 150 + index * 24, width: 760, height: 620 }} onActivate={() => raiseSource(tab.id)} onToggleFloating={() => toggleSourceFloating(tab.id)} key={tab.id}><SourceViewer fileName={tab.fileName} source={sourceByName.get(tab.fileName) ?? ''} onClose={() => closeSource(tab.id)} /></DesktopWindow>)}
          <DesktopWindow id="help-window" title="about-kitty-mesh.txt" floating={floating.help} visible={floating.help || activeWindow === 'help'} zIndex={zOrder.help} initialPosition={{ x: 520, y: 210, width: 500, height: 360 }} onActivate={() => raiseWindow('help')} onToggleFloating={() => toggleFloating('help')}><HelpPane source={readmeSource} onClose={() => selectWindow('camera')} /></DesktopWindow>
        </div>
      </div>
      <footer className="status-bar"><span>{status.toUpperCase()}</span><span>match: {activeLabel}</span><span>fps: {snapshot.fps.toFixed(0)}</span><span>hands: {snapshot.hands.length}</span><span>latency: {snapshot.latencyMs.toFixed(0)}ms</span><span>MediaPipe / local</span></footer>
    </main>
  )
}

export default App
