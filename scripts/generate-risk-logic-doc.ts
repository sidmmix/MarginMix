/**
 * generate-risk-logic-doc.ts
 * Generates the MarginMix Risk Logic Reference PDF for all questions (full assessment + profiler).
 * Run: npx tsx scripts/generate-risk-logic-doc.ts
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "../MarginMix_Risk_Logic_Reference.pdf");

const C = {
  emerald:  "#059669",
  teal:     "#0d9488",
  cyan:     "#0891b2",
  sky:      "#0284c7",
  amber:    "#d97706",
  violet:   "#7c3aed",
  dark:     "#111827",
  gray:     "#6b7280",
  lightGray:"#f3f4f6",
  border:   "#e5e7eb",
  low:      "#059669",
  medium:   "#d97706",
  high:     "#dc2626",
  white:    "#ffffff",
  black:    "#000000",
};

const RISK_BG = { low: "#d1fae5", medium: "#fef3c7", high: "#fee2e2" };
const RISK_TEXT = { low: "#065f46", medium: "#92400e", high: "#991b1b" };

type RiskLevel = "low" | "medium" | "high" | "none";

function riskLabel(r: RiskLevel) {
  if (r === "low") return "LOW";
  if (r === "medium") return "MEDIUM";
  if (r === "high") return "HIGH";
  return "—";
}

interface QuestionDef {
  number: string;
  id: string;
  title: string;
  subtitle?: string;
  context?: string;
  section: string;
  sectionColor: string;
  signal?: string;
  dimension?: string;
  options?: { label: string; risk: RiskLevel }[];
  note?: string;
  isIdentifier?: boolean;
  isNarrative?: boolean;
}

// ─── Full Assessment Questions ────────────────────────────────────────────────

const fullAssessmentQuestions: QuestionDef[] = [
  // ── Contact & Context ──
  {
    number: "Q1", id: "fullName", title: "What's your full name?",
    section: "Contact & Context", sectionColor: C.emerald,
    isIdentifier: true,
  },
  {
    number: "Q2", id: "workEmail", title: "What's your work email?",
    section: "Contact & Context", sectionColor: C.emerald,
    isIdentifier: true,
  },
  {
    number: "Q3", id: "roleTitle", title: "What's your role or title?",
    section: "Contact & Context", sectionColor: C.emerald,
    isIdentifier: true,
  },
  {
    number: "Q4", id: "organisationName", title: "What's your organization name?",
    section: "Contact & Context", sectionColor: C.emerald,
    isIdentifier: true,
  },
  {
    number: "Q5", id: "organisationSize", title: "What's your organization size?",
    section: "Contact & Context", sectionColor: C.emerald,
    context: "Larger organizations create more coordination layers that consume margin.",
    signal: "Heatmap indicator only",
    options: [
      { label: "50–500", risk: "low" },
      { label: "500–1,000", risk: "medium" },
      { label: "1,000–1,500", risk: "high" },
      { label: "1,500–2,000", risk: "high" },
    ],
  },
  {
    number: "Q6", id: "industry", title: "Which industry do you belong to?",
    section: "Contact & Context", sectionColor: C.emerald,
    isIdentifier: true,
    note: "Controls which conditional questions appear for Q7 decision label, Q10 engagement types, Q10b delivery model, and Q15 mix options. Does not score itself.",
    options: [
      { label: "Marketing & Advertising", risk: "none" },
      { label: "ITeS", risk: "none" },
      { label: "Management Consulting", risk: "none" },
      { label: "Computer Software", risk: "none" },
    ],
  },
  {
    number: "Q7", id: "decisionEvaluating",
    title: "What decision are you evaluating with this assessment?",
    section: "Contact & Context", sectionColor: C.emerald,
    context: "The type of decision shapes how much pricing flexibility remains.",
    signal: "EngagementState",
    dimension: "Commercial Exposure",
    note: "ITeS variant renames 'New client win' → 'New contract / SOW acceptance'",
    options: [
      { label: "New client win / pitch acceptance (or ITeS: New contract / SOW acceptance)", risk: "low" },
      { label: "Renewal / contract extension", risk: "low" },
      { label: "Scope expansion without repricing", risk: "high" },
      { label: "Escalation on a live account", risk: "high" },
      { label: "Strategic / leadership-driven exception", risk: "medium" },
      { label: "Exploratory / no active decision", risk: "low" },
    ],
  },
  // ── Client Engagement Context ──
  {
    number: "Q8", id: "specifyContext", title: "Specify Context",
    section: "Client Engagement Context", sectionColor: C.teal,
    context: "Multi-client assessments carry compounding coordination risk.",
    signal: "Identifier / context modifier",
    options: [
      { label: "Single client", risk: "low" },
      { label: "Group of clients – Org level", risk: "medium" },
    ],
  },
  {
    number: "Q9", id: "engagementClassification",
    title: "How would you classify this engagement today?",
    section: "Client Engagement Context", sectionColor: C.teal,
    context: "Engagement maturity affects how predictable the delivery effort will be.",
    signal: "EngagementState",
    dimension: "Commercial Exposure",
    options: [
      { label: "New (pre-kickoff / onboarding phase)", risk: "medium" },
      { label: "Ongoing (in delivery < 6 months)", risk: "medium" },
      { label: "Ongoing (in delivery 6–12 months)", risk: "low" },
      { label: "Ongoing (in delivery 12+ months)", risk: "low" },
      { label: "Renewal / scope expansion of an existing engagement", risk: "medium" },
    ],
  },
  {
    number: "Q10", id: "engagementType", title: "What's the engagement type?",
    section: "Client Engagement Context", sectionColor: C.teal,
    context: "Fixed-fee models absorb scope creep risk that retainers can pass through.",
    signal: "PricingRigidity → ResourcingFlex",
    dimension: "Commercial Exposure",
    note: "Options vary by industry (see below). High PricingRigidity → low ResourcingFlex → elevates Commercial Exposure.",
    options: [
      { label: "[Marketing & Advertising] Commission", risk: "high" },
      { label: "[Marketing & Advertising] Fixed Fees", risk: "low" },
      { label: "[Marketing & Advertising] Retainer", risk: "low" },
      { label: "[Marketing & Advertising] Outcome based", risk: "high" },
      { label: "[Marketing & Advertising] Hybrid – Retainer + Commission", risk: "medium" },
      { label: "[Marketing & Advertising] Hybrid – Retainer + Outcome based", risk: "medium" },
      { label: "[ITeS] Time & Materials (T&M)", risk: "medium" },
      { label: "[ITeS] Fixed Price", risk: "high" },
      { label: "[ITeS] Managed Services", risk: "medium" },
      { label: "[ITeS] Retainer / Ongoing Support", risk: "low" },
      { label: "[ITeS] Outcome / Milestone-based", risk: "high" },
      { label: "[ITeS] Hybrid", risk: "medium" },
      { label: "[Management Consulting] Fixed Fee / Project-based", risk: "high" },
      { label: "[Management Consulting] Retainer / Advisory", risk: "low" },
      { label: "[Management Consulting] Time & Materials", risk: "medium" },
      { label: "[Management Consulting] Outcome / Success-based", risk: "high" },
      { label: "[Management Consulting] Hybrid", risk: "medium" },
      { label: "[Computer Software] Implementation / Professional Services", risk: "high" },
      { label: "[Computer Software] Managed Services", risk: "medium" },
      { label: "[Computer Software] SaaS + Services Hybrid", risk: "medium" },
      { label: "[Computer Software] Fixed Price Development", risk: "high" },
      { label: "[Computer Software] T&M Development", risk: "medium" },
      { label: "[Computer Software] Outcome-based", risk: "high" },
    ],
  },
  {
    number: "Q10b", id: "deliveryModel", title: "What is the delivery model?",
    section: "Client Engagement Context", sectionColor: C.teal,
    context: "Onshore/offshore mix affects coordination overhead and margin risk.",
    signal: "Heatmap indicator only",
    note: "Conditional: shown only for ITeS and Computer Software industries.",
    options: [
      { label: "Onshore only", risk: "low" },
      { label: "Offshore only", risk: "medium" },
      { label: "Hybrid onshore/offshore", risk: "medium" },
      { label: "Nearshore", risk: "low" },
    ],
  },
  {
    number: "Q11", id: "clientVolatility", title: "How would you rate client volatility?",
    section: "Client Engagement Context", sectionColor: C.teal,
    context: "Client stability directly impacts coordination cost and rework risk.",
    signal: "ClientVolatility",
    dimension: "Volatility Control",
    options: [
      { label: "Low (stable stakeholders, clear expectations)", risk: "low" },
      { label: "Medium", risk: "medium" },
      { label: "High (frequent changes, multiple decision-makers)", risk: "high" },
    ],
  },
  {
    number: "Q12", id: "stakeholderComplexity",
    title: "What's the stakeholder complexity level?",
    section: "Client Engagement Context", sectionColor: C.teal,
    context: "More stakeholders mean more alignment cycles and hidden decision drag.",
    signal: "StakeholderLoad",
    dimension: "Volatility Control",
    options: [
      { label: "Low", risk: "low" },
      { label: "Medium", risk: "medium" },
      { label: "High", risk: "high" },
    ],
  },
  // ── Planned Delivery Structure ──
  {
    number: "Q13", id: "seniorLeadershipInvolvement",
    title: "How involved is senior leadership in day-to-day delivery?",
    section: "Planned Delivery Structure", sectionColor: C.cyan,
    context: "Senior involvement in delivery signals that junior/mid teams cannot carry the engagement independently.",
    signal: "SeniorDependency (combined with Q21)",
    dimension: "Workforce Intensity",
    options: [
      { label: "Minimal (strategic oversight only)", risk: "low" },
      { label: "Periodic (key milestones)", risk: "medium" },
      { label: "Frequent (weekly touchpoints)", risk: "high" },
      { label: "Continuous (hands-on delivery)", risk: "high" },
    ],
  },
  {
    number: "Q14", id: "midLevelOversight",
    title: "What's the mid-level oversight intensity?",
    section: "Planned Delivery Structure", sectionColor: C.cyan,
    context: "Mid-level oversight absorbs coordination costs that are often invisible in project budgets.",
    signal: "CoordinationIntensity",
    dimension: "Coordination Entropy",
    options: [
      { label: "Low", risk: "low" },
      { label: "Medium", risk: "medium" },
      { label: "High", risk: "high" },
    ],
  },
  {
    number: "Q15", id: "executionThinkingMix",
    title: "What's the execution vs thinking mix?",
    section: "Planned Delivery Structure", sectionColor: C.cyan,
    context: "Thinking-heavy work is harder to scope, price, and delegate.",
    signal: "IterationLoad proxy",
    dimension: "Workforce Intensity",
    note: "ITeS adds 'Advisory / Solutioning-heavy' (HIGH). Management Consulting adds 'Strategy / Advisory-heavy' (HIGH). Computer Software adds 'Technical / Implementation-heavy' (MEDIUM).",
    options: [
      { label: "Execution-heavy", risk: "low" },
      { label: "Balanced", risk: "medium" },
      { label: "Thinking-heavy", risk: "high" },
      { label: "[ITeS] Advisory / Solutioning-heavy", risk: "high" },
      { label: "[Management Consulting] Strategy / Advisory-heavy", risk: "high" },
      { label: "[Computer Software] Technical / Implementation-heavy", risk: "medium" },
    ],
  },
  // ── Delivery Dynamics ──
  {
    number: "Q16", id: "iterationIntensity",
    title: "What's the expected or current iteration intensity?",
    section: "Delivery Dynamics", sectionColor: C.sky,
    context: "High iteration erodes margin through repeated cycles of rework and refinement.",
    signal: "IterationLoad",
    dimension: "Workforce Intensity",
    options: [
      { label: "Low", risk: "low" },
      { label: "Medium", risk: "medium" },
      { label: "High", risk: "high" },
    ],
  },
  {
    number: "Q17", id: "scopeChangeLikelihood",
    title: "What's the likelihood of scope change?",
    section: "Delivery Dynamics", sectionColor: C.sky,
    context: "Scope changes without repricing are the most common source of margin leak.",
    signal: "ScopeElasticity",
    dimension: "Commercial Exposure",
    note: "Computer Software context note adds: 'Including technical dependency changes outside your control.'",
    options: [
      { label: "Low", risk: "low" },
      { label: "Medium", risk: "medium" },
      { label: "High", risk: "high" },
    ],
  },
  {
    number: "Q18", id: "crossFunctionalCoordination",
    title: "How much cross-functional coordination is required?",
    section: "Delivery Dynamics", sectionColor: C.sky,
    context: "Cross-team coordination creates invisible overhead that rarely gets priced in.",
    signal: "CoordinationLoad (combined with Q22)",
    dimension: "Coordination Entropy",
    options: [
      { label: "Low", risk: "low" },
      { label: "Medium", risk: "medium" },
      { label: "High", risk: "high" },
    ],
  },
  {
    number: "Q19", id: "aiEffortShift",
    title: "Where is AI primarily expected to substitute effort?",
    section: "Delivery Dynamics", sectionColor: C.sky,
    context: "The layer where AI replaces human effort determines whether it reduces cost or increases oversight burden.",
    signal: "AILeverage / MeasurementMaturity modifier",
    dimension: "Measurement Maturity",
    options: [
      { label: "Junior execution", risk: "low" },
      { label: "Mid-level production", risk: "medium" },
      { label: "Senior thinking / review", risk: "high" },
      { label: "No clear substitution", risk: "high" },
    ],
  },
  // ── Value, Load & Confidence ──
  {
    number: "Q20", id: "marginalValueSaturation",
    title: "Value Saturation — Compared to similar work, how much incremental value does adding more people create here?",
    section: "Value, Load & Confidence", sectionColor: C.amber,
    context: "When adding people stops creating value, staffing becomes a cost center.",
    signal: "GovernanceStrength",
    dimension: "Workforce Intensity",
    options: [
      { label: "Significant additional value", risk: "low" },
      { label: "Some additional value", risk: "medium" },
      { label: "Minimal additional value", risk: "high" },
      { label: "No meaningful additional value", risk: "high" },
    ],
  },
  {
    number: "Q21", id: "seniorOversightLoad",
    title: "Senior Oversight Load — Compared to similar engagements, how much senior oversight does this require?",
    section: "Value, Load & Confidence", sectionColor: C.amber,
    context: "Disproportionate senior oversight signals structural delivery risk.",
    signal: "SeniorDependency (modifier, combined with Q13)",
    dimension: "Workforce Intensity",
    options: [
      { label: "Less than usual", risk: "low" },
      { label: "About the same", risk: "medium" },
      { label: "More than usual", risk: "high" },
    ],
  },
  {
    number: "Q22", id: "coordinationDecisionDrag",
    title: "Coordination & Decision Drag — How much coordination is required across teams and stakeholders?",
    section: "Value, Load & Confidence", sectionColor: C.amber,
    context: "Heavy coordination slows decisions and inflates the cost of every deliverable.",
    signal: "CoordinationLoad (modifier, combined with Q18)",
    dimension: "Coordination Entropy",
    options: [
      { label: "Minimal", risk: "low" },
      { label: "Moderate", risk: "medium" },
      { label: "Heavy", risk: "high" },
    ],
  },
  {
    number: "Q23", id: "deliveryConfidence",
    title: "Delivery Confidence — How confident are you in the delivery model for this engagement?",
    section: "Value, Load & Confidence", sectionColor: C.amber,
    context: "Low confidence often signals structural issues that pricing alone cannot fix.",
    signal: "DeliveryConfidence → Confidence Signal",
    dimension: "HARD OVERRIDE if LOW",
    note: "LOW confidence is a hard override that fires before scoring and returns 'Do Not Proceed Without Repricing' unconditionally.",
    options: [
      { label: "High confidence", risk: "low" },
      { label: "Some concerns", risk: "medium" },
      { label: "Low confidence", risk: "high" },
    ],
  },
  // ── AI Risk ──
  {
    number: "Q24", id: "aiHumanHoursReplaced",
    title: "How many human hours will you replace / augment with an AI agent in delivery workflows?",
    section: "AI Risk", sectionColor: C.violet,
    signal: "MeasurementMaturity modifier",
    dimension: "Measurement Maturity",
    options: [
      { label: "0–25%", risk: "low" },
      { label: "25–50%", risk: "medium" },
      { label: "50–75%", risk: "high" },
      { label: "75–100%", risk: "high" },
      { label: "NA", risk: "low" },
    ],
  },
  {
    number: "Q25", id: "aiCommercialImpactMeasured",
    title: "Have you measured the commercial impact of using AI agents?",
    section: "AI Risk", sectionColor: C.violet,
    signal: "MeasurementMaturity modifier",
    dimension: "Measurement Maturity",
    options: [
      { label: "Yes", risk: "low" },
      { label: "No", risk: "high" },
      { label: "NA", risk: "low" },
    ],
  },
  {
    number: "Q26", id: "aiAgenticFramework",
    title: "Are you using AI or an Agentic framework and what kind of projects they are being deployed on?",
    section: "AI Risk", sectionColor: C.violet,
    signal: "MeasurementMaturity modifier",
    dimension: "Measurement Maturity",
    options: [
      { label: "Yes", risk: "high" },
      { label: "No", risk: "low" },
      { label: "NA", risk: "low" },
    ],
  },
  {
    number: "Q27", id: "openSignal",
    title: "Is there anything about this client engagement that feels risky or unusual?",
    section: "Open Signal", sectionColor: C.violet,
    signal: "Narrative only",
    isNarrative: true,
    note: "Free-text field. Passed to GPT-4.1 for narrative generation only. Does NOT affect verdict or scoring.",
  },
];

// ─── Quick Risk Profiler Questions (6) ───────────────────────────────────────

const profilerQuestions: QuestionDef[] = [
  {
    number: "P1", id: "decisionEvaluating",
    title: "What decision are you evaluating with this assessment?",
    section: "Quick Risk Profiler", sectionColor: C.emerald,
    signal: "EngagementState",
    dimension: "Commercial Exposure",
    note: "Corresponds to Q7 of full assessment. Answers carry over to full assessment (skipped there).",
    options: [
      { label: "New client win / pitch acceptance", risk: "low" },
      { label: "Renewal / contract extension", risk: "low" },
      { label: "Scope expansion without repricing", risk: "high" },
      { label: "Escalation on a live account", risk: "high" },
      { label: "Strategic / leadership-driven exception", risk: "medium" },
      { label: "Exploratory / no active decision", risk: "low" },
    ],
  },
  {
    number: "P2", id: "engagementClassification",
    title: "How would you classify this engagement today?",
    section: "Quick Risk Profiler", sectionColor: C.teal,
    signal: "EngagementState",
    dimension: "Commercial Exposure",
    note: "Corresponds to Q9 of full assessment. Answers carry over.",
    options: [
      { label: "New (pre-kickoff / onboarding phase)", risk: "medium" },
      { label: "Ongoing (in delivery < 6 months)", risk: "medium" },
      { label: "Ongoing (in delivery 6–12 months)", risk: "low" },
      { label: "Ongoing (in delivery 12+ months)", risk: "low" },
      { label: "Renewal / scope expansion of an existing engagement", risk: "medium" },
    ],
  },
  {
    number: "P3", id: "clientVolatility",
    title: "How would you rate client volatility?",
    section: "Quick Risk Profiler", sectionColor: C.teal,
    signal: "ClientVolatility",
    dimension: "Volatility Control",
    note: "Corresponds to Q11 of full assessment. Answers carry over.",
    options: [
      { label: "Low (stable stakeholders, clear expectations)", risk: "low" },
      { label: "Medium", risk: "medium" },
      { label: "High (frequent changes, multiple decision-makers)", risk: "high" },
    ],
  },
  {
    number: "P4", id: "seniorLeadershipInvolvement",
    title: "What's the planned senior leadership involvement?",
    section: "Quick Risk Profiler", sectionColor: C.cyan,
    signal: "SeniorDependency",
    dimension: "Workforce Intensity",
    note: "Corresponds to Q13 of full assessment. Answers carry over.",
    options: [
      { label: "Minimal (oversight only)", risk: "low" },
      { label: "Periodic (key moments)", risk: "medium" },
      { label: "Frequent (ongoing)", risk: "high" },
      { label: "Continuous (embedded)", risk: "high" },
    ],
  },
  {
    number: "P5", id: "executionThinkingMix",
    title: "What's the execution vs thinking mix?",
    section: "Quick Risk Profiler", sectionColor: C.cyan,
    signal: "IterationLoad proxy",
    dimension: "Workforce Intensity",
    note: "Corresponds to Q15 of full assessment. Profiler uses standard 3 options only. Answers carry over.",
    options: [
      { label: "Execution-heavy", risk: "low" },
      { label: "Balanced", risk: "medium" },
      { label: "Thinking-heavy", risk: "high" },
    ],
  },
  {
    number: "P6", id: "aiEffortShift",
    title: "Where is AI primarily expected to substitute effort?",
    section: "Quick Risk Profiler", sectionColor: C.sky,
    signal: "AILeverage",
    dimension: "Measurement Maturity",
    note: "Corresponds to Q19 of full assessment. Answers carry over.",
    options: [
      { label: "Junior execution", risk: "low" },
      { label: "Mid-level production", risk: "medium" },
      { label: "Senior thinking / review", risk: "high" },
      { label: "No clear substitution", risk: "high" },
    ],
  },
];

// ─── PDF Generation ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function riskChip(doc: PDFKit.PDFDocument, x: number, y: number, risk: RiskLevel) {
  if (risk === "none") return;
  const bgHex = RISK_BG[risk as keyof typeof RISK_BG] ?? "#f3f4f6";
  const textHex = RISK_TEXT[risk as keyof typeof RISK_TEXT] ?? "#374151";
  const label = riskLabel(risk);
  const w = 54, h = 13, r = 3;
  const [br, bg, bb] = hexToRgb(bgHex);
  doc.save().roundedRect(x, y - 1, w, h, r).fill(`rgb(${br},${bg},${bb})`);
  const [tr, tg, tb] = hexToRgb(textHex);
  doc.fontSize(7).font("Helvetica-Bold").fillColor(`rgb(${tr},${tg},${tb})`).text(label, x + 2, y + 1, { width: w - 4, align: "center" });
  doc.restore();
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, colorHex: string) {
  const [r, g, b] = hexToRgb(colorHex);
  doc.save().rect(50, doc.y, doc.page.width - 100, 20).fill(`rgb(${r},${g},${b})`);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(C.white).text(title.toUpperCase(), 58, doc.y - 17, { width: doc.page.width - 116 });
  doc.restore().moveDown(1.4);
}

function maybeAddPage(doc: PDFKit.PDFDocument, needed = 80) {
  if (doc.y > doc.page.height - needed - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function drawQuestion(doc: PDFKit.PDFDocument, q: QuestionDef, isFirst = false) {
  maybeAddPage(doc, 120);

  const pageWidth = doc.page.width - 100;
  const startY = doc.y;

  // Question number + title bar
  const [sr, sg, sb] = hexToRgb(q.sectionColor);
  doc.save().rect(50, startY, 4, 16).fill(`rgb(${sr},${sg},${sb})`).restore();
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor(C.dark)
    .text(`${q.number}   ${q.title}`, 62, startY, { width: pageWidth - 60, lineGap: 2 });

  doc.moveDown(0.25);

  // Identifier / Narrative badges
  if (q.isIdentifier && !q.options) {
    doc.fontSize(8).font("Helvetica").fillColor(C.gray).text("Identifier field — no risk score", 62, doc.y);
    doc.moveDown(0.6);
    return;
  }
  if (q.isNarrative) {
    doc.fontSize(8).font("Helvetica").fillColor(C.gray).text("Free-text narrative — no risk score, passed to GPT-4.1 for PDF narrative only.", 62, doc.y, { width: pageWidth - 60 });
    doc.moveDown(0.6);
    return;
  }

  // Signal & dimension
  if (q.signal) {
    const sigY = doc.y;
    doc.fontSize(7.5).font("Helvetica").fillColor(C.gray).text(`Signal: `, 62, sigY, { continued: true });
    doc.font("Helvetica-Bold").fillColor(C.dark).text(q.signal, { continued: q.dimension ? true : false });
    if (q.dimension) {
      doc.font("Helvetica").fillColor(C.gray).text(`   |   Dimension: `, { continued: true });
      doc.font("Helvetica-Bold").fillColor(
        q.dimension.includes("OVERRIDE") ? C.high : C.dark
      ).text(q.dimension);
    }
    doc.moveDown(0.25);
  }

  // Context
  if (q.context) {
    doc.fontSize(7.5).font("Helvetica").fillColor(C.gray)
      .text(q.context, 62, doc.y, { width: pageWidth - 60, lineGap: 1 });
    doc.moveDown(0.3);
  }

  // Industry note
  if (q.note) {
    const [nr, ng, nb] = hexToRgb("#fffbeb");
    const noteY = doc.y;
    const noteH = 24;
    doc.save().rect(62, noteY, pageWidth - 60, noteH + 4).fill(`rgb(${nr},${ng},${nb})`).restore();
    doc.fontSize(7.5).font("Helvetica").fillColor("#92400e")
      .text(`⚑  ${q.note}`, 66, noteY + 3, { width: pageWidth - 68, lineGap: 1 });
    doc.moveDown(0.5);
  }

  // Options table
  if (q.options && q.options.length > 0) {
    maybeAddPage(doc, 30 + q.options.length * 16);
    const tableY = doc.y;
    const col1w = pageWidth - 120;
    const col2w = 60;

    // Header row
    const [hr, hg, hb] = hexToRgb("#f9fafb");
    doc.save().rect(62, tableY, col1w + col2w, 14).fill(`rgb(${hr},${hg},${hb})`).restore();
    doc.fontSize(7).font("Helvetica-Bold").fillColor(C.gray)
      .text("OPTION", 66, tableY + 3, { width: col1w })
      .text("RISK", 66 + col1w, tableY + 3, { width: col2w, align: "center" });
    doc.moveDown(0.95);

    q.options.forEach((opt, i) => {
      maybeAddPage(doc, 20);
      const rowY = doc.y;
      if (i % 2 === 0) {
        const [er, eg, eb] = hexToRgb("#ffffff");
        doc.save().rect(62, rowY - 1, col1w + col2w, 15).fill(`rgb(${er},${eg},${eb})`).restore();
      }
      doc.fontSize(8).font("Helvetica").fillColor(C.dark)
        .text(opt.label, 66, rowY + 1, { width: col1w - 4, lineGap: 1 });

      if (opt.risk !== "none") {
        riskChip(doc, 66 + col1w + 3, rowY + 1, opt.risk);
      }
      doc.y = rowY + 15;
    });
  }

  doc.moveDown(0.8);
}

function buildPdf() {
  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
  const stream = fs.createWriteStream(OUTPUT_PATH);
  doc.pipe(stream);

  const pageW = doc.page.width - 100;

  // ─── Cover Page ────────────────────────────────────────────────────────────
  const [er, eg, eb] = hexToRgb(C.emerald);
  doc.save().rect(0, 0, doc.page.width, doc.page.height).fill(`rgb(${er},${eg},${eb})`).restore();

  doc.fontSize(28).font("Helvetica-Bold").fillColor(C.white)
    .text("MarginMix", 50, 180, { align: "center", width: pageW });
  doc.fontSize(16).font("Helvetica").fillColor(C.white)
    .text("Risk Logic Reference", 50, 220, { align: "center", width: pageW });

  doc.fontSize(11).font("Helvetica").fillColor("rgba(255,255,255,0.85)")
    .text("Complete question set · Risk mappings · Signal routing · Weighted scoring model", 50, 258, { align: "center", width: pageW });

  doc.fontSize(10).font("Helvetica").fillColor("rgba(255,255,255,0.7)")
    .text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 50, 290, { align: "center", width: pageW });

  // Cover sub-boxes
  const boxes = [
    { label: "Full Assessment", val: "27 Questions" },
    { label: "Quick Profiler", val: "6 Questions" },
    { label: "Scoring Dimensions", val: "5 Weighted" },
    { label: "Verdict Levels", val: "5 Outcomes" },
  ];
  const bw = 110, bh = 55, bGap = 14;
  const totalBoxW = boxes.length * bw + (boxes.length - 1) * bGap;
  let bx = (doc.page.width - totalBoxW) / 2;
  const by = 340;

  boxes.forEach(b => {
    doc.save().roundedRect(bx, by, bw, bh, 8).fill("rgba(255,255,255,0.15)").restore();
    doc.fontSize(18).font("Helvetica-Bold").fillColor(C.white).text(b.val, bx, by + 10, { width: bw, align: "center" });
    doc.fontSize(8).font("Helvetica").fillColor("rgba(255,255,255,0.75)").text(b.label, bx, by + 34, { width: bw, align: "center" });
    bx += bw + bGap;
  });

  doc.addPage();

  // ─── Section 1: Weighted Scoring Model ─────────────────────────────────────
  doc.fontSize(14).font("Helvetica-Bold").fillColor(C.dark).text("1. Weighted Scoring Model", 50, doc.y);
  doc.moveDown(0.5);

  doc.fontSize(9).font("Helvetica").fillColor(C.gray)
    .text("The verdict is determined by a weighted composite score across 5 risk dimensions. Confidence Signal = Negative fires as a hard override before any scoring.", 50, doc.y, { width: pageW, lineGap: 2 });
  doc.moveDown(0.7);

  // Override banner
  const [or, og, ob] = hexToRgb("#fee2e2");
  doc.save().roundedRect(50, doc.y, pageW, 32, 4).fill(`rgb(${or},${og},${ob})`).restore();
  doc.fontSize(9).font("Helvetica-Bold").fillColor(C.high)
    .text("HARD OVERRIDE: Confidence Signal = Negative (Q23: Low confidence)", 58, doc.y - 28, { width: pageW - 16 });
  doc.fontSize(8).font("Helvetica").fillColor(C.high)
    .text("Fires unconditionally BEFORE weighted scoring → Verdict: Do Not Proceed Without Repricing", 58, doc.y - 14, { width: pageW - 16 });
  doc.moveDown(1.8);

  // Weights table
  const dims = [
    { dim: "Workforce Intensity", weight: 30, qs: "Q13, Q15, Q16, Q20, Q21", desc: "Most direct driver of margin erosion" },
    { dim: "Coordination Entropy", weight: 25, qs: "Q14, Q18, Q22", desc: "Compounding overhead across delivery layers" },
    { dim: "Commercial Exposure", weight: 20, qs: "Q7, Q9, Q10, Q17", desc: "Pricing and scope risk" },
    { dim: "Volatility Control", weight: 15, qs: "Q11, Q12", desc: "Client-side unpredictability" },
    { dim: "Measurement Maturity", weight: 10, qs: "Q19, Q24, Q25, Q26", desc: "AI substitution and oversight risk" },
  ];

  const [hr, hg, hb] = hexToRgb("#f3f4f6");
  doc.save().rect(50, doc.y, pageW, 16).fill(`rgb(${hr},${hg},${hb})`).restore();
  doc.fontSize(8).font("Helvetica-Bold").fillColor(C.gray)
    .text("DIMENSION", 58, doc.y - 13, { width: 140 })
    .text("WEIGHT", 200, doc.y - 13, { width: 45, align: "center" })
    .text("QUESTIONS", 250, doc.y - 13, { width: 80 })
    .text("RATIONALE", 335, doc.y - 13, { width: pageW - 290 });
  doc.moveDown(0.5);

  dims.forEach((d, i) => {
    const [rr, rg, rb] = i % 2 === 0 ? hexToRgb("#ffffff") : hexToRgb("#f9fafb");
    const rowY = doc.y;
    doc.save().rect(50, rowY, pageW, 18).fill(`rgb(${rr},${rg},${rb})`).restore();
    doc.fontSize(8.5).font("Helvetica-Bold").fillColor(C.dark).text(d.dim, 58, rowY + 3, { width: 138 });
    const [wr, wg, wb] = hexToRgb(C.emerald);
    doc.fontSize(9).font("Helvetica-Bold").fillColor(`rgb(${wr},${wg},${wb})`).text(`${d.weight}%`, 200, rowY + 3, { width: 45, align: "center" });
    doc.fontSize(8).font("Helvetica").fillColor(C.gray).text(d.qs, 250, rowY + 3, { width: 80 });
    doc.fontSize(8).font("Helvetica").fillColor(C.gray).text(d.desc, 335, rowY + 3, { width: pageW - 290 });
    doc.y = rowY + 18;
  });

  doc.moveDown(1);

  // Score thresholds
  doc.fontSize(10).font("Helvetica-Bold").fillColor(C.dark).text("Score Thresholds (0–100)", 50, doc.y);
  doc.moveDown(0.4);

  const thresholds = [
    { range: "0–19", verdict: "Structurally Safe", color: C.low },
    { range: "20–39", verdict: "Execution Heavy", color: "#d97706" },
    { range: "40–59", verdict: "Price Sensitive", color: "#b45309" },
    { range: "60–79", verdict: "Structurally Fragile", color: "#ea580c" },
    { range: "80–100", verdict: "Do Not Proceed Without Repricing", color: C.high },
  ];

  const tw = (pageW - (thresholds.length - 1) * 8) / thresholds.length;
  let tx = 50;
  thresholds.forEach(t => {
    const [tr2, tg2, tb2] = hexToRgb(t.color);
    doc.save().roundedRect(tx, doc.y, tw, 40, 4).fill(`rgb(${tr2},${tg2},${tb2})`).restore();
    doc.fontSize(11).font("Helvetica-Bold").fillColor(C.white).text(t.range, tx, doc.y - 36, { width: tw, align: "center" });
    doc.fontSize(7).font("Helvetica").fillColor("rgba(255,255,255,0.85)").text(t.verdict, tx, doc.y - 20, { width: tw, align: "center" });
    tx += tw + 8;
  });

  doc.moveDown(3);
  doc.moveDown(0.5);

  // ─── Section 2: Quick Risk Profiler ────────────────────────────────────────
  doc.addPage();
  doc.fontSize(14).font("Helvetica-Bold").fillColor(C.dark).text("2. Quick Risk Profiler (60-Second Assessment)", 50, doc.y);
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica").fillColor(C.gray)
    .text("6 questions giving an instant risk verdict. Answers carry over to the full assessment (those 6 questions are skipped in the full flow). The profiler uses the same risk dimension weightings as the main engine.", 50, doc.y, { width: pageW, lineGap: 2 });
  doc.moveDown(0.8);

  const profilerSectHeader = "Quick Risk Profiler — All 6 Questions";
  sectionHeader(doc, profilerSectHeader, C.emerald);

  profilerQuestions.forEach((q, i) => drawQuestion(doc, q, i === 0));

  // ─── Section 3: Full Assessment ────────────────────────────────────────────
  doc.addPage();
  doc.fontSize(14).font("Helvetica-Bold").fillColor(C.dark).text("3. Full Assessment — All 27 Questions", 50, doc.y);
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica").fillColor(C.gray)
    .text("When arriving from the Quick Profiler, 6 questions (P1–P6) are pre-filled and skipped. The remaining questions are re-numbered 1–21. Industry selection (Q6) controls which conditional variants appear.", 50, doc.y, { width: pageW, lineGap: 2 });
  doc.moveDown(0.8);

  let lastSection = "";
  fullAssessmentQuestions.forEach((q, i) => {
    if (q.section !== lastSection) {
      maybeAddPage(doc, 60);
      sectionHeader(doc, q.section, q.sectionColor);
      lastSection = q.section;
    }
    drawQuestion(doc, q, i === 0);
  });

  // ─── Section 4: Signal → Dimension Routing ─────────────────────────────────
  doc.addPage();
  doc.fontSize(14).font("Helvetica-Bold").fillColor(C.dark).text("4. Signal → Dimension Routing Summary", 50, doc.y);
  doc.moveDown(0.5);

  const routing = [
    { signal: "ClientVolatility", questions: "Q11 (P3)", dimension: "Volatility Control", rule: "Direct map: low/medium/high" },
    { signal: "StakeholderLoad", questions: "Q12", dimension: "Volatility Control", rule: "Direct map: low/medium/high" },
    { signal: "SeniorDependency", questions: "Q13 (P4), Q21", dimension: "Workforce Intensity", rule: "Either HIGH → high; either MEDIUM → medium; else low" },
    { signal: "CoordinationIntensity", questions: "Q14", dimension: "Coordination Entropy", rule: "Direct map: low/medium/high" },
    { signal: "IterationLoad (proxy)", questions: "Q15 (P5)", dimension: "Workforce Intensity", rule: "execution=low, balanced=medium, thinking/advisory/strategy=high, technical-impl=medium" },
    { signal: "IterationLoad", questions: "Q16", dimension: "Workforce Intensity", rule: "Direct map: low/medium/high" },
    { signal: "ScopeElasticity", questions: "Q17", dimension: "Commercial Exposure", rule: "Direct map: low/medium/high" },
    { signal: "CoordinationLoad", questions: "Q18, Q22", dimension: "Coordination Entropy", rule: "Either HIGH → high; either MEDIUM → medium; else low" },
    { signal: "AILeverage", questions: "Q19 (P6)", dimension: "Measurement Maturity", rule: "junior=low, mid=medium, senior/no-sub=high" },
    { signal: "GovernanceStrength", questions: "Q20", dimension: "Workforce Intensity", rule: "significant=high, some=medium, minimal/none=low" },
    { signal: "PricingRigidity", questions: "Q10", dimension: "Commercial Exposure", rule: "Fixed/outcome/milestone=high, T&M/managed/saas=medium, retainer=low" },
    { signal: "DeliveryConfidence", questions: "Q23", dimension: "HARD OVERRIDE (Confidence Signal)", rule: "low=Negative→DNP override; some_concerns=neutral; high=positive" },
    { signal: "MeasurementMaturity", questions: "Q19, Q24, Q25, Q26", dimension: "Measurement Maturity", rule: "aiRiskPeak: high hours OR no measurement OR agentic = high modifier" },
    { signal: "EngagementState", questions: "Q7, Q9", dimension: "Commercial Exposure", rule: "scope-expansion/escalation=high; strategic-exception/new/renewal=medium; stable=low" },
  ];

  const [rhdr, ghdr, bhdr] = hexToRgb("#f3f4f6");
  doc.save().rect(50, doc.y, pageW, 16).fill(`rgb(${rhdr},${ghdr},${bhdr})`).restore();
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.gray)
    .text("SIGNAL", 58, doc.y - 13, { width: 110 })
    .text("QUESTIONS", 172, doc.y - 13, { width: 65 })
    .text("DIMENSION", 240, doc.y - 13, { width: 110 })
    .text("ROUTING RULE", 354, doc.y - 13, { width: pageW - 308 });
  doc.moveDown(0.4);

  routing.forEach((r, i) => {
    maybeAddPage(doc, 20);
    const [rr2, rg2, rb2] = i % 2 === 0 ? hexToRgb("#ffffff") : hexToRgb("#f9fafb");
    const rowY = doc.y;
    const lineH = r.rule.length > 60 ? 22 : 16;
    doc.save().rect(50, rowY, pageW, lineH).fill(`rgb(${rr2},${rg2},${rb2})`).restore();
    doc.fontSize(8).font("Helvetica-Bold").fillColor(C.dark).text(r.signal, 58, rowY + 3, { width: 110 });
    doc.fontSize(7.5).font("Helvetica").fillColor(C.gray).text(r.questions, 172, rowY + 3, { width: 63 });
    const dimColor = r.dimension.includes("HARD") ? C.high : C.dark;
    doc.fontSize(7.5).font("Helvetica").fillColor(dimColor).text(r.dimension, 240, rowY + 3, { width: 108 });
    doc.fontSize(7.5).font("Helvetica").fillColor(C.gray).text(r.rule, 354, rowY + 3, { width: pageW - 308, lineGap: 1 });
    doc.y = rowY + lineH;
  });

  doc.moveDown(1.5);

  // ─── Legend ────────────────────────────────────────────────────────────────
  maybeAddPage(doc, 60);
  doc.fontSize(11).font("Helvetica-Bold").fillColor(C.dark).text("Risk Level Legend", 50, doc.y);
  doc.moveDown(0.5);

  const legend = [
    { risk: "low" as RiskLevel, label: "LOW", desc: "Acceptable — within normal operating risk tolerance" },
    { risk: "medium" as RiskLevel, label: "MEDIUM", desc: "Elevated — monitor and manage; margin pressure possible" },
    { risk: "high" as RiskLevel, label: "HIGH", desc: "Critical — direct contributor to margin erosion or verdict escalation" },
  ];

  legend.forEach(l => {
    const ly = doc.y;
    riskChip(doc, 50, ly, l.risk);
    doc.fontSize(8.5).font("Helvetica").fillColor(C.dark).text(l.desc, 115, ly + 1, { width: pageW - 70 });
    doc.moveDown(0.7);
  });

  doc.moveDown(0.8);
  doc.fontSize(8).font("Helvetica").fillColor(C.gray)
    .text("Identifiers (Q1–Q4, Q6) are contextual fields with no risk score and no influence on the verdict.", 50, doc.y, { width: pageW, lineGap: 2 });
  doc.text("Q27 (Open Signal) is a free-text field passed to GPT-4.1 for narrative generation only — it has no effect on the weighted score.", 50, doc.y + 12, { width: pageW });

  // ─── Page numbers ───────────────────────────────────────────────────────────
  const pageCount = (doc as any).bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    if (i === 0) continue; // skip cover
    doc.switchToPage(i);
    doc.fontSize(7).font("Helvetica").fillColor(C.gray)
      .text(
        `MarginMix Risk Logic Reference  |  Page ${i + 1} of ${pageCount}`,
        50, doc.page.height - 40, { width: pageW, align: "center" }
      );
  }

  doc.end();

  stream.on("finish", () => {
    console.log(`\n✓ PDF written to: ${OUTPUT_PATH}\n`);
  });
}

buildPdf();
