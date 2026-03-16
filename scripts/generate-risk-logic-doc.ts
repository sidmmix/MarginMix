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
    signal: "Context modifier",
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
    signal: "PricingRigidity → ResourcingFlex", dimension: "Commercial Exposure",
    note: "Options are industry-specific. High PricingRigidity → low ResourcingFlex → elevates Commercial Exposure.",
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
    signal: "AILeverage / MeasurementMaturity modifier", dimension: "Measurement Maturity",
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
    signal: "DeliveryConfidence → Confidence Signal", dimension: "HARD OVERRIDE if LOW",
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
    signal: "MeasurementMaturity modifier", dimension: "Measurement Maturity",
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
    signal: "MeasurementMaturity modifier", dimension: "Measurement Maturity",
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
    signal: "MeasurementMaturity modifier", dimension: "Measurement Maturity",
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
    note: "Free-text. Passed to GPT-4.1 for PDF narrative generation only. No effect on weighted score or verdict.",
  },
];

// ─── Quick Risk Profiler ──────────────────────────────────────────────────────

const profilerQuestions: QuestionDef[] = [
  {
    number: "P1", id: "decisionEvaluating", title: "What decision are you evaluating with this assessment?",
    section: "Quick Risk Profiler",
    context: "The type of decision shapes how much pricing flexibility remains.",
    signal: "EngagementState", dimension: "Commercial Exposure",
    note: "Corresponds to Q7 of full assessment. Answers carry over; Q7 is skipped in the full flow.",
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
    note: "Corresponds to Q9. Answers carry over.",
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
    note: "Corresponds to Q11. Answers carry over.",
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
    note: "Corresponds to Q13. Answers carry over.",
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
    note: "Corresponds to Q15. Profiler uses standard 3 options only (no industry variants). Answers carry over.",
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
    signal: "AILeverage", dimension: "Measurement Maturity",
    note: "Corresponds to Q19. Answers carry over.",
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

function drawQuestion(doc: PDFKit.PDFDocument, q: QuestionDef) {
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
      .text("RISK", riskColX, tY, { width: riskColW });
    doc.moveDown(0.3);
    hRule(doc);
    doc.moveDown(0.2);

    q.options.forEach((opt) => {
      maybeAddPage(doc, 16);
      const rowY = doc.y;
      doc.fontSize(8).font("Helvetica").fillColor(T.dark).text(opt.label, titleX, rowY, { width: optW - 4, lineGap: 1 });
      const rLabel = riskText(opt.risk);
      const rColor = opt.risk === "high" ? "#dc2626" : opt.risk === "medium" ? "#b45309" : opt.risk === "low" ? "#059669" : T.light;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(rColor).text(rLabel, riskColX, rowY, { width: riskColW });
      doc.moveDown(0.5);
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
    ["27", "Full Assessment Questions"],
    ["6",  "Quick Profiler Questions"],
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
      "The verdict is determined by a composite weighted score across five risk dimensions. " +
      "Confidence Signal = Negative is a hard override that fires before scoring.",
      50, doc.y, { width: pageW, lineGap: 2 }
    );
  doc.moveDown(0.8);

  // Override note
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(T.black)
    .text("Hard Override:", 50, doc.y, { continued: true });
  doc.font("Helvetica").fillColor(T.mid)
    .text("  Q23 Low confidence → Confidence Signal = Negative → Do Not Proceed Without Repricing (fires unconditionally before scoring).");
  doc.moveDown(0.8);

  // Dimensions table
  hRule(doc);
  doc.moveDown(0.3);
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(T.light)
    .text("DIMENSION",          50,  doc.y, { width: 140 })
    .text("WEIGHT",            194,  doc.y, { width: 38,  align: "right" })
    .text("QUESTIONS",         242,  doc.y, { width: 80  })
    .text("RATIONALE",         328,  doc.y, { width: pageW - 278 });
  doc.moveDown(0.3);
  hRule(doc);
  doc.moveDown(0.3);

  const dims = [
    { d: "Workforce Intensity",   w: "30%", qs: "Q13 Q15 Q16 Q20 Q21",  r: "Most direct driver of margin erosion" },
    { d: "Coordination Entropy",  w: "25%", qs: "Q14 Q18 Q22",           r: "Compounding overhead across delivery layers" },
    { d: "Commercial Exposure",   w: "20%", qs: "Q7 Q9 Q10 Q17",         r: "Pricing and scope risk" },
    { d: "Volatility Control",    w: "15%", qs: "Q11 Q12",                r: "Client-side unpredictability" },
    { d: "Measurement Maturity",  w: "10%", qs: "Q19 Q24 Q25 Q26",       r: "AI substitution and oversight risk" },
  ];
  dims.forEach(d => {
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(T.black).text(d.d, 50, doc.y, { width: 140 });
    doc.fontSize(8.5).font("Helvetica").fillColor(T.mid)
      .text(d.w,  194, doc.y - 11, { width: 38,  align: "right" })
      .text(d.qs, 242, doc.y - 11, { width: 80  })
      .text(d.r,  328, doc.y - 11, { width: pageW - 278 });
    doc.moveDown(0.5);
    hRule(doc);
    doc.moveDown(0.3);
  });

  doc.moveDown(0.6);

  // Thresholds table
  doc.fontSize(10).font("Helvetica-Bold").fillColor(T.black).text("Score Thresholds (0–100)", 50, doc.y);
  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.3);
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(T.light)
    .text("SCORE RANGE", 50,  doc.y, { width: 80 })
    .text("VERDICT",     134, doc.y, { width: pageW - 84 });
  doc.moveDown(0.3);
  hRule(doc);
  doc.moveDown(0.3);

  const thresholds = [
    { range: "0 – 19",   verdict: "Structurally Safe"                    },
    { range: "20 – 39",  verdict: "Execution Heavy"                      },
    { range: "40 – 59",  verdict: "Price Sensitive"                      },
    { range: "60 – 79",  verdict: "Structurally Fragile"                 },
    { range: "80 – 100", verdict: "Do Not Proceed Without Repricing"     },
  ];
  thresholds.forEach(t => {
    doc.fontSize(8.5).font("Helvetica").fillColor(T.mid).text(t.range,   50,  doc.y, { width: 80 });
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(T.black).text(t.verdict, 134, doc.y - 11, { width: pageW - 84 });
    doc.moveDown(0.5);
    hRule(doc);
    doc.moveDown(0.3);
  });

  // ── 2. Quick Risk Profiler ────────────────────────────────────────────────
  doc.addPage();
  doc.fontSize(13).font("Helvetica-Bold").fillColor(T.black).text("2.  Quick Risk Profiler", 50, doc.y);
  doc.moveDown(0.3);
  doc.fontSize(8.5).font("Helvetica").fillColor(T.gray)
    .text(
      "Six questions that generate an instant risk verdict. Answers carry over to the full assessment — those six questions are skipped in the full flow. " +
      "The profiler applies the same risk dimension weightings as the main engine.",
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
      "When arriving from the Quick Profiler, P1–P6 answers are pre-filled and those questions are skipped. " +
      "Industry selection (Q6) controls which conditional question variants appear.",
      50, doc.y, { width: pageW, lineGap: 2 }
    );
  doc.moveDown(0.9);

  let lastSection = "";
  fullAssessmentQuestions.forEach(q => {
    if (q.section !== lastSection) {
      sectionBanner(doc, q.section);
      lastSection = q.section;
    }
    drawQuestion(doc, q);
  });

  // ── 4. Signal → Dimension Routing ────────────────────────────────────────
  doc.addPage();
  doc.fontSize(13).font("Helvetica-Bold").fillColor(T.black).text("4.  Signal → Dimension Routing", 50, doc.y);
  doc.moveDown(0.5);

  hRule(doc);
  doc.moveDown(0.3);
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(T.light)
    .text("SIGNAL",         50,  doc.y, { width: 118 })
    .text("QUESTIONS",      172, doc.y, { width: 68  })
    .text("DIMENSION",      244, doc.y, { width: 110 })
    .text("ROUTING RULE",   358, doc.y, { width: pageW - 308 });
  doc.moveDown(0.3);
  hRule(doc);
  doc.moveDown(0.3);

  const routing = [
    { s: "ClientVolatility",        qs: "Q11, P3",       d: "Volatility Control",      r: "Direct: low/medium/high" },
    { s: "StakeholderLoad",         qs: "Q12",           d: "Volatility Control",      r: "Direct: low/medium/high" },
    { s: "SeniorDependency",        qs: "Q13, Q21, P4",  d: "Workforce Intensity",     r: "Either HIGH → high; either MEDIUM → medium; else low" },
    { s: "CoordinationIntensity",   qs: "Q14",           d: "Coordination Entropy",    r: "Direct: low/medium/high" },
    { s: "IterationLoad (proxy)",   qs: "Q15, P5",       d: "Workforce Intensity",     r: "execution=low, balanced=medium, thinking/advisory/strategy=high, technical-impl=medium" },
    { s: "IterationLoad",           qs: "Q16",           d: "Workforce Intensity",     r: "Direct: low/medium/high" },
    { s: "ScopeElasticity",         qs: "Q17",           d: "Commercial Exposure",     r: "Direct: low/medium/high" },
    { s: "CoordinationLoad",        qs: "Q18, Q22",      d: "Coordination Entropy",    r: "Either HIGH → high; either MEDIUM → medium; else low" },
    { s: "AILeverage",              qs: "Q19, P6",       d: "Measurement Maturity",    r: "junior=low, mid=medium, senior/no-sub=high" },
    { s: "GovernanceStrength",      qs: "Q20",           d: "Workforce Intensity",     r: "significant=high, some=medium, minimal/none=low" },
    { s: "PricingRigidity",         qs: "Q10",           d: "Commercial Exposure",     r: "Fixed/outcome/milestone=high; T&M/managed/saas=medium; retainer=low" },
    { s: "DeliveryConfidence",      qs: "Q23",           d: "HARD OVERRIDE",           r: "low=Negative→DNP override; some_concerns=neutral; high=positive" },
    { s: "MeasurementMaturity",     qs: "Q19,Q24,Q25,Q26",d: "Measurement Maturity",  r: "aiRiskPeak: high hours OR no measurement OR agentic = high modifier" },
    { s: "EngagementState",         qs: "Q7, Q9",        d: "Commercial Exposure",     r: "scope-expansion/escalation=high; strategic-exception/new/renewal=medium; stable=low" },
  ];

  routing.forEach(row => {
    maybeAddPage(doc, 20);
    const rowY = doc.y;
    const isOverride = row.d === "HARD OVERRIDE";
    doc.fontSize(8).font("Helvetica-Bold").fillColor(T.dark)  .text(row.s,  50,  rowY, { width: 118 });
    doc.fontSize(8).font("Helvetica").fillColor(T.gray)        .text(row.qs, 172, rowY, { width: 68  });
    doc.fontSize(8).font("Helvetica").fillColor(isOverride ? "#dc2626" : T.dark).text(row.d,  244, rowY, { width: 110 });
    doc.fontSize(7.5).font("Helvetica").fillColor(T.gray)      .text(row.r,  358, rowY, { width: pageW - 308, lineGap: 1 });
    doc.moveDown(0.5);
    hRule(doc);
    doc.moveDown(0.3);
  });

  // ── Risk Level Legend ─────────────────────────────────────────────────────
  doc.moveDown(0.6);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(T.black).text("Risk Level Legend", 50, doc.y);
  doc.moveDown(0.4);
  hRule(doc);
  doc.moveDown(0.4);

  const legend = [
    { label: "Low",    color: "#059669", desc: "Within normal operating risk tolerance." },
    { label: "Medium", color: "#b45309", desc: "Elevated — monitor and manage; margin pressure possible." },
    { label: "High",   color: "#dc2626", desc: "Critical — direct contributor to margin erosion or verdict escalation." },
    { label: "—",      color: T.light,   desc: "Identifier fields (Q1–Q4, Q6) — context only, no risk score." },
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
    doc.fontSize(7).font("Helvetica").fillColor(T.light)
      .text(
        `MarginMix Risk Logic Reference  ·  Page ${i + 1} of ${total}`,
        50, doc.page.height - 38, { width: pageW, align: "center" }
      );
  }

  doc.end();
  stream.on("finish", () => console.log(`\n✓ PDF written → ${OUTPUT_PATH}\n`));
}

buildPdf();
