---
name: XML parser declarations
description: fast-xml-parser behavior when parsing XML declarations into JavaScript objects.
---

When parsing XML with `fast-xml-parser`, set `ignorePiTags: true` when validating document root keys. Otherwise, an XML declaration can appear in the parsed object as a `?xml` key alongside the actual root.

**Why:** A root-structure assertion intended to require one sitemap root also rejected the valid XML declaration until this parser behavior was accounted for.

**How to apply:** For any XML document parsed into an object and checked for exact root keys, ignore processing-instruction tags or explicitly filter the declaration before checking the document structure.
