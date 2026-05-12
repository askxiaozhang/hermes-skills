# bilibili-blogger-tracker

> Track Bilibili creators with automated new video detection, comment-image extraction, and wiki ingestion.

## What it does

Automates the full workflow of tracking a Bilibili content creator:

1. **Detect new uploads** — compares latest BV number against stored tracking record
2. **Extract content** — prioritizes UP主's comment images (richest source with links), falls back to subtitles, then description/tags reconstruction
3. **Ingest into wiki** — 4-file pattern: tracking record, latest video, entity page, summary
4. **Cron monitoring** — silent skip when no new video, instant notification when new content drops

## Content Extraction Priority

| Level | Source | Quality | When |
|-------|--------|---------|------|
| ⭐ L1 | UP主 comment images | High | Creator posts image summaries in comments |
| L2 | Video subtitles | High | Rare for Chinese creators |
| L3 | Description + tags + comments | Medium | Reconstructed from metadata |
| L4 | Cross-platform search | Medium | YouTube, Zhihu, WeChat fallback |

## Prerequisites

- AI agent with `curl`, `python3`, and browser tools (for image extraction)
- Optional: `llm-wiki` skill for wiki integration

## Quick Start

```bash
# Install with npx skills CLI
npx skills add hermes-agent/hermes-skills -s bilibili-blogger-tracker

# Or install all skills
npx skills add hermes-agent/hermes-skills
```

## Usage

Tell your AI agent:

> "追踪 Bilibili 博主 产品君 (UID: 1845434732)"

The skill will:
1. Fetch the latest video from Bilibili API
2. Check if UP主 posted comment images (priority!)
3. Extract and parse the content
4. Create wiki pages (if llm-wiki skill is available)
5. Set up cron monitoring for future updates

## API Reference

The skill includes a comprehensive Bilibili API cheatsheet at `references/api-cheatsheet.md` covering:
- Video metadata, subtitles, tags
- Comment extraction (with UP主 image detection)
- Search API (most resilient against rate limiting)
- Rate limiting workarounds (-352, -799, 412 codes)

## Cron Template

See `references/cron-template.md` for ready-to-use cron job prompt templates with:
- Comment image priority checking
- Silent skip pattern (no notification when no new video)
- Schedule recommendations by creator type

## Pitfalls

- **Bilibili API -352**: Direct view API triggers risk control after 1-3 calls. Use search API instead.
- **Space page fails in headless**: `space.bilibili.com/<mid>/video` shows -352 without auth cookies.
- **No subtitles ≠ no content**: Most Chinese creators don't provide subtitles. Comment images are the gold standard.
- **Tracking file is critical**: Without it, the cron job can't detect new vs. already-seen videos.

## License

MIT
