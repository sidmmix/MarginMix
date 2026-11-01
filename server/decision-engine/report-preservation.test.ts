import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { executeDecisionEngine, type AssessmentInput } from "./index";
import { generateFallbackNarrative } from "../narrative-generator";
import { renderAssessmentOutputPDF, renderDecisionMemoPDF } from "../pdf-renderer";
import { buildAssessmentEmail } from "../resend";
import { buildReportGroups, reportBand } from "../../shared/report-groups";
import { buildVerdictReport, isVerdictMechanismText } from "../../shared/verdict-provenance";
import { decideVerdict } from "./decisionTable";
import { detectAIAnswerContradictions } from "./contradictionDetector";

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
  { name: "pricing override retains raw score", input: { ...low, marginalValueSaturation: "minimal" }, score: 7.5, band: "Very High", verdict: "Do Not Proceed Without Repricing" },
  { name: "both existing confidence conditions recorded", input: { ...low, marginalValueSaturation: "none", deliveryConfidence: "low" }, score: 7.5, band: "Very High", verdict: "Do Not Proceed Without Repricing" },
  { name: "pricing override without delivery answer", input: { ...low, marginalValueSaturation: "minimal", deliveryConfidence: undefined }, score: 7.5, band: "Very High", verdict: "Do Not Proceed Without Repricing" },
  { name: "ytx remains 55", input: ytx, score: 55, band: "Moderate", verdict: "Price Sensitive" },
];

test("reporting bands use exact raw-score boundaries, independently of engine bands", () => {
  for (const [score, expected] of [
    [0, "Low"], [24, "Low"], [24.999, "Low"], [25, "Medium"],
    [49.999, "Medium"], [50, "Elevated"], [74.999, "Elevated"],
    [75, "High"], [100, "High"],
  ] as const) assert.equal(reportBand(score), expected);
  for (const value of [NaN, Infinity, -1, 101]) assert.throws(() => reportBand(value));
});

test("report ranking includes all five groups and handles ties without inventing a strength", () => {
  const tied = buildReportGroups({ WI: 0, CO: 0, CE: 0, VC: 0, MM: 0 });
  assert.ok(tied.groups.every(group => group.rank === 1 && group.role === "relative strength"));
  assert.match(tied.comparativeSentence, /All five groups are tied/);
  const mixed = buildReportGroups({ WI: 100, CO: 100, CE: 75, VC: 25, MM: 25 });
  assert.deepEqual(mixed.groups.map(group => group.rank), [1, 1, 3, 4, 4]);
  assert.match(mixed.comparativeSentence, /Workforce Intensity and Coordination Entropy/);
  assert.match(mixed.comparativeSentence, /Volatility Control and AI Substitution and Measurement Risk/);
});

test("AI answer flag quotes both answers, excludes absent/NA/zero hours and qualifies the zero-inclusive band", () => {
  for (const [value, label] of [["25-50", "25–50%"], ["50-75", "50–75%"], ["75-100", "75–100%"]]) {
    const [flag] = detectAIAnswerContradictions({ aiEffortShift: "no_clear_substitution", aiHumanHoursReplaced: value });
    assert.equal(flag.severity, "warning");
    assert.ok(flag.description.includes('"No clear substitution"'));
    assert.ok(flag.description.includes(`"${label}"`));
  }
  for (const value of [undefined, "", "na", "0"]) {
    assert.deepEqual(detectAIAnswerContradictions({ aiEffortShift: "no_clear_substitution", aiHumanHoursReplaced: value }), []);
  }
  for (const shift of ["junior_execution", "mid_level_production", "senior_thinking_review"]) {
    assert.deepEqual(detectAIAnswerContradictions({ aiEffortShift: shift, aiHumanHoursReplaced: "25-50" }), []);
  }
  const [uncertain] = detectAIAnswerContradictions({ aiEffortShift: "no_clear_substitution", aiHumanHoursReplaced: "0-25" });
  assert.equal(uncertain.severity, "info");
  assert.match(uncertain.description, /band includes zero/);
});

for (const fixture of cases) {
  test(`report-only preservation: ${fixture.name}`, async () => {
    const beforeInput = JSON.stringify(fixture.input);
    const decision = executeDecisionEngine(fixture.input);
    assert.equal(decision.compositeRiskScore, fixture.score);
    assert.equal(decision.riskBand, fixture.band);
    assert.equal(decision.marginRiskVerdict, fixture.verdict);
    const beforeDecision = JSON.stringify(decision);
    const report = buildReportGroups(decision.bucketScores);
    assert.equal(report.groups.find(group => group.key === "MM")!.name, "AI Substitution and Measurement Risk");
    assert.match(report.groups.find(group => group.key === "MM")!.description, /Higher scores mean greater/);
    const verdictReport = buildVerdictReport(decision);
    const expected = decideVerdict({
      confidenceSignal: decision.signals.pricingConfidence === "negative" || decision.signals.deliveryConfidence === "negative"
        ? "negative" : "neutral",
    }, decision.computationTrace);
    assert.equal(decision.marginRiskVerdict, expected.verdict);
    assert.deepEqual(decision.triggeredBy, expected.triggeredBy);
    const narrative = generateFallbackNarrative(decision);
    assert.equal(narrative.assessmentOutput.overrideConditions, verdictReport.overrideDescription);
    assert.ok(narrative.assessmentOutput.structuralRiskSignals.every(signal => !isVerdictMechanismText(signal)));
    const pdfs = [
      await renderDecisionMemoPDF(decision, narrative.decisionMemo),
      await renderAssessmentOutputPDF(decision, narrative.assessmentOutput, null),
    ];
    const attachments = pdfs.map((content, i) => ({ filename: `report-${i}.pdf`, content }));
    const email = buildAssessmentEmail(decision, null, attachments);
    assert.deepEqual(email.attachments, attachments);
    assert.ok(email.html.includes(report.comparativeSentence));
    const reportTexts = [email.html];
    for (const pdf of pdfs) {
      const text = execFileSync("pdftotext", ["-", "-"], { input: pdf })
        .toString().replace(/\s+/g, " ");
      assert.ok(text.includes(fixture.verdict), "PDF must retain the calculated verdict");
      assert.ok(text.includes(`${fixture.score}/100`), "PDF must retain the calculated composite");
      for (const group of report.groups) {
        assert.ok(text.includes(group.description), `PDF must use canonical description for ${group.name}`);
        assert.ok(email.html.includes(group.description), `Email must use canonical description for ${group.name}`);
      }
      assert.ok(text.includes(report.comparativeSentence), `Missing comparison: ${report.comparativeSentence}\nPDF text: ${text}`);
      assert.doesNotMatch(text, /Moderate volatility exists|Delivery conditions are well-controlled/);
      reportTexts.push(text);
    }
    for (const text of reportTexts) {
      assert.doesNotMatch(text, /Measurement Maturity/i, "Retired group name must not appear in reports");
      assert.doesNotMatch(text, /AI Displacement Risk/i, "Retired group alias must not appear in reports");
      assert.match(text, /AI Substitution and Measurement Risk/, "Reports must use the canonical group name");
      assert.doesNotMatch(text, /WEIGHTED[\s_-]*SCORE/i, "No internal verdict band identifiers in reports");
      if (decision.verdictProvenance.path === "weighted_score") {
        assert.deepEqual(decision.verdictProvenance.overrides, []);
        assert.equal(verdictReport.overrideDescription, "");
        assert.doesNotMatch(text, /\boverrid(?:e|es|den|ing)\b/i);
        assert.ok(text.includes(`weighted composite score of ${fixture.score}/100`));
      } else {
        assert.match(text, /Override Conditions/);
        assert.ok(decision.verdictProvenance.overrides.length > 0);
        for (const trigger of decision.verdictProvenance.overrides) {
          assert.ok(text.includes(trigger.condition));
          assert.ok(text.includes(trigger.answerLabel));
          assert.ok(text.includes(trigger.questionId));
        }
      }
    }
    if (decision.verdictProvenance.path === "override") {
      const triggers = decision.verdictProvenance.overrides;
      assert.equal(triggers.some(trigger => trigger.questionId === "Q23"), fixture.input.deliveryConfidence === "low");
      assert.equal(triggers.some(trigger => trigger.questionId === "Q20"), ["minimal", "none"].includes(fixture.input.marginalValueSaturation));
      for (const trigger of triggers) {
        assert.equal(trigger.answer, trigger.questionId === "Q23"
          ? fixture.input.deliveryConfidence : fixture.input.marginalValueSaturation);
      }
    }
    if (fixture.name === "ytx remains 55") {
      assert.deepEqual(report.groups.map(group => [group.key, group.score, group.band, group.rank]), [
        ["WI", 62.5, "Elevated", 2], ["CO", 50, "Elevated", 3],
        ["CE", 50, "Elevated", 3], ["VC", 25, "Medium", 5], ["MM", 100, "High", 1],
      ]);
      const flag = decision.contradictionFlags.find(flag => flag.code === "UNCLEAR_AI_SUBSTITUTION_WITH_EXPECTED_HOURS");
      assert.ok(flag);
      for (const text of reportTexts) {
        assert.ok(text.includes("No clear substitution"));
        assert.ok(text.includes("25–50%"));
      }
    }
    assert.equal(JSON.stringify(decision), beforeDecision, "Reporting must not mutate engine output");
    assert.equal(JSON.stringify(fixture.input), beforeInput, "Reporting must not mutate answers");
  });
}
