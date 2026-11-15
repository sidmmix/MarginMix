import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { publicPages, resolvePageMetadata } from "../client/src/lib/route-metadata";
import { injectCrawlerPage } from "../server/crawler-pages";

const builtTemplate = readFileSync("dist/public/index.html", "utf8");
const indexablePages = Object.entries(publicPages).filter(
  ([, metadata]) => metadata.indexable,
);

assert.ok(indexablePages.length > 0, "at least one public page must be checked");

for (const [path] of indexablePages) {
  const metadata = resolvePageMetadata(path);
  const html = injectCrawlerPage(builtTemplate, path);
  assert.ok(html.includes(`<title>${metadata.title}</title>`), `${path} built title must match`);
  assert.ok(
    html.includes(`<meta name="description" content="${metadata.description}" />`),
    `${path} built description must match`,
  );
  assert.ok(
    metadata.canonicalUrl &&
      html.includes(`<link rel="canonical" href="${metadata.canonicalUrl}" />`),
    `${path} built canonical URL must match`,
  );
  assert.ok(
    html.includes(`<meta property="og:url" content="${metadata.openGraph.url}" />`),
    `${path} built social URL must match`,
  );
}

console.log(`Verified production built canonical metadata for ${indexablePages.length} public pages.`);
