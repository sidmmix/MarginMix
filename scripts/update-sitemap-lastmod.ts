import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { publicPages, siteOrigin } from "../client/src/lib/route-metadata";
import { assertValidSitemapXml } from "./sitemap-xml";

const root = process.cwd();
const sitemapPath = "client/public/sitemap.xml";
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".html"]);
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".css", ".json"];
const sharedSources = [
  "client/src/App.tsx",
  "client/src/index.css",
  "client/index.html",
  "client/src/lib/route-metadata.ts",
  "client/src/components/route-metadata.tsx",
  "client/src/components/header.tsx",
  "client/src/components/footer.tsx",
  "client/src/components/brand-name.tsx",
];
const pageSources: Record<string, string> = {
  "/": "client/src/pages/landing.tsx",
  "/platform": "client/src/pages/platform.tsx",
  "/free-tier/calculator": "client/src/pages/free-tier-calculator.tsx",
  "/founder": "client/src/pages/founder.tsx",
  "/why-choose": "client/src/pages/why-choose.tsx",
};

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function ensureGitRepository(): void {
  try {
    git("rev-parse", "--is-inside-work-tree");
  } catch {
    throw new Error("Sitemap dates require Git history; run this script from the project repository.");
  }
}

function changedPaths(): Set<string> {
  const status = execFileSync(
    "git",
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    { cwd: root, encoding: "utf8" },
  );
  const paths = new Set<string>();
  const entries = status.split("\0").filter(Boolean);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    paths.add(entry.slice(3).replaceAll("\\", "/"));
    if (/^[RC]/.test(entry.slice(0, 2)) && entries[index + 1]) {
      paths.add(entries[index + 1].replaceAll("\\", "/"));
      index += 1;
    }
  }

  return paths;
}

function resolveImport(importer: string, specifier: string): string | undefined {
  let resolved: string;
  if (specifier.startsWith("@/")) {
    resolved = path.resolve(root, "client/src", specifier.slice(2));
  } else if (specifier.startsWith("@shared/")) {
    resolved = path.resolve(root, "shared", specifier.slice("@shared/".length));
  } else if (specifier.startsWith("@assets/")) {
    resolved = path.resolve(root, "attached_assets", specifier.slice("@assets/".length));
  } else if (specifier.startsWith(".")) {
    resolved = path.resolve(root, path.dirname(importer), specifier);
  } else {
    return undefined;
  }

  const candidates = [resolved, ...sourceExtensions.map((extension) => `${resolved}${extension}`)];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return path.relative(root, candidate).replaceAll("\\", "/");
    }
  }

  for (const extension of sourceExtensions) {
    const indexFile = path.join(resolved, `index${extension}`);
    if (existsSync(indexFile)) return path.relative(root, indexFile).replaceAll("\\", "/");
  }

  return undefined;
}

function collectPageSources(entry: string): Set<string> {
  const found = new Set<string>();
  const pending = [entry, ...sharedSources];

  while (pending.length) {
    const current = pending.pop()!;
    if (found.has(current)) continue;
    found.add(current);

    const absolutePath = path.resolve(root, current);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      throw new Error(`Sitemap source file is missing: ${current}`);
    }

    const extension = path.extname(current).toLowerCase();
    if (!codeExtensions.has(extension)) continue;
    const contents = readFileSync(absolutePath, "utf8");

    for (const match of contents.matchAll(
      /(?:\bfrom\s*|\bimport\s*)["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/g,
    )) {
      const dependency = resolveImport(current, match[1] ?? match[2]);
      if (dependency) pending.push(dependency);
    }

    for (const match of contents.matchAll(/["'`]\/([^"'`?#]+\.(?:svg|png|jpe?g|webp|ico|woff2?))["'`]/gi)) {
      const asset = `client/public/${match[1]}`;
      if (existsSync(path.resolve(root, asset))) found.add(asset);
    }
  }

  return found;
}

function newestCommitDate(files: string[]): string {
  const result = git("log", "-1", "--format=%cs", "HEAD", "--", ...files);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) {
    throw new Error(`No Git change date found for sitemap sources: ${files.join(", ")}`);
  }
  return result;
}

function latestPageDate(files: Set<string>, dirtyPaths: Set<string>): string {
  if ([...files].some((file) => dirtyPaths.has(file))) {
    return new Date().toISOString().slice(0, 10);
  }
  return newestCommitDate([...files]);
}

function updateSitemap(xml: string, dates: Map<string, string>): string {
  assertValidSitemapXml(xml);
  const seen = new Set<string>();
  const updated = xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
    const location = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (!location?.startsWith(siteOrigin)) {
      throw new Error(`Sitemap URL is missing or outside ${siteOrigin}`);
    }
    const route = location.slice(siteOrigin.length) || "/";
    const date = dates.get(route);
    if (!date) throw new Error(`No sitemap date source is configured for ${route}`);
    seen.add(route);
    if (!/<lastmod>[^<]+<\/lastmod>/.test(block)) {
      throw new Error(`Sitemap entry is missing lastmod: ${route}`);
    }
    return block.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${date}</lastmod>`);
  });

  for (const route of dates.keys()) {
    if (!seen.has(route)) throw new Error(`Sitemap is missing the public route ${route}`);
  }
  return updated;
}

function main(): void {
  ensureGitRepository();
  const indexableRoutes = Object.entries(publicPages)
    .filter(([, metadata]) => metadata.indexable)
    .map(([route]) => route)
    .sort();
  const configuredRoutes = Object.keys(pageSources).sort();
  if (JSON.stringify(indexableRoutes) !== JSON.stringify(configuredRoutes)) {
    throw new Error(
      `Sitemap date sources must match indexable routes. Public: ${indexableRoutes.join(", ")}. Configured: ${configuredRoutes.join(", ")}.`,
    );
  }

  const dirtyPaths = changedPaths();
  const dates = new Map(
    Object.entries(pageSources).map(([route, entry]) => [
      route,
      latestPageDate(collectPageSources(entry), dirtyPaths),
    ]),
  );
  const original = readFileSync(path.resolve(root, sitemapPath), "utf8");
  const updated = updateSitemap(original, dates);

  if (process.argv.includes("--check")) {
    if (updated !== original) {
      throw new Error("Sitemap dates are stale. Run `npm run sitemap:update` to refresh them.");
    }
    console.log("Sitemap dates match the latest public-page source changes.");
    return;
  }

  if (updated !== original) writeFileSync(path.resolve(root, sitemapPath), updated);
  console.log("Updated sitemap dates from public-page Git history.");
}

main();
