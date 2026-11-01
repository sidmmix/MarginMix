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
body("This reference documents the standalone full assessment's deterministic Model1 computation. The scorecard is authoritative for question points, signal groups, arithmetic means, weights and verdict thresholds. The 51.7 example is a regression fixture, not a target for other answers. AI does not calculate or supply scores.");
divider();

// ─── LAYER 1 ─────────────────────────────────────────────────────────────────
h1("Layer 1 — Questions → Signals");
body("The scorecard assigns points to 18 answers. Q1–Q6 are identifiers/context and are not in the composite. Q23 is a confidence override, not a numeric dimension input. Q27 is narrative-only. The full assessment is independent of the homepage quick profiler; answers are not prefilled or skipped.");

h3("Identifier Questions (Q1–Q5) — No Signal Produced");
note("Q1 Full Name  ·  Q2 Work Email  ·  Q3 Role / Title  ·  Q4 Organisation Name  ·  Q5 Organisation Size");

h3("Model1 Scored Answers");
drawTable(
  ["Q#", "Answer", "Points"],
  [
    ["Q7", "Decision: new / renewal / exploratory; expansion / escalation; strategic exception", "0 / 100 / 50"],
    ["Q9", "Stage: new / under 6 months / renewal-expansion; 6–12 months / 12+ months", "50 / 0"],
    ["Q10", "Retainer; hybrid / T&M / managed; fixed fee / commission / outcome-based", "0 / 50 / 100"],
    ["Q11, Q12, Q14, Q16, Q17, Q18", "Low / medium / high", "0 / 50 / 100"],
    ["Q13, Q21", "Q13: minimal / periodic / frequent / continuous; Q21: less / same / more", "0 / 50 / 100"],
    ["Q15", "Execution-heavy / balanced / thinking-heavy; technical implementation", "0 / 50 / 100; 50"],
    ["Q19", "Junior execution / mid-level production / senior thinking / no clear path", "0 / 50 / 100 / 100"],
    ["Q20", "Significant / some / minimal / no meaningful additional value", "0 / 50 / 100 / 100"],
    ["Q24", "Agentic framework: no / yes / NA", "0 / 100 / 0"],
    ["Q25", "AI hours replaced: 0–25% / 25–50% / 50–75% / 75–100% / NA", "0 / 50 / 100 / 100 / 0"],
    ["Q26", "Commercial AI impact measured: yes / no / NA", "0 / 100 / 0"],
    ["Q23", "Low confidence triggers the override; Q27 open text is narrative-only.", "Override / no points"],
  ],
  [60, 330, 95]
);

h3("Scorecard interpretation");
note("Points are risk points on a 0–100 scale, not Low/Medium/High ratings. For hybrid engagements, score each applicable component using its answer mapping; a fixed-fee answer scores 100 across industries. Missing or NA follow-ups are not silently replaced with an AI estimate.");

// ─── LAYER 2 ─────────────────────────────────────────────────────────────────
h1("Layer 2 — Signals → Numeric Dimensions");
body("Each named signal is first scored from its mapped answer. Signals joined by MAX use the highest point value. Each dimension is the arithmetic mean of its listed signal scores; no categorical dimension conversion is used for scoring.");

drawTable(
  ["Dimension", "Signal and source question", "Aggregation"],
  [
    ["Workforce Intensity",
     "SeniorDependency = MAX(Q13,Q21)\nIterationLoad proxy = Q15\nIterationLoad = Q16\nGovernanceStrength = Q20",
     "Mean of 4 signal scores"],
    ["Coordination Entropy",
     "CoordinationIntensity = Q14\nCoordinationLoad = MAX(Q18,Q22)",
     "Mean of 2 signal scores"],
    ["Commercial Exposure",
     "EngagementState = MAX(Q7,Q9)\nPricingRigidity = Q10\nScopeElasticity = Q17",
     "Mean of 3 signal scores"],
    ["Volatility Control",
     "ClientVolatility = Q11\nStakeholderLoad = Q12",
     "Mean of 2 signal scores"],
    ["Measurement Maturity",
     "AILeverage = Q19\nAIRiskPeak = MAX(Q24,Q25,Q26)",
     "Mean of 2 signal scores"],
  ],
  [116, 254, 115]
);

// ─── LAYER 3 ─────────────────────────────────────────────────────────────────
h1("Layer 3 — Dimensions → Verdict (Weighted Scoring Model)");
body("The raw composite is the sum of each numeric dimension mean multiplied by its unchanged weight. Preserve full precision through verdict selection; round only the displayed composite to one decimal place. The sample 51.7 is a fixture, not a score to impose on other answer sets.");

h3("Step 1 — Hard Override (fires before scoring)");
drawTable(
  ["Override", "Condition", "Verdict", "Trigger Code"],
  [
    ["Confidence Failure",
     "Fires when the existing Confidence Signal is Negative: low Q23 delivery confidence, or minimal/no additional value on Q20. This override is evaluated before the weighted verdict.",
     "Do Not Proceed\nWithout Repricing",
     "LOW_CONFIDENCE\n_OVERRIDE"],
  ],
  [75, 230, 110, 70]
);

h3("Step 2 — Weighted Score (applied when no override fires)");
body("Dimension means are already numeric; do not convert them to bands and back into points. For each dimension, weighted contribution = dimension mean × weight ÷ 100. Composite = sum of the five contributions. The override does not replace or fabricate the underlying composite.");
drawTable(
  ["Dimension", "Weight", "Score formula", "Contribution"],
  [
    ["Workforce Intensity",   "30%", "Mean(Q13/Q21 MAX, Q15, Q16, Q20)", "Mean × 0.30"],
    ["Coordination Entropy",  "25%", "Mean(Q14, Q18/Q22 MAX)", "Mean × 0.25"],
    ["Commercial Exposure",   "20%", "Mean(Q7/Q9 MAX, Q10, Q17)", "Mean × 0.20"],
    ["Volatility Control",    "15%", "Mean(Q11, Q12)", "Mean × 0.15"],
    ["Measurement Maturity",  "10%", "Mean(Q19, Q24/Q25/Q26 MAX)", "Mean × 0.10"],
    ["TOTAL",                 "100%", "Sum of five contributions", "Composite 0–100"],
  ],
  [122, 46, 222, 95]
);

h3("Illustrative regression fixture — not a target");
drawTable(
  ["Dimension", "Mean", "Weight", "Contribution"],
  [
    ["Workforce Intensity", "62.5", "30%", "18.75"],
    ["Coordination Entropy", "50", "25%", "12.5"],
    ["Commercial Exposure", "33.333…", "20%", "6.666…"],
    ["Volatility Control", "25", "15%", "3.75"],
    ["Measurement Maturity", "100", "10%", "10"],
    ["Raw total", "", "", "51.666… → display 51.7"],
  ],
  [150, 88, 75, 172]
);
note("Those values come from one fixed answer fixture. Other answers must produce their own signal scores, means and weighted contributions.");

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

// ─── PRINCIPLES ──────────────────────────────────────────────────────────────
h1("Core Design Principles");
bullet("Deterministic scoring", "Every point, signal maximum, dimension mean and weighted contribution is calculated from the submitted answers. AI is limited to prose; numeric claims it produces are rejected.");
bullet("Confidence override", "The existing negative Confidence Signal remains a pre-scoring override. It changes the verdict, not the numeric composite.");
bullet("No margin forecast", "The assessment does not estimate margin erosion or effective margin, and does not invent staffing percentages or effort allocations.");
bullet("Separate quick profiler", "The full assessment at /assessment has its own independent question, scoring and report flow. The homepage profiler does not prefill it or skip its questions.");

divider();
doc.fontSize(8).fillColor(MID_GRAY).font("Helvetica")
  .text("MarginMix — Confidential Internal Reference  ·  marginmix.ai  ·  Decision Support for Margin Risk Clarity",
    LEFT, doc.y, { align: "center", width: PAGE_W });

doc.end();

stream.on("finish", () => console.log(`✓ PDF saved: ${outputPath}`));
