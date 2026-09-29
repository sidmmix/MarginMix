---
name: Development dependency audit boundary
description: Why npm overrides should not force an unsupported esbuild version into the Drizzle CLI toolchain.
---

Keep production dependency advisories separate from development-tool advisories when prioritizing remediation. Do not force an `esbuild` version outside the range supported by the Drizzle CLI's `@esbuild-kit` dependency just to clear an audit report; wait for a compatible upstream release or test an alternative tooling path.

**Why:** A forced override left an invalid npm dependency tree despite successful type checks and builds. A clean production audit does not mean the full development-tool audit is clean, but an invalid install is worse than a clearly disclosed development-only advisory.

**How to apply:** After dependency updates, check both production and full audits, `npm ls` for overridden packages, the build, and the database CLI before claiming the advisories are resolved.

The newer Drizzle Kit pre-release removes the deprecated loader but expects an ORM internal export absent from the stable ORM used by this project. Treat it as a coordinated ORM-and-CLI migration, not a safe development-only dependency bump.

**Why:** The newer CLI failed even for its version command against the stable ORM. Replacing the deprecated loader with a local stub also made npm report an invalid dependency tree while misleadingly clearing the audit.

**How to apply:** Do not treat an audit count of zero as success unless `npm ls` and the CLI both work. Get informed consent before changing the ORM major version to solve a development-tool advisory.