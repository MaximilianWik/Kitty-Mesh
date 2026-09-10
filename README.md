# Kitty Mesh =^..^=

Kitty Mesh watches face, body, and hand landmarks in your browser. I keep every frame on your device and show the real source files that make the whiskers twitch.

## What this kitten recognizes

| State | How I look for it |
| --- | --- |
| Blank stare | Low expression score, 30% or higher |
| Side profile | Nose shifts across the eye line |
| Tongue out | Mouth-open blendshape approximation, 25% or higher |
| Happy face | Both mouth corners smile with cheek activity |
| Kiss face | Pucker and funnel mouth blendshapes |
| Angry face | Brows, nose, eyes, and mouth tighten together |
| Full 360 | Front, side, away, opposite side, front |
| Hands up | Both wrists rise above the shoulders |
| Open palm | Five fingers extended |
| Closed fist | Five fingers folded |
| Point | Index finger extended |
| Peace sign | Index and middle fingers extended |
| Thumbs up | Thumb extended upward |

## Windows and source paws

- Click any file in **Explorer** to open its entire bundled source in the read-only source viewer.
- Use the `↗` button to pop a camera or source window out. Drag its title bar to move it, resize from its lower-right corner, and click it to bring it forward.
- Docked windows are resizable too. This lets you give the camera more room without interrupting tracking.
- File, View, Camera, and Help are real menus. Camera lists available video inputs after permission is granted.

These are browser desktop windows, not operating-system windows. That keeps one live camera stream shared by every view. =^..^=

## Future reaction media

Place images and sounds in `public/reactions/`, then map them in `public/reactions/manifest.json`:

```json
"kiss": { "image": "kiss.gif", "audio": "kiss.mp3" }
```

When sound is enabled, mapped audio replaces the small built-in tone. Kitty Mesh still works with no media files.

## Privacy

- Camera frames stay in this browser.
- Kitty Mesh has no backend for frames.
- MediaPipe models download from their public model URLs on first use.
- Stop the camera from the Camera menu or the camera pane.

## Run locally on Windows

```powershell
cd "C:\Users\AD17661\GitHub\Face Mesh"
npm install
npm run dev
```

Run checks:

```powershell
npm test
npm run build
```

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. Keep the Vite build settings from `vercel.json`.
4. Deploy. Camera access requires the HTTPS deployment.

## Notes from the cat

- Face inference targets 30 Hz, hand inference 20 Hz, and pose inference 15 Hz. Actual speed depends on your browser and hardware, so the status bar reports measured FPS and latency.
- Hand gestures are geometric. Angled hands and occlusion can need threshold tuning.
- A webcam cannot see behind you. The 360 state is a staged sequence, not 3D reconstruction.
- Tongue tracking is an approximation because Face Landmarker does not expose a dedicated tongue landmark.

## Model sources

- [MediaPipe Tasks Vision](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- [Face Landmarker](https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task)
- [Pose Landmarker Lite](https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task)
- [Hand Landmarker](https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task)
