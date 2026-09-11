import { type KeyboardEvent, type PointerEvent, useRef } from 'react'

interface PanelResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  label: string
  onResize: (position: number, stacked: boolean) => void
}

export function PanelResizeHandle({ direction, label, onResize }: PanelResizeHandleProps) {
  const pointerId = useRef<number | null>(null)

  const resize = (event: PointerEvent<HTMLSpanElement>) => {
    const workspace = event.currentTarget.closest('.camera-workspace')
    if (!workspace) return
    const bounds = workspace.getBoundingClientRect()
    const stacked = window.matchMedia('(max-width: 980px)').matches
    const horizontalAxis = direction === 'horizontal' || stacked
    const position = horizontalAxis
      ? (event.clientY - bounds.top) / bounds.height
      : (event.clientX - bounds.left) / bounds.width
    onResize(position, stacked)
  }

  const startResize = (event: PointerEvent<HTMLSpanElement>) => {
    pointerId.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    resize(event)
    event.preventDefault()
    event.stopPropagation()
  }

  const moveResize = (event: PointerEvent<HTMLSpanElement>) => {
    if (pointerId.current !== event.pointerId) return
    resize(event)
    event.preventDefault()
  }

  const stopResize = (event: PointerEvent<HTMLSpanElement>) => {
    if (pointerId.current !== event.pointerId) return
    pointerId.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 0.025 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -0.025 : 0
    if (!delta) return
    const workspace = event.currentTarget.closest('.camera-workspace')
    if (!workspace) return
    const bounds = workspace.getBoundingClientRect()
    const stacked = window.matchMedia('(max-width: 980px)').matches
    const horizontalAxis = direction === 'horizontal' || stacked
    const position = horizontalAxis
      ? (event.currentTarget.getBoundingClientRect().top - bounds.top) / bounds.height
      : (event.currentTarget.getBoundingClientRect().left - bounds.left) / bounds.width
    onResize(position + delta, stacked)
    event.preventDefault()
  }

  return <span className={`panel-resize panel-resize--${direction}`} role="separator" aria-label={label} aria-orientation={direction === 'vertical' ? 'vertical' : 'horizontal'} tabIndex={0} onPointerDown={startResize} onPointerMove={moveResize} onPointerUp={stopResize} onPointerCancel={stopResize} onKeyDown={onKeyDown} />
}
