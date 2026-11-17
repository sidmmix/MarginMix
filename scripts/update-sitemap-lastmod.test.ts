import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { siteOrigin } from "../client/src/lib/route-metadata";
import { updateSitemapDates } from "./sitemap-xml";

const script = fileURLToPath(new URL("./update-sitemap-lastmod.ts", import.meta.url));
const tsx = fileURLToPath(import.meta.resolve("tsx"));
const validXml = readFileSync(new URL("../client/public/sitemap.xml", import.meta.url), "utf8")
  .replace(/<lastmod>[^<]+<\/lastmod>/g, "<lastmod>2001-01-01</lastmod>");
const sourceFixturePaths = [
  "client/src/App.tsx",
  "client/src/index.css",
  "client/index.html",
  "client/src/lib/route-metadata.ts",
  "client/src/components/route-metadata.tsx",
  "client/src/components/header.tsx",
  "client/src/components/footer.tsx",
  "client/src/components/brand-name.tsx",
  "client/src/components/page-shared.tsx",
  ...["landing", "platform", "free-tier-calculator", "founder", "why-choose"]
    .map((page) => `client/src/pages/${page}.tsx`),
];

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

function fixtureGit(root: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Sitemap test",
      GIT_AUTHOR_EMAIL: "sitemap@example.invalid",
      GIT_COMMITTER_NAME: "Sitemap test",
      GIT_COMMITTER_EMAIL: "sitemap@example.invalid",
      GIT_AUTHOR_DATE: "2020-01-02T12:00:00Z",
      GIT_COMMITTER_DATE: "2020-01-02T12:00:00Z",
    },
  });
}

function withDependencyFixture(run: (root: string, file: string) => void): void {
  withSitemap(validXml, (root, file) => {
    for (const source of sourceFixturePaths) {
      const target = path.join(root, source);
      mkdirSync(path.dirname(target), { recursive: true });
      const contents = source.endsWith("/landing.tsx")
        ? 'import { shared } from "@/components/page-shared";\nexport const page = shared;\n'
        : source.endsWith("/platform.tsx")
          ? 'export { shared as page } from "../components/page-shared";\n'
          : source.endsWith("/page-shared.tsx")
            ? 'export { value as shared } from "./page-value";\n'
            : "";
      writeFileSync(target, contents);
    }
    fixtureGit(root, "init", "--quiet");
    fixtureGit(root, "add", ".");
    fixtureGit(root, "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Base pages");
    run(root, file);
  });
}

function assertUpdatedDates(root: string, file: string, overrides: Record<string, string> = {}): void {
  const expectedDates = new Map([
    ["/", "2020-01-02"],
    ["/platform", "2020-01-02"],
    ["/founder", "2020-01-02"],
    ["/why-choose", "2020-01-02"],
    ["/free-tier/calculator", "2020-01-02"],
    ...Object.entries(overrides),
  ]);
  const result = update(root, false);
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(file, "utf8"), updateSitemapDates(validXml, expectedDates, siteOrigin));
  const checked = update(root, true);
  assert.ifError(checked.error);
  assert.equal(checked.status, 0, checked.stderr);
}

for (const state of ["unstaged", "staged", "untracked"] as const) {
  test(`${state} shared dependency changes use today's UTC date only for importing pages`, () => {
    withDependencyFixture((root, file) => {
      // Both pages reach this dependency indirectly, through an alias or a relative re-export.
      const dependency = "client/src/components/page-value.ts";
      if (state !== "untracked") {
        writeFileSync(path.join(root, dependency), "export const value = 'original';\n");
        fixtureGit(root, "add", dependency);
        fixtureGit(root, "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Base dependency");
      }
      writeFileSync(path.join(root, dependency), "export const value = 'changed';\n");
      if (state === "staged") fixtureGit(root, "add", dependency);

      const before = new Date().toISOString().slice(0, 10);
      const result = update(root, false);
      const after = new Date().toISOString().slice(0, 10);
      assert.ifError(result.error);
      assert.equal(result.status, 0, result.stderr);
      const actual = readFileSync(file, "utf8");
      // Allow a run crossing UTC midnight, without accepting any other date.
      assert.ok([before, after].some((date) => actual === updateSitemapDates(validXml, new Map([
        ["/", date],
        ["/platform", date],
        ["/founder", "2020-01-02"],
        ["/why-choose", "2020-01-02"],
        ["/free-tier/calculator", "2020-01-02"],
      ]), siteOrigin)), "only importing pages should receive the current UTC date");
    });
  });
}

test("unrelated committed, unstaged, staged, and untracked files leave every page date unchanged", () => {
  withDependencyFixture((root, file) => {
    const unrelated = "client/src/components/unused.tsx";
    writeFileSync(path.join(root, unrelated), "export const unused = 'original';\n");
    fixtureGit(root, "add", unrelated);
    // A newer commit must not supersede the older, relevant page history.
    execFileSync("git", [
      "-c", "user.name=Sitemap test", "-c", "user.email=sitemap@example.invalid",
      "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Unrelated component",
    ], {
      cwd: root,
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: "2020-05-06T12:00:00Z",
        GIT_COMMITTER_DATE: "2020-05-06T12:00:00Z",
      },
    });
    assert.equal(fixtureGit(root, "log", "-1", "--format=%cs").trim(), "2020-05-06");
    assertUpdatedDates(root, file);
    const before = readFileSync(file);
    const beforeStat = statSync(file, { bigint: true });

    writeFileSync(path.join(root, unrelated), "export const unused = 'modified';\n");
    assertUpdatedDates(root, file);
    fixtureGit(root, "add", unrelated);
    assertUpdatedDates(root, file);
    writeFileSync(path.join(root, "README.md"), "Untracked unrelated content.\n");
    assertUpdatedDates(root, file);
    assert.deepEqual(readFileSync(file), before);
    assert.equal(statSync(file, { bigint: true }).mtimeNs, beforeStat.mtimeNs,
      "unrelated changes must not cause a sitemap rewrite");
  });
});

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
    for (const source of sourceFixturePaths) {
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

test("updates only the changed page and its imported shared component dependents", () => {
  withSitemap(validXml, (root, file) => {
    for (const source of sourceFixturePaths) {
      const target = path.join(root, source);
      mkdirSync(path.dirname(target), { recursive: true });
      const contents =
        source === "client/src/pages/landing.tsx" ||
        source === "client/src/pages/platform.tsx"
          ? 'import { shared } from "../components/page-shared";\nexport const page = shared;\n'
          : "";
      writeFileSync(target, contents);
    }

    const git = (...args: string[]) => execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ...gitIdentity },
    });
    const commit = (date: string, message: string, paths?: string[]) => {
      git("add", ...(paths?.length ? paths : ["."]));
      execFileSync(
        "git",
        ["-c", "user.name=Sitemap test", "-c", "user.email=sitemap@example.invalid",
          "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", message],
        {
          cwd: root,
          encoding: "utf8",
          env: {
            ...process.env,
            ...gitIdentity,
            GIT_AUTHOR_DATE: date,
            GIT_COMMITTER_DATE: date,
          },
        },
      );
    };
    const gitIdentity = {
      GIT_AUTHOR_NAME: "Sitemap test",
      GIT_AUTHOR_EMAIL: "sitemap@example.invalid",
      GIT_COMMITTER_NAME: "Sitemap test",
      GIT_COMMITTER_EMAIL: "sitemap@example.invalid",
    };

    execFileSync("git", ["init", "--quiet"], { cwd: root });
    commit("2020-01-02T12:00:00Z", "Base pages");

    writeFileSync(
      path.join(root, "client/src/pages/landing.tsx"),
      'import { shared } from "../components/page-shared";\nexport const page = `${shared} home update`;\n',
    );
    commit("2020-02-01T12:00:00Z", "Update homepage", ["client/src/pages/landing.tsx"]);
    const homeUpdate = update(root, false);
    assert.ifError(homeUpdate.error);
    assert.equal(homeUpdate.status, 0, homeUpdate.stderr);

    const dateMap = () => {
      const xml = readFileSync(file, "utf8");
      return Object.fromEntries(
        [...xml.matchAll(/<url\b[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)]
          .map((match) => [new URL(match[1]).pathname || "/", match[2]]),
      );
    };
    assert.deepEqual(dateMap(), {
      "/": "2020-02-01",
      "/platform": "2020-01-02",
      "/founder": "2020-01-02",
      "/why-choose": "2020-01-02",
      "/free-tier/calculator": "2020-01-02",
    });

    writeFileSync(
      path.join(root, "client/src/components/page-shared.tsx"),
      "export const shared = 'shared update';\n",
    );
    commit("2020-03-01T12:00:00Z", "Update shared component",
      ["client/src/components/page-shared.tsx"]);
    const sharedUpdate = update(root, false);
    assert.ifError(sharedUpdate.error);
    assert.equal(sharedUpdate.status, 0, sharedUpdate.stderr);
    assert.deepEqual(dateMap(), {
      "/": "2020-03-01",
      "/platform": "2020-03-01",
      "/founder": "2020-01-02",
      "/why-choose": "2020-01-02",
      "/free-tier/calculator": "2020-01-02",
    });

    const founderPath = path.join(root, "client/src/pages/founder.tsx");
    writeFileSync(founderPath, "export const founder = 'uncommitted';\n");
    const uncommittedUpdate = update(root, false);
    assert.ifError(uncommittedUpdate.error);
    assert.equal(uncommittedUpdate.status, 0, uncommittedUpdate.stderr);
    const todayUtc = new Date().toISOString().slice(0, 10);
    assert.deepEqual(dateMap(), {
      "/": "2020-03-01",
      "/platform": "2020-03-01",
      "/founder": todayUtc,
      "/why-choose": "2020-01-02",
      "/free-tier/calculator": "2020-01-02",
    });

    writeFileSync(path.join(root, "README.md"), "Unrelated file change.");
    const before = readFileSync(file);
    const beforeStat = statSync(file, { bigint: true });
    const unrelatedUpdate = update(root, false);
    assert.ifError(unrelatedUpdate.error);
    assert.equal(unrelatedUpdate.status, 0, unrelatedUpdate.stderr);
    assert.deepEqual(readFileSync(file), before);
    assert.equal(statSync(file, { bigint: true }).mtimeNs, beforeStat.mtimeNs);
  });
});

test("updates XML elements despite attributes and preserves comments and whitespace", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="${"http://www.sitemaps.org/schemas/sitemap/0.9"}" data-version="1">
  <!-- <url><loc>https://marginmix.ai/fake</loc><lastmod>1999-01-01</lastmod></url> -->
  <url data-id="home">
    <loc>https://marginmix.ai/</loc>
    <lastmod source="fixture"> 2001-01-01 </lastmod>
    <changefreq>weekly</changefreq>
  </url>
</urlset>`;

  const updated = updateSitemapDates(xml, new Map([["/", "2025-04-03"]]), siteOrigin);
  assert.equal(
    updated,
    xml.replace("2001-01-01", "2025-04-03"),
    "only the parsed lastmod text should change",
  );
});

const formattingFixtures = [
  ["whitespace in opening and closing tags", (xml: string) => xml
    .replaceAll("<url>", "<url \n\t>")
    .replaceAll("</url>", "</url \t>")
    .replaceAll("<lastmod>", "<lastmod \n > \t")
    .replaceAll("</lastmod>", " \r\n</lastmod \t>")],
  ["attributes containing greater-than signs", (xml: string) => xml
    .replaceAll("<url>", '<url data-note="a > b" data-other=\'c > d\'>')
    .replaceAll("<lastmod>", '<lastmod source="fixture" data-note="x > y">')],
  ["tag-shaped comments before and inside entries", (xml: string) => xml
    .replaceAll("</lastmod>", '<!-- </url> fake closing tag --></lastmod>')
    .replaceAll("<lastmod>", '<!-- <lastmod>1999-01-01</lastmod> -->\n<lastmod>')
    .replaceAll("<url>", '<!-- <url><loc>fake</loc></url> -->\n<url>')
    .replace("<urlset ", '<!-- <url><lastmod>1999-01-01</lastmod></url> -->\n<urlset ')],
  ["CDATA, processing instructions, extensions and CRLF", (xml: string) => xml
    .replaceAll("<url>", '<url><?note sample="<lastmod>fake</lastmod>"?>')
    .replaceAll("<lastmod>2001-01-01</lastmod>",
      '<lastmod><![CDATA[ 2001-01-01 ]]></lastmod><extra><![CDATA[<url><lastmod>fake</lastmod></url>]]></extra>')
    .replaceAll("\n", "\r\n")],
] as const;

for (const [name, format] of formattingFixtures) {
  test(`updates parsed dates with ${name} without rewriting unrelated bytes`, () => {
    const xml = format(validXml);
    // Use different dates to catch accidental misalignment between parsed URLs.
    const dates = new Map([
      ["/", "2025-01-01"],
      ["/platform", "2025-02-02"],
      ["/founder", "2025-03-03"],
      ["/why-choose", "2025-04-04"],
      ["/free-tier/calculator", "2025-05-05"],
    ]);
    const expected = format(validXml.replace(
      /<loc>([^<]+)<\/loc>(\s*)<lastmod>2001-01-01<\/lastmod>/g,
      (_, loc, whitespace) =>
        `<loc>${loc}</loc>${whitespace}<lastmod>${dates.get(new URL(loc).pathname)}</lastmod>`,
    ));
    // Apply CDATA wrapping to all date values in the expected document too.
    const expectedFormatted = name.startsWith("CDATA")
      ? expected.replace(/<lastmod>(2025-[\d-]+)<\/lastmod>/g,
        '<lastmod><![CDATA[ $1 ]]></lastmod><extra><![CDATA[<url><lastmod>fake</lastmod></url>]]></extra>')
      : expected;
    assert.equal(updateSitemapDates(xml, dates, siteOrigin), expectedFormatted);
    assert.equal(updateSitemapDates(expectedFormatted, dates, siteOrigin), expectedFormatted,
      "repeated updates should preserve every byte");
  });
}

test("preserves comments and processing instructions within the lastmod text", () => {
  const xml = `<urlset><url><loc>${siteOrigin}/</loc>
<lastmod> <!-- before -->2001-<?keep unchanged?>01<!-- middle -->-01<!-- after --> </lastmod>
</url></urlset>`;
  const expected = xml.replace("2001-", "2025-06-07").replace("01<!-- middle -->-01", "<!-- middle -->");
  assert.equal(updateSitemapDates(xml, new Map([["/", "2025-06-07"]]), siteOrigin), expected);
});

test("formatted XML works through stale checks, updates, and no-op checks", () => {
  withDependencyFixture((root, file) => {
    const xml = validXml
      .replaceAll("<url>", '<!-- <url>fake</url> -->\r\n<url \n data-note="a > b">')
      .replaceAll("<lastmod>2001-01-01</lastmod>",
        '<lastmod \n source="fixture"> <!-- <lastmod>2001-01-01</lastmod> -->\r\n<![CDATA[ 2001-01-01 ]]></lastmod \t>');
    writeFileSync(file, xml);
    const before = statSync(file, { bigint: true }).mtimeNs;
    const stale = update(root, true);
    assert.equal(stale.status, 1, stale.stderr);
    assert.match(stale.stderr, /Sitemap dates are stale/);
    assert.equal(readFileSync(file, "utf8"), xml);
    assert.equal(statSync(file, { bigint: true }).mtimeNs, before);

    const updated = update(root, false);
    assert.equal(updated.status, 0, updated.stderr);
    // This fixture's fake comments use the same date deliberately.
    const expected = xml.replace(/(?<=CDATA\[ )2001-01-01(?= \]\]>)/g, "2020-01-02");
    assert.equal(readFileSync(file, "utf8"), expected);
    const after = statSync(file, { bigint: true }).mtimeNs;
    for (const check of [true, false]) {
      const result = update(root, check);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(readFileSync(file, "utf8"), expected);
      assert.equal(statSync(file, { bigint: true }).mtimeNs, after);
    }
  });
});

for (const lastmod of [
  "",
  "<lastmod/>",
  "<lastmod> </lastmod>",
  "<lastmod>2001-01-01</lastmod><lastmod>2002-01-01</lastmod>",
  "<lastmod>2001-01-01<extra>do not erase</extra></lastmod>",
]) {
  test(`rejects missing, empty, duplicate or nested lastmod: ${lastmod}`, () => {
    const xml = `<urlset><url><loc>${siteOrigin}/</loc>${lastmod}</url></urlset>`;
    assert.throws(() => updateSitemapDates(xml, new Map([["/", "2025-06-07"]]), siteOrigin), /lastmod/);
  });
}
