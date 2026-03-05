import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputPath = path.join(process.cwd(), "client/public/MarginMix-Scoring-Logic.pdf");
const doc = new PDFDocument({ margin: 50, size: "A4" });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const EMERALD = "#059669";
const DARK = "#111827";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";
const WHITE = "#FFFFFF";

function heading1(text: string) {
  doc.moveDown(0.5)
    .fontSize(20).fillColor(EMERALD).font("Helvetica-Bold").text(text)
    .moveDown(0.3);
}

function heading2(text: string) {
  doc.moveDown(0.6)
    .fontSize(13).fillColor(DARK).font("Helvetica-Bold").text(text)
    .moveDown(0.2);
}

function heading3(text: string) {
  doc.moveDown(0.4)
    .fontSize(11).fillColor(EMERALD).font("Helvetica-Bold").text(text)
    .moveDown(0.15);
}

function body(text: string) {
  doc.fontSize(10).fillColor(DARK).font("Helvetica").text(text, { lineGap: 3 });
}

function note(text: string) {
  doc.fontSize(9).fillColor(GRAY).font("Helvetica-Oblique").text(text, { lineGap: 2 })
    .moveDown(0.2);
}

function rule(label: string, detail: string) {
  const x = doc.x;
  const y = doc.y;
  doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold").text(`• ${label}: `, { continued: true })
    .font("Helvetica").fillColor(GRAY).text(detail, { lineGap: 3 });
}

function tableRow(cols: string[], widths: number[], isHeader = false, shaded = false) {
  const x = 50;
  const y = doc.y;
  const rowHeight = 22;

  if (shaded) {
    doc.rect(x, y, widths.reduce((a, b) => a + b, 0), rowHeight).fill(LIGHT_GRAY);
  }

  let curX = x;
  cols.forEach((col, i) => {
    doc.fontSize(isHeader ? 9 : 9)
      .fillColor(isHeader ? WHITE : DARK)
      .font(isHeader ? "Helvetica-Bold" : "Helvetica")
      .text(col, curX + 4, y + 6, { width: widths[i] - 8, lineBreak: false });
    curX += widths[i];
  });

  doc.y = y + rowHeight;
  doc.x = x;
}

function tableHeader(cols: string[], widths: number[]) {
  const x = 50;
  const y = doc.y;
  const rowHeight = 22;
  doc.rect(x, y, widths.reduce((a, b) => a + b, 0), rowHeight).fill(EMERALD);
  doc.y = y;
  let curX = x;
  cols.forEach((col, i) => {
    doc.fontSize(9).fillColor(WHITE).font("Helvetica-Bold")
      .text(col, curX + 4, y + 6, { width: widths[i] - 8, lineBreak: false });
    curX += widths[i];
  });
  doc.y = y + rowHeight;
  doc.x = x;
}

function divider() {
  doc.moveDown(0.4)
    .moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#E5E7EB").lineWidth(0.5).stroke()
    .moveDown(0.4);
}

// ─── COVER ───────────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 200).fill(EMERALD);
doc.fontSize(28).fillColor(WHITE).font("Helvetica-Bold")
  .text("MarginMix", 50, 60);
doc.fontSize(16).fillColor(WHITE).font("Helvetica")
  .text("Decision Engine — Scoring & Rules Logic", 50, 100);
doc.fontSize(10).fillColor("#D1FAE5").font("Helvetica")
  .text("Full reference document for the deterministic margin risk assessment system", 50, 130);
doc.fontSize(9).fillColor("#A7F3D0")
  .text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 50, 155);

doc.y = 220;
doc.x = 50;

body("This document describes the complete rule-based scoring mechanism used by MarginMix to assess margin risk for agency and consulting engagements. The system is fully deterministic — no AI, no ML, no averages in the verdict logic. All decisions follow explicit if-then rules across four sequential layers.");

divider();

// ─── LAYER 1 ─────────────────────────────────────────────────────────────────
heading1("Layer 1 — Questions → Signals");
body("18 of the 23 questions (Q6–Q22) produce signals. Q1–Q5 are identifiers only (name, email, role, org name, org size) and never enter the engine. Q23 is an open text field used for narrative generation only.");

doc.moveDown(0.5);
heading3("Identifier Questions (Q1–Q5) — No Signal Produced");
note("fullName (Q1) · workEmail (Q2) · roleTitle (Q3) · organisationName (Q4) · organisationSize (Q5)");

doc.moveDown(0.4);
heading3("Signal-Producing Questions (Q6–Q22)");

const q1Widths = [40, 145, 130, 230];
tableHeader(["Q#", "Question", "Signal", "Mapping Logic"], q1Widths);

const qRows = [
  ["Q6", "Decision type", "engagementState", "New / ongoing / renewal / escalation / strategic"],
  ["Q7", "Specify context", "engagementState (mod)", "Single client vs group of clients"],
  ["Q8", "Engagement classification", "engagementState", "New / ongoing (<6m, 6-12m, 12m+) / renewal"],
  ["Q9", "Pricing model", "pricingRigidity", "Commission/Outcome=High · Hybrid=Medium · Retainer/T&M=Low"],
  ["Q10", "Client volatility", "clientVolatility", "Direct: Low / Medium / High"],
  ["Q11", "Stakeholder complexity", "stakeholderLoad", "Direct: Low / Medium / High"],
  ["Q12", "Senior leadership involvement", "seniorDependency (1)", "Minimal=Low · Periodic=Med · Frequent/Continuous=High"],
  ["Q13", "Mid-level oversight", "coordinationLoad (1)", "Direct: Low / Medium / High"],
  ["Q14", "Execution vs thinking mix", "teamMaturity", "Execution-heavy=High · Balanced=Med · Thinking-led=Low"],
  ["Q15", "Iteration intensity", "iterationLoad", "Direct: Low / Medium / High"],
  ["Q16", "Scope change likelihood", "scopeElasticity", "Direct: Low / Medium / High"],
  ["Q17", "Cross-functional coordination", "coordinationLoad (2)", "Direct: Low / Medium / High"],
  ["Q18", "AI effort shift", "measurementMaturity + aiLeverage", "Junior exec=High · Mid prod=Med · Senior/None=Low"],
  ["Q19", "Marginal value saturation", "pricingConfidence + governanceStrength", "Significant=Positive · Some=Neutral · Minimal/None=Negative"],
  ["Q20", "Senior oversight load", "seniorDependency (2)", "Less=Low · Same=Med · More=High"],
  ["Q21", "Coordination decision drag", "coordinationLoad (3)", "Minimal=Low · Moderate=Med · Heavy=High"],
  ["Q22", "Delivery confidence", "deliveryConfidence", "High=Positive · Some concerns=Neutral · Low=Negative"],
  ["Q23", "Open signal", "Narrative only", "Never enters verdict or dimension logic"],
];

qRows.forEach((row, i) => tableRow(row, q1Widths, false, i % 2 === 0));

doc.moveDown(0.6);
heading3("Combined Signal Rules");
rule("seniorDependency", "High if Q12 OR Q20 is High · Medium if either is Medium · Low otherwise");
rule("coordinationLoad", "High if Q13 OR Q17 OR Q21 is High · Medium if any is Medium · Low otherwise");

divider();

// ─── LAYER 2 ─────────────────────────────────────────────────────────────────
heading1("Layer 2 — Signals → 6 Risk Dimensions");
body("Each dimension is produced by pure if-then promotion rules. No averages or numeric calculations are used at this layer.");

doc.moveDown(0.4);
const d2Widths = [130, 120, 295];
tableHeader(["Dimension", "Sources", "Rule"], d2Widths);
const dimRows = [
  ["Workforce Intensity", "seniorDependency\niterationLoad", "High if EITHER = High\nMedium if either = Medium\nLow otherwise"],
  ["Coordination Entropy", "stakeholderLoad\ncoordinationLoad", "High if EITHER = High\nMedium if either = Medium\nLow otherwise"],
  ["Commercial Exposure", "scopeElasticity\npricingRigidity", "High if scopeElasticity = High\nMedium if scopeElasticity = Medium\nLow otherwise"],
  ["Volatility Control", "clientVolatility", "Directly mirrors clientVolatility"],
  ["Confidence Signal", "pricingConfidence\ndeliveryConfidence", "Negative if EITHER = Negative\nPositive only if BOTH = Positive\nNeutral otherwise"],
  ["Measurement Maturity", "measurementMaturity (Q18)", "Directly mirrors measurementMaturity signal"],
];
dimRows.forEach((row, i) => tableRow(row, d2Widths, false, i % 2 === 0));

divider();

// ─── LAYER 3 ─────────────────────────────────────────────────────────────────
heading1("Layer 3 — Dimensions → Verdict");
body("Verdict rules fire in strict precedence order. The first rule that matches determines the verdict. Subsequent rules are not evaluated.");

doc.moveDown(0.4);

const v3Widths = [30, 155, 200, 160];
tableHeader(["#", "Rule", "Verdict", "Triggered By"], v3Widths);
const verdictRows = [
  ["1", "Confidence Signal = Negative\n(OVERRIDE — highest priority)", "Do Not Proceed Without Repricing", "LOW_CONFIDENCE\nPricing or delivery confidence insufficient"],
  ["2", "Workforce Intensity = High\nAND Coordination Entropy = High\n(OVERRIDE)", "Structurally Fragile", "STRUCTURAL_OVERLOAD\nUnsustainable margin pressure"],
  ["3", "Commercial Exposure = High", "Price Sensitive", "HIGH_COMMERCIAL_EXPOSURE\nScope/pricing vulnerability"],
  ["4", "Workforce Intensity = High", "Execution Heavy", "HIGH_WORKFORCE_INTENSITY\nSenior dependency dominant"],
  ["5", "No high-risk conditions met\n(DEFAULT)", "Structurally Safe", "NO_HIGH_RISK_CONDITIONS\nProceed with standard governance"],
];
verdictRows.forEach((row, i) => tableRow(row, v3Widths, false, i % 2 === 0));

doc.moveDown(0.4);
note("Important: Rule 1 always fires before Rule 2. A negative confidence signal overrides even structural overload.");

divider();

// ─── LAYER 4 ─────────────────────────────────────────────────────────────────
heading1("Layer 4 — Margin Erosion Calculation");
body("Once the verdict is determined, the margin erosion is calculated using the verdict's erosion range and the dimension weights. This value is for display only — it never feeds back into the verdict.");

doc.moveDown(0.4);
heading3("Step 1 — Verdict Sets the Erosion Range");
const rangeWidths = [200, 80, 80, 185];
tableHeader(["Verdict", "Min %", "Max %", "Interpretation"], rangeWidths);
const rangeRows = [
  ["Structurally Safe", "0%", "3%", "Minimal risk under standard governance"],
  ["Execution Heavy", "3%", "8%", "Senior effort will consume margin"],
  ["Price Sensitive", "5%", "12%", "Pricing assumptions need protection"],
  ["Structurally Fragile", "10%", "18%", "Structural overload threatens viability"],
  ["Do Not Proceed Without Repricing", "15%", "25%", "Engagement not viable at current price"],
];
rangeRows.forEach((row, i) => tableRow(row, rangeWidths, false, i % 2 === 0));

doc.moveDown(0.5);
heading3("Step 2 — Dimension Weights Fine-Tune Within Range");
body("Each of the 6 dimensions is converted to a numeric weight:");
rule("Low", "0.0");
rule("Medium", "0.5");
rule("High", "1.0");
rule("Confidence (Positive)", "0.0  ·  Confidence (Neutral): 0.5  ·  Confidence (Negative): 1.0");
doc.moveDown(0.3);
body("The 6 weights are averaged to produce a single position value between 0 and 1.");

doc.moveDown(0.5);
heading3("Step 3 — Formula");
doc.rect(50, doc.y, 495, 60).fill("#F0FDF4").stroke("#6EE7B7");
doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold")
  .text("Estimated Margin Loss  =  Min + (Max − Min) × Average Dimension Weight", 62, doc.y - 55);
doc.fontSize(10).fillColor(DARK).font("Helvetica")
  .text("Effective Margin  =  Current Margin − Estimated Margin Loss", 62, doc.y - 35);
doc.y += 10;

doc.moveDown(0.4);
heading3("Example");
body("Verdict: Price Sensitive (range 5–12%). Dimension weights: WI=1.0, CE=0.5, Commercial=1.0, Volatility=0.5, Confidence=0.5, Measurement=0.0. Average = 0.583.");
body("Estimated Loss = 5 + (12 − 5) × 0.583 = 5 + 4.08 = 9.1%. If current margin is 18%, Effective Margin = 18 − 9.1 = 8.9%.");

doc.moveDown(0.5);
heading3("Step 4 — Impact Label");
const labelWidths = [100, 120, 100, 225];
tableHeader(["Estimated Loss", "Label", "Colour", "Meaning"], labelWidths);
const labelRows = [
  ["0–1%", "No Impact", "Green", "Safe to proceed"],
  ["1–4%", "Minimal Impact", "Green", "Manageable with standard controls"],
  ["4–8%", "Moderate Impact", "Amber", "Warrants attention and monitoring"],
  ["8–15%", "Significant Impact", "Red", "Requires structural intervention"],
  ["15%+", "Severe Impact", "Red", "Engagement non-viable at current margin"],
];
labelRows.forEach((row, i) => tableRow(row, labelWidths, false, i % 2 === 0));

divider();

// ─── PRINCIPLES ──────────────────────────────────────────────────────────────
heading1("Core Design Principles");
rule("Fully deterministic", "No AI, no ML, no probabilistic scoring anywhere in the verdict logic");
rule("First-match precedence", "Verdict rules fire in order — first match wins, no blending");
rule("Margin erosion is display-only", "The erosion number never feeds back into the verdict");
rule("Identifiers are never scored", "Q1–Q5 pass to PDFs and emails but are invisible to the engine");
rule("Q23 open signal", "Feeds GPT-4.1 narrative generation only — cannot alter the verdict");
rule("AI exposure (Q18)", "Only affects Measurement Maturity signal — not a direct verdict driver");

doc.moveDown(1);
doc.fontSize(8).fillColor(GRAY).font("Helvetica")
  .text("MarginMix — Confidential Internal Reference · marginmix.ai", 50, doc.y, { align: "center" });

doc.end();

stream.on("finish", () => {
  console.log(`✓ PDF saved to: ${outputPath}`);
});
