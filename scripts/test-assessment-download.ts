import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { executeDecisionEngine } from "../server/decision-engine";
import { generateFallbackNarrative } from "../server/narrative-generator";
import { renderAssessmentOutputPDF, renderDecisionMemoPDF } from "../server/pdf-renderer";
import { buildReportGroups } from "../shared/report-groups";
import { buildVerdictReport } from "../shared/verdict-provenance";

// Intercept submission: never store an assessment or send an email during this test.
const form = {
  fullName: "Download Test", workEmail: "download@example.invalid", roleTitle: "Lead",
  organisationName: "Test Agency", organisationSize: "50-500",
  industry: "marketing-advertising", decisionEvaluating: "renewal-extension",
  specifyContext: "single-client", engagementClassification: "ongoing-6-12",
  engagementType: "retainer", deliveryModel: "", clientVolatility: "medium",
  stakeholderComplexity: "low", seniorLeadershipInvolvement: "periodic",
  midLevelOversight: "low", executionThinkingMix: "balanced", iterationIntensity: "high",
  scopeChangeLikelihood: "medium", crossFunctionalCoordination: "high",
  aiEffortShift: "no_clear_substitution", marginalValueSaturation: "some",
  seniorOversightLoad: "about_same", coordinationDecisionDrag: "heavy",
  deliveryConfidence: "some_concerns", aiAgenticFramework: "na",
  aiHumanHoursReplaced: "25-50", aiCommercialImpactMeasured: "no", openSignal: "",
};
const decision = executeDecisionEngine({ ...form, decisionType: form.decisionEvaluating });
const narrative = generateFallbackNarrative(decision);
const assessmentPdf = await renderAssessmentOutputPDF(decision, narrative.assessmentOutput, null);
const memoPdf = await renderDecisionMemoPDF(decision, narrative.decisionMemo);
const reports = {
  assessmentOutput: { filename: "assessment-results.pdf", data: assessmentPdf.toString("base64") },
  decisionMemo: { filename: "decision-memo.pdf", data: memoPdf.toString("base64") },
};
const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox"] });
const output = await mkdtemp(join(tmpdir(), "assessment-download-test-"));
try {
  const page = await browser.newPage({ acceptDownloads: true });
  await page.addInitScript((data) => {
    localStorage.setItem("marginmix_assessment_progress", JSON.stringify({ data }));
  }, form);
  let malformed = false;
  await page.route("**/api/assessments", (route) => {
    const submission = route.request().postDataJSON() as Record<string, unknown>;
    assert.equal("isDemo" in submission, false);
    return route.fulfill({
      status: 201, contentType: "application/json",
      body: JSON.stringify({ success: true, pdfs: malformed ? {} : reports, decisionObject: decision }),
    });
  });
  const base = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://127.0.0.1:5000";
  for (const path of ["/assessment", "/demo"]) {
    await page.goto(`${base}${path}`);
    await page.getByRole("button", { name: "Click / Enter / Return to continue" }).waitFor();
    assert.doesNotMatch(await page.locator("body").innerText(), /Demo Mode|completely free|Free for every submission|payment required|pay to continue/i);
  }
  async function submit() {
    await page.goto(`${base}/assessment`);
    await page.getByRole("button", { name: "Click / Enter / Return to continue" }).waitFor();
    const decline = page.getByRole("button", { name: "Decline", exact: true });
    if (await decline.isVisible()) await decline.click();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(650);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(650);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(650);
    await page.locator('[title^="Q27:"]').click();
    await page.waitForTimeout(650);
    await page.getByRole("button", { name: "Review", exact: true }).click();
    await page.locator("#consent").check();
    await page.getByRole("button", { name: "Submit to Proceed" }).click();
  }
  const automaticAssessment = page.waitForEvent("download", {
    predicate: (file) => file.suggestedFilename() === "assessment-results.pdf",
  });
  const automaticMemo = page.waitForEvent("download", {
    predicate: (file) => file.suggestedFilename() === "decision-memo.pdf",
  });
  await submit();
  const automaticFiles = await Promise.all([automaticAssessment, automaticMemo]);
  for (const [index, file] of automaticFiles.entries()) {
    const destination = join(output, `automatic-${file.suggestedFilename()}`);
    await file.saveAs(destination);
    assert.deepEqual(await readFile(destination), index === 0 ? assessmentPdf : memoPdf);
  }
  await page.getByRole("link", { name: "Download Assessment PDF", exact: true }).first().waitFor();
  for (const [label, expected, filename] of [
    ["Download Assessment PDF", assessmentPdf, "assessment-results.pdf"],
    ["Download Decision Memo", memoPdf, "decision-memo.pdf"],
  ] as const) {
    const link = page.getByRole("link", { name: label, exact: true }).first();
    assert.match((await link.getAttribute("href"))!, /^blob:/);
    const downloadEvent = page.waitForEvent("download");
    await link.click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), filename);
    const destination = join(output, filename);
    await download.saveAs(destination);
    assert.deepEqual(await readFile(destination), expected);
  }
  await page.screenshot({ path: join(output, "results.png") });
  const report = buildReportGroups(decision.bucketScores);
  await page.getByText(buildVerdictReport(decision).explanation, { exact: true }).waitFor();
  assert.doesNotMatch(await page.locator("body").innerText(), /\boverride\b|WEIGHTED[\s_-]*SCORE/i);
  assert.doesNotMatch(await page.locator("body").innerText(), /Measurement Maturity/i);
  const aiFlag = decision.contradictionFlags.find(flag => flag.code === "UNCLEAR_AI_SUBSTITUTION_WITH_EXPECTED_HOURS");
  assert.ok(aiFlag);
  await page.getByText(aiFlag.description, { exact: true }).waitFor();
  for (const group of report.groups) {
    await page.getByText(group.description, { exact: true }).waitFor();
  }
  await page.getByText(report.comparativeSentence, { exact: true }).waitFor();
  await page.getByRole("heading", { name: "Risk Dimensions", exact: true })
    .locator("..").screenshot({ path: join(output, "group-descriptions.png") });
  malformed = true;
  await submit();
  await page.getByText("A PDF report is missing. Please submit again.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Download Assessment PDF", exact: true }).count(), 0);
  console.log(`PASS: both PDFs auto-download and both backup links work byte-for-byte; malformed reports show an error. Results: ${output}`);
} finally {
  await browser.close();
}
