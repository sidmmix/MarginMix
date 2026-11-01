import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { executeDecisionEngine, type AssessmentInput } from "./index";
import { buildComputationTrace, WEIGHTS } from "./scorecard";
import { decideVerdict } from "./decisionTable";
import { generateFallbackNarrative, validateGeneratedNarrative } from "../narrative-generator";
import { renderAssessmentOutputPDF, renderDecisionMemoPDF } from "../pdf-renderer";
import { buildAssessmentEmail } from "../resend";

test("obsolete main-engine scorers and invented-output helpers stay retired", () => {
  for (const file of ["scoring", "buckets", "rules", "verdict", "decisionObject", "marginImpactCalculator", "effortAllocator"]) {
    assert.equal(existsSync(new URL(`./${file}.ts`, import.meta.url)), false,
      `${file} must not be restored alongside the authoritative Model1 scorer`);
  }
});

/** Exactly the eighteen scored answers in the supplied document/Model1 workbook.
 * Q25's "25 percent" is the workbook's 25–50% band (50 points).
 * Q23 is intentionally absent in the first fixture.
 */
const fixture: AssessmentInput = {
  fullName: "Regression Fixture",
  workEmail: "fixture@example.invalid",
  roleTitle: "Agency lead",
  organisationName: "Fixture Agency",
  organisationSize: "11-50",
  specifyContext: "",
  decisionType: "renewal-extension",                 // Q7 renewal
  engagementClassification: "ongoing-less-6",       // Q9 — updated scorecard example
  engagementType: "hybrid",                         // Q10
  clientVolatility: "medium",                      // Q11
  stakeholderComplexity: "low",                    // Q12
  seniorLeadershipInvolvement: "periodic",          // Q13
  midLevelOversight: "low",                        // Q14
  executionThinkingMix: "balanced",                // Q15
  iterationIntensity: "high",                      // Q16
  scopeChangeLikelihood: "medium",                 // Q17
  crossFunctionalCoordination: "high",             // Q18
  aiEffortShift: "no_clear_substitution",           // Q19
  marginalValueSaturation: "some",                 // Q20
  seniorOversightLoad: "about_same",               // Q21
  coordinationDecisionDrag: "heavy",               // Q22
  aiAgenticFramework: "na",                        // Q24
  aiHumanHoursReplaced: "25-50",                    // Q25
  aiCommercialImpactMeasured: "no",                // Q26
};

test("updated scorecard fixture: composite 55 and Price Sensitive", () => {
  const result = executeDecisionEngine(fixture);
  assert.equal(result.compositeRiskScore, 55);
  assert.equal(result.marginRiskVerdict, "Price Sensitive");
  assert.equal(result.computationTrace.compositeBeforeRounding, 55);
  const scores = Object.values(result.computationTrace.dimensions).map((d) => d.score);
  assert.deepEqual(scores, [62.5, 50, 50, 25, 100]);
});

test("Q9 stage points stay exact: under six months is 50; six to twelve is 0", () => {
  const updatedExample = buildComputationTrace(fixture);
  const priorStage = buildComputationTrace({ ...fixture, engagementClassification: "ongoing-6-12" });
  assert.equal(updatedExample.dimensions.commercialExposure.signals[0].questions[1].score, 50);
  assert.equal(priorStage.dimensions.commercialExposure.signals[0].questions[1].score, 0);
  assert.equal(executeDecisionEngine({ ...fixture, engagementClassification: "ongoing-6-12" }).compositeRiskScore, 51.7);
});

test("required fixture: Q23 low confidence overrides the composite", () => {
  const result = executeDecisionEngine({ ...fixture, deliveryConfidence: "low" });
  assert.equal(result.marginRiskVerdict, "Do Not Proceed Without Repricing");
  assert.equal(result.compositeRiskScore, 55); // Never replace a real score with 85.
  assert.deepEqual(result.triggeredBy, ["LOW_CONFIDENCE_OVERRIDE"]);
  assert.deepEqual(result.computationTrace, executeDecisionEngine(fixture).computationTrace);
});

test("trace exposes every signal, aggregation, unrounded dimension and contribution", () => {
  const trace = buildComputationTrace(fixture);
  assert.equal(Object.values(WEIGHTS).reduce((a, b) => a + b), 100);
  for (const dimension of Object.values(trace.dimensions)) {
    assert.equal(dimension.aggregation, "arithmetic_mean");
    assert.equal(dimension.score, dimension.signals.reduce((sum, s) => sum + s.score, 0) / dimension.signals.length);
    assert.equal(dimension.weightedContribution, dimension.score * dimension.weight / 100);
    for (const signal of dimension.signals) {
      assert.equal(signal.score, Math.max(...signal.questions.map((q) => q.score)));
    }
  }
  assert.equal(trace.dimensions.measurementMaturity.signals[1].questions[2].question, "Q26");
  assert.equal(trace.dimensions.measurementMaturity.signals[1].questions[2].score, 100);
});

test("AI risk direction: measured junior substitution is low; unmeasured/no path are high-risk signals", () => {
  const measured = {
    ...fixture, aiEffortShift: "junior_execution", aiAgenticFramework: "no",
    aiHumanHoursReplaced: "0-25", aiCommercialImpactMeasured: "yes",
  };
  assert.equal(buildComputationTrace(measured).dimensions.measurementMaturity.score, 0);
  const unmeasured = buildComputationTrace({ ...measured, aiCommercialImpactMeasured: "no" });
  assert.equal(unmeasured.dimensions.measurementMaturity.signals[1].score, 100);
  const noPath = buildComputationTrace({ ...measured, aiEffortShift: "no_clear_substitution" });
  assert.equal(noPath.dimensions.measurementMaturity.signals[0].score, 100);
  const agentic = buildComputationTrace({ ...measured, aiAgenticFramework: "yes", aiCommercialImpactMeasured: "no" });
  assert.equal(agentic.dimensions.measurementMaturity.signals[1].score, 100);
});

test("verdict thresholds use the raw score, never a rounded dimension or composite", () => {
  const decision = executeDecisionEngine(fixture);
  const trace = buildComputationTrace(fixture);
  for (const [score, expected] of [
    [19.999, "Structurally Safe"], [20, "Execution Heavy"], [39.999, "Execution Heavy"],
    [40, "Price Sensitive"], [59.999, "Price Sensitive"], [60, "Structurally Fragile"],
    [79.999, "Structurally Fragile"], [80, "Do Not Proceed Without Repricing"],
  ] as const) {
    assert.equal(decideVerdict(decision.dimensions, { ...trace, compositeBeforeRounding: score }).verdict, expected);
  }
});

test("all industry fixed fees score 100, and pricing/service variants remain supported", () => {
  for (const engagementType of ["fixed-fee", "ites-fixed-price", "mc-fixed-fee", "sw-fixed-price"]) {
    assert.equal(buildComputationTrace({ ...fixture, engagementType }).dimensions.commercialExposure.signals[1].score, 100);
  }
  for (const engagementType of ["retainer", "commission", "outcome-based", "hybrid-retainer-commission", "hybrid-retainer-outcome", "ites-tm", "ites-managed-services", "ites-retainer", "ites-outcome", "ites-hybrid", "mc-retainer", "mc-tm", "mc-outcome", "mc-hybrid", "sw-implementation", "sw-managed-services", "sw-saas-services", "sw-tm", "sw-outcome"]) {
    assert.doesNotThrow(() => executeDecisionEngine({ ...fixture, engagementType }));
  }
});

test("no fabricated sections in JSON, email, or either PDF; absent Q23 stays absent", async () => {
  const decision = executeDecisionEngine({ ...fixture, currentMargin: 30 });
  for (const key of ["marginImpact", "effortBand", "effortPercentages", "effortAllocation", "riskSource", "correctability"]) {
    assert.equal(key in decision, false, key);
  }
  assert.equal("confidenceSignal" in decision.dimensions, false);
  assert.equal(JSON.parse(JSON.stringify(decision)).signals.deliveryConfidence, undefined);
  assert.equal("opticsDrivenStaffing" in decision.saturationDetails, false);
  const narrative = generateFallbackNarrative(decision);
  assert.equal("effortBandsAllocation" in narrative.assessmentOutput, false);
  const attachment = { filename: "fixture.pdf", content: Buffer.from("%PDF-fixture") };
  const email = buildAssessmentEmail(decision, null, [attachment]);
  assert.deepEqual(email.attachments, [attachment]);
  assert.ok(email.to.includes(fixture.workEmail));
  const outputs = [email.html];
  for (const pdf of [
    await renderDecisionMemoPDF(decision, narrative.decisionMemo),
    await renderAssessmentOutputPDF(decision, narrative.assessmentOutput, null),
  ]) {
    outputs.push(execFileSync("pdftotext", ["-", "-"], { input: pdf }).toString());
  }
  for (const output of outputs) {
    assert.doesNotMatch(output, /Estimated Margin Impact|Current Margin|Estimated Margin Erosion|Effective Margin|Effort (?:Bands|Allocation)|Risk Source|Correctability|Optics-Driven Staffing|Confidence Signal|single.source/i);
    assert.match(output, /\b55(?:\.0)?\b/);
  }
});

test("answered Q23 remains visible in PDF and email", async () => {
  const decision = executeDecisionEngine({ ...fixture, deliveryConfidence: "low" });
  const narrative = generateFallbackNarrative(decision);
  assert.match(buildAssessmentEmail(decision, null).html, /Confidence Signal/);
  const pdf = await renderAssessmentOutputPDF(decision, narrative.assessmentOutput, null);
  assert.match(execFileSync("pdftotext", ["-", "-"], { input: pdf }).toString(), /Confidence Signal/);
});

test("55 is a fixture, not a target: different answers produce different scores", () => {
  const low: AssessmentInput = {
    ...fixture, engagementClassification: "ongoing-6-12",
    engagementType: "retainer", clientVolatility: "low", stakeholderComplexity: "low",
    seniorLeadershipInvolvement: "minimal", seniorOversightLoad: "less_than_usual",
    executionThinkingMix: "execution-heavy", iterationIntensity: "low", marginalValueSaturation: "significant",
    midLevelOversight: "low", crossFunctionalCoordination: "low", coordinationDecisionDrag: "minimal",
    scopeChangeLikelihood: "low", aiEffortShift: "junior_execution", aiAgenticFramework: "no",
    aiHumanHoursReplaced: "0-25", aiCommercialImpactMeasured: "yes",
  };
  assert.equal(executeDecisionEngine(low).compositeRiskScore, 0);
  const high: AssessmentInput = {
    ...fixture, decisionType: "escalation", engagementType: "fixed-fee",
    clientVolatility: "high", stakeholderComplexity: "high", seniorLeadershipInvolvement: "continuous",
    seniorOversightLoad: "more_than_usual", executionThinkingMix: "thinking-heavy",
    iterationIntensity: "high", marginalValueSaturation: "none", midLevelOversight: "high",
    crossFunctionalCoordination: "high", coordinationDecisionDrag: "heavy", scopeChangeLikelihood: "high",
  };
  assert.equal(executeDecisionEngine(high).compositeRiskScore, 100);
});

test("AI-written numbers, unsupported assertions, and altered dimension levels are rejected", () => {
  const decision = executeDecisionEngine(fixture);
  const candidate = generateFallbackNarrative(decision);
  assert.throws(() => validateGeneratedNarrative(candidate, decision), /numerical claim/);
  // Replace prose, retaining the canonical dimension levels, to isolate the guard checks.
  const clean = JSON.parse(JSON.stringify(candidate, (key, value) =>
    typeof value === "string" && key !== "level" ? "Qualitative assessment." : value));
  assert.doesNotThrow(() => validateGeneratedNarrative(clean, decision));
  for (const text of ["Estimated loss: 12%.", "Margin falls by twelve percent.", "Add twenty hours.", "Use half the team.", "Risk Source: Structural.", "Confidence Signal: neutral."]) {
    const changed = structuredClone(clean);
    changed.assessmentOutput.executiveSnapshot = text;
    assert.throws(() => validateGeneratedNarrative(changed, decision));
  }
  const changed = structuredClone(clean);
  changed.assessmentOutput.riskDimensionSummary.workforceIntensity.level = "Low";
  assert.throws(() => validateGeneratedNarrative(changed, decision), /changed a dimension level/);
});
