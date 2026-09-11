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

export function HelpPane({ source, onClose }: { source: string; onClose: () => void }) {
  return (
    <section className="help-pane" aria-label="Kitty Mesh help">
      <header className="pane-titlebar"><span>about-kitty-mesh.txt</span><button type="button" onClick={onClose}>close</button></header>
      <pre className="help-pane__readme">{source.replaceAll('\r\n', '\n')}</pre>
    </section>
  )
}

