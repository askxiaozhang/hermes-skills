---
name: web-video-auto-render
description: |
  Automatically render Vite+React presentation projects into MP4 videos using
  Playwright headless browser recording + ffmpeg audio merge. Zero manual screen
  recording. Companion to web-video-presentation skill (Phase 4).
---

# Web Video Auto Render

把 `web-video-presentation` 产出的 Vite+React+TS 演示项目，**自动渲染为 MP4 视频**。
Playwright 无头浏览器录屏 + ffmpeg 音画合并，**零人工录屏**。

## 适用场景

- web-video-presentation Phase 2+3 完成后，需要产出最终 MP4
- 不想用 OBS / 系统录屏手动操作
- 需要可重复、可自动化的渲染流程

## 两种模式

| 模式 | 说明 | 适用阶段 |
|------|------|---------|
| **模式 A：浏览器手动预览** | `?auto=1` 自动播放，人工浏览器录屏 | 开发阶段快速预览 |
| **模式 B：全自动渲染** | Playwright 无头录屏 + ffmpeg 合并 | 正式成片 |

---

## Phase 0：环境检查（必做）

在执行任何渲染前，先确认 4 个依赖就位：

```bash
# 1. ffmpeg / ffprobe
ffmpeg -version && ffprobe -version
# 缺失 → apt-get update && apt-get install -y ffmpeg

# 2. Playwright + Chromium
cd <project>/presentation
npm ls playwright 2>/dev/null || npm install playwright
npx playwright install chromium --with-deps
# --with-deps 会安装 Chromium 所需的系统库（libgbm, libnss3 等）

# 3. edge-tts（容器内 TTS 合成，如果还没合成音频）
pip install edge-tts 2>/dev/null || true
edge-tts --version 2>/dev/null && echo "✓ edge-tts"

# 4. Node.js 18+
node --version  # 需要 >= 18
```

### 环境检查清单

```bash
# 一键检查脚本
echo "=== 环境检查 ==="
for cmd in ffmpeg ffprobe node; do
  command -v $cmd >/dev/null 2>&1 && echo "✓ $cmd" || echo "✗ $cmd — 需要安装"
done
node -e "require('playwright')" 2>/dev/null && echo "✓ playwright" || echo "✗ playwright — npm install playwright"
npx playwright install --dry-run chromium 2>/dev/null && echo "✓ chromium" || echo "✗ chromium — npx playwright install chromium --with-deps"
```

---

## 模式 A：浏览器手动预览（?auto=1）

最简单的方式，不写脚本，浏览器打开后自动播放。

### 步骤

1. **构建项目**
   ```bash
   cd <project>/presentation
   npm run build
   ```

2. **启动 HTTP server**（服务 dist/ 目录）
   ```bash
   # 方式 1：Python 自守护（推荐，不受 Hermes 回收）
   python3 -c "
   import os,sys,http.server,socketserver
   if os.fork()>0: sys.exit(0)
   os.setsid()
   if os.fork()>0: sys.exit(0)
   sys.stdin.close()
   os.chdir('$(pwd)/dist')
   socketserver.TCPServer(('0.0.0.0',5174),http.server.SimpleHTTPRequestHandler).serve_forever()
   "

   # 方式 2：简单前台（快速测试）
   cd dist && python3 -m http.server 5174
   ```

3. **浏览器打开** `http://localhost:5174/?auto=1`
   - 页面自动播放，每步等待对应音频时长后推进
   - 手动用 OBS / 系统录屏捕获浏览器窗口

### 适用场景
- 开发阶段快速预览效果
- 需要人工调整录屏区域
- 不追求完美音画同步

---

## 模式 B：全自动渲染（Playwright + ffmpeg）

**零人工**，一条命令出成片。原理：

```
┌─────────────────────────────────────────────────────┐
│ 1. Playwright 启动无头 Chromium，打开页面            │
│ 2. 开启内置录屏（1920×1080, .webm）                  │
│ 3. 逐步推进：每步等待音频时长（动画在此期间播放）     │
│    → ArrowRight 键触发下一步                         │
│ 4. 关闭浏览器 → 得到完整 .webm 视频                  │
│ 5. ffmpeg 拼接所有 .mp3 音频段为完整音轨             │
│ 6. ffmpeg 合并 .webm 视频 + 音轨 → 最终 .mp4        │
└─────────────────────────────────────────────────────┘
```

### 核心脚本：scripts/render-video.mjs

放在项目的 `scripts/render-video.mjs`，一条命令运行：

```bash
cd <project>/presentation
node scripts/render-video.mjs
# 输出: output.mp4（默认 1920×1080）

# 自定义输出路径
node scripts/render-video.mjs --output /path/to/final.mp4
```

### 前置条件：audio-segments.json

脚本依赖项目根目录的 `audio-segments.json`，格式：

```json
[
  { "chapter": "coldopen", "step": 1 },
  { "chapter": "coldopen", "step": 2 },
  { "chapter": "architecture", "step": 1 }
]
```

这个文件在 Phase 2 章节开发完成后，由 narrations.ts 中的 step 列表生成。

### 产出物

```
<project>/presentation/
├── output.mp4          ← 最终成片（默认 ~11MB/5min, 1920×1080）
├── .render-tmp/        ← 临时文件（可删除）
│   ├── *.webm          ← Playwright 原始录屏
│   ├── concat.txt      ← ffmpeg 音频拼接列表
│   ├── silence.mp3     ← 300ms 静音间隔
│   └── audio.mp3       ← 合并后的完整音轨
└── public/audio/       ← 各步骤 MP3 音频（Phase 3 产出）
```

---

## 依赖工具清单

| 工具 | 用途 | 安装 |
|------|------|------|
| **Playwright** | 无头浏览器录屏 | `npm install playwright` |
| **Chromium** | Playwright 的浏览器引擎 | `npx playwright install chromium --with-deps` |
| **ffmpeg** | 音视频处理、合并 | `apt-get install ffmpeg` |
| **ffprobe** | 读取音频时长 | 随 ffmpeg 一起安装 |
| **edge-tts** | 容器内 TTS 合成（可选） | `pip install edge-tts` |
| **Node.js 18+** | 运行脚本 | 预装 / `apt-get install nodejs` |

---

## Pitfall：webm duration = N/A

Playwright 录出的 `.webm` 文件 duration metadata 为 N/A。
**必须先转 mp4 再合并音频**，不能直接 webm + audio merge。

如果脚本里的单步合并失败，手动分步：

```bash
# 1. webm → mp4（修复 duration）
ffmpeg -y -i recording.webm -c:v libx264 -preset ultrafast -crf 28 -an video-only.mp4

# 2. 拼接音频
ffmpeg -y -f concat -safe 0 -i concat.txt -c:a libmp3lame audio.mp3

# 3. 合并
ffmpeg -y -i video-only.mp4 -i audio.mp3 -c:v copy -c:a aac -b:a 128k -shortest output.mp4
```

## Pitfall：concat.txt 必须用绝对路径

ffmpeg 的 concat demuxer 要求 `file` 指令使用**绝对路径**。
用相对路径时 `cd` 到 concat 文件目录才行，推荐直接用绝对路径。

## Pitfall：容器内存限制（OOM kill）

容器有 5GB 内存限制。ffmpeg 大文件操作（尤其同时处理视频+音频）可能被 OOM kill。
**分步执行**比一步到位更安全：
1. 先 webm → mp4（`-preset ultrafast -crf 28`，降低内存占用）
2. 再音频拼接
3. 最后合并

## Pitfall：Hermes 后台进程被回收

Vite dev server / python http.server 用 `terminal(background=true)` 启动会被 Hermes 自动回收。
**Playwright 脚本内部自带 http server**（用 spawn 启动，不受 Hermes 管理），不需要外部 server。
如果需要手动预览（模式 A），用 Python self-daemon 脚本（见模式 A 说明）。

## Pitfall：容器无端口转发

Docker 没有 `-p` 端口转发时，宿主机无法访问 `localhost:5174`。
**全自动渲染（模式 B）不需要宿主机访问**——Playwright 在容器内运行，连接 `localhost:18923`。
手动预览（模式 A）需要在宿主机运行 server，或配置 Docker 端口转发。

## Pitfall：narrations.ts 中文引号

TypeScript 字符串中的中文 `""` 引号会导致 rolldown 构建失败。
改用 `''`、`——` 或去掉引号。详见 `web-video-presentation` skill 的 pitfall 章节。

---

## 与 web-video-presentation 的关系

```
web-video-presentation          web-video-auto-render
    Phase 1  内容编写         →
    Phase 2  网页开发         →
    Phase 3  音频合成         →
                               Phase 4  自动渲染 ← 本 skill
```

本 skill 是 `web-video-presentation` 的 Phase 4 增强。
原来 Phase 4 需要人工 OBS 录屏，现在用 Playwright + ffmpeg 全自动替代。
