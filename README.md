# Kitty Mesh :3333

An on-device webcam experiment that recognizes expressions and body poses, triggers original visual and audio reactions, and exposes its real runtime path through a mapped source-code visualization.

## Recognized states

| State | Detection approach | Framing |
| --- | --- | --- |
| Blank stare | Low facial blendshape activity | Face centered and well lit |
| Side profile | Nose offset relative to the eyes | Turn clearly left or right |
| Tongue out | Mouth-open approximation, threshold 0.25 | Face close to camera, mouth open wide |
| Happy face | Bilateral smile and cheek blendshapes | Face centered |
| Full 360 | Staged orientation sequence | Upper body and both shoulders visible |
| Angry face | Brow-down, nose-sneer, squint, and mouth-press blendshapes | Face centered |
| Hands up | Both wrists above their corresponding shoulders | Step back until wrists and shoulders fit |
| Open palm | All five fingers extended | Hand visible and facing the camera |
| Closed fist | All five fingers folded | Hand visible |
| Point | Index extended, other fingers folded | Hand visible |
| Peace sign | Index and middle extended | Hand visible |
| Thumbs up | Thumb extended upward, other fingers folded | Hand visible |

### Important limitations

A normal webcam image does not contain depth behind the person. The 360 detector therefore recognizes this sequence:

`front → first side → face hidden while pose remains → opposite side → front`

This is a practical gesture sequence, not continuous 3D body reconstruction. Tongue landmarks are not exposed by MediaPipe Face Landmarker, so tongue-out is intentionally labeled and implemented as an approximation using mouth-open geometry and blendshapes. Thresholds may need tuning for different cameras, faces, lighting, and mobility.

## Runtime visualization

The source panel is a mapped runtime visualization. It receives events from the actual camera, Face Landmarker, Pose Landmarker, Hand Landmarker, signal extraction, classifier, stabilizer, and reaction paths. Active lines correspond to those real events. It is not a JavaScript interpreter, browser debugger, or fabricated terminal stream.

## Privacy

- Camera frames are processed locally in the browser.
- The app has no backend and sends no frames to this repository or Vercel.
- On first use, the browser downloads MediaPipe WebAssembly and model files from pinned public CDN/model URLs.
- Camera access can be stopped from the interface or the browser permission controls.
- Audio is synthesized locally through the Web Audio API and is muted by default.

## Run locally on Windows

Requirements: Node.js 20.19+ or 22.12+ and a current Chromium, Firefox, or Safari browser.

Open PowerShell:

```powershell
cd "C:\Users\AD17661\GitHub\Face Mesh"
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`. Camera APIs work on localhost and secure HTTPS origins.

Run verification:

```powershell
npm test
npm run build
```

Preview the production build:

```powershell
npm run preview
```

## Deploy to Vercel

### Vercel dashboard

1. Push the repository to GitHub.
2. In Vercel, select **Add New → Project**.
3. Import `MaximilianWik/Face-Mesh`.
4. Vercel detects Vite. Keep the included build and output settings.
5. Deploy, then grant camera access on the HTTPS deployment.

### Vercel CLI

```powershell
npm install --global vercel
cd "C:\Users\AD17661\GitHub\Face Mesh"
vercel
```

For the production deployment:

```powershell
vercel --prod
```

## Architecture

```text
src/
├── components/
│   ├── DesktopWindow.tsx      draggable and stackable view window
│   ├── GestureRail.tsx        confidence, hand, and 360 states
│   ├── LandmarkLayer.tsx      face, pose, hand, and finger canvas
│   ├── MatchOutput.tsx        dedicated matched-gesture view
│   ├── PoseFigure.tsx         inline gesture references
│   └── RuntimePanel.tsx      mapped source execution view
├── lib/
│   ├── audio.ts              synthesized Web Audio cues
│   ├── gesture-engine.ts     signal extraction and state machines
│   ├── reactions.ts          state-to-reaction mapping
│   ├── runtime-source.ts     source excerpts mapped to events
│   ├── types.ts              shared state types
│   └── vision.ts             MediaPipe loading and frame loop
└── App.tsx                   camera lifecycle and UI composition
```

The app targets face inference at up to 30 Hz, hand inference at up to 20 Hz, and pose inference at up to 15 Hz. The synchronous MediaPipe calls are staggered by task interval. Actual speed depends on the device and browser; the app reports measured FPS and latency instead of claiming a fixed rate.

## Window layout

Camera and Match Output can run as normal tabs or be popped out inside the browser desktop. Use the `↗` title-bar button to float a window, drag its title bar to move it, resize it from the browser resize handle, and click it to bring it to the front. These are in-page windows, not separate operating-system browser windows, which keeps the live camera and matching state shared.

## Replace or extend reactions

Built-in pose references use inline SVG and audio cues use locally synthesized tones, so the project ships without copyrighted media.

1. Add media under `public/reactions/` using the gesture IDs shown in `src/lib/reactions.ts`, for example `happy.png`, `peace.gif`, or `thumbs-up.mp3`.
2. Each reaction exposes a `mediaBaseName` matching that filename stem.
3. The Match Output window already displays the expected media path for the active match.
4. Keep audio opt-in and include descriptive text for added visual media.

Gesture thresholds live in `src/lib/gesture-engine.ts`. Adjust one signal at a time and verify across multiple users and lighting conditions.

## Model sources

- [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision), pinned in `package.json`
- [Face Landmarker model](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task)
- [Pose Landmarker Lite model](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task)
- [Hand Landmarker model](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task)

## Browser support notes

- Camera access requires HTTPS in production.
- iOS browsers may pause camera processing when the tab is hidden.
- Low-power devices may report reduced FPS. The UI remains usable because pose inference is throttled separately.
- The app requests one user-facing camera, one pose, and up to two hands at a time.
- Finger and hand-gesture recognition is geometric and may need threshold tuning for unusual angles or partial occlusion.
- “Near instant” depends on the device. The app targets 30 Hz face, 20 Hz hand, and 15 Hz pose inference and reports actual latency.
