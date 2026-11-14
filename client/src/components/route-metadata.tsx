import { useEffect } from "react";
import { useLocation } from "wouter";
import { resolvePageMetadata } from "@/lib/route-metadata";

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(url?: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!url) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

export function RouteMetadata() {
  const [location] = useLocation();
  const normalizedPath =
    location.length > 1 ? location.replace(/\/+$/, "") : location;
  const metadata = resolvePageMetadata(normalizedPath);

  useEffect(() => {
    document.title = metadata.title;
    setMeta('meta[name="description"]', "name", "description", metadata.description);
    setMeta('meta[name="robots"]', "name", "robots", metadata.robots);
    setCanonical(metadata.canonicalUrl);
    setMeta('meta[property="og:type"]', "property", "og:type", metadata.openGraph.type);
    setMeta('meta[property="og:url"]', "property", "og:url", metadata.openGraph.url);
    setMeta('meta[property="og:title"]', "property", "og:title", metadata.openGraph.title);
    setMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      metadata.openGraph.description,
    );
    setMeta('meta[property="og:image"]', "property", "og:image", metadata.openGraph.image);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", metadata.twitter.card);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", metadata.twitter.title);
    setMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      metadata.twitter.description,
    );
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", metadata.twitter.image);
  }, [metadata]);

  return null;
}
