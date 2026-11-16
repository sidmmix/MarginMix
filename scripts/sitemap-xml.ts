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

type UrlFrame = { lastmodRanges: TextRange[] };
type TagFrame = {
  name: string;
  contentStart: number;
  url?: UrlFrame;
  parentUrl?: UrlFrame;
};

function findUrlLastmodRanges(xml: string): TextRange[][] {
  const stack: TagFrame[] = [];
  const urls: UrlFrame[] = [];

  for (let index = 0; index < xml.length;) {
    const start = xml.indexOf("<", index);
    if (start < 0) break;

    if (xml.startsWith("<!--", start)) {
      const end = xml.indexOf("-->", start + 4);
      if (end < 0) throw new Error("Sitemap contains an unfinished XML comment.");
      index = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", start)) {
      const end = xml.indexOf("]]>", start + 9);
      if (end < 0) throw new Error("Sitemap contains an unfinished CDATA section.");
      index = end + 3;
      continue;
    }
    if (xml.startsWith("<?", start)) {
      const end = xml.indexOf("?>", start + 2);
      if (end < 0) throw new Error("Sitemap contains an unfinished processing instruction.");
      index = end + 2;
      continue;
    }
    if (xml.startsWith("<!", start)) {
      index = findTagEnd(xml, start);
      continue;
    }

    const end = findTagEnd(xml, start);
    const token = xml.slice(start, end);
    const match = token.match(/^<\s*(\/?)\s*([A-Za-z_:][\w:.-]*)/);
    if (!match) throw new Error("Sitemap contains an invalid XML element.");
    const closing = match[1] === "/";
    const name = match[2];
    const selfClosing = !closing && /\/\s*>$/.test(token);

    if (closing) {
      const frame = stack.pop();
      if (!frame || frame.name !== name) {
        throw new Error(`Sitemap has an unexpected closing element: ${name}.`);
      }
      if (frame.parentUrl) {
        const text = xml.slice(frame.contentStart, start);
        const leading = text.match(/^\s*/)?.[0].length ?? 0;
        const trailing = text.match(/\s*$/)?.[0].length ?? 0;
        frame.parentUrl.lastmodRanges.push({
          start: frame.contentStart + leading,
          end: start - trailing,
        });
      }
      if (frame.url) urls.push(frame.url);
    } else {
      const parent = stack.at(-1);
      const url = name === "url" && parent?.name === "urlset"
        ? { lastmodRanges: [] }
        : undefined;
      const parentUrl = name === "lastmod" && parent?.name === "url"
        ? parent.url
        : undefined;
      const frame: TagFrame = { name, contentStart: end, url, parentUrl };
      if (selfClosing) {
        if (url) urls.push(url);
        if (parentUrl) parentUrl.lastmodRanges.push({ start: end, end });
      } else {
        stack.push(frame);
      }
    }
    index = end;
  }

  return urls.map((url) => url.lastmodRanges);
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
    replacements.push({ ...entryRanges[0], value: date });
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
