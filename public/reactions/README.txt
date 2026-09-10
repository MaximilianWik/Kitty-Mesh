Place custom images, GIFs, and audio files in this directory.

Use `manifest.json` to map each gesture to its files. Paths are relative to `/reactions/`.
Example:

```json
"happy": { "image": "happy.gif", "audio": "happy.mp3" }
```

The default app uses inline pose references and synthesized Web Audio, so no external media files are required.
