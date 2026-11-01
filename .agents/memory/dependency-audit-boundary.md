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

When the ORM and CLI are migrated together to the pre-release line, keep the schema adapter in step and pin all three rather than allowing independent pre-release updates. Generated validation schemas use Zod 4 types, even if unrelated client validators still use Zod 3.

**Why:** A matching CLI and ORM alone left the old adapter with an invalid peer tree; the newer adapter's generated schemas did not type-check against Zod 3 extensions.

**How to apply:** Check the complete dependency tree and keep shared generated schemas and server extensions on the same Zod major. Re-run schema generation offline before applying any database changes.

An upstream change from a required dependency to an optional peer does not guarantee that npm removes the old vulnerable package from an existing lockfile.

**Why:** A parent upgrade retained its previous renderer as an optional peer, including the vulnerable merge library beneath it, even though the parent's new direct dependencies no longer included that renderer.

**How to apply:** Audit the resolved lockfile and installed tree after parent upgrades, not just the parent's published dependency list. If the optional peer remains installed, ensure its version and its own dependencies are safe and compatible.