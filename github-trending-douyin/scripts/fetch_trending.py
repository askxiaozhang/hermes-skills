#!/usr/bin/env python3
"""
Stage 1 · 数据采集 —— GitHub Trending 爬取器（代表性公开实现）

抓取 GitHub Trending 榜单，按「区间 star 增长量」降序重排，输出结构化 JSON，
作为整条短视频流水线（选题 → 脚本 → 配音 → 合成 → 发布）的第一环。

这是 github-trending-douyin skill 中可独立运行的一个模块，
完整生产配方（脚本生成 / 渲染踩坑 / 发布策略）保留在私有版本。

用法:
    python3 fetch_trending.py                      # 默认 monthly, Top 10
    python3 fetch_trending.py --since weekly       # daily / weekly / monthly
    python3 fetch_trending.py --limit 5 -o top5.json
"""
from __future__ import annotations

import argparse
import json
import sys

import requests
from bs4 import BeautifulSoup

TRENDING_URL = "https://github.com/trending"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    )
}
PERIOD_SUFFIXES = ("stars today", "stars this week", "stars this month")


def _to_int(s: str) -> int:
    """'4,698' -> 4698；GitHub 的 star 数带逗号，解析前必须去掉。"""
    return int(s.replace(",", "").strip() or 0)


def fetch_trending(since: str = "monthly", limit: int = 10) -> list[dict]:
    """抓取 GitHub Trending，返回按区间增长量降序排列的项目列表。"""
    resp = requests.get(
        TRENDING_URL, params={"since": since}, headers=HEADERS, timeout=15
    )
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    projects: list[dict] = []
    for row in soup.select("article.Box-row")[:limit]:
        h2 = row.select_one("h2 a")
        repo = h2["href"].strip("/") if h2 else ""

        desc_tag = row.select_one("p")
        desc = desc_tag.get_text(strip=True) if desc_tag else ""

        lang_tag = row.select_one("[itemprop='programmingLanguage']")
        lang = lang_tag.get_text(strip=True) if lang_tag else "N/A"

        star_links = row.select("a.Link--muted")
        total_stars = star_links[0].get_text(strip=True) if star_links else "0"

        period_tag = row.select_one("span.d-inline-block.float-sm-right")
        period_stars = period_tag.get_text(strip=True) if period_tag else "0"
        for suffix in PERIOD_SUFFIXES:
            period_stars = period_stars.replace(suffix, "")
        period_stars = period_stars.strip()

        projects.append(
            {
                "repo": repo,
                "description": desc,
                "language": lang,
                "total_stars": total_stars,
                "period_stars": period_stars,
                "period_stars_int": _to_int(period_stars),
                "url": f"https://github.com/{repo}",
            }
        )

    # 按区间增长量降序，重新编号 1..N（口播脚本与帧渲染都依赖这个顺序）
    projects.sort(key=lambda p: p["period_stars_int"], reverse=True)
    for i, p in enumerate(projects, start=1):
        p["rank"] = i

    return projects


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch GitHub Trending repos.")
    parser.add_argument(
        "--since",
        choices=("daily", "weekly", "monthly"),
        default="monthly",
        help="时间范围（默认 monthly）",
    )
    parser.add_argument("--limit", type=int, default=10, help="Top N（默认 10）")
    parser.add_argument(
        "-o", "--output", default="trending-data.json", help="输出 JSON 路径"
    )
    args = parser.parse_args(argv)

    try:
        projects = fetch_trending(since=args.since, limit=args.limit)
    except requests.RequestException as e:
        print(f"❌ 抓取失败: {e}", file=sys.stderr)
        return 1

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)

    print(f"📊 GitHub Trending [{args.since}] Top {len(projects)}")
    for p in projects:
        print(
            f"  #{p['rank']:<2} {p['repo']:<42} "
            f"+{p['period_stars']:<7} ⭐{p['total_stars']:<8} {p['language']}"
        )
    print(f"\n✅ 已写入 {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
