import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  publicPages,
  resolvePageMetadata,
  siteOrigin,
} from "./route-metadata";
import { injectCrawlerPage } from "../../../server/crawler-pages";
import {
  founderPageCopy,
  platformPageCopy,
  whyChoosePageCopy,
} from "../../../shared/public-page-copy";

const expectedPublicPaths = [
  "/",
  "/platform",
  "/free-tier/calculator",
  "/founder",
  "/why-choose",
];

const sitemap = readFileSync("client/public/sitemap.xml", "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (match) => match[1],
);
const appSource = readFileSync("client/src/App.tsx", "utf8");
const appRoutePaths = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map(
  (match) => match[1].replace(/\/\*.*$/, ""),
);

test("indexable public pages have distinct search metadata and canonical social tags", () => {
  const indexablePaths = Object.entries(publicPages)
    .filter(([, metadata]) => metadata.indexable)
    .map(([path]) => path)
    .sort();

  assert.deepEqual(indexablePaths, [...expectedPublicPaths].sort());

  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const path of indexablePaths) {
    const metadata = resolvePageMetadata(path);
    assert.ok(metadata.title.trim(), `${path} must have a title`);
    assert.ok(metadata.description.trim(), `${path} must have a description`);
    assert.ok(!titles.has(metadata.title), `${path} title must be unique`);
    assert.ok(
      !descriptions.has(metadata.description),
      `${path} description must be unique`,
    );
    titles.add(metadata.title);
    descriptions.add(metadata.description);

    const expectedCanonical = `${siteOrigin}${path}`;
    assert.equal(metadata.robots, "index, follow");
    assert.equal(metadata.canonicalUrl, expectedCanonical);
    assert.equal(metadata.openGraph.url, expectedCanonical);
    assert.equal(metadata.openGraph.title, metadata.title);
    assert.equal(metadata.openGraph.description, metadata.description);
    assert.equal(metadata.twitter.title, metadata.title);
    assert.equal(metadata.twitter.description, metadata.description);
    const pageSchema = (metadata.structuredData?.["@graph"] as Record<string, unknown>[] | undefined)
      ?.find((schema) => schema.url === expectedCanonical);
    assert.ok(pageSchema, `${path} needs page-specific structured data`);
  }

  const schemaType = (path: string) =>
    (resolvePageMetadata(path).structuredData?.["@graph"] as Record<string, unknown>[])[2]["@type"];
  assert.equal(schemaType("/platform"), "WebPage");
  assert.equal(
    schemaType("/free-tier/calculator"),
    "SoftwareApplication",
  );
  assert.equal(schemaType("/founder"), "AboutPage");
  assert.equal(schemaType("/why-choose"), "WebPage");
});

test("sitemap contains every canonical public page and no private or form routes", () => {
  const expectedUrls = expectedPublicPaths
    .map((path) => `${siteOrigin}${path}`)
    .sort();
  assert.deepEqual([...sitemapUrls].sort(), expectedUrls);

  const lastModifiedDates = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(
    (match) => match[1],
  );
  assert.equal(lastModifiedDates.length, sitemapUrls.length);
  for (const date of lastModifiedDates) {
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/, "lastmod must be a calendar date");
    assert.ok(!Number.isNaN(Date.parse(date)), `${date} must be a valid date`);
  }

  const excludedPaths = [
    "/free-tier/input",
    "/free-tier/calculator/output",
    "/quick-profiler",
    "/audit-questions",
    "/assessment",
    "/demo",
    "/auth",
    "/sign-in",
    "/sign-up",
    "/dashboard",
    "/home",
  ];

  for (const path of excludedPaths) {
    const metadata = resolvePageMetadata(path);
    assert.equal(metadata.robots, "noindex, nofollow", `${path} must be noindex`);
    assert.equal(metadata.canonicalUrl, undefined, `${path} must not be canonical`);
    assert.equal(metadata.structuredData, undefined, `${path} must not have page structured data`);
    assert.ok(!sitemapUrls.includes(`${siteOrigin}${path}`), `${path} must not be in sitemap`);
  }
});

test("server-rendered public pages get matching canonical URLs and structured data", () => {
  const template = readFileSync("client/index.html", "utf8");
  const html = injectCrawlerPage(template, "/free-tier/calculator");
  const schemaScript = html.match(
    /<script id="route-page-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/,
  );

  assert.ok(schemaScript, "public calculator HTML must include its page schema");
  const graph = JSON.parse(schemaScript[1])["@graph"] as Record<string, unknown>[];
  assert.equal(graph[2].url, `${siteOrigin}/free-tier/calculator`);
  assert.equal(graph[2]["@type"], "SoftwareApplication");
  assert.match(html, /<link rel="canonical" href="https:\/\/marginmix\.ai\/free-tier\/calculator" \/>/);
  assert.match(html, /<title>Free Margin Leak Calculator \| MarginMix<\/title>/);
});

test("server-rendered private pages have no page schema or canonical URL", () => {
  const template = readFileSync("client/index.html", "utf8");
  const html = injectCrawlerPage(template, "/free-tier/calculator/output");

  assert.doesNotMatch(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /<link rel="canonical"/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow" \/>/);
});

test("crawler summaries reuse the current public page copy", () => {
  const template = readFileSync("client/index.html", "utf8");
  const renderedCrawlerText = (path: string) =>
    injectCrawlerPage(template, path)
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ");
  const assertCopyPresent = (path: string, copy: string) => {
    assert.ok(
      renderedCrawlerText(path).includes(copy),
      `${path} crawler content must include visible copy: ${copy}`,
    );
  };

  for (const copy of [
    platformPageCopy.headline,
    platformPageCopy.introduction,
    platformPageCopy.conversationTitle,
    platformPageCopy.conversationDetail,
    ...platformPageCopy.stages.flatMap((stage) => [
      `${stage.status}: ${stage.title}`,
      stage.summary,
      stage.detail,
    ]),
  ]) {
    assertCopyPresent("/platform", copy);
  }

  for (const copy of [
    founderPageCopy.eyebrow,
    founderPageCopy.headline,
    founderPageCopy.introduction,
    founderPageCopy.patternTitle,
    founderPageCopy.pattern,
    founderPageCopy.patternConclusion,
    founderPageCopy.outsideQuoteTitle,
    ...founderPageCopy.outsideQuote.map(
      ({ title, description }) => `${title}: ${description}.`,
    ),
    founderPageCopy.patternCallout,
    founderPageCopy.decisionTitle,
    founderPageCopy.decisionSummary,
    ...founderPageCopy.fullerStory,
    founderPageCopy.experienceTitle,
    founderPageCopy.experienceSummary,
    founderPageCopy.founderExperience,
    founderPageCopy.advisorSummary,
    founderPageCopy.advisorExperience,
    founderPageCopy.callToActionTitle,
  ]) {
    assertCopyPresent("/founder", copy);
  }

  for (const copy of [
    whyChoosePageCopy.eyebrow,
    whyChoosePageCopy.headline,
    ...whyChoosePageCopy.cards.flatMap((card) => [card.title, card.body]),
  ]) {
    assertCopyPresent("/why-choose", copy);
  }
});

test("every declared app route has explicit metadata", () => {
  assert.ok(appRoutePaths.length > 0, "App.tsx must declare routes");

  for (const path of appRoutePaths) {
    assert.ok(
      Object.hasOwn(publicPages, path),
      `${path} needs an explicit metadata entry`,
    );
    assert.equal(
      resolvePageMetadata(path).robots,
      expectedPublicPaths.includes(path) ? "index, follow" : "noindex, nofollow",
      `${path} has the wrong indexing policy`,
    );
  }
});
