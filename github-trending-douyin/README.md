# github-trending-douyin

> **EN —** Custom [Hermes Agent](../README.md) skills powering a fully-automated short-video pipeline:
> trend-scraping → LLM scripting → edge-tts → ffmpeg → auto-publish. **100k+ views in 30 days, zero manual editing.**

基于 **Hermes Agent** 自研的一套 skill，驱动一条**全自动短视频内容流水线**：
每天从 GitHub Trending 抓取热点 → LLM 生成口播文案 → edge-tts 合成配音 → Pillow + ffmpeg 自动剪辑成片 → 生成抖音发布文案。**全程 0 人工干预**，已稳定产出真实流量。

---

## 架构

![架构图：全自动短视频内容流水线](./architecture.svg)

```
热点抓取 ──▶ 文案生成 ──▶ 配音合成 ──▶ 视频合成 ──▶ 发布文案
(GitHub     (LLM         (edge-tts)   (Pillow +     (4 套抖音
 Trending)   口播脚本)                  ffmpeg)        标题/描述/话题)
   ▲                                                      │
   └──────────────  项目知识库 · 回头客上下文  ◀────────────┘
```

编排 / 调度复用 Hermes Agent，**选题 → 脚本 → 配音 → 合成 → 发布的全部 skill 实现为自研**。

## 真实数据（近 30 天）

| 指标 | 数值 |
|------|------|
| 播放量 | **10 万+** |
| 净增粉丝 | **+388** |
| 作品点赞 | **2,251** |
| 单条成片人工耗时 | **≈ 0**（全自动） |

## 技术栈

`Hermes Agent` · `Python` · `requests` / `BeautifulSoup`（抓取） · `edge-tts`（配音） · `Pillow`（竖版帧渲染） · `imageio-ffmpeg`（合成） · LLM API（文案）

## 本仓库包含什么

这是**在 Hermes Agent 框架之上的 skill 层**，不包含框架本身。为保护核心配方，本仓库只公开代表性部分：

- [`SKILL.md`](./SKILL.md) — 流水线 overview（公开版，去掉了爆款 Hook 模板库、16 条渲染踩坑、精调参数与知识库逻辑）
- [`architecture.svg`](./architecture.svg) — 架构图
- [`scripts/fetch_trending.py`](./scripts/fetch_trending.py) — **代表性可运行代码**：Stage 1 GitHub Trending 爬取器（按增长量排序 → 结构化 JSON）
- [`scripts/verify_emoji.py`](./scripts/verify_emoji.py) — 渲染质量门：确保 emoji / 中文字形不丢失，失败则不合成视频

完整生产配方（Hook 模板库、踩坑库、发布 CTR 策略、知识库回头客逻辑）保留在私有版本，不随仓库发布。

## 快速试用

```bash
pip install requests beautifulsoup4
python3 scripts/fetch_trending.py --since weekly --limit 5
```

输出示例：

```
📊 GitHub Trending [weekly] Top 5
  #1  owner/repo-a   +14,272  ⭐17,662   Python
  #2  owner/repo-b   +13,359  ⭐148,003  Python
  ...
✅ 已写入 trending-data.json
```

---

<sub>本目录是 <a href="../README.md">hermes-skills</a> 仓库的一个 skill。框架为 Hermes Agent（开源底座），本 skill 的实现与编排为自研。</sub>
