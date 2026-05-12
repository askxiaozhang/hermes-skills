# Cron Job Template for Bilibili Blogger Tracking

## Creating a Cron Job

Use the `cronjob` tool with `action='create'`.

### Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| `schedule` | `"0 12,20 * * 6,0"` | Twice daily on Sat/Sun (for weekly digest creators) |
| `schedule` | `"0 12 * * *"` | Daily at noon (for frequent uploaders) |
| `deliver` | `"origin"` | Back to the chat where created |
| `repeat` | `forever` | Keep monitoring indefinitely |
| `name` | `"XXX B站更新监控"` | Human-readable name |
| `skills` | `["bilibili-blogger-tracker", "llm-wiki"]` | Load both skills |

## Prompt Template

Replace `{{placeholders}}` with actual values:

```
检查 Bilibili 博主"{{BLOGGER_NAME}}"(UID: {{MID}}) 是否有新视频更新。

执行步骤：

1. **读取跟踪文件**
   - 读取 wiki 中的跟踪记录：/wiki/raw/articles/bilibili-{{username}}-tracking.md
   - 获取当前已记录的最新 BV 号：{{STORED_BV}}

2. **检查评论区 UP 主图片（优先）**
   - 通过 Bilibili API 获取最新视频信息
   - 获取该视频的评论区：curl https://api.bilibili.com/x/v2/reply?type=1&oid={aid}&sort=1
   - 检查 UP 主（mid={{MID}}）是否在评论区发了图片（reply 中 images/pictures 字段）
   - 如果 UP 主评论区有图片，用浏览器打开图片 URL，用 vision_analyze 解析图片内容
   - UP 主的评论图片通常是带链接的事件总结，比视频本身信息更完整

3. **判断是否有新视频**
   - 用搜索 API 获取最新视频 BV 号：curl https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword={{BLOGGER_NAME}}&order=pubdate&page=1
   - 比较 API 返回的最新 BV 号与跟踪文件中的 BV 号
   - 如果相同，输出空内容（静默跳过，不通知用户）

4. **如果有新视频，按优先级获取内容**
   - 优先：检查新视频评论区 UP 主图片（步骤2的逻辑）
   - 次选：尝试获取视频字幕（/x/player/v2?bvid=...&cid=...）
   - 兜底：用视频描述、标签、弹幕重建内容

5. **更新 wiki**
   - 将内容保存到 /wiki/raw/articles/bilibili-{{username}}-latest-YYYYMMDD.md
   - 更新 /wiki/queries/{{username}}-weekly-YYYYMMDD.md 总结页
   - 更新跟踪文件中的最新 BV 号和检查日期
   - 更新 index.md 和 log.md

6. **报告结果**
   - 有新视频：列出标题、事件数量、是否来自评论区图片
   - 无新视频：不输出任何内容（静默跳过）

注意：Bilibili API 有风控，使用 /x/space/wbi/arc/search 需要 WBI 签名。如果 API 被限制，用 delegate_task 委托子任务通过浏览器访问 search.bilibili.com 获取。
```

## Example: 产品君 Tracking Job

```python
cronjob(
    action="create",
    name="产品君 B站更新监控",
    schedule="0 12,20 * * 6,0",
    deliver="origin",
    repeat=999,  # forever
    skills=["bilibili-blogger-tracker", "llm-wiki"],
    prompt="""检查 Bilibili 博主"产品君"(UID: 1845434732) 是否有新视频更新。
    ... (full prompt as above with placeholders filled) ..."""
)
```

## Managing Existing Jobs

```python
# List all jobs
cronjob(action="list")

# Update a job (e.g., change prompt to add comment-image check)
cronjob(action="update", job_id="e194f69d2ca8", prompt="...new prompt...")

# Pause/resume
cronjob(action="pause", job_id="...")
cronjob(action="resume", job_id="...")

# Run immediately for testing
cronjob(action="run", job_id="...")

# Remove
cronjob(action="remove", job_id="...")
```

## Silent Skip Pattern

When no new video is detected, the cron agent should output **nothing**.
The cron system treats empty output as "no notification needed" — the user won't see anything happened.

This is preferred over "无新视频" messages, which would spam the user on every check.

## Schedule Recommendations

| Creator Type | Schedule | Rationale |
|-------------|----------|-----------|
| Weekly digest (e.g., 产品君) | `0 12,20 * * 6,0` | Videos drop on weekends, check twice daily |
| Daily uploader | `0 12 * * *` | Check once daily at noon |
| Irregular uploader | `0 12,20 * * *` | Check twice daily all week |
| Breaking news | `*/30 * * * *` | Every 30 min (use sparingly, costs tokens) |
