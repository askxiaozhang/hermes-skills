#!/usr/bin/env python3
"""Verify emoji rendering in render.py and rendered frames.

Usage:
    cd /opt/data/video-projects/<project>/presentation/
    python3 verify_emoji.py

Checks:
    1. render.py: no draw.text() calls contain emoji characters
    2. Rendered frames: emoji areas have visible pixels (not ☒)
    3. All project descriptions render without missing glyphs
"""
import os, sys, json, re
from PIL import Image, ImageDraw, ImageFont

FONT_CJK = os.path.expanduser("~/.local/share/fonts/NotoSansCJKsc-Regular.ttf")
FONT_EMOJI = os.path.expanduser("~/.local/share/fonts/NotoEmoji-Regular.ttf")

def is_emoji_char(ch):
    cp = ord(ch)
    return (
        0x1F300 <= cp <= 0x1FAFF or
        0x2600 <= cp <= 0x27BF or
        0x2300 <= cp <= 0x23FF or
        0x2B50 <= cp <= 0x2B55 or
        0x200D == cp or
        0xFE00 <= cp <= 0xFE0F or
        0x20E3 == cp
    )

errors = []

# === Check 1: draw.text() with emoji in render.py ===
print("=== Check 1: render.py draw.text() with emoji ===")
render_file = "render.py"
if os.path.exists(render_file):
    with open(render_file) as f:
        lines = f.readlines()
    found_issue = False
    for i, line in enumerate(lines):
        if 'draw.text(' in line:
            for ch in line:
                if is_emoji_char(ch):
                    print(f"  ❌ Line {i+1}: draw.text() with emoji '{ch}': {line.strip()[:80]}")
                    errors.append(f"draw.text() emoji at line {i+1}")
                    found_issue = True
                    break
    if not found_issue:
        print("  ✅ No emoji in draw.text() calls")
else:
    print("  ⚠️ render.py not found, skipping")

# === Check 2: Frame emoji pixel verification ===
print("\n=== Check 2: Frame emoji pixel verification ===")
frames_dir = "frames"
if os.path.exists(frames_dir):
    font_emoji = ImageFont.truetype(FONT_EMOJI, 48)
    font_cjk = ImageFont.truetype(FONT_CJK, 48)
    
    # Test all emoji used in the video
    test_emojis = "🔥⭐📊🏆📈🆕💬👆🤖📋🔗🥇🥈🥉"
    for ch in test_emojis:
        test_img = Image.new("RGB", (80, 80), "#0D1117")
        test_draw = ImageDraw.Draw(test_img)
        test_draw.text((5, 5), ch, font=font_emoji, fill="#FFFFFF")
        non_bg = sum(1 for x in range(80) for y in range(80)
                     if test_img.getpixel((x, y)) != (13, 17, 23))
        status = "✅" if non_bg > 10 else "❌"
        if non_bg <= 10:
            errors.append(f"Emoji '{ch}' (U+{ord(ch):04X}) not rendering")
        print(f"  {status} '{ch}' (U+{ord(ch):04X}): {non_bg} pixels")
    
    # Check hook frame for fire emoji
    hook_path = os.path.join(frames_dir, "01-hook.png")
    if os.path.exists(hook_path):
        img = Image.open(hook_path)
        white_in_emoji = sum(1 for x in range(60, 130) for y in range(195, 280)
                            if img.getpixel((x, y))[0] > 200)
        if white_in_emoji > 50:
            print(f"  ✅ Hook frame 🔥 area: {white_in_emoji} bright pixels")
        else:
            print(f"  ❌ Hook frame 🔥 area: only {white_in_emoji} bright pixels")
            errors.append("Hook frame fire emoji missing")
else:
    print("  ⚠️ frames/ not found, skipping")

# === Check 3: Project description character coverage ===
print("\n=== Check 3: Project description character coverage ===")
data_file = "trending-data.json"
if os.path.exists(data_file):
    with open(data_file) as f:
        projects = json.load(f)
    font_cjk = ImageFont.truetype(FONT_CJK, 32)
    for p in projects:
        desc = p.get("description", "")
        for ch in desc:
            if is_emoji_char(ch) or ord(ch) < 128:
                continue
            test_img = Image.new("RGB", (60, 60), "#000000")
            test_draw = ImageDraw.Draw(test_img)
            test_draw.text((5, 5), ch, font=font_cjk, fill="#FFFFFF")
            non_black = sum(1 for x in range(60) for y in range(60)
                           if test_img.getpixel((x, y)) != (0, 0, 0))
            if non_black < 5:
                print(f"  ❌ {p['repo']}: '{ch}' (U+{ord(ch):04X}) not rendered")
                errors.append(f"Missing glyph '{ch}' in {p['repo']}")
    if not errors or all("Missing glyph" not in e for e in errors):
        print("  ✅ All description characters render correctly")
else:
    print("  ⚠️ trending-data.json not found, skipping")

# === Summary ===
print(f"\n{'='*50}")
if errors:
    print(f"❌ {len(errors)} issue(s) found:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
else:
    print("✅ All checks passed! Safe to render video.")
    sys.exit(0)
