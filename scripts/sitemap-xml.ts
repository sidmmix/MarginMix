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
