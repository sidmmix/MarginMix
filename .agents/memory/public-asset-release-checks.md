---
name: Public asset release checks
description: Keep build-time public asset HTTP verification independent of external services.
---

Public asset release checks should exercise the real static-serving handlers and HTML fallback without initializing the full application's external service clients.

**Why:** Starting the whole app introduces database and API credential requirements into a build that previously needed none. Development credentials can hide this release-environment failure.

**How to apply:** Reuse the production serving handlers in an isolated HTTP server, test the actual built public files, and verify release builds can pass with service credentials absent. Keep separate full-application checks when middleware integration itself is the subject.
