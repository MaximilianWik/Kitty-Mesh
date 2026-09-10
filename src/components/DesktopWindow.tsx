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
  const drag = useRef({ pointerId: 0, offsetX: 0, offsetY: 0 })

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!floating || (event.target as HTMLElement).closest('button')) return
    onActivate()
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
    }
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

  return (
    <section
      id={id}
      role="tabpanel"
      className={`desktop-window${floating ? ' desktop-window--floating' : ' desktop-window--docked'}`}
      hidden={!visible}
      onPointerDown={onActivate}
      style={floating ? {
        left: position.x,
        top: position.y,
        width: initialPosition.width,
        height: initialPosition.height,
        zIndex,
      } : undefined}
    >
      <header
        className="desktop-window__titlebar"
        onPointerDown={startDrag}
        onPointerMove={moveWindow}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <span>{title}</span>
        <button type="button" onClick={onToggleFloating} title={floating ? 'Dock window' : 'Pop out window'}>
          {floating ? '□' : '↗'}
        </button>
      </header>
      <div className="desktop-window__content">{children}</div>
    </section>
  )
}
