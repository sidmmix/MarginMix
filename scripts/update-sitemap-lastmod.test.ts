import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("./update-sitemap-lastmod.ts", import.meta.url));
const tsx = fileURLToPath(import.meta.resolve("tsx"));
const validXml = readFileSync(new URL("../client/public/sitemap.xml", import.meta.url), "utf8")
  .replace(/<lastmod>[^<]+<\/lastmod>/g, "<lastmod>2001-01-01</lastmod>");

function withSitemap(xml: string, run: (root: string, file: string) => void): void {
  const root = mkdtempSync(path.join(tmpdir(), "sitemap-updater-"));
  const file = path.join(root, "client/public/sitemap.xml");
  try {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, xml);
    run(root, file);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function update(root: string, check: boolean) {
  return spawnSync(process.execPath, ["--import", tsx, script, ...(check ? ["--check"] : [])], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      TSX_TSCONFIG_PATH: fileURLToPath(new URL("../tsconfig.json", import.meta.url)),
    },
    timeout: 30_000,
  });
}

const invalidDocuments = [
  ["mismatched closing tag", validXml.replace("</urlset>", "</sitemap>"), /well-formed XML/],
  ["unclosed trailing element", `${validXml}<broken>`, /well-formed XML/],
  ["missing root closing tag", validXml.replace("</urlset>", ""), /well-formed XML/],
  ["multiple roots", `${validXml}<extra />`, /well-formed XML|one urlset root/],
  ["wrong root", validXml.replaceAll("urlset", "sitemap"), /one urlset root/],
] as const;

for (const [name, xml, expectedError] of invalidDocuments) {
  for (const check of [false, true]) {
    test(`${check ? "check" : "update"} rejects ${name} without touching the file`, () => {
      // Deliberately omit Git and page sources: XML validation must happen first.
      withSitemap(xml, (root, file) => {
        const before = readFileSync(file);
        const beforeStat = statSync(file, { bigint: true });
        const result = update(root, check);
        assert.ifError(result.error);
        assert.equal(result.status, 1, result.stderr);
        assert.match(result.stderr, expectedError);
        assert.deepEqual(readFileSync(file), before, "source bytes must remain identical");
        assert.equal(statSync(file, { bigint: true }).mtimeNs, beforeStat.mtimeNs,
          "rejected input must not be written, even with identical contents");
      });
    });
  }
}

test("valid XML preserves formatting, updates dates, and supports read-only checks", () => {
  withSitemap(validXml, (root, file) => {
    const sources = [
      "client/src/App.tsx",
      "client/src/index.css",
      "client/index.html",
      "client/src/lib/route-metadata.ts",
      "client/src/components/route-metadata.tsx",
      "client/src/components/header.tsx",
      "client/src/components/footer.tsx",
      "client/src/components/brand-name.tsx",
      ...["landing", "platform", "free-tier-calculator", "founder", "why-choose"]
        .map((page) => `client/src/pages/${page}.tsx`),
    ];
    for (const source of sources) {
      const target = path.join(root, source);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, "");
    }
    const git = (...args: string[]) => execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: "2020-01-02T12:00:00Z",
        GIT_COMMITTER_DATE: "2020-01-02T12:00:00Z",
      },
    });
    git("init", "--quiet");
    git("add", ".");
    git("-c", "user.name=Sitemap test", "-c", "user.email=sitemap@example.invalid",
      "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Fixture sources");

    const staleCheck = update(root, true);
    assert.ifError(staleCheck.error);
    assert.equal(staleCheck.status, 1, staleCheck.stderr);
    assert.match(staleCheck.stderr, /Sitemap dates are stale/);
    assert.equal(readFileSync(file, "utf8"), validXml);

    const result = update(root, false);
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const expected = validXml.replaceAll("2001-01-01", "2020-01-02");
    assert.equal(readFileSync(file, "utf8"), expected);

    const beforeStat = statSync(file, { bigint: true });
    for (const check of [true, false]) {
      const repeat = update(root, check);
      assert.ifError(repeat.error);
      assert.equal(repeat.status, 0, repeat.stderr);
      assert.equal(readFileSync(file, "utf8"), expected);
      assert.equal(statSync(file, { bigint: true }).mtimeNs, beforeStat.mtimeNs);
    }
  });
});
