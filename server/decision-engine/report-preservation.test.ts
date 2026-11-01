import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { executeDecisionEngine, type AssessmentInput } from "./index";
import { generateFallbackNarrative } from "../narrative-generator";
import { renderAssessmentOutputPDF, renderDecisionMemoPDF } from "../pdf-renderer";
import { buildAssessmentEmail } from "../resend";

// Synthetic inputs only: never retain respondent contact details in fixtures.
const low: AssessmentInput = {
  fullName: "Report Regression", workEmail: "report@example.invalid",
  roleTitle: "Lead", organisationName: "Fixture Agency", organisationSize: "500-1000",
  industry: "ites", decisionType: "renewal-extension", specifyContext: "single-client",
  engagementClassification: "ongoing-6-12", engagementType: "ites-retainer",
  deliveryModel: "onshore-only", clientVolatility: "low", stakeholderComplexity: "low",
  seniorLeadershipInvolvement: "minimal", seniorOversightLoad: "less",
  executionThinkingMix: "execution-heavy", iterationIntensity: "low",
  marginalValueSaturation: "significant", midLevelOversight: "low",
  crossFunctionalCoordination: "low", coordinationDecisionDrag: "minimal",
  scopeChangeLikelihood: "low", aiEffortShift: "junior_execution",
  aiAgenticFramework: "no", aiHumanHoursReplaced: "0-25",
  aiCommercialImpactMeasured: "yes", deliveryConfidence: "high",
};
const workforce: AssessmentInput = {
  ...low, seniorLeadershipInvolvement: "continuous", seniorOversightLoad: "more",
  executionThinkingMix: "thinking-heavy", iterationIntensity: "high",
  marginalValueSaturation: "significant",
};
const coordinated: AssessmentInput = {
  ...workforce, midLevelOversight: "high", crossFunctionalCoordination: "high",
  coordinationDecisionDrag: "heavy",
};
const commercial: AssessmentInput = {
  ...coordinated, decisionType: "escalation", engagementType: "ites-fixed-price",
  scopeChangeLikelihood: "high",
};
const highest: AssessmentInput = {
  ...commercial, clientVolatility: "high", stakeholderComplexity: "high",
  aiEffortShift: "no_clear_substitution", aiCommercialImpactMeasured: "no",
};
// Saved ytx answer pattern, with identifying details replaced.
const ytx: AssessmentInput = {
  ...low, engagementClassification: "ongoing-less-6", engagementType: "ites-hybrid",
  clientVolatility: "medium", seniorLeadershipInvolvement: "periodic",
  seniorOversightLoad: "about_same", executionThinkingMix: "balanced",
  iterationIntensity: "high", marginalValueSaturation: "some",
  crossFunctionalCoordination: "high", coordinationDecisionDrag: "heavy",
  scopeChangeLikelihood: "medium", aiEffortShift: "no_clear_substitution",
  aiAgenticFramework: "na", aiHumanHoursReplaced: "25-50",
  aiCommercialImpactMeasured: "no", deliveryConfidence: "some_concerns",
};

const cases = [
  { name: "safe", input: low, score: 0, band: "Low", verdict: "Structurally Safe" },
  { name: "execution heavy", input: workforce, score: 22.5, band: "Moderate", verdict: "Execution Heavy" },
  { name: "price sensitive", input: coordinated, score: 47.5, band: "Moderate", verdict: "Price Sensitive" },
  { name: "fragile", input: commercial, score: 67.5, band: "High", verdict: "Structurally Fragile" },
  { name: "critical", input: highest, score: 92.5, band: "Very High", verdict: "Do Not Proceed Without Repricing" },
  { name: "confidence override retains raw score", input: { ...low, deliveryConfidence: "low" }, score: 0, band: "Very High", verdict: "Do Not Proceed Without Repricing" },
  { name: "ytx remains 55", input: ytx, score: 55, band: "Moderate", verdict: "Price Sensitive" },
];

for (const fixture of cases) {
  test(`report-only preservation: ${fixture.name}`, async () => {
    const beforeInput = JSON.stringify(fixture.input);
    const decision = executeDecisionEngine(fixture.input);
    assert.equal(decision.compositeRiskScore, fixture.score);
    assert.equal(decision.riskBand, fixture.band);
    assert.equal(decision.marginRiskVerdict, fixture.verdict);
    const beforeDecision = JSON.stringify(decision);
    const narrative = generateFallbackNarrative(decision);
    const pdfs = [
      await renderDecisionMemoPDF(decision, narrative.decisionMemo),
      await renderAssessmentOutputPDF(decision, narrative.assessmentOutput, null),
    ];
    const attachments = pdfs.map((content, i) => ({ filename: `report-${i}.pdf`, content }));
    const email = buildAssessmentEmail(decision, null, attachments);
    assert.deepEqual(email.attachments, attachments);
    for (const pdf of pdfs) {
      const text = execFileSync("pdftotext", ["-", "-"], { input: pdf })
        .toString().replace(/\s+/g, " ");
      assert.ok(text.includes(fixture.verdict), "PDF must retain the calculated verdict");
      assert.ok(text.includes(`${fixture.score}/100`), "PDF must retain the calculated composite");
    }
    assert.equal(JSON.stringify(decision), beforeDecision, "Reporting must not mutate engine output");
    assert.equal(JSON.stringify(fixture.input), beforeInput, "Reporting must not mutate answers");
  });
}
