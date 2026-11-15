import { existsSync, readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import {
  publicPages,
  resolvePageMetadata,
  socialImage,
  siteOrigin,
} from "./route-metadata";
import { injectCrawlerPage } from "../../../server/crawler-pages";
import {
  engagementJourneyCopy,
  founderPageCopy,
  platformPageCopy,
  whyChoosePageCopy,
} from "../../../shared/public-page-copy";

test("public journey distinguishes the live calculator from planned document assessment", () => {
  const homepage = injectCrawlerPage(readFileSync("client/index.html", "utf8"), "/");
  const platform = injectCrawlerPage(readFileSync("client/index.html", "utf8"), "/platform");
  for (const html of [homepage, platform]) {
    assert.ok(html.includes(engagementJourneyCopy.assessment));
    assert.match(html, /Document upload and analysis are not available yet/);
  }
});

const expectedPublicPaths = [
  "/",
  "/platform",
  "/free-tier/calculator",
  "/founder",
  "/why-choose",
];

const sitemapNamespace = "http://www.sitemaps.org/schemas/sitemap/0.9";
const sitemapParser = new XMLParser({
  ignoreAttributes: false,
  ignorePiTags: true,
});

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

function parseSitemap(xml: string): SitemapEntry[] {
  const validation = XMLValidator.validate(xml);
  assert.equal(
    validation,
    true,
    `sitemap must be well-formed XML${validation === true ? "" : `: ${validation.err.msg}`}`,
  );

  const document = sitemapParser.parse(xml) as Record<string, unknown>;
  assert.deepEqual(Object.keys(document), ["urlset"], "sitemap must have one urlset root");
  const root = document.urlset;
  assert.ok(typeof root === "object" && root !== null && !Array.isArray(root));

  const urlset = root as Record<string, unknown>;
  assert.equal(
    urlset["@_xmlns"],
    sitemapNamespace,
    "urlset must use the sitemap protocol namespace",
  );
  assert.deepEqual(
    Object.keys(urlset).filter((key) => !key.startsWith("@_")),
    ["url"],
    "urlset must contain URL entries",
  );

  const rawEntries = Array.isArray(urlset.url)
    ? urlset.url
    : urlset.url === undefined
      ? []
      : [urlset.url];
  assert.ok(rawEntries.length > 0, "sitemap must contain at least one URL entry");

  return rawEntries.map((rawEntry, index) => {
    assert.ok(
      typeof rawEntry === "object" && rawEntry !== null && !Array.isArray(rawEntry),
      `sitemap URL entry ${index + 1} must be an object`,
    );
    const entry = rawEntry as Record<string, unknown>;
    assert.ok(
      typeof entry.loc === "string" && entry.loc.trim().length > 0,
      `sitemap URL entry ${index + 1} must have a non-empty loc`,
    );
    assert.ok(
      entry.lastmod === undefined || typeof entry.lastmod === "string",
      `sitemap URL entry ${index + 1} lastmod must be text`,
    );

    return {
      loc: entry.loc as string,
      lastmod: entry.lastmod as string | undefined,
    };
  });
}

const sitemapEntries = parseSitemap(readFileSync("client/public/sitemap.xml", "utf8"));
const sitemapUrls = sitemapEntries.map(({ loc }) => loc);
const appSource = readFileSync("client/src/App.tsx", "utf8");
const appRoutePaths = [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map(
  (match) => match[1].replace(/\/\*.*$/, ""),
);

test("every route and initial HTML use the exact sitewide search and social copy", () => {
  const template = readFileSync("client/index.html", "utf8");
  for (const path of [...appRoutePaths, "/missing-page"]) {
    const metadata = resolvePageMetadata(path);
    assert.equal(metadata.title, "MarginMix - Margin Visibility");
    assert.equal(metadata.description, "Catch your Margin Leak before it hits your books.");
    assert.equal(metadata.openGraph.title, metadata.title);
    assert.equal(metadata.openGraph.description, metadata.description);
    assert.equal(metadata.twitter.title, metadata.title);
    assert.equal(metadata.twitter.description, metadata.description);
    const html = injectCrawlerPage(template, path);
    assert.ok(html.includes(`<title>${metadata.title}</title>`));
    assert.ok(html.includes(`<meta name="description" content="${metadata.description}"`));
  }
  assert.ok(template.includes("<title>MarginMix - Margin Visibility</title>"));
  assert.ok(template.includes('content="Catch your Margin Leak before it hits your books."'));
});

test("sitemap must be well-formed XML with the required URL-set structure", () => {
  const namespace = `xmlns="${sitemapNamespace}"`;

  assert.throws(
    () => parseSitemap(`<urlset ${namespace}><url></urlset>`),
    /well-formed XML/,
  );
  assert.throws(() => parseSitemap("<sitemap />"), /one urlset root/);
  assert.throws(
    () => parseSitemap(`<urlset ${namespace}><url><changefreq>weekly</changefreq></url></urlset>`),
    /non-empty loc/,
  );
});

test("indexable public pages keep canonical social tags with sitewide metadata", () => {
  const indexablePaths = Object.entries(publicPages)
    .filter(([, metadata]) => metadata.indexable)
    .map(([path]) => path)
    .sort();

  assert.deepEqual(indexablePaths, [...expectedPublicPaths].sort());

  for (const path of indexablePaths) {
    const metadata = resolvePageMetadata(path);
    assert.ok(metadata.title.trim(), `${path} must have a title`);
    assert.ok(metadata.description.trim(), `${path} must have a description`);
    assert.equal(metadata.title, "MarginMix - Margin Visibility");
    assert.equal(metadata.description, "Catch your Margin Leak before it hits your books.");

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

test("indexable pages reference existing social preview images", async () => {
  const publicAssetsRoot = resolve(process.cwd(), "client/public");
  const imageUrls = new Set<string>();

  for (const path of expectedPublicPaths) {
    const metadata = resolvePageMetadata(path);

    for (const [platform, image] of [
      ["Open Graph", metadata.openGraph.image],
      ["Twitter", metadata.twitter.image],
    ] as const) {
      assert.equal(
        image,
        socialImage,
        `${path} ${platform} image must use the configured social image`,
      );

      const url = new URL(image);
      assert.ok(
        url.protocol === "https:" || url.protocol === "http:",
        `${path} ${platform} image must use HTTP or HTTPS`,
      );
      imageUrls.add(url.href);
    }
  }

  for (const image of imageUrls) {
    const url = new URL(image);
    if (url.origin === siteOrigin) {
      const assetPath = resolve(publicAssetsRoot, `.${decodeURIComponent(url.pathname)}`);
      assert.ok(
        assetPath.startsWith(`${publicAssetsRoot}${sep}`),
        `social image path must stay inside client/public: ${image}`,
      );
      assert.ok(
        existsSync(assetPath),
        `social image asset does not exist: ${assetPath}`,
      );
      continue;
    }

    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8_000),
    });
    assert.ok(
      response.ok,
      `external social image must respond successfully: ${image} (${response.status})`,
    );
    assert.match(
      response.headers.get("content-type") ?? "",
      /^image\//i,
      `external social image must return an image content type: ${image}`,
    );
  }
});

test("sitemap contains every canonical public page and no private or form routes", () => {
  const expectedUrls = expectedPublicPaths
    .map((path) => `${siteOrigin}${path}`)
    .sort();
  assert.deepEqual([...sitemapUrls].sort(), expectedUrls);

  const lastModifiedDates = sitemapEntries.map(({ lastmod }) => lastmod);
  assert.equal(lastModifiedDates.length, sitemapUrls.length);
  for (const date of lastModifiedDates) {
    assert.ok(date, "every sitemap URL must have a lastmod date");
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
  assert.match(html, /<title>MarginMix - Margin Visibility<\/title>/);
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
