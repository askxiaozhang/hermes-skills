# Bilibili API Quick Reference

All endpoints are under `https://api.bilibili.com`. No auth required for basic metadata.

## Video Metadata

### Get video by BV ID
```bash
curl -s "https://api.bilibili.com/x/web-interface/view?bvid=BV_ID"
```
**Returns:** title, desc, duration, aid (numeric ID), cid, owner.mid, stat.view, stat.like, pubdate
**Rate limit:** 1-3 calls before -352 风控. Space 5+ seconds between calls.

### Get video tags
```bash
curl -s "https://api.bilibili.com/x/tag/archive/tags?bvid=BV_ID"
```

### Get subtitles
```bash
curl -s "https://api.bilibili.com/x/player/v2?bvid=BV_ID&cid=CID"
```
**Path:** `data.subtitle.subtitles[]` → each has `subtitle_url`
**Common:** Empty for most Chinese creators.

## Search

### Search videos (most resilient API)
```bash
curl -s "https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=KEYWORD&order=pubdate&page=1"
```
**Use for:** Finding latest videos by a creator. Order by `pubdate` for newest first.
**Advantage:** Less aggressive rate limiting than space APIs.

### Search users
```bash
curl -s "https://api.bilibili.com/x/web-interface/search/type?search_type=bili_user&keyword=USERNAME"
```

## Comments

### Get video comments (sorted by hot)
```bash
curl -s "https://api.bilibili.com/x/v2/reply?type=1&oid=AID&sort=1"
```
**type=1** means video. **sort=1** means by hot (best first).
**Key fields per reply:**
- `member.mid` — commenter UID (compare with UP's mid to find UP's comments)
- `member.uname` — commenter name
- `content.message` — text content
- `content.pictures[]` — images array, each has `img_src` (URL)
- `like` — like count

### Get UP's own comments
```python
# Filter for UP主's mid in replies
for reply in data['data']['replies']:
    if str(reply['member']['mid']) == str(up_mid):
        # This is the UP's comment
        images = reply['content'].get('pictures', [])
        text = reply['content']['message']
```

## Space / Channel

### Get user's video list (WBI signed — HARD)
```bash
# Requires WBI signature — 412 without it
# Don't rely on this from cron/automated contexts
curl -s "https://api.bilibili.com/x/space/wbi/arc/search?mid=MID&ps=5&pn=1"
```

### Get user info
```bash
curl -s "https://api.bilibili.com/x/space/acc/info?mid=MID"
```
**Returns:** name, sign (bio), face (avatar URL), level, fans

## Rate Limiting & Workarounds

### Known failure codes
| Code | Meaning | Workaround |
|------|---------|------------|
| -352 | 风控校验失败 (risk control) | Wait 60s, or switch to search API |
| -799 | 请求过于频繁 (too many requests) | Wait 30s between calls |
| 412 | WBI signature required | Don't use space APIs directly |

### Recommended strategy (from production experience)
1. **Search API first** — `/x/web-interface/search/type?search_type=video` is most resilient
2. **Direct view API** — `/x/web-interface/view` works for 1-3 lookups, then rate-limited
3. **Comment API** — `/x/v2/reply` is generally stable, good for getting UP's images
4. **Browser fallback** — `delegate_task` with browser → navigate search.bilibili.com → use `browser_console` to call APIs from within page context (has valid cookies)
5. **Never use space APIs** from cron — they require WBI signature and get blocked fast

### Spacing between calls
Always add `sleep 3-5` between API calls in automated contexts. The rate limiter tracks IP + frequency.

## Parsing Helpers

### Extract video info (compact)
```bash
curl -s "https://api.bilibili.com/x/web-interface/view?bvid=BV_ID" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin).get('data', {})
print(json.dumps({
    'title': d.get('title', ''),
    'desc': d.get('desc', ''),
    'aid': d.get('aid', 0),
    'cid': d.get('cid', 0),
    'mid': d.get('owner', {}).get('mid', 0),
    'views': d.get('stat', {}).get('view', 0),
    'likes': d.get('stat', {}).get('like', 0),
    'pubdate': d.get('pubdate', 0),
    'duration': d.get('duration', 0),
}, ensure_ascii=False))
"
```

### Extract UP's comment images
```bash
curl -s "https://api.bilibili.com/x/v2/reply?type=1&oid=AID&sort=1" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin).get('data', {})
up_mid = UP_MID  # replace with actual mid
for reply in data.get('replies', []):
    if str(reply['member']['mid']) == str(up_mid):
        content = reply['content']
        images = content.get('pictures', [])
        if images:
            print('UP主评论图片:')
            for i, img in enumerate(images):
                print(f'  [{i+1}] {img.get(\"img_src\", \"\")}')
            print(f'文字: {content.get(\"message\", \"\")}')
"
```

### Search latest video by creator
```bash
curl -s "https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=CREATOR_NAME&order=pubdate&page=1" \
  | python3 -c "
import sys, json
results = json.load(sys.stdin).get('data', {}).get('result', [])
if results:
    v = results[0]
    print(json.dumps({
        'bvid': v.get('bvid', ''),
        'title': v.get('title', '').replace('<em class=\"keyword\">','').replace('</em>',''),
        'play': v.get('play', 0),
        'pubdate': v.get('pubdate', 0),
        'author': v.get('author', ''),
        'mid': v.get('mid', 0),
    }, ensure_ascii=False))
"
```
