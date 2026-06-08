---
name: github-trending-douyin
description: "一键流程：GitHub Trending 爬取 → 竖版短视频制作 → 抖音发布文案（标题+描述+话题）。用户指定 daily/weekly/monthly，全自动走完三个阶段。"
version: 1.0.0
author: askxiaozhang
tags: [video, github, trending, douyin, tiktok, automation, content-creation]
---

# GitHub Trending → 短视频 → 抖音发布

> **公开版（overview）。** 本文件展示这条全自动内容流水线的架构与公开实现。
> 完整生产配方（爆款 Hook 模板库、16 条渲染踩坑、精调参数、知识库回头客逻辑）保留在私有版本，未随仓库发布。
> 详见同目录 [`README.md`](./README.md)。

用户说 **"GitHub trending 视频"** 或 **"GitHub 趋势视频"** 时触发。
用户输入时间范围（daily / weekly / monthly），Agent 全自动完成三个阶段：

```
Stage 1: 数据采集 ─── 爬取 GitHub Trending，展示 Top 10，用户确认选题
Stage 2: 视频制作 ─── 脚本 → TTS → Pillow 帧渲染 → ffmpeg 合成 → 字幕烧录
Stage 3: 发布文案 ─── 生成 4 套抖音标题/描述/话题方案，推荐最优
```

**总产出**（按 `github-trending-<period>-<date>/` 归档）：
`output-with-subtitles.mp4`（成片）、`output.mp4`（无字幕）、`subtitles.srt`、`script.md`（口播脚本）、`trending-data.json`、`audio-segments.json`、`douyin-publish.md`（发布文案）。

---

## Stage 1 · 数据采集

输入时间范围（`daily` / `weekly` / `monthly`，默认 `monthly`），抓取 GitHub Trending Top 10，
按 **star 增长量降序** 重排编号，保存为 `trending-data.json`，展示给用户确认选题。

爬取实现见公开脚本 👉 [`scripts/fetch_trending.py`](./scripts/fetch_trending.py)（可独立运行）。

> 选题前会读取一个本地「项目知识库」，识别哪些项目是「回头客」（连续上榜 / 排名跃升 / 首次亮相），
> 以便在口播中关联上下文。知识库的具体维护逻辑保留在私有版本。

---

## Stage 2 · 视频制作

零人工的竖版（1080×1920，9:16）成片流程：

1. **口播脚本** — 爆款博主风格：4 秒强 Hook + 每个项目 7–10 秒（最多 2 个信息点）+ 关注/互动 CTA。
   Hook 走一个「每日轮换、不重样」的模板库（私有）。
2. **TTS 配音** — `edge-tts`，男声 `zh-CN-YunxiNeural`，语速 `+18%`（抖音节奏偏快），用 `mutagen` 取时长。
3. **帧渲染** — 容器内无 Playwright，改用 **Pillow** 直接绘制 GitHub 暗色风格卡片帧
   （Hook 封面 / 项目卡片 / CTA 结尾）。中文用 Noto Sans CJK，emoji 用 Noto Emoji 混合渲染。
4. **ffmpeg 合成** — `imageio-ffmpeg` 静态二进制；音频 concat → 帧+音频合成
   （`-pix_fmt yuv420p -movflags +faststart`，保证手机端不黑屏）。
5. **字幕** — 按标点拆行（≤18 字/行）生成 SRT，并用 **PIL 直接把字幕画到帧上**（静态 ffmpeg 的 libass 不渲染字幕）。

渲染后强制跑质量门 👉 [`scripts/verify_emoji.py`](./scripts/verify_emoji.py)：
检查 `render.py` 没有把 emoji 混进 `draw.text()`、帧内 emoji 像素正常、项目描述字符全覆盖。失败则不合成视频。

> 这一阶段最值钱的是 **16 条渲染踩坑记录**（emoji 显示成方框、alpha 后缀失效、字幕不渲染、手机黑屏……）
> 及其修复方案——这些保留在私有版本。`verify_emoji.py` 是其中可公开的一环。

---

## Stage 3 · 抖音发布文案

视频完成后生成 4 套方案（数字冲击 / 痛点切入 / 反问冲突 / 系列化），每套含标题 + 描述 + ≤5 个话题，并给出推荐项。

标题公式示例（数字冲击型）：

```
{数字}star！{项目}，{情绪词}
→ 一个月狂涨 7 万 star！GitHub 五月封神项目
```

话题从固定池（`#GitHub` `#程序员` `#开源` `#科技` 等）+ 动态话题（按内容选，如 `#AI工具` `#爬虫`）组合。
完整公式表、话题策略与 CTR 经验保留在私有版本。

---

## 依赖

```bash
pip install requests beautifulsoup4 edge-tts mutagen imageio-ffmpeg Pillow
```

## 说明

本目录是**在 Hermes Agent 框架之上的 skill 层**，不包含框架本身；编排/调度复用 Hermes Agent，
选题 → 脚本 → 配音 → 合成 → 发布的全部实现为自研。运行数据见 [`README.md`](./README.md)。
