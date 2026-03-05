import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputPath = path.join(process.cwd(), "client/public/MarginMix-Scoring-Logic.pdf");
const doc = new PDFDocument({ margin: 55, size: "A4", autoFirstPage: true });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const EMERALD = "#059669";
const DARK    = "#111827";
const GRAY    = "#6B7280";
const MID_GRAY = "#9CA3AF";
const LIGHT_BG = "#F0FDF4";
const BORDER  = "#6EE7B7";
const ROW_ALT = "#F9FAFB";
const PAGE_W  = 485; // usable width (595 - 2*55)
const LEFT    = 55;
const RIGHT   = LEFT + PAGE_W;
const BOTTOM_MARGIN = 790; // trigger new page before this y

// ─── TEXT HEIGHT ESTIMATOR ────────────────────────────────────────────────────
// Estimates how many points tall a block of text will be given a column width
function estimateTextHeight(text: string, colWidth: number, fontSize: number): number {
  const innerWidth = colWidth - 10; // cell padding
  // average character width ≈ 0.52× font size for Helvetica
  const avgCharW = fontSize * 0.52;
  const charsPerLine = Math.max(1, Math.floor(innerWidth / avgCharW));
  const lineHeight = fontSize * 1.35;

  let lines = 0;
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ").filter(Boolean);
    if (words.length === 0) { lines++; continue; }
    let lineLen = 0;
    let lineCount = 1;
    for (const word of words) {
      if (lineLen > 0 && lineLen + word.length + 1 > charsPerLine) {
        lineCount++;
        lineLen = word.length;
      } else {
        lineLen += (lineLen ? 1 : 0) + word.length;
      }
    }
    lines += lineCount;
  }

  return lines * lineHeight;
}

// ─── TABLE RENDERER ───────────────────────────────────────────────────────────
function drawTable(
  headers: string[],
  rows: string[][],
  colWidths: number[],
  fontSize = 8.5
) {
  const PAD_V = 5;   // vertical padding top & bottom inside cell
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const headerH = 20;

  // ── header ──
  if (doc.y + headerH > BOTTOM_MARGIN) doc.addPage();
  const hY = doc.y;
  doc.rect(LEFT, hY, totalW, headerH).fill(EMERALD);
  let hx = LEFT;
  headers.forEach((h, i) => {
    doc.fontSize(fontSize).fillColor("#FFFFFF").font("Helvetica-Bold")
      .text(h, hx + 5, hY + 5, { width: colWidths[i] - 10, lineBreak: false });
    hx += colWidths[i];
  });
  doc.y = hY + headerH;

  // ── data rows ──
  rows.forEach((row, rowIdx) => {
    // Measure each cell to find the tallest
    const cellHeights = row.map((cell, ci) =>
      estimateTextHeight(cell, colWidths[ci], fontSize)
    );
    const rowH = Math.max(...cellHeights) + PAD_V * 2;

    // Page break if needed
    if (doc.y + rowH > BOTTOM_MARGIN) doc.addPage();

    const ry = doc.y;

    // Background
    if (rowIdx % 2 === 0) {
      doc.rect(LEFT, ry, totalW, rowH).fill(ROW_ALT);
    } else {
      doc.rect(LEFT, ry, totalW, rowH).fill("#FFFFFF");
    }

    // Border
    doc.rect(LEFT, ry, totalW, rowH).stroke("#E5E7EB").lineWidth(0.3);

    // Cell text — rendered after background so it sits on top
    let rx = LEFT;
    row.forEach((cell, ci) => {
      doc.fontSize(fontSize).fillColor(DARK).font("Helvetica")
        .text(cell, rx + 5, ry + PAD_V, {
          width: colWidths[ci] - 10,
          lineBreak: true,
          lineGap: 1.5,
        });
      // reset x for next cell; doc.text moves doc.x & doc.y
      rx += colWidths[ci];
    });

    // Force doc.y to the bottom of this row
    doc.y = ry + rowH;
  });

  // bottom outer border line
  doc.moveTo(LEFT, doc.y).lineTo(LEFT + totalW, doc.y)
    .strokeColor("#D1D5DB").lineWidth(0.5).stroke();
  doc.moveDown(0.6);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function h1(text: string) {
  if (doc.y > 680) doc.addPage();
  doc.moveDown(0.8)
    .fontSize(15).fillColor(EMERALD).font("Helvetica-Bold")
    .text(text.toUpperCase(), LEFT, doc.y, { characterSpacing: 0.4, width: PAGE_W });
  doc.moveDown(0.15);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).strokeColor(EMERALD).lineWidth(1.5).stroke();
  doc.moveDown(0.5);
}

function h3(text: string) {
  doc.moveDown(0.5)
    .fontSize(10).fillColor(EMERALD).font("Helvetica-Bold")
    .text(text, LEFT, doc.y, { width: PAGE_W })
    .moveDown(0.15);
}

function body(text: string, indent = 0) {
  doc.fontSize(9.5).fillColor(DARK).font("Helvetica")
    .text(text, LEFT + indent, doc.y, { width: PAGE_W - indent, lineGap: 2 })
    .moveDown(0.3);
}

function bullet(label: string, detail: string) {
  const y = doc.y;
  doc.fontSize(9.5).fillColor(DARK).font("Helvetica-Bold")
    .text(`• ${label}: `, LEFT + 10, y, { continued: true, width: PAGE_W - 10 });
  doc.font("Helvetica").fillColor(GRAY)
    .text(detail, { lineGap: 2 });
  doc.moveDown(0.2);
}

function note(text: string) {
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica-Oblique")
    .text(text, LEFT, doc.y, { width: PAGE_W, lineGap: 2 })
    .moveDown(0.4);
}

function divider() {
  doc.moveDown(0.4);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

function infoBox(lines: string[]) {
  const lineH = 15;
  const boxH = lines.length * lineH + 14;
  const boxY = doc.y;
  doc.rect(LEFT, boxY, PAGE_W, boxH).fill(LIGHT_BG).stroke(BORDER).lineWidth(0.8);
  lines.forEach((line, i) => {
    doc.fontSize(9.5)
      .fillColor(DARK)
      .font(i === 0 ? "Helvetica-Bold" : "Helvetica")
      .text(line, LEFT + 10, boxY + 7 + i * lineH, { width: PAGE_W - 20, lineBreak: false });
  });
  doc.y = boxY + boxH + 10;
}

// ─── COVER PAGE ──────────────────────────────────────────────────────────────
doc.rect(0, 0, 595, 220).fill(EMERALD);
doc.fontSize(32).fillColor("#FFFFFF").font("Helvetica-Bold").text("MarginMix", LEFT, 58);
doc.fontSize(17).fillColor("#D1FAE5").font("Helvetica")
  .text("Decision Engine — Scoring & Rules Logic", LEFT, 103);
doc.fontSize(10).fillColor("#A7F3D0")
  .text("Complete reference for the deterministic margin risk assessment system", LEFT, 138);
doc.fontSize(9).fillColor("#6EE7B7")
  .text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, LEFT, 168);

doc.y = 240;
body("This document describes the complete scoring mechanism used by MarginMix to assess margin risk for agency and consulting engagements. The system is fully deterministic — no AI, no ML. Layers 1 and 2 use explicit if-then rules. Layer 3 uses a weighted scoring model to catch accumulated medium-risk engagements that a rule-only system would miss. Layer 4 translates the verdict into an estimated margin erosion figure.");
divider();

// ─── LAYER 1 ─────────────────────────────────────────────────────────────────
h1("Layer 1 — Questions → Signals");
body("18 of the 23 questions (Q6–Q22) produce signals that feed the engine. Q1–Q5 are context identifiers that never influence the verdict. Q23 is an open text field used for narrative generation only.");

h3("Identifier Questions (Q1–Q5) — No Signal Produced");
note("Q1 Full Name  ·  Q2 Work Email  ·  Q3 Role / Title  ·  Q4 Organisation Name  ·  Q5 Organisation Size");

h3("Signal-Producing Questions (Q6–Q22)");
drawTable(
  ["Q#", "Question", "Signal Produced", "Mapping Logic"],
  [
    ["Q6",  "Decision type",                   "engagementState",                    "New / ongoing / renewal / escalation / strategic"],
    ["Q7",  "Specify context",                 "engagementState (modifier)",          "Single client vs group of clients"],
    ["Q8",  "Engagement classification",       "engagementState",                    "New · Ongoing <6m / 6–12m / 12m+ · Renewal-expansion"],
    ["Q9",  "Pricing model",                   "pricingRigidity",                    "Commission or Outcome-based = High · Hybrid = Medium · Retainer or T&M = Low"],
    ["Q10", "Client volatility",               "clientVolatility",                   "Direct pass-through: Low / Medium / High"],
    ["Q11", "Stakeholder complexity",          "stakeholderLoad",                    "Direct pass-through: Low / Medium / High"],
    ["Q12", "Senior leadership involvement",   "seniorDependency (input 1 of 2)",    "Minimal = Low · Periodic = Medium · Frequent or Continuous = High"],
    ["Q13", "Mid-level oversight",             "coordinationLoad (input 1 of 3)",    "Direct pass-through: Low / Medium / High"],
    ["Q14", "Execution vs thinking mix",       "teamMaturity",                       "Execution-heavy = High · Balanced = Medium · Thinking-led = Low"],
    ["Q15", "Iteration intensity",             "iterationLoad",                      "Direct pass-through: Low / Medium / High"],
    ["Q16", "Scope change likelihood",         "scopeElasticity",                    "Direct pass-through: Low / Medium / High"],
    ["Q17", "Cross-functional coordination",  "coordinationLoad (input 2 of 3)",    "Direct pass-through: Low / Medium / High"],
    ["Q18", "AI effort shift",                 "measurementMaturity + aiLeverage",   "Junior execution = High · Mid-level production = Medium · Senior thinking or no clear substitution = Low"],
    ["Q19", "Marginal value saturation",       "pricingConfidence + governance",     "Significant = Positive · Some = Neutral · Minimal or None = Negative"],
    ["Q20", "Senior oversight load",           "seniorDependency (input 2 of 2)",    "Less than usual = Low · About the same = Medium · More than usual = High"],
    ["Q21", "Coordination decision drag",      "coordinationLoad (input 3 of 3)",    "Minimal = Low · Moderate = Medium · Heavy = High"],
    ["Q22", "Delivery confidence",             "deliveryConfidence",                 "High = Positive · Some concerns = Neutral · Low = Negative"],
    ["Q23", "Open signal (optional text)",     "Narrative only — no signal",         "Feeds GPT-4.1 for written narrative. Never enters verdict, dimension, or signal logic."],
  ],
  [28, 138, 130, 189]
);

h3("Combined Signal Merging Rules");
note("Where multiple questions feed the same signal, the following OR-logic applies:");
bullet("seniorDependency", "High if Q12 OR Q20 is High · Medium if either is Medium · Low if both are Low");
bullet("coordinationLoad", "High if Q13 OR Q17 OR Q21 is High · Medium if any one is Medium · Low if all are Low");

// ─── LAYER 2 ─────────────────────────────────────────────────────────────────
h1("Layer 2 — Signals → 6 Risk Dimensions");
body("Signals are promoted to dimensions using pure if-then rules only. No numeric averaging or weighting is used at this layer. Each dimension resolves to Low, Medium, or High — except Confidence Signal which resolves to Positive, Neutral, or Negative.");

drawTable(
  ["Dimension", "Input Signals", "Promotion Rule"],
  [
    ["Workforce Intensity",
     "seniorDependency\niterationLoad",
     "High if EITHER seniorDependency OR iterationLoad = High\nMedium if either = Medium\nLow if both = Low"],
    ["Coordination Entropy",
     "stakeholderLoad\ncoordinationLoad",
     "High if EITHER stakeholderLoad OR coordinationLoad = High\nMedium if either = Medium\nLow if both = Low"],
    ["Commercial Exposure",
     "scopeElasticity\npricingRigidity",
     "High if scopeElasticity = High (regardless of pricingRigidity)\nMedium if scopeElasticity = Medium\nLow if scopeElasticity = Low"],
    ["Volatility Control",
     "clientVolatility",
     "Directly mirrors clientVolatility\nLow / Medium / High — no transformation applied"],
    ["Confidence Signal",
     "pricingConfidence\ndeliveryConfidence",
     "Negative if EITHER pricingConfidence OR deliveryConfidence = Negative\nPositive only if BOTH = Positive\nNeutral in all other cases"],
    ["Measurement Maturity",
     "measurementMaturity\n(derived from Q18)",
     "Directly mirrors measurementMaturity signal\nJunior execution = High · Mid production = Medium · Senior or None = Low"],
  ],
  [120, 120, 245]
);

// ─── LAYER 3 ─────────────────────────────────────────────────────────────────
h1("Layer 3 — Dimensions → Verdict (Weighted Scoring Model)");
body("Layer 3 produces the final verdict through two sequential steps: (1) a hard override check that fires unconditionally before any scoring, and (2) a weighted numerical score applied to the remaining five dimensions. This two-step design captures both unambiguous confidence failures and accumulated moderate-risk engagements that a pure rule-based system would misclassify as safe.");

h3("Step 1 — Hard Override (fires before scoring)");
drawTable(
  ["Override", "Condition", "Verdict", "Trigger Code"],
  [
    ["Confidence Failure",
     "Confidence Signal = Negative\nFires when pricingConfidence OR deliveryConfidence = Negative\n(from Q19 or Q22). Confidence is non-negotiable — no weight can\ndilute a fundamental pricing or delivery confidence failure.",
     "Do Not Proceed\nWithout Repricing",
     "LOW_CONFIDENCE\n_OVERRIDE"],
  ],
  [75, 230, 110, 70]
);

h3("Step 2 — Weighted Score (applied when no override fires)");
body("Each of the five remaining dimensions is converted to a numeric value (Low=0, Medium=0.5, High=1.0) and multiplied by its weight. The weighted score is the sum of all five dimension scores × 100. A score of 50 correctly reflects an all-Medium engagement as Price Sensitive — a key accuracy improvement over the prior rule-based model.");
drawTable(
  ["Dimension", "Weight", "Low Score", "Medium Score", "High Score"],
  [
    ["Workforce Intensity",   "30%", "0", "15", "30"],
    ["Coordination Entropy",  "25%", "0", "12.5", "25"],
    ["Commercial Exposure",   "20%", "0", "10", "20"],
    ["Volatility Control",    "15%", "0", "7.5", "15"],
    ["Measurement Maturity",  "10%", "0", "5", "10"],
    ["TOTAL",                 "100%", "0", "50", "100"],
  ],
  [145, 50, 65, 85, 70]
);

h3("Score → Verdict Thresholds");
drawTable(
  ["Score Range", "Verdict", "Trigger Code"],
  [
    ["0 – 19",  "Structurally Safe",                   "WEIGHTED_SCORE_SAFE"],
    ["20 – 39", "Execution Heavy",                      "WEIGHTED_SCORE_EXECUTION_HEAVY"],
    ["40 – 59", "Price Sensitive",                      "WEIGHTED_SCORE_PRICE_SENSITIVE"],
    ["60 – 79", "Structurally Fragile",                 "WEIGHTED_SCORE_FRAGILE"],
    ["80 – 100","Do Not Proceed Without Repricing",      "WEIGHTED_SCORE_CRITICAL"],
  ],
  [75, 200, 210]
);

h3("Verdict Meanings");
bullet("Structurally Safe", "Engagement viable under stated assumptions. Proceed with standard governance and monitoring.");
bullet("Execution Heavy", "Senior dependency and iteration load will dominate effort. Elevated management attention required throughout delivery.");
bullet("Price Sensitive", "High scope elasticity or pricing rigidity creates commercial vulnerability. Pricing assumptions require explicit protection.");
bullet("Structurally Fragile", "High workforce intensity combined with high coordination entropy creates unsustainable margin pressure. Structural changes required.");
bullet("Do Not Proceed Without Repricing", "Pricing or delivery confidence is insufficient to proceed safely. Engagement requires repricing or structural changes before commitment.");

note("Important: Rule 1 (Negative Confidence Signal) always fires before Rule 2 (Structural Overload). A negative confidence signal overrides even a full structural overload scenario.");

// ─── LAYER 4 ─────────────────────────────────────────────────────────────────
h1("Layer 4 — Margin Erosion Calculation");
body("Once the verdict is determined, the estimated margin erosion is calculated in four steps. This figure is for decision support and display only — it never feeds back into the verdict logic.");

h3("Step 1 — Verdict Sets the Erosion Range");
drawTable(
  ["Verdict", "Min Erosion", "Max Erosion", "Interpretation"],
  [
    ["Structurally Safe",                "0%",  "3%",  "Minimal risk. Standard governance is sufficient."],
    ["Execution Heavy",                  "3%",  "8%",  "Senior effort and iteration intensity will consume margin over time."],
    ["Price Sensitive",                  "5%",  "12%", "Pricing assumptions need explicit protection to prevent leakage."],
    ["Structurally Fragile",             "10%", "18%", "Structural overload is actively threatening commercial viability."],
    ["Do Not Proceed Without Repricing", "15%", "25%", "Engagement is not commercially viable at the current price level."],
  ],
  [175, 75, 75, 160]
);

h3("Step 2 — Dimension Weights Position You Within the Range");
body("Each of the 6 risk dimensions is converted to a numeric weight on a 0 to 1 scale:");
bullet("Low", "0.0");
bullet("Medium", "0.5");
bullet("High", "1.0");
bullet("Confidence Signal — Positive", "0.0   ·   Neutral: 0.5   ·   Negative: 1.0");
doc.moveDown(0.2);
body("The 6 weights (one per dimension) are added together and divided by 6 to produce a single average weight between 0 and 1. This average determines where within the verdict's erosion range the final figure lands — 0 means minimum erosion, 1 means maximum.");

h3("Step 3 — Formula");
infoBox([
  "Estimated Margin Loss  =  Min + (Max − Min) × Average Dimension Weight",
  "Effective Margin  =  Current Margin %  −  Estimated Margin Loss",
]);

h3("Worked Example");
drawTable(
  ["Input", "Value"],
  [
    ["Verdict", "Price Sensitive  →  Range: 5% to 12%"],
    ["Workforce Intensity", "High = 1.0"],
    ["Coordination Entropy", "Medium = 0.5"],
    ["Commercial Exposure", "High = 1.0"],
    ["Volatility Control", "Medium = 0.5"],
    ["Confidence Signal", "Neutral = 0.5"],
    ["Measurement Maturity", "Low = 0.0"],
    ["Average weight", "(1.0 + 0.5 + 1.0 + 0.5 + 0.5 + 0.0) ÷ 6  =  0.583"],
    ["Estimated Margin Loss", "5 + (12 − 5) × 0.583  =  5 + 4.08  =  9.1%"],
    ["Current Margin entered", "18%"],
    ["Effective Margin", "18 − 9.1  =  8.9%"],
  ],
  [175, 310]
);

h3("Step 4 — Impact Label");
drawTable(
  ["Estimated Loss", "Label", "Colour", "What It Means"],
  [
    ["0 – 1%",  "No Impact",          "Green", "Safe to proceed as structured. No margin intervention needed."],
    ["1 – 4%",  "Minimal Impact",     "Green", "Manageable with standard controls and normal monitoring."],
    ["4 – 8%",  "Moderate Impact",    "Amber", "Warrants active monitoring. Consider governance checkpoints."],
    ["8 – 15%", "Significant Impact", "Red",   "Requires structural intervention. Revisit pricing or scope before proceeding."],
    ["15%+",    "Severe Impact",      "Red",   "Engagement is not viable at the current margin. Repricing mandatory."],
  ],
  [75, 110, 65, 235]
);

// ─── PRINCIPLES ──────────────────────────────────────────────────────────────
h1("Core Design Principles");
bullet("Fully deterministic", "No AI, no ML, and no probabilistic scoring anywhere in the verdict logic. Given identical inputs, the system always produces an identical verdict. The weighted score is computed from fixed rules — it is deterministic arithmetic, not learned inference.");
bullet("Confidence is a hard override, not a weight", "A Negative Confidence Signal fires unconditionally before any scoring begins. No combination of low-risk dimension scores can counteract a confidence failure. This reflects the real-world truth that a client or team without delivery confidence represents non-negotiable structural risk.");
bullet("Weighted scoring catches accumulated medium risk", "A first-match rule-only system cannot detect an engagement that is Medium on every dimension — it would return Structurally Safe. The weighted model produces a score of 50 for an all-Medium engagement, correctly classifying it as Price Sensitive. This is the primary motivation for the scoring model.");
bullet("Weights reflect margin sensitivity, not operational severity", "Workforce Intensity (30%) and Coordination Entropy (25%) carry the highest weights because senior-dependency and coordination drag are the two most consistent drivers of margin erosion in agency engagements. Commercial Exposure (20%) reflects pricing structure fragility. Volatility Control (15%) and Measurement Maturity (10%) are real but secondary contributors.");
bullet("Margin erosion is display-only", "The erosion percentage is computed after the verdict is already set. It provides decision context but cannot change the verdict under any circumstances.");
bullet("Identifiers are invisible to the engine", "Q1–Q5 (name, email, role, organisation name, organisation size) are passed to PDFs, emails, and heatmaps but are never evaluated by any scoring rule.");
bullet("Q23 open signal is narrative only", "The optional open text field feeds GPT-4.1 for written narrative generation only. It cannot alter, override, soften, or harden the verdict in any way. GPT is never permitted to recalculate, reinterpret, or contradict the deterministic verdict.");
bullet("AI exposure (Q18)", "Only affects the Measurement Maturity signal. It is not a direct verdict driver — it influences margin erosion depth through the dimension weight average, not the verdict itself. Junior-execution AI substitution = High risk; mid-level production = Medium; senior thinking or no clear substitution = Low.");
bullet("Layers 1 and 2 use no arithmetic", "Questions → Signals (Layer 1) and Signals → Dimensions (Layer 2) use only logical comparisons (equals, AND, OR, MAX). Numeric weights appear only in Layer 3 Step 2 (verdict scoring) and Layer 4 (margin erosion display).");

divider();
doc.fontSize(8).fillColor(MID_GRAY).font("Helvetica")
  .text("MarginMix — Confidential Internal Reference  ·  marginmix.ai  ·  Decision Support for Margin Risk Clarity",
    LEFT, doc.y, { align: "center", width: PAGE_W });

doc.end();

stream.on("finish", () => console.log(`✓ PDF saved: ${outputPath}`));
