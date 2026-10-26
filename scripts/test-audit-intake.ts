/**
 * End-to-end smoke test using synthetic data only.
 * Run against the configured development workflow: npx tsx scripts/test-audit-intake.ts
 * Chromium is supplied by the Replit environment; no browser download is needed.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { randomUUID } from "node:crypto";
import { getVisibleQuestions, type AuditAnswers } from "../shared/audit-questionnaire";
import { db, pool } from "../server/db";
import { auditSubmissions } from "../shared/schema";
import { eq } from "drizzle-orm";
import { saveAuditSubmission } from "../server/audit-storage";
import { createAuditSubmissionHandler } from "../server/audit-intake";
import { renderAuditResponsesPDF } from "../server/audit-pdf";
import { buildAuditQuestionnaireEmail } from "../server/audit-email";

const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
const id = randomUUID();
let persisted = false;
try {
  await page.goto(`${base}/audit-questions`);
  await page.getByRole("heading", { name: "First, what’s your name?" }).waitFor();
  if (await page.getByRole("button", { name: "Decline", exact: true }).isVisible()) await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Please answer" }).waitFor();
  await page.getByRole("textbox", { name: "First, what’s your name?" }).fill("Synthetic Audit Test");
  await page.getByRole("textbox", { name: "First, what’s your name?" }).press("Enter");
  await page.getByRole("textbox", { name: "What’s your email address?" }).fill("not-an-email");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "valid email" }).waitFor();
  await page.getByRole("textbox", { name: "What’s your email address?" }).fill("audit-smoke@example.invalid");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "What’s your agency’s name?" }).fill("Synthetic Agency");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "What should we call this engagement?" }).fill("Synthetic smoke engagement");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Marketing, creative or media", { exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Fixed fee / fixed price", { exact: true }).check();
  await page.getByLabel("Retainer", { exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Reviewing an active engagement", { exact: true }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Add row", exact: true }).click();
  await page.getByLabel("Engagement start, row 1", { exact: true }).fill("2026-01-01");
  await page.getByLabel("Expected end / next review, row 1", { exact: true }).fill("2026-12-31");
  await page.getByLabel("Assessment period start, row 1", { exact: true }).fill("2026-10-01");
  await page.getByLabel("Assessment period end, row 1", { exact: true }).fill("2026-10-31");
  await page.waitForTimeout(400); // debounce draft write, not a server-readiness poll
  await page.reload();
  await page.getByRole("heading", { name: "What period should we assess?" }).waitFor();
  assert.equal(await page.getByLabel("Engagement start, row 1", { exact: true }).inputValue(), "2026-01-01");
  assert.equal(await page.getByRole("button", { name: /First, what’s your name\?:/ }).count(), 0, "Contact question must not be a heatmap cell");
  await page.getByRole("button", { name: /How do your commercial components interact\?:/ }).click();
  await page.getByRole("heading", { name: "How do your commercial components interact?" }).waitFor();
  await page.getByLabel(/I don’t know yet/).check();
  await page.getByRole("button", { name: /How do your commercial components interact\?: Unknown/ }).waitFor();
  await page.getByRole("button", { name: "Review all answers", exact: true }).click();
  await page.getByRole("heading", { name: "Review the assumptions." }).waitFor();
  await page.getByRole("button", { name: "Submit audit", exact: true }).click();
  await page.getByRole("alert").waitFor();
  console.log("PASS contact order, validation, keyboard, branching, table editing, resume, heatmap and incomplete-submit guard");

  // Real validation/PDF/database persistence, with the external mail transport
  // replaced in this test only. Never send synthetic financial messages to Sid.
  let emailPrepared = false;
  await page.route("**/api/audit-submissions", async (route) => {
    let status = 200;
    let payload: unknown;
    await createAuditSubmissionHandler(saveAuditSubmission, async (submission) => {
      persisted = true;
      const pdf = await renderAuditResponsesPDF(submission);
      const email = buildAuditQuestionnaireEmail({
        id: submission.id, name: String(submission.answers.name), email: String(submission.answers.email), pdf,
      });
      assert.deepEqual(email.bcc, ["sid@dilexicon.com"]);
      assert.equal(email.to[0], "audit-smoke@example.invalid");
      assert.equal(email.attachments[0].content.subarray(0, 5).toString(), "%PDF-");
      emailPrepared = true;
    })({ body: route.request().postDataJSON() } as any, {
      status(code: number) { status = code; return this; },
      json(body: unknown) { payload = body; return this; },
    } as any, (() => {}) as any);
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(payload) });
  });
  const answers: AuditAnswers = {
    name: "Synthetic Audit Test", email: "audit-smoke@example.invalid", agency: "Synthetic Agency",
    services: ["marketing"], models: ["fixed"], lifecycle: "new", reviewers: ["not-yet"],
  };
  for (const q of getVisibleQuestions(answers)) if (answers[q.id] === undefined) answers[q.id] = "__unknown__";
  await page.evaluate(({ answers, id }) => {
    localStorage.setItem("marginmix_audit_draft_v1", JSON.stringify({ answers, submissionId: id, activeId: "reviewers", reviewing: false }));
  }, { answers, id });
  await page.reload();
  await page.getByRole("heading", { name: "Who has reviewed this submission?" }).waitFor();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.getByRole("dialog").waitFor({ timeout: 30000 });
  await page.getByRole("heading", { name: "Thank you for your response. We'll be in touch", exact: true }).waitFor();
  assert.ok(emailPrepared);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("heading", { name: "Your assumptions are in." }).waitFor({ timeout: 30000 });
  persisted = true;
  assert.ok(await page.getByText(id, { exact: true }).isVisible());
  const row = (await db.select().from(auditSubmissions).where(eq(auditSubmissions.id, id)))[0];
  assert.ok(row, "Server acknowledgement must correspond to a database record");
  assert.equal((row.answers as AuditAnswers).agency, "Synthetic Agency");
  assert.equal(await page.evaluate(() => localStorage.getItem("marginmix_audit_draft_v1")), null);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download answers JSON", exact: true }).click();
  assert.match((await downloadPromise).suggestedFilename(), /^marginmix-audit-.*\.json$/);
  console.log("PASS final-question Submit → real persistence/PDF → exact recipients/copy → thank-you popup → JSON download (external mail mocked)");

  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole("heading", { name: "First, what’s your name?" }).waitFor();
  assert.ok(await page.getByRole("navigation", { name: "Jump to assessment category" }).isVisible());
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "No mobile horizontal page overflow");
  await page.getByRole("textbox", { name: "First, what’s your name?" }).fill("Clear me");
  await page.getByRole("button", { name: "Clear draft", exact: true }).click();
  await page.getByRole("button", { name: "Clear answers", exact: true }).click();
  assert.equal(await page.getByRole("textbox", { name: "First, what’s your name?" }).inputValue(), "");
  assert.deepEqual(errors, []);
  console.log("PASS mobile navigation, no overflow, confirmed reset, no browser runtime errors");
} finally {
  if (persisted) await db.delete(auditSubmissions).where(eq(auditSubmissions.id, id));
  await browser.close();
  await pool.end();
}
