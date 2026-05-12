# web-video-auto-render

> Automatically render Vite+React presentation projects into MP4 videos. Playwright headless recording + ffmpeg audio merge. Zero manual screen capture.

## What it does

Converts `web-video-presentation` output into final MP4 videos with zero human intervention:

1. **Playwright** launches headless Chromium, records the browser at 1920×1080
2. Steps through each chapter/step, waiting for the audio duration per step
3. **ffmpeg** concatenates all MP3 audio segments into one track
4. **ffmpeg** merges video + audio → final `.mp4`

## Quick Start

```bash
# Install
npx skills add hermes-agent/hermes-skills -s web-video-auto-render

# Usage (after Phase 2+3 of web-video-presentation)
cd <project>/presentation
node scripts/render-video.mjs
# → output.mp4 (1920×1080, ~11MB/5min)
```

## Two Modes

| Mode | Description | When |
|------|-------------|------|
| **Mode A: Browser preview** | `?auto=1` auto-play, manual screen capture | Development / quick preview |
| **Mode B: Full auto render** | Playwright headless + ffmpeg | Final production video |

## Prerequisites

- Node.js 18+
- Playwright + Chromium (`npx playwright install chromium --with-deps`)
- ffmpeg + ffprobe
- A built `web-video-presentation` project with audio segments

## Pitfalls

- **webm duration = N/A**: Playwright's `.webm` has no duration metadata. Convert to mp4 first, then merge with audio.
- **concat.txt needs absolute paths**: ffmpeg concat demuxer requires absolute file paths.
- **OOM in containers**: Split ffmpeg operations into steps (webm→mp4, audio concat, final merge) to avoid memory kills.
- **Hermes process reclamation**: The render script spawns its own HTTP server internally, immune to Hermes background process cleanup.

## Related Skills

- [`web-video-presentation`](../web-video-presentation) — Phase 1-3 (content, development, TTS). This skill handles Phase 4.

## License

MIT
