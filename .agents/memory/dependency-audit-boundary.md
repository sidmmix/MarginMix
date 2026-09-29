---
name: Development dependency audit boundary
description: Why npm overrides should not force an unsupported esbuild version into the Drizzle CLI toolchain.
---

Keep production dependency advisories separate from development-tool advisories when prioritizing remediation. Do not force an `esbuild` version outside the range supported by the Drizzle CLI's `@esbuild-kit` dependency just to clear an audit report; wait for a compatible upstream release or test an alternative tooling path.

**Why:** A forced override left an invalid npm dependency tree despite successful type checks and builds. A clean production audit does not mean the full development-tool audit is clean, but an invalid install is worse than a clearly disclosed development-only advisory.

**How to apply:** After dependency updates, check both production and full audits, `npm ls` for overridden packages, the build, and the database CLI before claiming the advisories are resolved.