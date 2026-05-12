<div align="center">

# Hermes Skills

**A curated collection of production-ready [Agent Skills](https://hermes-agent.nousresearch.com/docs) for Hermes, Claude Code, Cursor, Codex, and other AI coding agents.**

<a id="skills-gallery"></a>

<table>
<tr>
<td width="50%" valign="top">
<a href="#bilibili-blogger-tracker"><img src="https://img.shields.io/badge/Bilibili-Tracker-blue?style=for-the-badge&logo=bilibili" alt="Bilibili Blogger Tracker Skill" width="100%"></a>
<br/><a href="#bilibili-blogger-tracker"><strong>bilibili-blogger-tracker</strong></a>
<br/><sub>Video tracking / Content extraction</sub>
</td>
<td width="50%" valign="top">
<a href="#web-video-auto-render"><img src="https://img.shields.io/badge/Video-Auto--Render-red?style=for-the-badge&logo=ffmpeg" alt="Web Video Auto Render Skill" width="100%"></a>
<br/><a href="#web-video-auto-render"><strong>web-video-auto-render</strong></a>
<br/><sub>Video rendering / Automation</sub>
</td>
</tr>
</table>

[![License: MIT](https://img.shields.io/github/license/hermes-agent/hermes-skills?style=flat-square&color=blue)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/hermes-agent/hermes-skills?style=flat-square)](https://github.com/hermes-agent/hermes-skills/stargazers)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](#contributing)
[![Skills count](https://img.shields.io/badge/skills-2-orange?style=flat-square)](#skills-gallery)

</div>

---

## Table of contents

| Install | Skills | Contribute |
|---|---|---|
| [Install](#install)<br>[`npx skills add`](#option-a--npx-skills-cli)<br>[Manual copy](#option-b--manual-copy)<br>[Git submodule](#option-c--git-submodule) | [`bilibili-blogger-tracker`](#bilibili-blogger-tracker)<br>[`web-video-auto-render`](#web-video-auto-render) | [Contributing](#contributing)<br>[License](#license) |

---

## Skills

### `bilibili-blogger-tracker`

**Category:** Research / Content Tracking
**Best for:** Tracking Bilibili content creators, automated new video detection, comment-image extraction, wiki ingestion, and cron monitoring.

`bilibili-blogger-tracker` automates the full workflow of tracking a Bilibili creator: detecting new uploads, extracting content (prioritizing UP主's comment images which are the richest source with links), ingesting into a personal knowledge base, and setting up automated monitoring.

Highlights:

- **Comment image priority** — automatically checks if UP主 posted structured summary images in comments (richest source with event titles + URLs)
- **4-level content extraction** — comment images → subtitles → description/tags reconstruction → cross-platform search
- **4-file wiki pattern** — tracking record, latest video content, entity page, summary/query page
- **Cron monitoring** — silent skip when no new video, instant notification when new content drops
- **Rate limit resilience** — built-in workarounds for Bilibili API -352/-799/412 codes

Links: [README](./skills/bilibili-blogger-tracker/README.md) · [SKILL.md](./skills/bilibili-blogger-tracker/SKILL.md) · <!-- DOWNLOAD:bilibili-blogger-tracker:start -->
[Download v1.0.0 .zip](https://github.com/hermes-agent/hermes-skills/releases/download/bilibili-blogger-tracker-v1.0.0/bilibili-blogger-tracker-1.0.0.zip)
<!-- DOWNLOAD:bilibili-blogger-tracker:end -->

---

### `web-video-auto-render`

**Category:** Video / Automation
**Best for:** Automatically rendering Vite+React presentation projects into MP4 videos. Playwright headless browser recording + ffmpeg audio merge. Zero manual screen capture.

`web-video-auto-render` is the Phase 4 enhancement for `web-video-presentation`. Instead of manually recording the screen with OBS, it uses Playwright's built-in video recording to capture the browser at 1920×1080, then merges the recorded video with synthesized audio via ffmpeg — all in one command.

> 🎬 **Live demo** — a 5min presentation about [Hermes Kanban](https://hermes-agent.nousresearch.com), fully auto-rendered from a Vite+React project with 7 chapters and 37 audio segments:
>
> [![Watch demo](https://img.shields.io/badge/▶_Watch_Demo-MP4_(11MB)-red?style=for-the-badge&logo=videolan)](./demo/web-video-auto-render/hermes-kanban-demo.mp4)

Highlights:

- **Zero manual recording** — Playwright headless Chromium captures all CSS/Framer Motion animations natively
- **Two modes** — browser preview with `?auto=1` for dev, fully automated Playwright+ffmpeg for production
- **Built-in HTTP server** — spawns its own server during rendering, immune to process reclamation
- **OOM-safe** — split ffmpeg pipeline (webm→mp4, audio concat, final merge) avoids memory kills
- **6 pitfalls documented** — webm duration N/A, concat absolute paths, container limits, Chinese quotes, and more

Links: [README](./skills/web-video-auto-render/README.md) · [SKILL.md](./skills/web-video-auto-render/SKILL.md) · <!-- DOWNLOAD:web-video-auto-render:start -->
[Download v1.0.0 .zip](https://github.com/hermes-agent/hermes-skills/releases/download/web-video-auto-render-v1.0.0/web-video-auto-render-1.0.0.zip)
<!-- DOWNLOAD:web-video-auto-render:end -->

---

## Install

### Option A · `npx skills` CLI

The fastest way to install any skill:

```bash
# Install a specific skill
npx skills add hermes-agent/hermes-skills -s bilibili-blogger-tracker

# Install all skills
npx skills add hermes-agent/hermes-skills

# Install globally (all projects)
npx skills add hermes-agent/hermes-skills -s bilibili-blogger-tracker --global
```

### Option B · Manual copy

```bash
git clone https://github.com/hermes-agent/hermes-skills.git
cp -r hermes-skills/skills/bilibili-blogger-tracker /path/to/your/project/.skills/
```

### Option C · Git submodule

```bash
git submodule add https://github.com/hermes-agent/hermes-skills.git .skills/hermes-skills
```

---

## Compatibility

| Agent | Status |
|-------|--------|
| [Hermes Agent](https://hermes-agent.nousresearch.com) | ✅ Native |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | ✅ Compatible |
| [Cursor](https://cursor.sh) | ✅ Compatible |
| [Codex CLI](https://github.com/openai/codex) | ✅ Compatible |
| [OpenCode](https://github.com/opencode-ai/opencode) | ✅ Compatible |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | ✅ Compatible |

---

## Contributing

Contributions welcome! To add a skill:

1. Fork this repo
2. Create `skills/your-skill-name/` with:
   - `SKILL.md` — the skill prompt (with YAML frontmatter: `name`, `description`)
   - `manifest.json` — metadata (`name`, `version`, `category`, `description`, `compat`)
   - `README.md` — human-friendly docs
   - `references/` — optional supporting files
3. Run `npm run validate` to check
4. Submit a PR

---

## License

[MIT](./LICENSE)
