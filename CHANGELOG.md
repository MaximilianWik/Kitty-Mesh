# Changelog

All notable changes to this project are documented here.

## 0.3.0 · 2026-09-10

### Added

- MediaPipe hand tracking for up to two hands with 21 landmarks per hand.
- Finger extension readout for thumb, index, middle, ring, and pinky.
- Open palm, fist, point, peace, and thumbs-up gesture states.
- Happy-face detection and a matching pose reference.
- Draggable, resizable, stackable Camera and Match Output windows.
- Named image and audio slots under `public/reactions/` for future media.

### Changed

- Lowered the tongue-out activation threshold to 0.25.
- Reduced gesture hold times and increased face and hand inference rates for faster feedback.
- Added hand skeletons, fingertip markers, and live hand labels to the camera overlay.

## 0.2.0 · 2026-09-10

### Changed

- Replaced the original visual treatment with a flat late-1990s IDE workbench.
- Removed gradients, glows, decorative circuitry, reaction slogans, and marketing copy.
- Consolidated camera controls, runtime source, signal scores, and status data into standard panes.

### Added

- Match Output tab with a large live match view.
- Six inline reference illustrations for blank, profile, tongue, 360, angry, and hands-up states.
- Persistent last-match output while the detector returns to idle.

## 0.1.0 · 2026-09-10

### Added

- React, TypeScript, and Vite application configured for Vercel.
- On-device MediaPipe Face Landmarker and Pose Landmarker pipeline.
- Recognition for blank stare, side profile, tongue-out approximation, angry face, raised hands, and a staged 360 turn.
- Confidence smoothing, gesture hold times, action priority, transition cooldowns, and 360 timeout recovery.
- Responsive face mesh and pose skeleton canvas.
- Original CSS reaction visuals and opt-in synthesized Web Audio cues.
- Camera permission, loading, error, retry, and stop states.
- Truthful mapped runtime visualization connected to real pipeline events.
- Responsive 1990s IDE workbench with reduced-motion support.
- Privacy, local setup, limitations, customization, and Vercel deployment documentation.
