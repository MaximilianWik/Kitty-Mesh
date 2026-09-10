---
name: Face Mesh Runtime
register: product
status: v1
colors:
  base: "oklch(12% 0.018 170)"
  surface: "oklch(17% 0.022 170)"
  ink: "oklch(94% 0.016 165)"
  signal: "oklch(82% 0.19 150)"
  pose: "oklch(79% 0.14 218)"
  face: "oklch(76% 0.17 310)"
  warning: "oklch(82% 0.16 80)"
typography:
  interface: "Arial, Helvetica, sans-serif"
  code: "Cascadia Code, SFMono-Regular, Consolas, monospace"
---

# Overview
A dark, instrument-like interface inspired by exposed electronics and transparent hardware. The webcam is the main stage. A truthful runtime trace surrounds it and jumps between relevant code paths as detection progresses.

# Colors
Near-black green-tinted surfaces create the enclosure. Mineral green marks active execution, warm amber marks pending signals, violet identifies face landmarks, and cool cyan identifies pose landmarks. Labels and shapes reinforce every semantic color.

# Typography
Use a neutral system sans-serif for controls and explanations. Use monospace only where source code, measurements, or trace events make it semantically correct. Keep the hierarchy compact and operational.

# Elevation
Create depth through surface lightness, fine borders, and selective opacity. Avoid broad shadows and decorative glow. The runtime layer appears behind the camera plane, as if visible through a transparent enclosure.

# Components
The system contains a primary camera stage, mapped runtime trace, confidence meter, gesture rail, privacy notice, camera permission state, and reaction overlay. Controls use familiar buttons and switches with visible focus and disabled states.

# Do's and Don'ts
- Do connect every animation to a real detector or state transition.
- Do keep the camera feed visually dominant.
- Do explain that the code trace is a mapped runtime visualization.
- Do not fabricate random logs.
- Do not use generic glass cards.
- Do not hide core controls on small screens.
