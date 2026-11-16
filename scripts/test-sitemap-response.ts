import assert from "node:assert/strict";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import express from "express";
import { XMLParser } from "fast-xml-parser";
import { assertValidSitemapXml } from "./sitemap-xml";
import { serveStatic } from "../server/static";

const mode = process.argv[2] ?? "production";
assert.ok(
  mode === "production" || mode === "development",
  "Choose production (requires npm run build) or development.",
);

// Exercise the app's real HTTP serving handlers and HTML fallback without
// initializing unrelated database, authentication or external API clients.
const app = express();
const server = createServer(app);
let vite: Awaited<ReturnType<typeof import("../server/vite").setupVite>> | undefined;

try {
  if (mode === "production") {
    serveStatic(app, path.resolve("dist/public"));
  } else {
    const { setupVite } = await import("../server/vite");
    vite = await setupVite(app, server);
  }
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;

  const expected = readFileSync("client/public/sitemap.xml", "utf8");
  const parser = new XMLParser({ ignoreAttributes: false, ignorePiTags: true });
  for (const userAgent of ["Googlebot", "bingbot"]) {
    const response = await fetch(`${origin}/sitemap.xml`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": userAgent, Accept: "*/*" },
    });
    assert.equal(response.status, 200, `${mode}: ${userAgent} must receive HTTP 200`);
    assert.equal(response.headers.has("location"), false, "Sitemap must not redirect");
    assert.match(
      response.headers.get("content-type") ?? "",
      /^(?:application|text)\/xml(?:\s*;|$)/i,
      `${mode}: sitemap must have an XML content type`,
    );
    const xml = await response.text();
    assertValidSitemapXml(xml);
    const { urlset } = parser.parse(xml);
    assert.equal(urlset["@_xmlns"], "http://www.sitemaps.org/schemas/sitemap/0.9");
    const entries = Array.isArray(urlset.url) ? urlset.url : [urlset.url];
    assert.ok(entries.length > 0 && entries.every((entry: { loc?: string } | undefined) =>
      typeof entry?.loc === "string" && URL.canParse(entry.loc)),
    "Sitemap must contain absolute URL entries");
    assert.equal(xml, expected, `${mode}: server must deliver the published sitemap, not HTML`);
  }

  const sitemapDocument = parser.parse(expected) as {
    urlset: { url: { loc: string }[] | { loc: string } };
  };
  const sitemapEntries = Array.isArray(sitemapDocument.urlset.url)
    ? sitemapDocument.urlset.url
    : [sitemapDocument.urlset.url];
  for (const { loc } of sitemapEntries) {
    const pageUrl = new URL(loc);
    const response = await fetch(`${origin}${pageUrl.pathname}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    assert.equal(response.status, 200, `${mode}: public page ${pageUrl.pathname} must return 200`);
    const html = await response.text();
    assert.ok(
      html.includes(`<link rel="canonical" href="${loc}" />`),
      `${mode}: public page ${pageUrl.pathname} must include its canonical URL`,
    );
  }

  const missingPage = await fetch(`${origin}/missing-page`, {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(missingPage.status, 404, `${mode}: unknown routes must return 404`);
  const missingHtml = await missingPage.text();
  assert.match(missingHtml, /name="robots" content="noindex, nofollow"/);
  assert.doesNotMatch(missingHtml, /rel="canonical"/);

  console.log(`Verified ${mode} sitemap delivery, public page canonicals and unknown-route 404s.`);
} finally {
  await vite?.close();
  if (server.listening) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}
