---
name: Express fallback path preservation
description: Preserve the requested path when serving route-aware HTML from a mounted Express catch-all.
---

In Express mounted catch-all middleware such as `app.use("*", ...)`, `req.path` may reflect the mount-relative path instead of the requested route. Use `req.originalUrl` and parse its pathname when route-specific HTML depends on the original request.

**Why:** The production fallback was serving the same homepage crawler content for every route because the mounted catch-all obscured the request path.

**How to apply:** When a fallback builds HTML or other output based on the route, normalize the pathname from `req.originalUrl`, and test both `/` and non-root paths over HTTP.
