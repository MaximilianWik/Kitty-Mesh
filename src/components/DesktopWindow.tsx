import { useRef, useState, type PointerEvent, type ReactNode } from 'react'

interface DesktopWindowProps {
  id: string
  title: string
  floating: boolean
  visible: boolean
  zIndex: number
  initialPosition: { x: number; y: number; width: number; height: number }
  onActivate: () => void
  onToggleFloating: () => void
  children: ReactNode
}

export function DesktopWindow({
  id,
  title,
  floating,
  visible,
  zIndex,
  initialPosition,
  onActivate,
  onToggleFloating,
  children,
}: DesktopWindowProps) {
  const [position, setPosition] = useState({ x: initialPosition.x, y: initialPosition.y })
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const drag = useRef({ pointerId: 0, offsetX: 0, offsetY: 0 })
  const resize = useRef({ pointerId: 0, startX: 0, startY: 0, width: initialPosition.width, height: initialPosition.height })

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!floating || (event.target as HTMLElement).closest('button')) return
    onActivate()
    drag.current = { pointerId: event.pointerId, offsetX: event.clientX - position.x, offsetY: event.clientY - position.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveWindow = (event: PointerEvent<HTMLDivElement>) => {
    if (!floating || drag.current.pointerId !== event.pointerId) return
    const nextX = Math.min(Math.max(event.clientX - drag.current.offsetX, 0), window.innerWidth - 180)
    const nextY = Math.min(Math.max(event.clientY - drag.current.offsetY, 0), window.innerHeight - 60)
    setPosition({ x: nextX, y: nextY })
  }

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId !== event.pointerId) return
    drag.current.pointerId = 0
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const startResize = (event: PointerEvent<HTMLSpanElement>) => {
    onActivate()
    const parent = event.currentTarget.parentElement
    if (!parent) return
    const bounds = parent.getBoundingClientRect()
    resize.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, width: bounds.width, height: bounds.height }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const moveResize = (event: PointerEvent<HTMLSpanElement>) => {
    if (resize.current.pointerId !== event.pointerId) return
    const maxWidth = floating ? window.innerWidth - position.x : Math.max(window.innerWidth - 182, 360)
    const maxHeight = floating ? window.innerHeight - position.y : Math.max(window.innerHeight - 114, 280)
    setSize({
      width: Math.min(Math.max(resize.current.width + event.clientX - resize.current.startX, 340), maxWidth),
      height: Math.min(Math.max(resize.current.height + event.clientY - resize.current.startY, 260), maxHeight),
    })
  }

  const stopResize = (event: PointerEvent<HTMLSpanElement>) => {
    if (resize.current.pointerId !== event.pointerId) return
    resize.current.pointerId = 0
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const dimensions = size ?? { width: initialPosition.width, height: initialPosition.height }
  const style = floating
    ? { left: position.x, top: position.y, width: dimensions.width, height: dimensions.height, zIndex }
    : size ? { width: dimensions.width, height: dimensions.height } : undefined

  return (
    <section
      id={id}
      role="tabpanel"
      className={`desktop-window${floating ? ' desktop-window--floating' : ' desktop-window--docked'}`}
      hidden={!visible}
      onPointerDown={onActivate}
      style={style}
    >
      <header className="desktop-window__titlebar" onPointerDown={startDrag} onPointerMove={moveWindow} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
        <span>{title}</span>
        <button type="button" onClick={onToggleFloating} title={floating ? 'Dock window' : 'Pop out window'}>{floating ? '□' : '↗'}</button>
      </header>
      <div className="desktop-window__content">{children}</div>
      <span className="desktop-window__resize" aria-label="Resize window" onPointerDown={startResize} onPointerMove={moveResize} onPointerUp={stopResize} onPointerCancel={stopResize} />
    </section>
  )
}
