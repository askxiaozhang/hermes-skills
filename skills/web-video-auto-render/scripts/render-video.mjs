/**
 * render-video.mjs — 全自动 HTML → 视频
 *
 * 原理:
 *   1. Playwright 无头浏览器打开页面，逐步推进（每步等待音频时长）
 *   2. Playwright 内置录屏捕获全部动画 → .webm
 *   3. ffmpeg 拼接音频为完整音轨
 *   4. ffmpeg 合并视频 + 音轨 → 最终 MP4
 *
 * Usage:
 *   node scripts/render-video.mjs
 *   node scripts/render-video.mjs --output my-video.mp4
 */

import { chromium } from "playwright";
import { execSync } from "child_process";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const AUDIO = join(ROOT, "public", "audio");
const TMP = join(ROOT, ".render-tmp");
const OUTPUT = join(ROOT, "output.mp4");

const args = process.argv.slice(2);
const outIdx = args.indexOf("--output");
const outputPath = outIdx !== -1 ? args[outIdx + 1] : OUTPUT;

const W = 1920, H = 1080;

// ── Helpers ──

function getAudioMs(mp3Path) {
  try {
    const s = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${mp3Path}"`,
      { encoding: "utf8" }
    ).trim();
    return Math.round(parseFloat(s) * 1000);
  } catch {
    return 3000; // fallback 3s
  }
}

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

// ── Main ──

async function main() {
  mkdirSync(TMP, { recursive: true });

  const segments = JSON.parse(readFileSync(join(ROOT, "audio-segments.json"), "utf8"));
  console.log(`📋 ${segments.length} segments`);

  // ── Step 1: Start HTTP server ──
  const PORT = 18923;
  const { spawn } = await import("child_process");
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "0.0.0.0"], {
    cwd: DIST, stdio: "pipe",
  });
  await new Promise(r => setTimeout(r, 1500));
  console.log(`🌐 http://localhost:${PORT}`);

  // ── Step 2: Record with Playwright ──
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: TMP, size: { width: W, height: H } },
  });
  const page = await ctx.newPage();

  await page.goto(`http://localhost:${PORT}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const videoPath = await page.video().path();
  console.log(`🎥 Recording → ${videoPath}`);

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const mp3 = join(AUDIO, seg.chapter, `${seg.step}.mp3`);
    const ms = getAudioMs(mp3) + 300; // 300ms padding between steps

    process.stdout.write(`  [${i + 1}/${segments.length}] ${seg.chapter}/${seg.step} (${(ms / 1000).toFixed(1)}s)`);

    // Wait for the audio duration (animations play during this time)
    await page.waitForTimeout(ms);
    console.log(" ✓");

    // Advance to next step
    if (i < segments.length - 1) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(300); // CSS transition
    }
  }

  await page.close();
  await ctx.close();
  await browser.close();
  server.kill();
  console.log("📼 Raw video recorded");

  // ── Step 3: Build merged audio track ──
  const silence300 = join(TMP, "silence.mp3");
  sh(`ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.3 -c:a libmp3lame "${silence300}"`);

  const concatList = join(TMP, "concat.txt");
  let list = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    list += `file '${join(AUDIO, seg.chapter, `${seg.step}.mp3`)}'\n`;
    if (i < segments.length - 1) list += `file '${silence300}'\n`;
  }
  execSync(`printf '%s' ${JSON.stringify(list)} > "${concatList}"`);

  const mergedAudio = join(TMP, "audio.mp3");
  sh(`ffmpeg -y -f concat -safe 0 -i "${concatList}" -c:a libmp3lame "${mergedAudio}"`);
  console.log("🔊 Audio track built");

  // ── Step 4: Merge video + audio ──
  sh(`ffmpeg -y -i "${videoPath}" -i "${mergedAudio}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest "${outputPath}"`);

  const size = sh(`du -sh "${outputPath}"`).split("\t")[0];
  console.log(`\n✅ Done! ${outputPath} (${size})`);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
