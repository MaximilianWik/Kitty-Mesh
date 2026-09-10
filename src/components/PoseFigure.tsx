import type { GestureId } from '../lib/types'

interface PoseFigureProps {
  gesture: Exclude<GestureId, 'idle'>
  label: string
}

export function PoseFigure({ gesture, label }: PoseFigureProps) {
  const isBody = gesture === 'hands' || gesture === 'spin'

  return (
    <svg
      className="pose-figure"
      viewBox="0 0 240 240"
      role="img"
      aria-label={`${label} reference`}
    >
      <title>{label} reference</title>
      <rect className="pose-figure__frame" x="8" y="8" width="224" height="224" />
      <path className="pose-figure__guide" d="M24 120H216M120 24V216" />

      {isBody ? (
        <BodyPose gesture={gesture} />
      ) : (
        <FacePose gesture={gesture} />
      )}
    </svg>
  )
}

function FacePose({ gesture }: { gesture: 'blank' | 'profile' | 'tongue' | 'angry' }) {
  if (gesture === 'profile') {
    return (
      <g className="pose-figure__subject">
        <path d="M88 178C78 155 75 126 80 91C84 61 102 43 128 43C153 43 171 61 174 89L186 106L171 114L168 140C166 159 153 174 135 181" />
        <path d="M115 88L133 84M165 104L173 105M151 137Q161 143 169 137" />
        <path d="M98 190Q128 170 159 190" />
      </g>
    )
  }

  return (
    <g className="pose-figure__subject">
      <ellipse cx="120" cy="112" rx="58" ry="72" />
      <path d="M83 86Q96 80 106 86M134 86Q145 80 158 86" />
      <circle cx="96" cy="99" r="3" />
      <circle cx="144" cy="99" r="3" />
      <path d="M120 104V126L112 130" />
      {gesture === 'blank' && <path d="M99 149H141" />}
      {gesture === 'tongue' && (
        <>
          <path d="M96 143Q120 130 144 143Q141 174 120 178Q99 174 96 143Z" />
          <path d="M108 160Q120 154 132 160V177Q120 188 108 177Z" />
        </>
      )}
      {gesture === 'angry' && (
        <>
          <path d="M80 78L106 88M160 78L134 88" />
          <path d="M98 158Q120 140 142 158" />
          <path d="M104 120L96 127M136 120L144 127" />
        </>
      )}
      <path d="M82 199Q120 174 158 199" />
    </g>
  )
}

function BodyPose({ gesture }: { gesture: 'hands' | 'spin' }) {
  return (
    <g className="pose-figure__subject">
      <circle cx="120" cy="58" r="25" />
      <path d="M120 83V151M120 104L82 125M120 104L158 125M120 151L91 202M120 151L149 202" />
      {gesture === 'hands' ? (
        <path d="M82 125L55 76L44 42M158 125L185 76L196 42" />
      ) : (
        <>
          <path d="M82 125L61 159M158 125L179 159" />
          <path className="pose-figure__accent" d="M64 71A68 68 0 0 1 178 64M176 51L178 64L165 65" />
          <path className="pose-figure__accent" d="M176 168A68 68 0 0 1 62 175M64 188L62 175L75 174" />
        </>
      )}
    </g>
  )
}
