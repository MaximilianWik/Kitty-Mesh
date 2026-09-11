# Changelog

## 0.5.2 · 2026-09-11

### Added

- Added rock-sign detection (index and pinky extended), including the supplied `rock.png` and `rock.mp3` assets.

### Changed

- Rebuilt the docked camera workbench as camera feed top-left, reaction.ts top-right, and the gesture-engine runtime panel spanning the bottom row.
- Changed the camera preview to `object-fit: contain`, so every captured pixel remains visible instead of being cropped.
- Enabled and unlocked reaction audio from the Start camera action, then reuse one audio player for supplied MP3 reaction sounds.

## 0.5.1 · 2026-09-11

### Added

- Added docked splitters for camera feed, reaction.ts, and the gesture-engine runtime panel. They support pointer drag and keyboard arrow keys.
- Installed the supplied reaction images and MP3 files in `public/reactions`, with a manifest including the `tounge.*` to `tongue` mapping.

### Changed

- Removed C-hand and full-360 spin from the detector, signal scores, runtime trace, reaction registry, and tests.
- Kept the reaction media area at a fixed 260 × 180 slot, so images cannot resize or shift the pane.
- Made floating windows raise above the workspace without changing the selected docked tab.
- Made the camera layout stack vertically at narrower widths, while retaining adjustable splitters.

## 0.5.0 · 2026-09-10

### Added

- Multiple source tabs can remain open at once.
- Camera, reaction, and source windows can float together and stack independently.
- Reaction pane now shows future image and sound paths for the live gesture.
- Live source trace now shows more untruncated code.

### Changed

- Added an explicit drag resize handle for docked and floating windows.
- Made hand labels larger and camera readout text smaller.
- Tightened score bars to compact segmented blocks.
- Switched the workbench from crimson to sparse black and green terminal colors.

## 0.4.0 · 2026-09-10

### Added

- Explorer entries now open real bundled source files in a read-only code window.
- File, View, Camera, and Help menus now work.
- Camera input selection, stop, restart, mesh, sound, window reset, and about controls.
- Kiss face recognition using pucker and funnel blendshapes.
- Resizable docked and floating camera and source windows.

### Changed

- Removed the old reaction output and its reference components.
- Raised blank-stare activation to 30%.
- Locked pane and signal-row dimensions so detector updates do not move the camera view.
- Reworked the palette to flat gothic crimson, bone, and amber.
- Replaced smooth meters with segmented block bars.
- Renamed the project and README to Kitty Mesh. =^..^=

## 0.3.0 · 2026-09-10

### Added

- Hand tracking for up to two paws with five finger states and five hand gestures.
- Happy-face detection, hand skeletons, fingertip markers, and media manifest slots.

### Changed

- Faster face, pose, and hand inference targets.
- Tongue-out activation at 25%.
