# Sitemap last-modified dates

The sitemap's `<lastmod>` values are generated from the latest Git change to each public page's source and its imported local components, plus shared layout, metadata, and styles. Build runs `npm run sitemap:update` before checking the metadata and building the site. Changes in the working tree use today's UTC date; committed changes use the source commit date.

To refresh dates manually, run `npm run sitemap:update`. To verify the committed sitemap without changing it, run `npm run test:sitemap-dates`. Keep the route-to-page mapping in `scripts/update-sitemap-lastmod.ts` aligned with indexable entries in `client/src/lib/route-metadata.ts`; the generator fails if they differ or a sitemap route has no source mapping. Git history is required so missing history fails explicitly rather than silently publishing stale dates.

The updater validates XML syntax and the `urlset` root before computing dates or modifying the file. `npm run test:sitemap-dates` also runs isolated command-line regression tests that verify malformed documents remain byte-for-byte unchanged in both update and check modes.
