import { resolvePageMetadata } from "../client/src/lib/route-metadata";
import {
  engagementJourneyCopy,
  founderPageCopy,
  platformPageCopy,
  whyChoosePageCopy,
} from "../shared/public-page-copy";

const renderParagraph = (text: string) => `<p>${escapeHtml(text)}</p>`;
const renderHeading = (level: number, text: string) =>
  `<h${level}>${escapeHtml(text)}</h${level}>`;

const crawlerPages: Record<string, string> = {
  "/": `
    <main aria-label="MarginMix overview">
      <h1>Make Margin Risk Visible.</h1>
      <p>Pressure test pricing, staffing, and delivery assumptions of an engagement.</p>
      <p>MarginMix is structured decision support for pricing and margin risk. It is not a productivity or time tracking system.</p>
      <h2>Make engagement economics visible before delivery</h2>
      <p>AI is reshaping delivery, while many pricing models have not caught up. MarginMix helps agency and consulting leaders consider the work behind the price before an engagement begins.</p>
      <h2>Consider more than the quoted scope</h2>
      <p>Review staffing assumptions, scope movement, billing signals, senior attention, coordination, and repeated iteration. The goal is to make assumptions visible while decisions can still change.</p>
      <h2>Decision support across commercial models</h2>
      <p>MarginMix is designed for time and materials, fixed price, outcome-based, and hybrid engagements. It supports a clearer pricing conversation; it does not replace financial review or professional judgment.</p>
      <h2>Try the free leak calculator</h2>
      <p>The calculator lets you pressure test engagement assumptions and returns an indicative exposure estimate based on preset rules. It is not an audited loss or a live engagement result.</p>
      ${renderHeading(2, engagementJourneyCopy.title)}
      ${renderParagraph(engagementJourneyCopy.calculator)}
      ${renderParagraph(engagementJourneyCopy.assessment)}
      ${renderParagraph(engagementJourneyCopy.availability)}
    </main>`,
  "/platform": `
    <main aria-label="MarginMix platform">
      <p>MarginMix platform</p>
      ${renderHeading(1, platformPageCopy.headline)}
      ${renderParagraph(platformPageCopy.introduction)}
      ${platformPageCopy.stages.map((stage) => `
      ${renderHeading(2, `${stage.status}: ${stage.title}`)}
      ${renderParagraph(stage.summary)}
      ${renderParagraph(stage.detail)}`).join("")}
      ${renderHeading(2, platformPageCopy.conversationTitle)}
      ${renderParagraph(platformPageCopy.conversationDetail)}
    </main>`,
  "/why-choose": `
    <main aria-label="Why choose MarginMix">
      ${renderParagraph(whyChoosePageCopy.eyebrow)}
      ${renderHeading(1, whyChoosePageCopy.headline)}
      ${whyChoosePageCopy.cards.map((card) => `
      ${renderHeading(2, card.title)}
      ${renderParagraph(card.body)}`).join("")}
    </main>`,
  "/founder": `
    <main aria-label="Why MarginMix exists">
      ${renderParagraph(founderPageCopy.eyebrow)}
      ${renderHeading(1, founderPageCopy.headline)}
      ${renderParagraph(founderPageCopy.introduction)}
      ${renderHeading(2, founderPageCopy.patternTitle)}
      ${renderParagraph(founderPageCopy.pattern)}
      ${renderParagraph(founderPageCopy.patternConclusion)}
      ${renderHeading(2, founderPageCopy.outsideQuoteTitle)}
      <ul>
        ${founderPageCopy.outsideQuote.map(({ title, description }) => `<li>${escapeHtml(title)}: ${escapeHtml(description)}.</li>`).join("")}
      </ul>
      ${renderParagraph(founderPageCopy.patternCallout)}
      ${renderHeading(2, founderPageCopy.decisionTitle)}
      ${renderParagraph(founderPageCopy.decisionSummary)}
      ${founderPageCopy.fullerStory.map(renderParagraph).join("")}
      ${renderHeading(2, founderPageCopy.experienceTitle)}
      ${renderParagraph(founderPageCopy.experienceSummary)}
      ${renderParagraph(founderPageCopy.founderExperience)}
      ${renderParagraph(founderPageCopy.advisorSummary)}
      ${renderParagraph(founderPageCopy.advisorExperience)}
      ${renderHeading(2, founderPageCopy.callToActionTitle)}
    </main>`,
};

export function injectCrawlerPage(template: string, pathname: string): string {
  const normalizedPath =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const page = crawlerPages[normalizedPath];
  const metadata = resolvePageMetadata(normalizedPath);

  let html = template.replace("<!-- CRAWLER_PAGE_CONTENT -->", page ?? "");
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`);
  html = replaceMeta(html, "name", "description", metadata.description);
  html = replaceMeta(html, "name", "robots", metadata.robots);
  html = replaceMeta(html, "property", "og:type", metadata.openGraph.type);
  html = replaceMeta(html, "property", "og:url", metadata.openGraph.url);
  html = replaceMeta(html, "property", "og:title", metadata.openGraph.title);
  html = replaceMeta(html, "property", "og:description", metadata.openGraph.description);
  html = replaceMeta(html, "property", "og:image", metadata.openGraph.image);
  html = replaceMeta(html, "name", "twitter:card", metadata.twitter.card);
  html = replaceMeta(html, "name", "twitter:title", metadata.twitter.title);
  html = replaceMeta(html, "name", "twitter:description", metadata.twitter.description);
  html = replaceMeta(html, "name", "twitter:image", metadata.twitter.image);

  const canonicalTag = /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;
  if (metadata.canonicalUrl) {
    const link = `<link rel="canonical" href="${escapeHtml(metadata.canonicalUrl)}" />`;
    html = canonicalTag.test(html)
      ? html.replace(canonicalTag, link)
      : html.replace("</head>", `    ${link}\n  </head>`);
  } else {
    html = html.replace(canonicalTag, "");
  }

  html = html.replace(
    /<script\b(?=[^>]*\bid=["']route-page-structured-data["'])[^>]*>[\s\S]*?<\/script>/i,
    "",
  );
  if (metadata.structuredData) {
    const jsonLd = JSON.stringify(metadata.structuredData).replace(/</g, "\\u003c");
    html = html.replace(
      "</head>",
      `    <script id="route-page-structured-data" type="application/ld+json">${jsonLd}</script>\n  </head>`,
    );
  }
  return html;
}

function replaceMeta(
  html: string,
  attribute: "name" | "property",
  key: string,
  content: string,
): string {
  const tagPattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${attribute}=["']${escapeRegExp(key)}["'])[^>]*>`,
    "i",
  );
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`;
  return html.replace(tagPattern, tag);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
