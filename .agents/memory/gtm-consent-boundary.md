---
name: GTM consent boundary
description: Strict pre-consent blocking for Google Tag Manager and analytics requests.
---

Google Consent Mode v2 with default denied consent can still send cookieless analytics pings when GTM tags are already loaded. To prevent all analytics requests before consent, keep the GTM container unloaded until consent is accepted; do not use a no-JavaScript GTM iframe because consent cannot be collected there.

**Why:** A real-browser check observed Google Analytics collection requests with denied consent (`gcs=G100`).

**How to apply:** Preserve the Consent Mode default before any tags load, then load GTM only after an accepted choice or when accepted consent is restored from storage. Keep this blocking behavior covered by a browser test against the real container.
