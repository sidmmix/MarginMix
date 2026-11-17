import { XMLParser, XMLValidator } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  ignorePiTags: true,
});

export function assertValidSitemapXml(xml: string): void {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new Error(`Sitemap must be well-formed XML: ${validation.err.msg}`);
  }

  const document = parser.parse(xml) as Record<string, unknown>;
  if (
    Object.keys(document).length !== 1 ||
    !Object.hasOwn(document, "urlset") ||
    typeof document.urlset !== "object" ||
    document.urlset === null ||
    Array.isArray(document.urlset)
  ) {
    throw new Error("Sitemap must have one urlset root.");
  }
}

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

type TextRange = { start: number; end: number };

function textValue(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "#text" in value) {
    const text = (value as { "#text"?: unknown })["#text"];
    return typeof text === "string" ? text.trim() : undefined;
  }
  return undefined;
}

function parseSitemapEntries(xml: string): SitemapEntry[] {
  assertValidSitemapXml(xml);
  const document = parser.parse(xml) as {
    urlset?: { url?: unknown | unknown[] };
  };
  const root = document.urlset;
  const rawUrls = Array.isArray(root?.url)
    ? root.url
    : root?.url === undefined
      ? []
      : [root.url];
  if (rawUrls.length === 0) throw new Error("Sitemap must contain URL entries.");

  return rawUrls.map((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`Sitemap URL entry ${index + 1} must be an element.`);
    }
    const entry = raw as { loc?: unknown; lastmod?: unknown };
    const loc = textValue(entry.loc);
    const lastmod = entry.lastmod === undefined ? undefined : textValue(entry.lastmod);
    if (!loc) throw new Error(`Sitemap URL entry ${index + 1} has no location.`);
    if (entry.lastmod !== undefined && !lastmod) {
      throw new Error(`Sitemap URL entry ${index + 1} has an invalid lastmod.`);
    }
    return { loc, lastmod };
  });
}

function findTagEnd(xml: string, start: number): number {
  let quote: "'" | '"' | undefined;
  for (let index = start + 1; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote) {
      if (character === quote) quote = undefined;
    } else if (character === "'" || character === '"') {
      quote = character;
    } else if (character === ">") {
      return index + 1;
    }
  }
  throw new Error("Sitemap contains an unfinished XML tag.");
}

type OrderedNode = {
  [name: string]: OrderedNode[];
  [metadata: symbol]: { startIndex?: number; endIndex?: number };
};

const positionParser = new XMLParser({
  ignorePiTags: true,
  preserveOrder: true,
  captureMetaData: true,
  parseTagValue: false,
});

function lastmodTextRanges(xml: string, node: OrderedNode): TextRange[] {
  const { startIndex, endIndex } = node[XMLParser.getMetaDataSymbol() as symbol] ?? {};
  if (startIndex === undefined || endIndex === undefined) {
    throw new Error("Sitemap lastmod is missing XML source positions.");
  }
  if (node.lastmod.some((child) => Object.keys(child).some((key) => key !== "#text"))) {
    throw new Error("Sitemap lastmod must contain text, not child elements.");
  }

  const ranges: TextRange[] = [];
  const contentEnd = xml.lastIndexOf("</", endIndex);
  // Only scan content inside the element selected by the parser. Comments,
  // processing instructions, and CDATA delimiters are never replacement targets.
  for (let index = findTagEnd(xml, startIndex); index < contentEnd;) {
    if (xml.startsWith("<!--", index)) {
      index = xml.indexOf("-->", index + 4) + 3;
      continue;
    }
    if (xml.startsWith("<?", index)) {
      index = xml.indexOf("?>", index + 2) + 2;
      continue;
    }
    const cdata = xml.startsWith("<![CDATA[", index);
    const start = cdata ? index + 9 : index;
    const next = xml.indexOf(cdata ? "]]>" : "<", start);
    const end = next < 0 ? contentEnd : Math.min(next, contentEnd);
    const text = xml.slice(start, end);
    const trimmed = text.trim();
    if (trimmed) {
      const leading = text.length - text.trimStart().length;
      ranges.push({ start: start + leading, end: start + leading + trimmed.length });
    }
    index = cdata ? end + 3 : end;
  }
  if (!ranges.length) throw new Error("Sitemap lastmod must contain date text.");
  return ranges;
}

function findUrlLastmodRanges(xml: string): TextRange[][][] {
  const document = positionParser.parse(xml) as OrderedNode[];
  const root = document.find((node) => Object.hasOwn(node, "urlset"))!;
  return root.urlset
    .filter((node) => Object.hasOwn(node, "url"))
    .map((node) => node.url
      .filter((child) => Object.hasOwn(child, "lastmod"))
      .map((child) => lastmodTextRanges(xml, child)));
}

export function updateSitemapDates(
  xml: string,
  dates: ReadonlyMap<string, string>,
  siteOrigin: string,
): string {
  const entries = parseSitemapEntries(xml);
  const ranges = findUrlLastmodRanges(xml);
  if (entries.length !== ranges.length) {
    throw new Error("Sitemap URL elements do not match parsed URL entries.");
  }

  const seen = new Set<string>();
  const replacements: Array<TextRange & { value: string }> = [];
  entries.forEach((entry, index) => {
    if (!entry.loc.startsWith(siteOrigin)) {
      throw new Error(`Sitemap URL is outside ${siteOrigin}: ${entry.loc}`);
    }
    const route = entry.loc.slice(siteOrigin.length) || "/";
    const date = dates.get(route);
    if (!date) throw new Error(`No sitemap date source is configured for ${route}`);
    seen.add(route);
    const entryRanges = ranges[index];
    if (entryRanges.length !== 1 || !entry.lastmod) {
      throw new Error(`Sitemap entry must contain exactly one lastmod: ${route}`);
    }
    entryRanges[0].forEach((range, index) => {
      replacements.push({ ...range, value: index === 0 ? date : "" });
    });
  });

  for (const route of dates.keys()) {
    if (!seen.has(route)) throw new Error(`Sitemap is missing the public route ${route}`);
  }

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (updated, replacement) =>
        updated.slice(0, replacement.start) +
        replacement.value +
        updated.slice(replacement.end),
      xml,
    );
}
