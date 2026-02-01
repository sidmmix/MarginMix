import OpenAI from "openai";
import { DecisionObject } from "./decision-engine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NarrativeOutput {
  decisionMemo: {
    decisionContext: string;
    marginRiskVerdict: string;
    primaryDriversOfRisk: string[];
    pricingGovernanceImplications: string;
    whatWouldNeedToChange: string[];
    recommendation: string;
  };
  assessmentOutput: {
    executiveSnapshot: string;
    riskDimensionSummary: {
      workforceIntensity: { level: string; description: string };
      coordinationEntropy: { level: string; description: string };
      commercialExposure: { level: string; description: string };
      volatilityControl: { level: string; description: string };
    };
    effortBandsAllocation: {
      senior: { percentage: string; rationale: string };
      midLevel: { percentage: string; rationale: string };
      execution: { percentage: string; rationale: string };
    };
    structuralRiskSignals: string[];
    overrideConditions: string;
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

1. DECISION MEMO:
- Decision Context: 1-2 sentences describing the engagement type (${decision.engagementContext.type}), classification (${decision.engagementContext.classification}), and pricing structure (${decision.engagementContext.decisionType}). Must explicitly state the pricing model/structure.
- Margin Risk Verdict: Explain the verdict "${decision.marginRiskVerdict}" in plain language
- Primary Drivers of Risk: List 3-4 structural contributors based on dominant drivers: ${decision.dominantDrivers.join(", ")}
- Pricing & Governance Implications: Describe impact on pricing decisions and control requirements
- What Would Need to Change: List 2-3 specific conditions required to improve viability
- Recommendation: Final guidance - proceed, reprice, or restructure based on verdict

2. ASSESSMENT OUTPUT:
- Executive Snapshot: 2-3 sentences with the verdict "${decision.marginRiskVerdict}" and high-level risk context
- Risk Dimension Summary: For each dimension, provide level and brief description:
  * Workforce Intensity: ${decision.dimensions.workforceIntensity}
  * Coordination Entropy: ${decision.dimensions.coordinationEntropy}
  * Commercial Exposure: ${decision.dimensions.commercialExposure}
  * Volatility Control: ${decision.dimensions.volatilityControl}
- Effort Bands & Allocation: Explain the rationale for Senior ${decision.effortPercentages.senior}, Mid ${decision.effortPercentages.mid}, Execution ${decision.effortPercentages.junior}
- Structural Risk Signals: List 3-4 key signals that influenced the verdict
- Override Conditions: Describe any overrides triggered (${decision.triggeredBy.join(", ") || "None"})

Respond in JSON format matching this structure:
{
  "decisionMemo": {
    "decisionContext": "string",
    "marginRiskVerdict": "string",
    "primaryDriversOfRisk": ["string", "string", "string"],
    "pricingGovernanceImplications": "string",
    "whatWouldNeedToChange": ["string", "string"],
    "recommendation": "string"
  },
  "assessmentOutput": {
    "executiveSnapshot": "string",
    "riskDimensionSummary": {
      "workforceIntensity": { "level": "Low|Medium|High", "description": "string" },
      "coordinationEntropy": { "level": "Low|Medium|High", "description": "string" },
      "commercialExposure": { "level": "Low|Medium|High", "description": "string" },
      "volatilityControl": { "level": "Low|Medium|High", "description": "string" }
    },
    "effortBandsAllocation": {
      "senior": { "percentage": "string", "rationale": "string" },
      "midLevel": { "percentage": "string", "rationale": "string" },
      "execution": { "percentage": "string", "rationale": "string" }
    },
    "structuralRiskSignals": ["string", "string", "string"],
    "overrideConditions": "string"
  }
}`;

  try {
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
  } catch (error) {
    console.error("Narrative generation failed, using fallback:", error);
    return generateFallbackNarrative(decision);
  }
}

function generateFallbackNarrative(decision: DecisionObject): NarrativeOutput {
  const verdictDescriptions: Record<string, string> = {
    "Structurally Safe": "This engagement presents low margin risk and can proceed under standard operating conditions.",
    "Price Sensitive": "This engagement has elevated commercial exposure requiring careful pricing attention.",
    "Execution Heavy": "This engagement requires significant workforce allocation and coordination oversight.",
    "Structurally Fragile": "This engagement shows structural risk indicators that require active margin protection measures.",
    "Do Not Proceed Without Repricing": "This engagement cannot proceed safely under current pricing assumptions."
  };

  const recommendationMap: Record<string, string> = {
    "Structurally Safe": "Proceed with standard engagement terms and monitoring.",
    "Price Sensitive": "Proceed with enhanced pricing controls and quarterly margin review.",
    "Execution Heavy": "Proceed with resource allocation caps and coordination governance.",
    "Structurally Fragile": "Proceed only with restructured terms, enhanced governance, and margin buffers.",
    "Do Not Proceed Without Repricing": "Do not proceed until pricing is restructured to reflect true effort requirements."
  };

  const pricingStructure = decision.engagementContext.decisionType || "standard pricing";
  
  return {
    decisionMemo: {
      decisionContext: `${decision.engagementContext.type} engagement for ${decision.engagementContext.organisationName}, classified as ${decision.engagementContext.classification}. Pricing structure: ${pricingStructure}.`,
      marginRiskVerdict: verdictDescriptions[decision.marginRiskVerdict] || "Assessment completed.",
      primaryDriversOfRisk: decision.dominantDrivers.length > 0 
        ? decision.dominantDrivers.map(d => `${d} contributes to structural margin pressure`)
        : ["No significant risk drivers identified"],
      pricingGovernanceImplications: decision.riskBand === "Low" 
        ? "Standard pricing and governance controls are sufficient."
        : `${decision.riskBand} risk band requires enhanced pricing review and governance oversight.`,
      whatWouldNeedToChange: decision.marginRiskVerdict === "Structurally Safe"
        ? ["Current conditions support proceeding as planned"]
        : ["Reduce workforce intensity through scope refinement", "Strengthen coordination governance structures"],
      recommendation: recommendationMap[decision.marginRiskVerdict] || "Review engagement terms before proceeding."
    },
    assessmentOutput: {
      executiveSnapshot: `${decision.marginRiskVerdict}. This assessment identifies ${decision.riskBand.toLowerCase()} overall margin risk based on structural factors including ${decision.dominantDrivers.join(", ") || "standard operating conditions"}.`,
      riskDimensionSummary: {
        workforceIntensity: {
          level: capitalizeFirst(decision.dimensions.workforceIntensity),
          description: `Workforce requirements are ${decision.dimensions.workforceIntensity}, indicating ${decision.dimensions.workforceIntensity === "high" ? "elevated" : "manageable"} staffing demands.`
        },
        coordinationEntropy: {
          level: capitalizeFirst(decision.dimensions.coordinationEntropy),
          description: `Coordination complexity is ${decision.dimensions.coordinationEntropy}, suggesting ${decision.dimensions.coordinationEntropy === "high" ? "significant oversight needs" : "standard collaboration requirements"}.`
        },
        commercialExposure: {
          level: capitalizeFirst(decision.dimensions.commercialExposure),
          description: `Commercial exposure is ${decision.dimensions.commercialExposure}, reflecting ${decision.dimensions.commercialExposure === "high" ? "elevated pricing sensitivity" : "standard commercial terms"}.`
        },
        volatilityControl: {
          level: capitalizeFirst(decision.dimensions.volatilityControl),
          description: `Volatility control is ${decision.dimensions.volatilityControl}, indicating ${decision.dimensions.volatilityControl === "low" ? "limited" : "adequate"} change management capacity.`
        }
      },
      effortBandsAllocation: {
        senior: {
          percentage: decision.effortPercentages.senior,
          rationale: `Senior involvement at ${decision.effortPercentages.senior} reflects ${decision.riskBand === "Low" ? "standard oversight" : "elevated governance requirements"}.`
        },
        midLevel: {
          percentage: decision.effortPercentages.mid,
          rationale: `Mid-level allocation at ${decision.effortPercentages.mid} supports ${decision.dimensions.coordinationEntropy === "high" ? "coordination demands" : "standard program management"}.`
        },
        execution: {
          percentage: decision.effortPercentages.junior,
          rationale: `Execution layer at ${decision.effortPercentages.junior} enables ${decision.dimensions.workforceIntensity === "high" ? "intensive delivery requirements" : "standard delivery operations"}.`
        }
      },
      structuralRiskSignals: decision.triggeredBy.length > 0
        ? decision.triggeredBy.map(t => `${t} signal detected in assessment`)
        : ["No significant structural risk signals detected"],
      overrideConditions: decision.triggeredBy.length > 0
        ? `Override triggered by: ${decision.triggeredBy.join(", ")}`
        : "No override conditions were triggered. Verdict determined by primary rule evaluation."
    }
  };
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
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
