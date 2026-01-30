import OpenAI from "openai";
import { DecisionObject } from "./decision-engine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NarrativeOutput {
  decisionMemo: {
    executiveSummary: string;
    keyInsight: string;
    riskAssessment: {
      structural: string;
      behavioral: string;
      overall: string;
    };
    decisionGuidance: string[];
    recommendation: string;
  };
  assessmentOutput: {
    criticalSignalAnalysis: string;
    riskDrivers: {
      structural: { level: string; description: string };
      behavioral: { level: string; description: string };
      governance: { level: string; description: string };
    };
    effortBandRationale: {
      senior: string;
      midLevel: string;
      junior: string;
    };
    earlyWarningIndicators: string[];
  };
}

export async function generateNarrative(
  decision: DecisionObject,
  openSignal: string | null
): Promise<NarrativeOutput> {
  const prompt = `You are a financial reasoning engine for media agencies. Generate narrative explanations for a margin risk assessment.

IMPORTANT CONSTRAINTS:
- You MUST NOT recalculate any scores
- You MUST NOT change any risk bands
- You MUST NOT override any verdicts
- Your role is ONLY to explain and narrate the pre-computed decision data

DECISION DATA (System of Record - DO NOT MODIFY):
${JSON.stringify(decision, null, 2)}

${openSignal ? `OPEN SIGNAL FROM RESPONDENT:\n"${openSignal}"` : "No open signal provided."}

Based on this decision data, generate narrative content for two PDFs:

1. DECISION MEMO (Executive Summary for Leadership):
- Executive Summary: 2-3 sentences summarizing the engagement viability
- Key Insight: One critical insight about where margin risk originates
- Risk Assessment: Map to the computed risk band (${decision.riskBand})
- Decision Guidance: 3-4 actionable controls based on the dominant drivers
- Recommendation: Final guidance treating the verdict "${decision.marginRiskVerdict}" as absolute

2. ASSESSMENT OUTPUT (Detailed Technical Analysis):
- Critical Signal Analysis: Interpret the open signal in context of the risk drivers
- Risk Drivers: Explain each bucket score using the computed values (WI: ${decision.bucketScores.WI}, SI: ${decision.bucketScores.SI}, CO: ${decision.bucketScores.CO}, VSI: ${decision.bucketScores.VSI})
- Effort Band Rationale: Explain why the ${decision.effortBand} effort distribution makes sense
- Early Warning Indicators: 3-4 specific triggers based on the saturation flags

Respond in JSON format matching this structure:
{
  "decisionMemo": {
    "executiveSummary": "string",
    "keyInsight": "string",
    "riskAssessment": {
      "structural": "Low|Moderate|High|Very High",
      "behavioral": "Low|Moderate|High|Very High",
      "overall": "Low|Moderate|Moderate-High|High|Very High"
    },
    "decisionGuidance": ["string", "string", "string"],
    "recommendation": "string"
  },
  "assessmentOutput": {
    "criticalSignalAnalysis": "string",
    "riskDrivers": {
      "structural": { "level": "🟢|🟡|🟠|🔴", "description": "string" },
      "behavioral": { "level": "🟢|🟡|🟠|🔴", "description": "string" },
      "governance": { "level": "🟢|🟡|🟠|🔴", "description": "string" }
    },
    "effortBandRationale": {
      "senior": "string",
      "midLevel": "string",
      "junior": "string"
    },
    "earlyWarningIndicators": ["string", "string", "string"]
  }
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content: "You are a margin risk analyst. Generate narrative explanations from pre-computed decision data. Never recalculate or override any values - only explain them."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2000
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No narrative content generated");
  }

  return JSON.parse(content) as NarrativeOutput;
}

export function getRiskLevelEmoji(band: string): string {
  switch (band.toLowerCase()) {
    case "low": return "🟢";
    case "moderate": return "🟡";
    case "high": return "🟠";
    case "very high": return "🔴";
    default: return "🟡";
  }
}

export function mapBucketBandToLevel(band: string): string {
  switch (band) {
    case "Low": return "🟢 Low";
    case "Moderate": return "🟡 Moderate";
    case "High": return "🟠 High";
    case "Very High": return "🔴 Very High";
    default: return "🟡 Moderate";
  }
}
