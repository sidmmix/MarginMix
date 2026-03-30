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
  const systemPrompt = `"The reader is a CEO, COO, or CFO of an agency or consulting firm. They are time-poor, commercially sharp, and skeptical of vague advice. Write like you respect their intelligence. Be direct. Every sentence should earn its place."

That is your brief. Do not deviate from it.

You are a Senior Partner at a top-tier strategy consultancy — the equivalent of a McKinsey or Bain engagement lead specialising in commercial risk and margin governance for professional services firms.

Your task is to write the narrative sections of two executive-grade PDF documents: a Decision Memo and an Assessment Output. These documents will be read by CEOs, CFOs, COOs, Managing Partners, and Board-level stakeholders. The language must reflect that audience precisely.

WRITING STANDARDS — follow these without exception:
- Write in short, declarative, boardroom-grade sentences. No padding, no hedging, no filler.
- Be precise and commercially specific. Avoid generic phrases like "this may impact margins" — say exactly what is at risk and why.
- Use the active voice. Favour directness over diplomacy.
- Never use academic or overly technical language. Write as a trusted adviser speaking plainly to a CXO.
- Each narrative section must carry genuine analytical weight — it should read as if a senior practitioner reviewed the data and formed a considered view.
- Tone: authoritative, composed, and commercially intelligent. Not alarmist, but unambiguous.

HARD CONSTRAINTS — these override everything else:
- You MUST NOT recalculate any scores, percentages, or numeric values.
- You MUST NOT change, reinterpret, or soften any risk bands or verdicts.
- You MUST NOT introduce assumptions not present in the decision data.
- Your sole role is to narrate and contextualise the pre-computed decision outputs with clarity and executive precision.`;

  const userPrompt = `Below is the system-of-record decision output from the MarginMix assessment engine. Use it exclusively as the basis for your narrative. Do not modify any values.

DECISION DATA:
${JSON.stringify(decision, null, 2)}

${openSignal ? `RESPONDENT'S OWN ASSESSMENT:\n"${openSignal}"\n(Incorporate where it adds context, but do not let it override the computed verdict.)` : "No open signal provided."}

---

Write narrative content for TWO executive documents. Every field must read as polished, publication-ready prose — not notes or drafts.

DOCUMENT 1 — DECISION MEMO (for the CXO making the go/no-go call):

decisionContext:
  Write 2 crisp sentences. Name the engagement type (${decision.engagementContext.type}), its classification (${decision.engagementContext.classification}), and the pricing structure (${decision.engagementContext.decisionType}). Make the commercial stakes clear from the outset.

marginRiskVerdict:
  In 2-3 sentences, articulate what the verdict "${decision.marginRiskVerdict}" means for this engagement in plain commercial terms. Explain the consequence — not just the label. A CFO should immediately understand what action this demands.

primaryDriversOfRisk:
  List exactly 3-4 drivers. Each must be a single, precise sentence naming the specific structural factor and its margin consequence. Grounded in: ${decision.dominantDrivers.join(", ")}. No generic statements.

pricingGovernanceImplications:
  2-3 sentences. Be specific about what the pricing model cannot absorb given the risk profile, and what governance controls are now non-negotiable. Reference the pricing structure (${decision.engagementContext.decisionType}) directly.

whatWouldNeedToChange:
  List 2-3 concrete, actionable conditions — structural changes, commercial adjustments, or governance measures — that would materially reduce the risk level. Each as a single declarative sentence. Avoid vague recommendations.

recommendation:
  The definitive advisory position. 2-3 sentences. Should a CXO proceed, reprice, restructure, or decline? State it directly. If AI is a factor (AI Impact: ${decision.aiImpactClassification}), name the implication clearly.

---

DOCUMENT 2 — ASSESSMENT OUTPUT (the full analytical record):

executiveSnapshot:
  3 sentences. Open with the verdict "${decision.marginRiskVerdict}" and the composite risk score (${decision.compositeRiskScore}/100). In the second sentence, name the dominant structural factors. Close with the single most important commercial implication for the leadership team.

riskDimensionSummary:
  For each dimension below, provide: (a) the level exactly as computed, (b) a 2-sentence description that explains what that level means structurally and commercially — not just restating "it is high."
  - Workforce Intensity: ${decision.dimensions.workforceIntensity}
  - Coordination Entropy: ${decision.dimensions.coordinationEntropy}
  - Commercial Exposure: ${decision.dimensions.commercialExposure}
  - Volatility Control: ${decision.dimensions.volatilityControl}
  - Confidence Signal: ${decision.dimensions.confidenceSignal}
  - Measurement Maturity: ${decision.dimensions.measurementMaturity}

effortBandsAllocation:
  For Senior (${decision.effortPercentages.senior}), Mid-Level (${decision.effortPercentages.mid}), and Execution (${decision.effortPercentages.junior}):
  Write 1-2 sentences explaining why this allocation is structurally required given the engagement profile. Connect it to the risk verdict — not just describe the numbers.

structuralRiskSignals:
  List 3-4 specific signals drawn from the assessment data. Each signal should be a single sentence naming what was observed and why it matters. Include the AI effort shift classification (${decision.aiImpactClassification}: ${decision.aiEffortShiftLabel || "not specified"}) as one signal if relevant. Reference saturation or confidence flags where present.

overrideConditions:
  1-2 sentences. If overrides were triggered (${decision.triggeredBy.join(", ") || "none"}), explain precisely what condition fired and what it means for the verdict's authority. If none, state clearly that the verdict was determined by the weighted scoring model across all dimensions.

---

Respond in this exact JSON structure:
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
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 3500
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
  const verdict = decision.marginRiskVerdict;
  const riskBand = decision.riskBand;
  const drivers = decision.dominantDrivers;
  const dims = decision.dimensions;
  const pricingStructure = decision.engagementContext.decisionType || "the current pricing structure";
  const orgName = decision.engagementContext.organisationName || "the organisation";

  const verdictConsequence: Record<string, string> = {
    "Structurally Safe": `The engagement is structurally viable under current pricing and delivery assumptions. Margin protection is not at immediate risk, provided scope boundaries are maintained and no material change occurs to delivery complexity.`,
    "Execution Heavy": `The engagement demands a disproportionate share of senior and mid-level effort relative to its commercial return. Without pricing adjustment or scope containment, workforce costs will erode margin progressively across the delivery cycle.`,
    "Price Sensitive": `The current pricing model does not provide sufficient buffer against the commercial exposure this engagement presents. Even modest scope expansion or coordination overrun will compress margin below acceptable thresholds.`,
    "Structurally Fragile": `This engagement carries structural risk across multiple dimensions simultaneously. The combination of elevated workforce intensity, coordination complexity, and insufficient pricing headroom creates a high probability of margin erosion that cannot be mitigated through operational management alone.`,
    "Do Not Proceed Without Repricing": `The confidence signal and structural conditions identified in this assessment are incompatible with margin preservation under the current commercial terms. Proceeding without fundamental repricing or structural renegotiation would constitute a material financial risk to the firm.`
  };

  const recommendationMap: Record<string, string> = {
    "Structurally Safe": `Proceed under standard engagement terms. Establish a baseline scope governance protocol and schedule a mid-engagement margin review. No immediate pricing action is required.`,
    "Execution Heavy": `Proceed only after negotiating resource allocation caps with the client and establishing clear change-control governance. Senior effort levels must be contractually bounded to prevent margin compression.`,
    "Price Sensitive": `Do not proceed at current rates. Initiate a pricing review before contract execution. If repricing is not viable, negotiate explicit scope boundaries and escalation clauses that protect margin in the event of overrun.`,
    "Structurally Fragile": `Proceed only if commercial terms are restructured to include margin protection clauses, enhanced governance controls, and explicit scope change mechanisms. This engagement requires board-level visibility before sign-off.`,
    "Do Not Proceed Without Repricing": `Do not proceed under current commercial terms. Return to the client with a revised commercial proposal that accurately reflects delivery complexity and workforce requirements. Any AI-driven effort substitution (${decision.aiImpactClassification}) does not offset the structural risk identified.`
  };

  const pricingImplicationMap: Record<string, string> = {
    "Structurally Safe": `${pricingStructure} is appropriately calibrated to the delivery requirements of this engagement. Standard approval and monitoring controls are sufficient. No immediate commercial renegotiation is warranted.`,
    "Execution Heavy": `${pricingStructure} does not fully account for the senior effort intensity this engagement requires. Without rate adjustment or scope reduction, the firm absorbs the difference as margin loss. Governance must include a hard cap on unrecoverable senior hours.`,
    "Price Sensitive": `${pricingStructure} leaves the firm exposed to commercial pressure the moment delivery complexity exceeds baseline assumptions. Rate renegotiation or a contingency buffer built into contract terms is non-negotiable before proceeding.`,
    "Structurally Fragile": `${pricingStructure} is structurally insufficient for this engagement profile. The compounding of workforce intensity, coordination overhead, and commercial exposure means the pricing model cannot absorb even minor deviations from plan. Enhanced approval authority and escalation thresholds must be embedded in the contract.`,
    "Do Not Proceed Without Repricing": `${pricingStructure} bears no viable relationship to the structural demands of this engagement. Governance approval under current terms should be withheld. Any decision to proceed must be escalated to the CFO or equivalent authority with a documented risk acceptance.`
  };

  const whatWouldNeedToChange: Record<string, string[]> = {
    "Structurally Safe": ["Maintain current scope definition and change-control discipline throughout delivery."],
    "Execution Heavy": [
      "Negotiate contractual caps on senior involvement relative to total engagement hours.",
      "Reduce coordination touchpoints through consolidated client governance rather than distributed stakeholder management."
    ],
    "Price Sensitive": [
      "Reprice the engagement to reflect actual delivery complexity before contract execution.",
      "Introduce scope boundary clauses with commercially penalised change requests to protect against overrun."
    ],
    "Structurally Fragile": [
      "Restructure the commercial terms to include a margin protection mechanism tied to scope integrity.",
      "Establish a dedicated engagement governance layer with board-level visibility and monthly margin reporting.",
      "Reduce delivery complexity through phased scoping before full engagement commitment."
    ],
    "Do Not Proceed Without Repricing": [
      "Renegotiate all commercial terms with full transparency on workforce intensity and coordination requirements.",
      "Obtain a written risk acceptance from C-suite if the decision is made to proceed under current terms.",
      "Require independent margin viability sign-off before contract execution."
    ]
  };

  const dimensionDescriptions: Record<string, Record<string, string>> = {
    workforceIntensity: {
      low: "Senior and specialist effort requirements are well within standard delivery norms. The engagement does not place disproportionate demand on the firm's highest-cost resources.",
      medium: "The engagement requires a meaningful proportion of senior involvement, particularly in coordination and decision-making phases. This is manageable but warrants active resource planning.",
      high: "Senior effort demand is structurally elevated. The engagement cannot be delivered at projected quality without sustained involvement from the firm's most expensive practitioners, which directly threatens the commercial return."
    },
    coordinationEntropy: {
      low: "Stakeholder complexity is contained and governance lines are clear. Coordination overhead will not materially erode productive delivery capacity.",
      medium: "Coordination requirements are moderate but manageable with structured governance. Without proactive stakeholder alignment, meeting overhead risks consuming a disproportionate share of billable capacity.",
      high: "Coordination complexity is systemic. Multiple stakeholder layers, fragmented decision rights, or cross-functional dependencies will consume senior capacity that cannot be recovered through delivery efficiency."
    },
    commercialExposure: {
      low: "The commercial terms provide adequate headroom relative to delivery risk. Margin protection is not contingent on flawless execution.",
      medium: "The pricing model absorbs standard delivery variance, but offers limited buffer against scope expansion or efficiency shortfalls. Discipline in scope governance is essential.",
      high: "The commercial structure is acutely exposed to delivery risk. There is insufficient margin buffer to absorb even moderate overruns. The engagement is commercially fragile at the contract level."
    },
    volatilityControl: {
      low: "Scope, requirements, and client decision-making are highly variable. The absence of stable delivery conditions makes cost control structurally difficult and margin forecasting unreliable.",
      medium: "Moderate volatility exists in scope or client governance. Change management discipline will be required to prevent scope drift from compressing margin.",
      high: "Delivery conditions are well-controlled. Scope is stable, client governance is predictable, and the engagement is not materially exposed to unplanned volatility."
    }
  };

  const getDescription = (dim: string, level: string): string => {
    const normalized = level.toLowerCase();
    return dimensionDescriptions[dim]?.[normalized] || `${capitalizeFirst(level)} ${dim} level identified. Standard monitoring protocols apply.`;
  };

  return {
    decisionMemo: {
      decisionContext: `This is a ${decision.engagementContext.type} engagement for ${orgName}, classified as ${decision.engagementContext.classification} with a ${pricingStructure} pricing model. The assessment evaluates the structural and commercial conditions that will determine whether this engagement can protect its margin through the delivery cycle.`,
      marginRiskVerdict: verdictConsequence[verdict] || `The verdict is ${verdict}. Leadership should review the structural conditions before proceeding.`,
      primaryDriversOfRisk: drivers.length > 0
        ? drivers.map(d => `${d} is a primary contributor to the risk profile, directly influencing the firm's ability to maintain margin under current commercial terms.`)
        : ["The risk profile reflects the cumulative weight of multiple moderate-level signals across delivery dimensions.", "No single dimension dominates; the verdict reflects systemic exposure across the engagement structure.", "Management attention should focus on scope governance and pricing discipline as the primary protective measures."],
      pricingGovernanceImplications: pricingImplicationMap[verdict] || `The current pricing structure requires review given the ${riskBand.toLowerCase()} risk band identified by this assessment.`,
      whatWouldNeedToChange: whatWouldNeedToChange[verdict] || ["Review commercial terms and delivery assumptions before proceeding."],
      recommendation: recommendationMap[verdict] || `Review the engagement terms and risk dimensions with your CFO before proceeding.`
    },
    assessmentOutput: {
      executiveSnapshot: `This engagement has been assessed with a verdict of ${verdict} and a composite risk score of ${decision.compositeRiskScore}/100, placing it in the ${riskBand} risk band. ${drivers.length > 0 ? `The dominant structural contributors are ${drivers.join(" and ")}, each independently capable of compressing margin below acceptable thresholds.` : "Risk is distributed across multiple delivery dimensions rather than concentrated in a single factor."} The immediate commercial implication is that ${riskBand === "Low" ? "margin protection is intact under current terms and no urgent intervention is required" : "leadership must act on pricing, governance, or scope structure before this engagement is commercially sanctioned"}.`,
      riskDimensionSummary: {
        workforceIntensity: {
          level: capitalizeFirst(dims.workforceIntensity),
          description: getDescription("workforceIntensity", dims.workforceIntensity)
        },
        coordinationEntropy: {
          level: capitalizeFirst(dims.coordinationEntropy),
          description: getDescription("coordinationEntropy", dims.coordinationEntropy)
        },
        commercialExposure: {
          level: capitalizeFirst(dims.commercialExposure),
          description: getDescription("commercialExposure", dims.commercialExposure)
        },
        volatilityControl: {
          level: capitalizeFirst(dims.volatilityControl),
          description: getDescription("volatilityControl", dims.volatilityControl)
        }
      },
      effortBandsAllocation: {
        senior: {
          percentage: decision.effortPercentages.senior,
          rationale: `A ${decision.effortPercentages.senior} senior allocation is required by the structural complexity of this engagement. ${dims.workforceIntensity === "high" || dims.coordinationEntropy === "high" ? "Elevated workforce intensity and coordination demands cannot be delegated without quality and margin risk." : "This reflects standard oversight proportionate to the engagement's risk profile."}`
        },
        midLevel: {
          percentage: decision.effortPercentages.mid,
          rationale: `Mid-level practitioners at ${decision.effortPercentages.mid} carry the primary coordination and programme management burden. ${dims.coordinationEntropy === "high" ? "The high coordination complexity of this engagement demands experienced programme management that cannot be substituted with junior resource." : "This allocation is calibrated to the coordination requirements identified across the delivery dimensions."}`
        },
        execution: {
          percentage: decision.effortPercentages.junior,
          rationale: `Execution-layer resource at ${decision.effortPercentages.junior} represents the operational delivery capacity available within margin. ${dims.workforceIntensity === "high" ? "The constrained execution allocation reflects the disproportionate senior and mid-level demand; increasing junior resource without reducing complexity will not improve the commercial outcome." : "This is consistent with the delivery requirements identified in the assessment."}`
        }
      },
      structuralRiskSignals: [
        ...(decision.triggeredBy.length > 0
          ? decision.triggeredBy.map(t => `${t} override was triggered during verdict determination, indicating a structural condition severe enough to bypass standard scoring logic.`)
          : ["No hard override conditions were triggered; the verdict is the product of weighted scoring across all six risk dimensions."]),
        `AI Effort Shift classified as ${decision.aiImpactClassification}${decision.aiEffortShiftLabel ? ` (${decision.aiEffortShiftLabel})` : ""} — ${decision.aiImpactClassification === "Accretive" ? "AI tooling is contributing positively to delivery efficiency without undermining margin." : decision.aiImpactClassification === "Dilutive" ? "AI implementation is introducing complexity or cost that undermines the commercial return rather than enhancing it." : "AI tooling is present but does not materially alter the margin risk profile at this stage."}`
      ],
      overrideConditions: decision.triggeredBy.length > 0
        ? `This verdict was influenced by a hard override condition: ${decision.triggeredBy.join(", ")}. This override takes precedence over the weighted scoring model and reflects a structural signal that the engine treats as non-negotiable. The verdict cannot be improved by incremental scoring changes while this condition persists.`
        : `No override conditions were triggered. The verdict of ${verdict} was determined by the weighted scoring model across all six risk dimensions, with no single factor carrying sufficient weight to bypass standard evaluation logic.`
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
