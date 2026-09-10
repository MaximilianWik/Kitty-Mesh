interface SourceViewerProps {
  fileName: string
  source: string
  onClose: () => void
}

export function SourceViewer({ fileName, source, onClose }: SourceViewerProps) {
  const lines = source.replaceAll('\r\n', '\n').split('\n')

  return (
    <section className="source-viewer" aria-label={`${fileName} source code`}>
      <header className="pane-titlebar">
        <span>{fileName}</span>
        <button type="button" onClick={onClose}>close</button>
      </header>
      <ol>
        {lines.map((line, index) => <li key={index}><code>{line || ' '}</code></li>)}
      </ol>
    </section>
  )
}

export function HelpPane({ onClose }: { onClose: () => void }) {
  return (
    <section className="help-pane" aria-label="Kitty Mesh help">
      <header className="pane-titlebar"><span>about-kitty-mesh.txt</span><button type="button" onClick={onClose}>close</button></header>
      <div>
        <h1>Kitty Mesh =^..^=</h1>
        <p>Local webcam face, body, and hand tracking built with MediaPipe.</p>
        <p>Frames stay in this browser. No camera frames are sent to Kitty Mesh.</p>
        <p>Click Explorer files to inspect the real bundled source. Use Camera to choose an input or stop tracking.</p>
      </div>
    </section>
  )
}

