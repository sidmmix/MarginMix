import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputPath = path.join(process.cwd(), "client/public/MarginMix-Scoring-Logic.pdf");
const doc = new PDFDocument({ margin: 55, size: "A4", autoFirstPage: true });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const EMERALD = "#059669";
const DARK = "#111827";
const GRAY = "#6B7280";
const MID_GRAY = "#9CA3AF";
const LIGHT_BG = "#F0FDF4";
const BORDER = "#6EE7B7";
const PAGE_WIDTH = 595 - 110; // A4 minus margins

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function h1(text: string) {
  doc.moveDown(1)
    .fontSize(16).fillColor(EMERALD).font("Helvetica-Bold")
    .text(text.toUpperCase(), { characterSpacing: 0.5 })
    .moveDown(0.15);
  doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor(EMERALD).lineWidth(1.5).stroke();
  doc.moveDown(0.5);
}

function h2(text: string) {
  doc.moveDown(0.7)
    .fontSize(11).fillColor(DARK).font("Helvetica-Bold")
    .text(text)
    .moveDown(0.2);
}

function h3(text: string) {
  doc.moveDown(0.5)
    .fontSize(10).fillColor(EMERALD).font("Helvetica-Bold")
    .text(text)
    .moveDown(0.1);
}

function body(text: string, indent = 0) {
  doc.fontSize(9.5).fillColor(DARK).font("Helvetica")
    .text(text, 55 + indent, doc.y, { width: PAGE_WIDTH - indent, lineGap: 2 })
    .moveDown(0.25);
}

function bullet(label: string, detail: string) {
  const y = doc.y;
  doc.fontSize(9.5).fillColor(DARK).font("Helvetica-Bold")
    .text(`• ${label}:`, 65, y, { continued: true, width: PAGE_WIDTH - 10 });
  doc.font("Helvetica").fillColor(GRAY)
    .text(` ${detail}`, { lineGap: 2 });
  doc.moveDown(0.15);
}

function note(text: string) {
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica-Oblique")
    .text(text, 55, doc.y, { width: PAGE_WIDTH, lineGap: 2 })
    .moveDown(0.3);
}

function divider() {
  doc.moveDown(0.5);
  doc.moveTo(55, doc.y).lineTo(540, doc.y).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

function drawTable(headers: string[], rows: string[][], colWidths: number[]) {
  const startX = 55;
  const rowH = 18;
  const headerH = 20;

  // Header row
  let hx = startX;
  const hy = doc.y;
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  doc.rect(startX, hy, totalW, headerH).fill(EMERALD);
  headers.forEach((h, i) => {
    doc.fontSize(8.5).fillColor("#FFFFFF").font("Helvetica-Bold")
      .text(h, hx + 4, hy + 5, { width: colWidths[i] - 8, lineBreak: false });
    hx += colWidths[i];
  });

  // Data rows
  rows.forEach((row, rowIdx) => {
    // Check if we need a new page
    if (doc.y + rowH > 770) {
      doc.addPage();
    }

    const ry = doc.y;
    if (rowIdx % 2 === 0) {
      doc.rect(startX, ry, totalW, rowH).fill("#F9FAFB");
    }

    let rx = startX;
    row.forEach((cell, ci) => {
      doc.fontSize(8.5).fillColor(DARK).font("Helvetica")
        .text(cell, rx + 4, ry + 4, { width: colWidths[ci] - 8, lineBreak: false });
      rx += colWidths[ci];
    });

    // Row border
    doc.rect(startX, ry, totalW, rowH).stroke("#E5E7EB").lineWidth(0.3);
    doc.y = ry + rowH;
  });

  // Outer border
  doc.moveDown(0.5);
}

function infoBox(lines: string[]) {
  const boxY = doc.y;
  const lineH = 16;
  const boxH = lines.length * lineH + 16;
  doc.rect(55, boxY, PAGE_WIDTH, boxH).fill(LIGHT_BG).stroke(BORDER).lineWidth(0.5);
  lines.forEach((line, i) => {
    doc.fontSize(9.5).fillColor(DARK).font(i === 0 ? "Helvetica-Bold" : "Helvetica")
      .text(line, 65, boxY + 8 + i * lineH, { width: PAGE_WIDTH - 20, lineBreak: false });
  });
  doc.y = boxY + boxH + 8;
}

// ─── COVER PAGE ──────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 210).fill(EMERALD);
doc.fontSize(32).fillColor("#FFFFFF").font("Helvetica-Bold").text("MarginMix", 55, 55);
doc.fontSize(18).fillColor("#D1FAE5").font("Helvetica")
  .text("Decision Engine — Scoring & Rules Logic", 55, 100);
doc.fontSize(10).fillColor("#A7F3D0")
  .text("Complete reference for the deterministic margin risk assessment system", 55, 135);
doc.fontSize(9).fillColor("#6EE7B7")
  .text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 55, 165);
doc.y = 230;

body("This document describes the complete rule-based scoring mechanism used by MarginMix to assess margin risk for agency and consulting engagements. The system is fully deterministic — no AI, no ML, no averages in the verdict logic. All decisions follow explicit if-then rules across four sequential layers.");

divider();

// ─── LAYER 1 ─────────────────────────────────────────────────────────────────
h1("Layer 1 — Questions → Signals");
body("18 of the 23 questions (Q6–Q22) produce signals that feed the engine. Q1–Q5 are context identifiers and never influence the verdict. Q23 is an open text field for narrative generation only.");

h3("Identifier Questions (Q1–Q5) — No Signal Produced");
note("Q1 Full Name  ·  Q2 Work Email  ·  Q3 Role/Title  ·  Q4 Organisation Name  ·  Q5 Organisation Size");

h3("Signal-Producing Questions (Q6–Q22)");

drawTable(
  ["Q#", "Question", "Signal Produced", "Mapping Logic"],
  [
    ["Q6",  "Decision type",                    "engagementState",                "New / ongoing / renewal / escalation / strategic"],
    ["Q7",  "Specify context",                  "engagementState (modifier)",     "Single client vs group of clients"],
    ["Q8",  "Engagement classification",        "engagementState",                "New · Ongoing <6m / 6–12m / 12m+ · Renewal"],
    ["Q9",  "Pricing model",                    "pricingRigidity",                "Commission/Outcome=High · Hybrid=Medium · Retainer/T&M=Low"],
    ["Q10", "Client volatility",                "clientVolatility",               "Direct pass-through: Low / Medium / High"],
    ["Q11", "Stakeholder complexity",           "stakeholderLoad",                "Direct pass-through: Low / Medium / High"],
    ["Q12", "Senior leadership involvement",    "seniorDependency (input 1)",     "Minimal=Low · Periodic=Medium · Frequent/Continuous=High"],
    ["Q13", "Mid-level oversight",              "coordinationLoad (input 1)",     "Direct pass-through: Low / Medium / High"],
    ["Q14", "Execution vs thinking mix",        "teamMaturity",                   "Execution-heavy=High · Balanced=Medium · Thinking-led=Low"],
    ["Q15", "Iteration intensity",              "iterationLoad",                  "Direct pass-through: Low / Medium / High"],
    ["Q16", "Scope change likelihood",          "scopeElasticity",                "Direct pass-through: Low / Medium / High"],
    ["Q17", "Cross-functional coordination",   "coordinationLoad (input 2)",     "Direct pass-through: Low / Medium / High"],
    ["Q18", "AI effort shift",                  "measurementMaturity + aiLeverage","Junior exec=High · Mid production=Medium · Senior/None=Low"],
    ["Q19", "Marginal value saturation",        "pricingConfidence + governance", "Significant=Positive · Some=Neutral · Minimal/None=Negative"],
    ["Q20", "Senior oversight load",            "seniorDependency (input 2)",     "Less=Low · About same=Medium · More=High"],
    ["Q21", "Coordination decision drag",       "coordinationLoad (input 3)",     "Minimal=Low · Moderate=Medium · Heavy=High"],
    ["Q22", "Delivery confidence",              "deliveryConfidence",             "High=Positive · Some concerns=Neutral · Low=Negative"],
    ["Q23", "Open signal (optional)",           "Narrative only",                 "Never enters verdict, dimension, or signal logic"],
  ],
  [32, 140, 130, 183]
);

h3("Combined Signal Merging Rules");
bullet("seniorDependency", "High if Q12 OR Q20 is High · Medium if either is Medium · Low if both are Low");
bullet("coordinationLoad", "High if Q13 OR Q17 OR Q21 is High · Medium if any is Medium · Low if all are Low");

// ─── LAYER 2 ─────────────────────────────────────────────────────────────────
h1("Layer 2 — Signals → 6 Risk Dimensions");
body("Signals are promoted to dimensions using pure if-then rules. No numeric averaging is used at this layer. Each dimension resolves to Low, Medium, or High (Confidence resolves to Positive, Neutral, or Negative).");

drawTable(
  ["Dimension", "Input Signals", "Promotion Rule"],
  [
    ["Workforce Intensity",   "seniorDependency, iterationLoad",         "High if EITHER = High · Medium if either = Medium · Low otherwise"],
    ["Coordination Entropy",  "stakeholderLoad, coordinationLoad",       "High if EITHER = High · Medium if either = Medium · Low otherwise"],
    ["Commercial Exposure",   "scopeElasticity, pricingRigidity",        "High if scopeElasticity = High · Medium if = Medium · Low otherwise"],
    ["Volatility Control",    "clientVolatility",                        "Directly mirrors clientVolatility (Low / Medium / High)"],
    ["Confidence Signal",     "pricingConfidence, deliveryConfidence",   "Negative if EITHER = Negative · Positive if BOTH = Positive · Neutral otherwise"],
    ["Measurement Maturity",  "measurementMaturity (from Q18)",          "Directly mirrors measurementMaturity signal (Low / Medium / High)"],
  ],
  [130, 155, 200]
);

// ─── LAYER 3 ─────────────────────────────────────────────────────────────────
h1("Layer 3 — Dimensions → Verdict");
body("Verdict rules are evaluated in strict precedence order. The first rule that matches wins — subsequent rules are not evaluated. There is no blending or averaging of verdicts.");

drawTable(
  ["Priority", "Condition", "Verdict", "Trigger Code"],
  [
    ["1 — OVERRIDE\n(highest)", "Confidence Signal = Negative",                              "Do Not Proceed Without Repricing", "LOW_CONFIDENCE"],
    ["2 — OVERRIDE",            "Workforce Intensity = High AND Coordination Entropy = High", "Structurally Fragile",             "STRUCTURAL_OVERLOAD"],
    ["3 — PRIMARY",             "Commercial Exposure = High",                                 "Price Sensitive",                  "HIGH_COMMERCIAL_EXPOSURE"],
    ["4 — PRIMARY",             "Workforce Intensity = High",                                 "Execution Heavy",                  "HIGH_WORKFORCE_INTENSITY"],
    ["5 — DEFAULT",             "No high-risk conditions triggered",                          "Structurally Safe",                "NO_HIGH_RISK_CONDITIONS"],
  ],
  [75, 175, 150, 85]
);

h3("Verdict Descriptions");
bullet("Structurally Safe", "Engagement viable under stated assumptions. Proceed with standard governance.");
bullet("Execution Heavy", "Senior dependency and iteration load will dominate effort. Elevated management attention required.");
bullet("Price Sensitive", "High scope elasticity or pricing rigidity creates commercial vulnerability. Pricing assumptions require protection.");
bullet("Structurally Fragile", "Structural load exceeds safe operating assumptions. High workforce intensity combined with high coordination entropy creates unsustainable margin pressure.");
bullet("Do Not Proceed Without Repricing", "Pricing or delivery confidence is insufficient. Engagement requires repricing or structural changes before commitment.");

note("Important: Rule 1 (Confidence Signal = Negative) always fires before Rule 2. A negative confidence signal overrides even structural overload.");

// ─── LAYER 4 ─────────────────────────────────────────────────────────────────
h1("Layer 4 — Margin Erosion Calculation");
body("Once the verdict is determined, the margin erosion is calculated in four steps using the verdict's base range and the dimension weights. This value is for display and decision support only — it never feeds back into the verdict logic.");

h3("Step 1 — Verdict Sets the Erosion Range");
drawTable(
  ["Verdict", "Min Erosion", "Max Erosion", "Interpretation"],
  [
    ["Structurally Safe",                 "0%",  "3%",  "Minimal risk under standard governance"],
    ["Execution Heavy",                   "3%",  "8%",  "Senior effort and iteration will consume margin"],
    ["Price Sensitive",                   "5%",  "12%", "Pricing assumptions need explicit protection"],
    ["Structurally Fragile",              "10%", "18%", "Structural overload threatens commercial viability"],
    ["Do Not Proceed Without Repricing",  "15%", "25%", "Engagement non-viable at current pricing"],
  ],
  [180, 80, 80, 145]
);

h3("Step 2 — Dimension Weights");
body("Each of the 6 dimensions is converted to a numeric weight on a 0–1 scale:");
bullet("Low", "0.0");
bullet("Medium", "0.5");
bullet("High", "1.0");
bullet("Confidence Positive", "0.0  ·  Neutral: 0.5  ·  Negative: 1.0");
doc.moveDown(0.3);
body("The 6 weights (one per dimension) are summed and divided by 6 to produce a single average weight between 0 and 1. This average determines where within the verdict's range the final erosion figure lands.");

h3("Step 3 — Formula");
infoBox([
  "Estimated Margin Loss  =  Min + (Max − Min) × Average Dimension Weight",
  "Effective Margin  =  Current Margin % − Estimated Margin Loss",
]);

h3("Worked Example");
body("Verdict: Price Sensitive  →  Range: 5% to 12%");
body("Dimension weights: Workforce Intensity=1.0, Coordination Entropy=0.5, Commercial Exposure=1.0, Volatility Control=0.5, Confidence=0.5, Measurement Maturity=0.0");
body("Average weight = (1.0 + 0.5 + 1.0 + 0.5 + 0.5 + 0.0) ÷ 6 = 0.583");
body("Estimated Loss = 5 + (12 − 5) × 0.583 = 5 + 4.08 = 9.1%");
body("If current margin entered is 18% → Effective Margin = 18 − 9.1 = 8.9%");

h3("Step 4 — Impact Label");
drawTable(
  ["Estimated Loss", "Label", "Colour", "Meaning"],
  [
    ["0 – 1%",  "No Impact",           "Green", "Safe to proceed as structured"],
    ["1 – 4%",  "Minimal Impact",      "Green", "Manageable with standard controls"],
    ["4 – 8%",  "Moderate Impact",     "Amber", "Warrants active monitoring and governance"],
    ["8 – 15%", "Significant Impact",  "Red",   "Requires structural intervention before proceeding"],
    ["15%+",    "Severe Impact",       "Red",   "Engagement non-viable at current margin"],
  ],
  [80, 105, 70, 230]
);

// ─── PRINCIPLES ──────────────────────────────────────────────────────────────
h1("Core Design Principles");
bullet("Fully deterministic", "No AI, no ML, and no probabilistic scoring anywhere in the verdict logic. Given the same inputs, the system always produces the same verdict.");
bullet("First-match precedence", "Verdict rules fire in strict priority order. The first matching rule wins. There is no blending or weighting of verdicts.");
bullet("Margin erosion is display-only", "The erosion percentage is computed after the verdict is set. It provides context for the decision but cannot change the verdict.");
bullet("Identifiers are invisible to the engine", "Q1–Q5 (name, email, role, org name, org size) pass to PDFs, emails, and heatmaps but are never evaluated by any rule.");
bullet("Q23 open signal", "The open text field feeds GPT-4.1 for narrative generation only. It cannot alter, override, or soften the verdict in any way.");
bullet("AI exposure (Q18)", "Only affects the Measurement Maturity signal. It is not a direct verdict driver — it influences margin erosion depth through the dimension weight, not the verdict itself.");
bullet("No scoring math in verdict layer", "Layers 1–3 use only comparisons (=, AND, OR). Numeric weights only appear in Layer 4 for margin erosion display.");

// ─── FOOTER ──────────────────────────────────────────────────────────────────
divider();
doc.fontSize(8).fillColor(MID_GRAY).font("Helvetica")
  .text("MarginMix — Confidential Internal Reference  ·  marginmix.ai  ·  Decision Support for Margin Risk Clarity", 55, doc.y, { align: "center", width: PAGE_WIDTH });

doc.end();

stream.on("finish", () => {
  console.log(`✓ PDF saved to: ${outputPath}`);
});
