/**
 * generate-risk-logic-doc.ts
 * Clean, print-ready MarginMix Risk Logic Reference PDF.
 * Run: npx tsx scripts/generate-risk-logic-doc.ts
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "../MarginMix_Risk_Logic_Reference.pdf");

const T = {
  black:    "#111827",
  dark:     "#1f2937",
  mid:      "#374151",
  gray:     "#6b7280",
  light:    "#9ca3af",
  rule:     "#d1d5db",
  rowAlt:   "#f9fafb",
  white:    "#ffffff",
};

type RiskLevel = "low" | "medium" | "high" | "none";

interface QuestionDef {
  number: string;
  id: string;
  title: string;
  context?: string;
  section: string;
  signal?: string;
  dimension?: string;
  options?: { label: string; risk: RiskLevel }[];
  note?: string;
  isIdentifier?: boolean;
  isNarrative?: boolean;
}

// ─── Full Assessment Questions ────────────────────────────────────────────────

const fullAssessmentQuestions: QuestionDef[] = [
  { number: "Q1",  id: "fullName",           title: "What's your full name?",                                                              section: "Contact & Context",          isIdentifier: true },
  { number: "Q2",  id: "workEmail",           title: "What's your work email?",                                                             section: "Contact & Context",          isIdentifier: true },
  { number: "Q3",  id: "roleTitle",           title: "What's your role or title?",                                                          section: "Contact & Context",          isIdentifier: true },
  { number: "Q4",  id: "organisationName",    title: "What's your organization name?",                                                      section: "Contact & Context",          isIdentifier: true },
  {
    number: "Q5", id: "organisationSize", title: "What's your organization size?",
    section: "Contact & Context",
    context: "Larger organizations create more coordination layers that consume margin.",
    signal: "Heatmap indicator only",
    options: [
      { label: "50–500",       risk: "low"    },
      { label: "500–1,000",    risk: "medium" },
      { label: "1,000–1,500",  risk: "high"   },
      { label: "1,500–2,000",  risk: "high"   },
    ],
  },
  {
    number: "Q6", id: "industry", title: "Which industry do you belong to?",
    section: "Contact & Context",
    isIdentifier: true,
    note: "Controls conditional questions for Q7 decision label, Q10 engagement types, Q10b delivery model, and Q15 mix options. Does not score itself.",
    options: [
      { label: "Marketing & Advertising", risk: "none" },
      { label: "ITeS",                    risk: "none" },
      { label: "Management Consulting",   risk: "none" },
      { label: "Computer Software",       risk: "none" },
    ],
  },
  {
    number: "Q7", id: "decisionEvaluating", title: "What decision are you evaluating with this assessment?",
    section: "Contact & Context",
    context: "The type of decision shapes how much pricing flexibility remains.",
    signal: "EngagementState", dimension: "Commercial Exposure",
    note: "ITeS variant: 'New client win / pitch acceptance' → 'New contract / SOW acceptance'.",
    options: [
      { label: "New client win / pitch acceptance (ITeS: New contract / SOW acceptance)", risk: "low"    },
      { label: "Renewal / contract extension",                                              risk: "low"    },
      { label: "Scope expansion without repricing",                                         risk: "high"   },
      { label: "Escalation on a live account",                                              risk: "high"   },
      { label: "Strategic / leadership-driven exception",                                   risk: "medium" },
      { label: "Exploratory / no active decision",                                          risk: "low"    },
    ],
  },
  {
    number: "Q8", id: "specifyContext", title: "Specify Context",
    section: "Client Engagement Context",
    context: "Multi-client assessments carry compounding coordination risk.",
    signal: "Context only — not in the Model1 composite",
    options: [
      { label: "Single client",                    risk: "low"    },
      { label: "Group of clients – Org level",     risk: "medium" },
    ],
  },
  {
    number: "Q9", id: "engagementClassification", title: "How would you classify this engagement today?",
    section: "Client Engagement Context",
    context: "Engagement maturity affects how predictable the delivery effort will be.",
    signal: "EngagementState", dimension: "Commercial Exposure",
    options: [
      { label: "New (pre-kickoff / onboarding phase)",             risk: "medium" },
      { label: "Ongoing (in delivery < 6 months)",                 risk: "medium" },
      { label: "Ongoing (in delivery 6–12 months)",                risk: "low"    },
      { label: "Ongoing (in delivery 12+ months)",                 risk: "low"    },
      { label: "Renewal / scope expansion of existing engagement",  risk: "medium" },
    ],
  },
  {
    number: "Q10", id: "engagementType", title: "What's the engagement type?",
    section: "Client Engagement Context",
    context: "Fixed-fee models absorb scope creep risk that retainers can pass through.",
    signal: "PricingRigidity", dimension: "Commercial Exposure",
    note: "Options are industry-specific. Retainer scores 0; hybrid/T&M/managed services 50; fixed fee/commission/outcome-based 100.",
    options: [
      { label: "[Marketing & Advertising] Commission",                         risk: "high"   },
      { label: "[Marketing & Advertising] Fixed Fees",                         risk: "low"    },
      { label: "[Marketing & Advertising] Retainer",                           risk: "low"    },
      { label: "[Marketing & Advertising] Outcome based",                      risk: "high"   },
      { label: "[Marketing & Advertising] Hybrid – Retainer + Commission",     risk: "medium" },
      { label: "[Marketing & Advertising] Hybrid – Retainer + Outcome based",  risk: "medium" },
      { label: "[ITeS] Time & Materials (T&M)",                                risk: "medium" },
      { label: "[ITeS] Fixed Price",                                            risk: "high"   },
      { label: "[ITeS] Managed Services",                                       risk: "medium" },
      { label: "[ITeS] Retainer / Ongoing Support",                             risk: "low"    },
      { label: "[ITeS] Outcome / Milestone-based",                              risk: "high"   },
      { label: "[ITeS] Hybrid",                                                 risk: "medium" },
      { label: "[Management Consulting] Fixed Fee / Project-based",             risk: "high"   },
      { label: "[Management Consulting] Retainer / Advisory",                   risk: "low"    },
      { label: "[Management Consulting] Time & Materials",                      risk: "medium" },
      { label: "[Management Consulting] Outcome / Success-based",               risk: "high"   },
      { label: "[Management Consulting] Hybrid",                                risk: "medium" },
      { label: "[Computer Software] Implementation / Professional Services",    risk: "high"   },
      { label: "[Computer Software] Managed Services",                          risk: "medium" },
      { label: "[Computer Software] SaaS + Services Hybrid",                   risk: "medium" },
      { label: "[Computer Software] Fixed Price Development",                   risk: "high"   },
      { label: "[Computer Software] T&M Development",                           risk: "medium" },
      { label: "[Computer Software] Outcome-based",                             risk: "high"   },
    ],
  },
  {
    number: "Q10b", id: "deliveryModel", title: "What is the delivery model?",
    section: "Client Engagement Context",
    context: "Onshore/offshore mix affects coordination overhead and margin risk.",
    signal: "Heatmap indicator only",
    note: "Conditional — shown only for ITeS and Computer Software industries.",
    options: [
      { label: "Onshore only",              risk: "low"    },
      { label: "Offshore only",             risk: "medium" },
      { label: "Hybrid onshore/offshore",   risk: "medium" },
      { label: "Nearshore",                 risk: "low"    },
    ],
  },
  {
    number: "Q11", id: "clientVolatility", title: "How would you rate client volatility?",
    section: "Client Engagement Context",
    context: "Client stability directly impacts coordination cost and rework risk.",
    signal: "ClientVolatility", dimension: "Volatility Control",
    options: [
      { label: "Low (stable stakeholders, clear expectations)",            risk: "low"    },
      { label: "Medium",                                                    risk: "medium" },
      { label: "High (frequent changes, multiple decision-makers)",        risk: "high"   },
    ],
  },
  {
    number: "Q12", id: "stakeholderComplexity", title: "What's the stakeholder complexity level?",
    section: "Client Engagement Context",
    context: "More stakeholders mean more alignment cycles and hidden decision drag.",
    signal: "StakeholderLoad", dimension: "Volatility Control",
    options: [
      { label: "Low",    risk: "low"    },
      { label: "Medium", risk: "medium" },
      { label: "High",   risk: "high"   },
    ],
  },
  {
    number: "Q13", id: "seniorLeadershipInvolvement", title: "How involved is senior leadership in day-to-day delivery?",
    section: "Planned Delivery Structure",
    context: "Senior involvement in delivery signals that junior/mid teams cannot carry the engagement independently.",
    signal: "SeniorDependency (combined with Q21)", dimension: "Workforce Intensity",
    options: [
      { label: "Minimal (strategic oversight only)",  risk: "low"    },
      { label: "Periodic (key milestones)",           risk: "medium" },
      { label: "Frequent (weekly touchpoints)",       risk: "high"   },
      { label: "Continuous (hands-on delivery)",      risk: "high"   },
    ],
  },
  {
    number: "Q14", id: "midLevelOversight", title: "What's the mid-level oversight intensity?",
    section: "Planned Delivery Structure",
    context: "Mid-level oversight absorbs coordination costs that are often invisible in project budgets.",
    signal: "CoordinationIntensity", dimension: "Coordination Entropy",
    options: [
      { label: "Low",    risk: "low"    },
      { label: "Medium", risk: "medium" },
      { label: "High",   risk: "high"   },
    ],
  },
  {
    number: "Q15", id: "executionThinkingMix", title: "What's the execution vs thinking mix?",
    section: "Planned Delivery Structure",
    context: "Thinking-heavy work is harder to scope, price, and delegate.",
    signal: "IterationLoad proxy", dimension: "Workforce Intensity",
    note: "ITeS adds: Advisory / Solutioning-heavy (HIGH).  Management Consulting adds: Strategy / Advisory-heavy (HIGH).  Computer Software adds: Technical / Implementation-heavy (MEDIUM).",
    options: [
      { label: "Execution-heavy",                                    risk: "low"    },
      { label: "Balanced",                                           risk: "medium" },
      { label: "Thinking-heavy",                                     risk: "high"   },
      { label: "[ITeS] Advisory / Solutioning-heavy",               risk: "high"   },
      { label: "[Management Consulting] Strategy / Advisory-heavy",  risk: "high"   },
      { label: "[Computer Software] Technical / Implementation-heavy", risk: "medium" },
    ],
  },
  {
    number: "Q16", id: "iterationIntensity", title: "What's the expected or current iteration intensity?",
    section: "Delivery Dynamics",
    context: "High iteration erodes margin through repeated cycles of rework and refinement.",
    signal: "IterationLoad", dimension: "Workforce Intensity",
    options: [
      { label: "Low",    risk: "low"    },
      { label: "Medium", risk: "medium" },
      { label: "High",   risk: "high"   },
    ],
  },
  {
    number: "Q17", id: "scopeChangeLikelihood", title: "What's the likelihood of scope change?",
    section: "Delivery Dynamics",
    context: "Scope changes without repricing are the most common source of margin leak.",
    signal: "ScopeElasticity", dimension: "Commercial Exposure",
    note: "Computer Software context appends: 'Including technical dependency changes outside your control.'",
    options: [
      { label: "Low",    risk: "low"    },
      { label: "Medium", risk: "medium" },
      { label: "High",   risk: "high"   },
    ],
  },
  {
    number: "Q18", id: "crossFunctionalCoordination", title: "How much cross-functional coordination is required?",
    section: "Delivery Dynamics",
    context: "Cross-team coordination creates invisible overhead that rarely gets priced in.",
    signal: "CoordinationLoad (combined with Q22)", dimension: "Coordination Entropy",
    options: [
      { label: "Low",    risk: "low"    },
      { label: "Medium", risk: "medium" },
      { label: "High",   risk: "high"   },
    ],
  },
  {
    number: "Q19", id: "aiEffortShift", title: "Where is AI primarily expected to substitute effort?",
    section: "Delivery Dynamics",
    context: "The layer where AI replaces human effort determines whether it reduces cost or increases oversight burden.",
    signal: "AILeverage", dimension: "AI Substitution and Measurement Risk",
    options: [
      { label: "Junior execution",              risk: "low"    },
      { label: "Mid-level production",          risk: "medium" },
      { label: "Senior thinking / review",      risk: "high"   },
      { label: "No clear substitution",         risk: "high"   },
    ],
  },
  {
    number: "Q20", id: "marginalValueSaturation", title: "Value Saturation — How much incremental value does adding more people create here?",
    section: "Value, Load & Confidence",
    context: "When adding people stops creating value, staffing becomes a cost center.",
    signal: "GovernanceStrength", dimension: "Workforce Intensity",
    options: [
      { label: "Significant additional value",        risk: "low"    },
      { label: "Some additional value",               risk: "medium" },
      { label: "Minimal additional value",            risk: "high"   },
      { label: "No meaningful additional value",      risk: "high"   },
    ],
  },
  {
    number: "Q21", id: "seniorOversightLoad", title: "Senior Oversight Load — How much senior oversight does this engagement require?",
    section: "Value, Load & Confidence",
    context: "Disproportionate senior oversight signals structural delivery risk.",
    signal: "SeniorDependency modifier (combined with Q13)", dimension: "Workforce Intensity",
    options: [
      { label: "Less than usual",   risk: "low"    },
      { label: "About the same",    risk: "medium" },
      { label: "More than usual",   risk: "high"   },
    ],
  },
  {
    number: "Q22", id: "coordinationDecisionDrag", title: "Coordination & Decision Drag — How much coordination is required across teams?",
    section: "Value, Load & Confidence",
    context: "Heavy coordination slows decisions and inflates the cost of every deliverable.",
    signal: "CoordinationLoad modifier (combined with Q18)", dimension: "Coordination Entropy",
    options: [
      { label: "Minimal",   risk: "low"    },
      { label: "Moderate",  risk: "medium" },
      { label: "Heavy",     risk: "high"   },
    ],
  },
  {
    number: "Q23", id: "deliveryConfidence", title: "Delivery Confidence — How confident are you in the delivery model for this engagement?",
    section: "Value, Load & Confidence",
    context: "Low confidence often signals structural issues that pricing alone cannot fix.",
    signal: "DeliveryConfidence — Confidence Signal", dimension: "HARD OVERRIDE if LOW",
    note: "LOW confidence fires as a hard override BEFORE weighted scoring and unconditionally returns: Do Not Proceed Without Repricing.",
    options: [
      { label: "High confidence",  risk: "low"    },
      { label: "Some concerns",    risk: "medium" },
      { label: "Low confidence",   risk: "high"   },
    ],
  },
  {
    number: "Q24", id: "aiAgenticFramework", title: "Are you using AI or an Agentic framework and what kind of projects are they being deployed on?",
    section: "AI Risk",
    context: "Agentic deployments in billable workflows directly affect pricing integrity and delivery accountability.",
    signal: "AIRiskPeak (MAX of Q24, Q25, Q26)", dimension: "AI Substitution and Measurement Risk",
    options: [
      { label: "Yes", risk: "high" },
      { label: "No",  risk: "low"  },
      { label: "NA",  risk: "low"  },
    ],
  },
  {
    number: "Q25", id: "aiHumanHoursReplaced", title: "How many human hours will you replace / augment with an AI agent in delivery workflows?",
    section: "AI Risk",
    context: "The scale of AI substitution determines whether cost savings flow to margin or create oversight overhead.",
    signal: "AIRiskPeak (MAX of Q24, Q25, Q26)", dimension: "AI Substitution and Measurement Risk",
    options: [
      { label: "0–25%",     risk: "low"    },
      { label: "25–50%",    risk: "medium" },
      { label: "50–75%",    risk: "high"   },
      { label: "75–100%",   risk: "high"   },
      { label: "NA",        risk: "low"    },
    ],
  },
  {
    number: "Q26", id: "aiCommercialImpactMeasured", title: "Have you measured the commercial impact of using AI agents?",
    section: "AI Risk",
    context: "Unmeasured AI impact means you cannot price its contribution or account for its risks.",
    signal: "AIRiskPeak (MAX of Q24, Q25, Q26)", dimension: "AI Substitution and Measurement Risk",
    options: [
      { label: "Yes", risk: "low"  },
      { label: "No",  risk: "high" },
      { label: "NA",  risk: "low"  },
    ],
  },
  {
    number: "Q27", id: "openSignal", title: "Is there anything about this engagement that feels risky or unusual?",
    section: "Open Signal",
    isNarrative: true,
    note: "Free-text for narrative generation only. No effect on weighted score or verdict; AI cannot introduce numerical claims.",
  },
];

// ─── Quick Risk Profiler ──────────────────────────────────────────────────────

const profilerQuestions: QuestionDef[] = [
  {
    number: "P1", id: "decisionEvaluating", title: "What decision are you evaluating with this assessment?",
    section: "Quick Risk Profiler",
    context: "The type of decision shapes how much pricing flexibility remains.",
    signal: "EngagementState", dimension: "Commercial Exposure",
    note: "Topic overlaps full-assessment Q7; answers are not transferred between flows.",
    options: [
      { label: "New client win / pitch acceptance",           risk: "low"    },
      { label: "Renewal / contract extension",                risk: "low"    },
      { label: "Scope expansion without repricing",           risk: "high"   },
      { label: "Escalation on a live account",                risk: "high"   },
      { label: "Strategic / leadership-driven exception",     risk: "medium" },
      { label: "Exploratory / no active decision",            risk: "low"    },
    ],
  },
  {
    number: "P2", id: "engagementClassification", title: "How would you classify this engagement today?",
    section: "Quick Risk Profiler",
    context: "Engagement maturity affects how predictable the delivery effort will be.",
    signal: "EngagementState", dimension: "Commercial Exposure",
    note: "Topic overlaps full-assessment Q9; answers are not transferred between flows.",
    options: [
      { label: "New (pre-kickoff / onboarding phase)",             risk: "medium" },
      { label: "Ongoing (in delivery < 6 months)",                 risk: "medium" },
      { label: "Ongoing (in delivery 6–12 months)",                risk: "low"    },
      { label: "Ongoing (in delivery 12+ months)",                 risk: "low"    },
      { label: "Renewal / scope expansion of existing engagement",  risk: "medium" },
    ],
  },
  {
    number: "P3", id: "clientVolatility", title: "How would you rate client volatility?",
    section: "Quick Risk Profiler",
    context: "Client stability directly impacts coordination cost and rework risk.",
    signal: "ClientVolatility", dimension: "Volatility Control",
    note: "Topic overlaps full-assessment Q11; answers are not transferred between flows.",
    options: [
      { label: "Low (stable stakeholders, clear expectations)",      risk: "low"    },
      { label: "Medium",                                              risk: "medium" },
      { label: "High (frequent changes, multiple decision-makers)",  risk: "high"   },
    ],
  },
  {
    number: "P4", id: "seniorLeadershipInvolvement", title: "What's the planned senior leadership involvement?",
    section: "Quick Risk Profiler",
    context: "Senior involvement in delivery signals that junior/mid teams cannot carry the engagement.",
    signal: "SeniorDependency", dimension: "Workforce Intensity",
    note: "Topic overlaps full-assessment Q13; answers are not transferred between flows.",
    options: [
      { label: "Minimal (oversight only)",  risk: "low"    },
      { label: "Periodic (key moments)",    risk: "medium" },
      { label: "Frequent (ongoing)",        risk: "high"   },
      { label: "Continuous (embedded)",     risk: "high"   },
    ],
  },
  {
    number: "P5", id: "executionThinkingMix", title: "What's the execution vs thinking mix?",
    section: "Quick Risk Profiler",
    context: "Thinking-heavy work is harder to scope, price, and delegate.",
    signal: "IterationLoad proxy", dimension: "Workforce Intensity",
    note: "Topic overlaps full-assessment Q15; profiler options are separate and answers are not transferred.",
    options: [
      { label: "Execution-heavy", risk: "low"    },
      { label: "Balanced",        risk: "medium" },
      { label: "Thinking-heavy",  risk: "high"   },
    ],
  },
  {
    number: "P6", id: "aiEffortShift", title: "Where is AI primarily expected to substitute effort?",
    section: "Quick Risk Profiler",
    context: "The layer where AI replaces human effort determines whether it reduces cost or increases oversight burden.",
    signal: "AILeverage", dimension: "AI Substitution and Measurement Risk",
    note: "Topic overlaps full-assessment Q19; answers are not transferred between flows.",
    options: [
      { label: "Junior execution",          risk: "low"    },
      { label: "Mid-level production",      risk: "medium" },
      { label: "Senior thinking / review",  risk: "high"   },
      { label: "No clear substitution",     risk: "high"   },
    ],
  },
];

// ─── PDF Helpers ──────────────────────────────────────────────────────────────

function maybeAddPage(doc: PDFKit.PDFDocument, needed = 80) {
  if (doc.y > doc.page.height - needed - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function hRule(doc: PDFKit.PDFDocument, y?: number) {
  const ry = y ?? doc.y;
  doc.save().moveTo(50, ry).lineTo(doc.page.width - 50, ry).strokeColor(T.rule).lineWidth(0.5).stroke().restore();
}

function sectionBanner(doc: PDFKit.PDFDocument, label: string) {
  maybeAddPage(doc, 50);
  const y = doc.y;
  hRule(doc, y);
  doc.moveDown(0.4);
  doc.fontSize(8).font("Helvetica-Bold").fillColor(T.gray).text(label.toUpperCase(), 50, doc.y, { characterSpacing: 1 });
  doc.moveDown(0.3);
  hRule(doc);
  doc.moveDown(0.6);
}

function riskText(risk: RiskLevel): string {
  if (risk === "low")    return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high")   return "High";
  return "—";
}

function scorecardPoints(q: QuestionDef, option: string): string {
  const value = option.toLowerCase();
  const direct = (): string => value.startsWith("low") ? "0" : value.startsWith("medium") ? "50" : value.startsWith("high") ? "100" : "—";
  switch (q.number) {
    case "Q7":
      if (value.includes("scope expansion") || value.includes("escalation")) return "100";
      if (value.includes("strategic")) return "50";
      return "0";
    case "Q9":
      if (value.includes("under 6") || value.includes("< 6") || value.includes("new (") || value.includes("renewal")) return "50";
      return "0";
    case "Q10":
      if (value.includes("hybrid")) return "50";
      if (value.includes("retainer")) return "0";
      if (value.includes("fixed") || value.includes("commission") || value.includes("outcome") || value.includes("implementation")) return "100";
      if (value.includes("time & materials") || value.includes("t&m") || value.includes("managed") || value.includes("saas")) return "50";
      return "—";
    case "Q11": case "Q12": case "Q14": case "Q16": case "Q17": case "Q18":
      return direct();
    case "Q13":
      if (value.includes("minimal")) return "0";
      if (value.includes("periodic")) return "50";
      if (value.includes("frequent") || value.includes("continuous")) return "100";
      return "—";
    case "Q15":
      if (value.includes("execution-heavy")) return "0";
      if (value.includes("balanced") || value.includes("technical /")) return "50";
      if (value.includes("thinking") || value.includes("advisory") || value.includes("strategy")) return "100";
      return "—";
    case "Q19":
      return value.includes("junior") ? "0" : value.includes("mid-level") ? "50" : "100";
    case "Q20":
      return value.includes("significant") ? "0" : value.includes("some") ? "50" : "100";
    case "Q21":
      return value.includes("less") ? "0" : value.includes("about") ? "50" : value.includes("more") ? "100" : "—";
    case "Q22":
      return value.includes("minimal") ? "0" : value.includes("moderate") ? "50" : value.includes("heavy") ? "100" : "—";
    case "Q23":
      return value.includes("low confidence") ? "OVERRIDE" : "No points";
    case "Q24":
      return value.includes("yes") ? "100" : "0";
    case "Q25":
      if (value.includes("25–50")) return "50";
      if (value.includes("50–75") || value.includes("75–100")) return "100";
      return "0";
    case "Q26":
      return value.includes("no") ? "100" : "0";
    default:
      return "—";
  }
}

function drawQuestion(doc: PDFKit.PDFDocument, q: QuestionDef, isFullAssessment = false) {
  const pageW = doc.page.width - 100;
  maybeAddPage(doc, 100);

  // Question number + title
  const numW = 32;
  const titleX = 50 + numW;
  const titleW = pageW - numW;
  const qY = doc.y;

  doc.fontSize(9).font("Helvetica-Bold").fillColor(T.gray).text(q.number, 50, qY, { width: numW });
  doc.fontSize(9).font("Helvetica-Bold").fillColor(T.black).text(q.title, titleX, qY, { width: titleW, lineGap: 2 });
  doc.moveDown(0.3);

  if (q.isIdentifier && !q.options && !q.note) {
    doc.fontSize(8).font("Helvetica").fillColor(T.light).text("Identifier field — no risk score.", titleX, doc.y);
    doc.moveDown(0.9);
    return;
  }

  if (q.isNarrative) {
    doc.fontSize(8).font("Helvetica").fillColor(T.light).text("Free-text — narrative only, no risk score.", titleX, doc.y, { width: titleW });
    if (q.note) {
      doc.moveDown(0.2);
      doc.fontSize(7.5).font("Helvetica").fillColor(T.gray).text(`Note: ${q.note}`, titleX, doc.y, { width: titleW, lineGap: 1 });
    }
    doc.moveDown(0.9);
    return;
  }

  // Signal + dimension line
  if (q.signal) {
    const parts: string[] = [`Signal: ${q.signal}`];
    if (q.dimension) parts.push(`Dimension: ${q.dimension}`);
    doc.fontSize(7.5).font("Helvetica").fillColor(T.gray).text(parts.join("    |    "), titleX, doc.y, { width: titleW });
    doc.moveDown(0.25);
  }

  // Context
  if (q.context) {
    doc.fontSize(7.5).font("Helvetica").fillColor(T.gray).text(q.context, titleX, doc.y, { width: titleW, lineGap: 1 });
    doc.moveDown(0.25);
  }

  // Note (italicised, indented)
  if (q.note) {
    doc.fontSize(7.5).font("Helvetica-Oblique").fillColor(T.mid).text(`Note: ${q.note}`, titleX, doc.y, { width: titleW, lineGap: 1 });
    doc.moveDown(0.3);
  }

  // Options table
  if (q.options && q.options.length > 0) {
    maybeAddPage(doc, 20 + q.options.length * 14);
    const tY = doc.y;
    const optW = titleW - 50;
    const riskColW = 48;
    const riskColX = titleX + optW + 2;

    // Header
    doc.fontSize(7).font("Helvetica-Bold").fillColor(T.light)
      .text("OPTION", titleX, tY, { width: optW })
      .text(isFullAssessment ? "POINTS" : "PROFILER RISK", riskColX, tY, { width: riskColW });
    doc.moveDown(0.3);
    hRule(doc);
    doc.moveDown(0.2);

    q.options.forEach((opt) => {
      doc.fontSize(8).font("Helvetica");
      const rowHeight = Math.max(12, doc.heightOfString(opt.label, { width: optW - 4, lineGap: 1 })) + 6;
      maybeAddPage(doc, rowHeight);
      const rowY = doc.y;
      doc.fontSize(8).font("Helvetica").fillColor(T.dark).text(opt.label, titleX, rowY, { width: optW - 4, lineGap: 1 });
      const rLabel = isFullAssessment ? scorecardPoints(q, opt.label) : riskText(opt.risk);
      const rColor = isFullAssessment
        ? rLabel === "OVERRIDE" || rLabel === "100" ? "#dc2626" : rLabel === "50" ? "#b45309" : "#059669"
        : opt.risk === "high" ? "#dc2626" : opt.risk === "medium" ? "#b45309" : opt.risk === "low" ? "#059669" : T.light;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(rColor).text(rLabel, riskColX, rowY, { width: riskColW });
      doc.y = rowY + rowHeight;
    });
  }

  doc.moveDown(0.5);
  hRule(doc);
  doc.moveDown(0.6);
}

// ─── Build PDF ───────────────────────────────────────────────────────────────

function buildPdf() {
  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  const pageW = doc.page.width - 100;

  // ── Cover ────────────────────────────────────────────────────────────────
  doc.fontSize(22).font("Helvetica-Bold").fillColor(T.black)
    .text("MarginMix", 50, 160, { align: "left" });
  doc.fontSize(15).font("Helvetica").fillColor(T.gray)
    .text("Risk Logic Reference", 50, 192, { align: "left" });

  hRule(doc, 224);

  doc.fontSize(9).font("Helvetica").fillColor(T.gray)
    .text("Complete question set  ·  Risk mappings  ·  Signal routing  ·  Weighted scoring model", 50, 234);

  doc.fontSize(8.5).font("Helvetica").fillColor(T.light)
    .text(
      `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      50, 252
    );

  // Summary grid (text only)
  const summaryItems = [
    ["27", "Standalone Assessment Questions"],
    ["6",  "Separate Profiler Questions"],
    ["5",  "Weighted Dimensions"],
    ["5",  "Verdict Levels"],
  ];
  let sx = 50;
  const sw = (pageW - 30) / 4;
  summaryItems.forEach(([val, label]) => {
    hRule(doc, 290);
    doc.fontSize(18).font("Helvetica-Bold").fillColor(T.black).text(val, sx, 298, { width: sw, align: "left" });
    doc.fontSize(7.5).font("Helvetica").fillColor(T.gray).text(label, sx, 322, { width: sw });
    sx += sw + 10;
  });

  hRule(doc, 340);

  doc.addPage();

  // ── 1. Weighted Scoring Model ─────────────────────────────────────────────
  doc.fontSize(13).font("Helvetica-Bold").fillColor(T.black).text("1.  Weighted Scoring Model", 50, doc.y);
  doc.moveDown(0.5);
  doc.fontSize(8.5).font("Helvetica").fillColor(T.gray)
    .text(
      "The standalone assessment uses deterministic Model1 arithmetic: answer points, named signals, dimension means, then the weighted composite. The quick profiler is independent.",
      50, doc.y, { width: pageW, lineGap: 2 }
    );
  doc.moveDown(0.8);

  // Override note
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(T.black)
    .text("Confidence override:", 50, doc.y, { continued: true });
  doc.font("Helvetica").fillColor(T.mid)
    .text("  Negative Confidence Signal remains a pre-score override: low Q23 delivery confidence or the existing Q20 minimal/none value-saturation mapping. The numeric composite remains answer-based.");
  doc.moveDown(0.8);

  // Dimensions table
  hRule(doc);
  doc.moveDown(0.3);
  const dimensionHeaderY = doc.y;
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(T.light)
    .text("DIMENSION",          50,  dimensionHeaderY, { width: 140 })
    .text("WEIGHT",            194,  dimensionHeaderY, { width: 38,  align: "right" })
    .text("SIGNAL GROUPS",     242,  dimensionHeaderY, { width: 125 })
    .text("DIMENSION MEAN",    372,  dimensionHeaderY, { width: pageW - 322 });
  doc.y = dimensionHeaderY + 16;
  doc.moveDown(0.3);
  hRule(doc);
  doc.moveDown(0.3);

  const dims = [
    { d: "Workforce Intensity",   w: "30%", qs: "MAX(Q13,Q21); Q15; Q16; Q20", r: "Mean of 4 signals" },
    { d: "Coordination Entropy",  w: "25%", qs: "Q14; MAX(Q18,Q22)",             r: "Mean of 2 signals" },
    { d: "Commercial Exposure",   w: "20%", qs: "MAX(Q7,Q9); Q10; Q17",          r: "Mean of 3 signals" },
    { d: "Volatility Control",    w: "15%", qs: "Q11; Q12",                       r: "Mean of 2 signals" },
    { d: "AI Substitution and Measurement Risk",  w: "10%", qs: "Q19; MAX(Q24,Q25,Q26)",         r: "Mean of 2 signals" },
  ];
  dims.forEach(d => {
    const rowY = doc.y;
    doc.fontSize(8.5).font("Helvetica");
    const rowHeight = Math.max(
      doc.heightOfString(d.qs, { width: 125 }),
      doc.heightOfString(d.r, { width: pageW - 322 }),
      doc.heightOfString(d.d, { width: 140 }),
    ) + 8;
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(T.black).text(d.d, 50, rowY, { width: 140 });
    doc.fontSize(8.5).font("Helvetica").fillColor(T.mid)
      .text(d.w,  194, rowY, { width: 38,  align: "right" })
      .text(d.qs, 242, rowY, { width: 125 })
      .text(d.r,  372, rowY, { width: pageW - 322 });
    doc.y = rowY + rowHeight;
    doc.moveDown(0.5);
    hRule(doc);
    doc.moveDown(0.3);
  });

  doc.moveDown(0.6);

  doc.moveDown(0.4);
  doc.fontSize(8.5).font("Helvetica").fillColor(T.mid).text(
    "Score answers as 0, 50 or 100. Use MAX for grouped signals, then take the arithmetic mean of each dimension's signals. Multiply each mean by its weight / 100 and sum the five contributions. Preserve raw precision for verdict selection; round only the displayed score to one decimal place.",
    50, doc.y, { width: pageW, lineGap: 2 }
  );
  doc.moveDown(0.8);
  // Thresholds table
  doc.fontSize(10).font("Helvetica-Bold").fillColor(T.black).text("Score Thresholds (0–100)", 50, doc.y);
  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.3);
  const thresholdHeaderY = doc.y;
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(T.light)
    .text("SCORE RANGE", 50, thresholdHeaderY, { width: 80 })
    .text("VERDICT", 134, thresholdHeaderY, { width: pageW - 84 });
  doc.y = thresholdHeaderY + 14;
  doc.moveDown(0.3);
  hRule(doc);
  doc.moveDown(0.3);

  const thresholds = [
    { range: "0 to <20",   verdict: "Structurally Safe"                    },
    { range: "20 to <40",  verdict: "Execution Heavy"                      },
    { range: "40 to <60",  verdict: "Price Sensitive"                      },
    { range: "60 to <80",  verdict: "Structurally Fragile"                 },
    { range: "80 to 100",  verdict: "Do Not Proceed Without Repricing"     },
  ];
  thresholds.forEach(t => {
    const rowY = doc.y;
    doc.fontSize(8.5).font("Helvetica").fillColor(T.mid).text(t.range, 50, rowY, { width: 80 });
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(T.black).text(t.verdict, 134, rowY, { width: pageW - 84 });
    doc.y = rowY + 14;
    doc.moveDown(0.5);
    hRule(doc);
    doc.moveDown(0.3);
  });

  doc.moveDown(0.6);
  doc.fontSize(8.5).font("Helvetica").fillColor(T.mid).text(
    "Updated scorecard example only: dimension means 62.5, 50, 50, 25 and 100 give contributions 18.75 + 12.5 + 10 + 3.75 + 10 = 55. Q9 is ongoing under six months (50 points); six to twelve months remains 0. Different answers produce different scores. AI cannot supply numbers or alter the deterministic verdict. No margin-loss forecast or staffing percentages are inferred.",
    50, doc.y, { width: pageW, lineGap: 2 }
  );

  // ── 2. Quick Risk Profiler ────────────────────────────────────────────────
  doc.addPage();
  doc.fontSize(13).font("Helvetica-Bold").fillColor(T.black).text("2.  Quick Risk Profiler", 50, doc.y);
  doc.moveDown(0.3);
  doc.fontSize(8.5).font("Helvetica").fillColor(T.gray)
    .text(
      "This is a separate, independent quick-risk flow. It does not prefill the standalone full assessment or skip its questions. Profiler risk labels are not Model1 points.",
      50, doc.y, { width: pageW, lineGap: 2 }
    );
  doc.moveDown(0.9);

  sectionBanner(doc, "Quick Risk Profiler — All 6 Questions");
  profilerQuestions.forEach(q => drawQuestion(doc, q));

  // ── 3. Full Assessment ────────────────────────────────────────────────────
  doc.addPage();
  doc.fontSize(13).font("Helvetica-Bold").fillColor(T.black).text("3.  Full Assessment — All 27 Questions", 50, doc.y);
  doc.moveDown(0.3);
  doc.fontSize(8.5).font("Helvetica").fillColor(T.gray)
    .text(
      "The full assessment does not import quick-profiler answers. Industry selection (Q6) controls conditional variants. The POINTS column applies to Model1-scored answers; Q23 is override-only and Q27 is narrative-only.",
      50, doc.y, { width: pageW, lineGap: 2 }
    );
  doc.moveDown(0.9);

  let lastSection = "";
  fullAssessmentQuestions.forEach(q => {
    if (q.section !== lastSection) {
      sectionBanner(doc, q.section);
      lastSection = q.section;
    }
    drawQuestion(doc, q, true);
  });

  // ── 4. Signal → Dimension Routing ────────────────────────────────────────
  doc.addPage();
  doc.fontSize(13).font("Helvetica-Bold").fillColor(T.black).text("4.  Signal to Dimension Routing", 50, doc.y);
  doc.moveDown(0.5);

  hRule(doc);
  doc.moveDown(0.3);
  const routingHeaderY = doc.y;
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(T.light)
    .text("SIGNAL",         50, routingHeaderY, { width: 118 })
    .text("QUESTIONS",     172, routingHeaderY, { width: 68  })
    .text("DIMENSION",     244, routingHeaderY, { width: 110 })
    .text("ROUTING RULE",  358, routingHeaderY, { width: pageW - 308 });
  doc.y = routingHeaderY + 14;
  doc.moveDown(0.3);
  hRule(doc);
  doc.moveDown(0.3);

  const routing = [
    { s: "ClientVolatility",        qs: "Q11",           d: "Volatility Control",      r: "Answer points: low 0; medium 50; high 100" },
    { s: "StakeholderLoad",         qs: "Q12",           d: "Volatility Control",      r: "Answer points: low 0; medium 50; high 100" },
    { s: "SeniorDependency",        qs: "Q13, Q21",      d: "Workforce Intensity",     r: "MAX of both answer point values" },
    { s: "CoordinationIntensity",   qs: "Q14",           d: "Coordination Entropy",    r: "Answer points: low 0; medium 50; high 100" },
    { s: "IterationLoad proxy",     qs: "Q15",           d: "Workforce Intensity",     r: "Execution 0; balanced/technical 50; thinking/advisory/strategy 100" },
    { s: "IterationLoad",           qs: "Q16",           d: "Workforce Intensity",     r: "Answer points: low 0; medium 50; high 100" },
    { s: "ScopeElasticity",         qs: "Q17",           d: "Commercial Exposure",     r: "Answer points: low 0; medium 50; high 100" },
    { s: "CoordinationLoad",        qs: "Q18, Q22",      d: "Coordination Entropy",    r: "MAX of both answer point values" },
    { s: "AILeverage",              qs: "Q19",           d: "AI Substitution and Measurement Risk",    r: "Junior 0; mid-level 50; senior/no substitution 100" },
    { s: "GovernanceStrength",      qs: "Q20",           d: "Workforce Intensity",     r: "Significant 0; some 50; minimal/none 100" },
    { s: "PricingRigidity",         qs: "Q10",           d: "Commercial Exposure",     r: "Retainer 0; hybrid/T&M/managed/SaaS 50; fixed/commission/outcome 100" },
    { s: "Confidence Signal",       qs: "Q20, Q23",      d: "HARD OVERRIDE",           r: "Negative triggers override; no points added" },
    { s: "AIRiskPeak",              qs: "Q24,Q25,Q26",   d: "AI Substitution and Measurement Risk",    r: "MAX of three AI risk point values" },
    { s: "EngagementState",         qs: "Q7, Q9",        d: "Commercial Exposure",     r: "MAX of both answer point values" },
  ];

  routing.forEach(row => {
    doc.fontSize(8).font("Helvetica");
    const rowHeight = Math.max(
      doc.heightOfString(row.s, { width: 118 }),
      doc.heightOfString(row.qs, { width: 68 }),
      doc.heightOfString(row.d, { width: 110 }),
      doc.heightOfString(row.r, { width: pageW - 308, lineGap: 1 }),
    ) + 8;
    maybeAddPage(doc, rowHeight);
    const rowY = doc.y;
    const isOverride = row.d === "HARD OVERRIDE";
    doc.fontSize(8).font("Helvetica-Bold").fillColor(T.dark)  .text(row.s,  50,  rowY, { width: 118 });
    doc.fontSize(8).font("Helvetica").fillColor(T.gray)        .text(row.qs, 172, rowY, { width: 68  });
    doc.fontSize(8).font("Helvetica").fillColor(isOverride ? "#dc2626" : T.dark).text(row.d,  244, rowY, { width: 110 });
    doc.fontSize(7.5).font("Helvetica").fillColor(T.gray)      .text(row.r,  358, rowY, { width: pageW - 308, lineGap: 1 });
    doc.y = rowY + rowHeight;
    hRule(doc);
    doc.moveDown(0.3);
  });

  // ── Risk Level Legend ─────────────────────────────────────────────────────
  doc.moveDown(0.6);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(T.black).text("Model1 Point Legend", 50, doc.y);
  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.4);

  const legend = [
    { label: "0",      color: "#059669", desc: "Zero answer risk points." },
    { label: "50",     color: "#b45309", desc: "Fifty answer risk points." },
    { label: "100",    color: "#dc2626", desc: "One hundred answer risk points." },
    { label: "—",      color: T.light,   desc: "Outside the numeric composite: context, override or narrative." },
  ];
  legend.forEach(l => {
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(l.color).text(l.label, 50, doc.y, { width: 52, continued: false });
    doc.fontSize(8.5).font("Helvetica").fillColor(T.mid).text(l.desc, 108, doc.y - 11, { width: pageW - 58 });
    doc.moveDown(0.6);
  });

  // ── Page Numbers ──────────────────────────────────────────────────────────
  const total = (doc as any).bufferedPageRange().count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(i);
    if (i === 0) continue;
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0; // Footer must not create an extra blank page.
    doc.fontSize(7).font("Helvetica").fillColor(T.light)
      .text(
        `MarginMix Risk Logic Reference  ·  Page ${i + 1} of ${total}`,
        50, doc.page.height - 38, { width: pageW, align: "center" }
      );
    doc.page.margins.bottom = bottomMargin;
  }

  doc.end();
  stream.on("finish", () => console.log(`\n✓ PDF written → ${OUTPUT_PATH}\n`));
}

buildPdf();
