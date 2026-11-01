export interface VerdictTrigger {
  condition: string;
  question: string;
  questionId: "Q20" | "Q23";
  answer: string;
  answerLabel: string;
}

export type VerdictProvenance =
  | { path: "weighted_score"; weightedScoreBand: string; overrides: [] }
  | { path: "override"; overrides: VerdictTrigger[] };

/** Presentation only: consumes the engine-recorded path, never decides a verdict. */
export function buildVerdictReport(decision: {
  marginRiskVerdict: string;
  compositeRiskScore: number;
  verdictProvenance: VerdictProvenance;
}) {
  const source = decision.verdictProvenance;
  if (source.path === "weighted_score") {
    return {
      explanation: `The verdict "${decision.marginRiskVerdict}" is derived from the weighted composite score of ${decision.compositeRiskScore}/100.`,
      overrideDescription: "",
    };
  }
  if (!source.overrides.length) throw new Error("Verdict provenance is missing the triggering condition.");
  const description = source.overrides.map(trigger =>
    `Condition: ${trigger.condition}. Triggering answer to "${trigger.question}" (${trigger.questionId}): "${trigger.answerLabel}".`,
  ).join(" ");
  return {
    explanation: `The verdict "${decision.marginRiskVerdict}" was produced by a recorded confidence override. ${description} The calculated composite remains ${decision.compositeRiskScore}/100.`,
    overrideDescription: description,
  };
}

export function isVerdictMechanismText(text: string): boolean {
  return /\boverrid(?:e|es|den|ing)\b|weighted[\s_-]*score[\s_-]*(?:safe|execution|price|fragile|critical)/i.test(text);
}
