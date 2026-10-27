---
name: Full assessment separation
description: Product boundary between the independent full assessment and homepage quick profiler.
---

The full assessment is a standalone flow at `/assessment`. It must not import quick-profiler answers, skip full-assessment steps, or change its reports based on the homepage profiler.

**Why:** The user explicitly requires the full assessment, including its email and PDF sequence, to remain separate from the homepage risk-check flow.

**How to apply:** Keep assessment persistence and submission on the full-assessment path; do not add profiler-prefill or profiler-specific PDF/email behavior.
