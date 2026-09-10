import type { GestureId } from '../lib/types'

interface PoseFigureProps {
  gesture: Exclude<GestureId, 'idle'>
  label: string
}

export function PoseFigure({ gesture, label }: PoseFigureProps) {
  const isHand = ['open-palm', 'fist', 'point', 'peace', 'thumbs-up'].includes(gesture)
  const isBody = gesture === 'hands' || gesture === 'spin'
  const faceGesture = gesture as 'blank' | 'profile' | 'tongue' | 'happy' | 'angry'

  return (
    <svg className="pose-figure" viewBox="0 0 240 240" role="img" aria-label={`${label} reference`}>
      <title>{label} reference</title>
      <rect className="pose-figure__frame" x="8" y="8" width="224" height="224" />
      <path className="pose-figure__guide" d="M24 120H216M120 24V216" />
      {isHand ? <HandPose gesture={gesture as HandPoseId} /> : isBody ? <BodyPose gesture={gesture} /> : <FacePose gesture={faceGesture} />}
    </svg>
  )
}

type HandPoseId = 'open-palm' | 'fist' | 'point' | 'peace' | 'thumbs-up'

function HandPose({ gesture }: { gesture: HandPoseId }) {
  const paths: Record<HandPoseId, string> = {
    'open-palm': 'M81 193L66 126L55 76Q54 61 66 59Q77 59 81 73L92 111L88 51Q88 37 101 37Q114 38 114 51L117 107L120 42Q121 28 134 29Q147 31 145 44L142 108L151 55Q154 42 166 45Q177 48 174 61L165 120L178 92Q184 80 195 86Q205 92 199 104L171 173Q159 205 123 208Q92 210 81 193Z',
    fist: 'M75 169L67 119Q66 103 80 99L83 80Q84 65 98 64Q105 44 119 48Q132 32 145 44Q161 39 169 55L174 80Q188 86 185 104L176 161Q171 201 128 207Q88 207 75 169Z',
    point: 'M78 190L68 135Q66 119 79 115L96 129L97 46Q98 30 112 30Q127 31 126 47L126 123L137 89Q142 76 154 81L162 92Q177 87 184 100L178 160Q173 202 129 209Q91 210 78 190Z',
    peace: 'M76 190L66 135Q63 119 78 114L94 129L91 50Q91 34 106 34Q120 35 120 51L122 109L135 40Q138 25 152 28Q166 32 162 47L151 119L163 92Q168 79 181 84Q193 89 187 104L176 164Q170 203 129 209Q90 210 76 190Z',
    'thumbs-up': 'M78 191L68 136Q66 120 80 115L100 132L114 98L118 48Q119 31 133 29Q148 31 148 48L145 89L171 105Q188 116 183 135L176 169Q168 204 128 209Q91 210 78 191Z',
  }
  return <path className="pose-figure__subject" d={paths[gesture]} />
}

function FacePose({ gesture }: { gesture: 'blank' | 'profile' | 'tongue' | 'happy' | 'angry' }) {
  if (gesture === 'profile') {
    return (
      <g className="pose-figure__subject">
        <path d="M88 178C78 155 75 126 80 91C84 61 102 43 128 43C153 43 171 61 174 89L186 106L171 114L168 140C166 159 153 174 135 181" />
        <path d="M115 88L133 84M165 104L173 105M151 137Q161 143 169 137M98 190Q128 170 159 190" />
      </g>
    )
  }

  return (
    <g className="pose-figure__subject">
      <ellipse cx="120" cy="112" rx="58" ry="72" />
      <path d="M83 86Q96 80 106 86M134 86Q145 80 158 86" />
      <circle cx="96" cy="99" r="3" /><circle cx="144" cy="99" r="3" />
      <path d="M120 104V126L112 130" />
      {gesture === 'blank' && <path d="M99 149H141" />}
      {gesture === 'happy' && <path d="M96 143Q120 170 144 143" />}
      {gesture === 'tongue' && <><path d="M96 143Q120 130 144 143Q141 174 120 178Q99 174 96 143Z" /><path d="M108 160Q120 154 132 160V177Q120 188 108 177Z" /></>}
      {gesture === 'angry' && <><path d="M80 78L106 88M160 78L134 88" /><path d="M98 158Q120 140 142 158" /><path d="M104 120L96 127M136 120L144 127" /></>}
      <path d="M82 199Q120 174 158 199" />
    </g>
  )
}

function BodyPose({ gesture }: { gesture: 'hands' | 'spin' }) {
  return (
    <g className="pose-figure__subject">
      <circle cx="120" cy="58" r="25" />
      <path d="M120 83V151M120 104L82 125M120 104L158 125M120 151L91 202M120 151L149 202" />
      {gesture === 'hands' ? <path d="M82 125L55 76L44 42M158 125L185 76L196 42" /> : <><path d="M82 125L61 159M158 125L179 159" /><path className="pose-figure__accent" d="M64 71A68 68 0 0 1 178 64M176 51L178 64L165 65M176 168A68 68 0 0 1 62 175M64 188L62 175L75 174" /></>}
    </g>
  )
}
