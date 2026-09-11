# Kitty Mesh =^..^=

Kitty Mesh is a browser-only computer vision cockpit. It runs three MediaPipe Tasks Vision models (face, pose, hand) against your webcam entirely on-device, classifies the result into one of twelve states through a hand-rolled scoring and stabilization pipeline, and renders the whole thing as a fake retro IDE. No backend, no upload, no telemetry. Just whiskers and WASM.

## ( ^ω^ ) Inference pipeline

Every animation frame runs through `VisionRuntime` (`src/lib/vision.ts`):

1. **Face** — `FaceLandmarker.detectForVideo`, every frame (~30 Hz), `numFaces: 1`, blendshapes enabled.
2. **Hand** — `HandLandmarker.detectForVideo`, throttled to ~20 Hz, `numHands: 2`.
3. **Pose** — `PoseLandmarker.detectForVideo` (lite variant), throttled to ~15 Hz, `numPoses: 1`.

Face runs every tick because expression state is the most latency-sensitive signal; hand and pose are throttled independently since finger geometry and shoulder/wrist tracking tolerate more slack. Each stage emits a `RuntimeStepId` event (`camera.read` → `face.detect` → `hand.detect` → `pose.detect` → `signals.extract` → `gesture.rank` → `gesture.stabilize` → `reaction.dispatch`) so the runtime panel can trace exactly which line of source is executing, live.

## ( ⊙ω⊙ ) Signal extraction and scoring

`extractSignals` (`src/lib/gesture-engine.ts`) turns raw landmarks and blendshapes into a `GestureScores` vector, one float per state, computed independently every frame:

- **Face states** are weighted blendshape blends. Happy = 82% smile + 18% cheek squint, minus jaw-open leakage. Angry = 48% brow-down + 28% nose-sneer + 16% eye-squint + 8% mouth-press. Kiss = 64% pucker + 28% funnel + 8% shrug-lower, minus jaw-open, mouth-lower, and MediaPipe's `tongueOut` blendshape (kiss and tongue are mutually exclusive mouth shapes, so each suppresses the other). Tongue is jaw-open + mouth-lower/upper geometry with `tongueOut` as a boost, not the primary signal — MediaPipe's `tongueOut` blendshape is notoriously under-trained on 2D webcam input and reads near-zero even with the tongue clearly out.
- **Profile** comes from nose-to-eye-line yaw, normalized by inter-eye distance.
- **Blank** is `1 − max(expressive activity) × 1.55 − profile × 0.45`, i.e. the least interesting frame wins.
- **Hands up** needs both wrists above both shoulders by a visibility-gated margin, scored by how far above.
- **Hand shapes** (fist, point, peace, rock, thumbs-up) come from joint angles at each finger's MCP–PIP–tip, plus a thumb-specific angle/extension check. Point is the index finger extended alone, with the thumb either folded or extended. Rock is index+pinky extended with middle/ring folded; peace is index+middle. Geometry, not a trained classifier, so an oddly angled hand can need a squint to convince it.

Every score is exponentially smoothed (`smoothed = smoothed × 0.52 + incoming × 0.48`) before ranking, so a single noisy frame can't flip the state.

## (=^･ω･^=) Ranking and the stabilizer

`GestureEngine.update` walks a fixed priority list, from `hands` down to `blank`, and picks the first score that clears its own threshold (0.18 for tongue up to 0.62 for hand shapes — face states get lower bars, hand geometry gets stricter ones). The winning candidate then has to survive `GestureStabilizer`: a candidate must hold for ≥120ms (420ms for blank, so a resting face doesn't flicker) and the stabilizer enforces a 160ms cooldown between any two committed transitions. This is why the state you see never chatters even though scores are computed 30 times a second.

## ( ・ω・)✿ Twelve states it hunts for

| State | Signal |
| --- | --- |
| Blank stare | Lowest expressive activity, ≥30% |
| Side profile | Nose crosses the inter-eye line, yaw-normalized |
| Tongue out | Jaw-open + mouth-lower/upper geometry, boosted by `tongueOut`, ≥18% |
| Happy face | Smile blendshapes + cheek squint |
| Kiss face | Mouth pucker + funnel blendshapes |
| Angry face | Brow-down + nose-sneer + eye-squint + mouth-press |
| Hands up | Both wrists above both shoulders |
| Closed fist | All five fingers folded |
| Point | Index finger extended, thumb folded or extended |
| Peace sign | Index + middle extended |
| Rock sign | Index + pinky extended, middle/ring folded |
| Thumbs up | Thumb extended, pointing above the wrist |

## (=ↀωↀ=)✧ The fake desktop

The whole UI is built on `DesktopWindow`, a pointer-event-driven docked/floating window abstraction:

- **`camera.ts`** — one docked window split into three resizable panes via drag-handle separators: camera feed (top-left, `object-fit: contain` so you always see the full frame, never cropped), `reaction.ts` (top-right, image-only, no chrome, shows a "no person detected" placeholder when nothing is tracked), and `src/lib/gesture-engine.ts` (bottom, full width) — a live runtime trace with a scrolling event log and frame/latency counters.
- **`signals.watch`** — a fully separate tab with the raw per-state score table (segmented bar per state) and live hand classifications.
- Popping a window out (`↗`) never steals focus from whatever docked tab you're looking at; floating windows raise their own z-order independently.
- **Explorer** opens the actual bundled source of every file above in a read-only viewer, embedded via Vite's `?raw` imports — the source you're reading *is* the source running.

These are DOM-level fake windows, not real OS windows, precisely so one `<video>` element and one camera stream can be shared across every view without re-requesting `getUserMedia`.

## (^ᴥ^) Reaction media

Drop images and sounds in `public/reactions/`, map them in `public/reactions/manifest.json`:

```json
"kiss": { "image": "kiss.png", "audio": "kiss.mp3" }
```

Sound is on by default. The `AudioContext` is unlocked the moment you click **Start camera** (a real user gesture), and one reusable `<audio>` element is rewound and re-sourced per reaction so playback is instant on repeat triggers. States with no mapped MP3 fall back to a two-oscillator synthesized tone (`playReactionTone`) built from the state's own frequency pair. Kitty Mesh runs fine with zero media files.

## ᓚᘏᗢ Privacy

- Camera frames never leave the browser tab.
- No backend exists to send them to.
- The only network calls are one-time MediaPipe WASM/model downloads from Google's public model CDN, cached by the browser after first load.
- Stop the camera from the Camera menu or the camera pane toolbar at any time.

## (=✪ᆽ✪=) Run locally on Windows

```powershell
cd "C:\Users\AD17661\GitHub\Face Mesh"
npm install
npm run dev
```

Checks:

```powershell
npm test
npm run build
```

`npm run build` runs `tsc --noEmit` against both `tsconfig.json` and `tsconfig.node.json` before the Vite build, so type errors fail the build, not just the editor.

## ( =①ω①=) Deploy to Vercel

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Keep the Vite build settings from `vercel.json`.
4. Deploy. Camera access requires the HTTPS deployment (`getUserMedia` refuses plain HTTP outside `localhost`).

## (¬,W,)Y Field notes from the cat

- Status bar FPS/latency are measured, not assumed — actual throughput depends on your browser's WASM SIMD support and whatever else is eating your CPU.
- Hand shape detection is pure joint-angle geometry. No neural classifier sits between landmarks and gesture label, so extreme angles, partial occlusion, or a hand half out of frame can misfire.
- There is no depth camera and no 3D reconstruction anywhere in this codebase — every spatial claim is inferred from 2D normalized landmark coordinates plus MediaPipe's own z-estimate.
- Face, hand, and pose models run as three independent WASM graphs. They don't share a backbone, which is why their update rates can differ.

## ｼ ⁼³₌ω₌³⁼ ｼ Model sources

- [MediaPipe Tasks Vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) — `0.10.22-rc.20250304`
- [Face Landmarker](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task)
- [Pose Landmarker Lite](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task)
- [Hand Landmarker](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task)
