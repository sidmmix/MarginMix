import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const outputPath = path.join(process.cwd(), "client/public/MarginMix-Investor-Deck.pdf");
const stream = fs.createWriteStream(outputPath);

const doc = new PDFDocument({
  size: "A4",
  margin: 0,
  info: { Title: "MarginMix — Investor Pitch Deck", Author: "MarginMix" },
});
doc.pipe(stream);

const W = 595.28;
const H = 841.89;
const PAD = 52;

const DARK    = "#0F172A";
const MID     = "#1E293B";
const EMERALD = "#10B981";
const EMR_DIM = "#064E3B";
const EMR_TXT = "#6EE7B7";
const WHITE   = "#FFFFFF";
const GRAY    = "#94A3B8";
const LGRAY   = "#CBD5E1";
const RED_BG  = "#1A0A0A";
const RED_TXT = "#FCA5A5";
const AMBER   = "#FCD34D";

function newSlide(bg = DARK) {
  doc.addPage();
  doc.rect(0, 0, W, H).fill(bg);
}

function tag(text: string, x: number, y: number) {
  doc.fontSize(7).fillColor(EMERALD).font("Helvetica-Bold")
    .text(text.toUpperCase(), x, y, { characterSpacing: 2 });
}

function h1(text: string, x: number, y: number, width = W - PAD * 2, color = WHITE) {
  doc.fontSize(26).fillColor(color).font("Helvetica-Bold")
    .text(text, x, y, { width, lineGap: 4 });
}

function h2(text: string, x: number, y: number, width = W - PAD * 2, color = WHITE) {
  doc.fontSize(18).fillColor(color).font("Helvetica-Bold")
    .text(text, x, y, { width, lineGap: 3 });
}

function body(text: string, x: number, y: number, width = W - PAD * 2, color = LGRAY) {
  doc.fontSize(9.5).fillColor(color).font("Helvetica")
    .text(text, x, y, { width, lineGap: 3 });
}

function small(text: string, x: number, y: number, width = W - PAD * 2, color = GRAY) {
  doc.fontSize(8).fillColor(color).font("Helvetica")
    .text(text, x, y, { width, lineGap: 2 });
}

function divider(x: number, y: number, width = 40, color = EMERALD) {
  doc.moveTo(x, y).lineTo(x + width, y).strokeColor(color).lineWidth(2).stroke();
}

function pill(text: string, x: number, y: number) {
  const tw = doc.fontSize(7).widthOfString(text) + 16;
  doc.roundedRect(x, y, tw, 16, 4).fill(EMR_DIM);
  doc.fontSize(7).fillColor(EMR_TXT).font("Helvetica-Bold")
    .text(text.toUpperCase(), x + 8, y + 4, { characterSpacing: 1 });
  return tw;
}

function card(x: number, y: number, w: number, h: number, bg = "#FFFFFF10", stroke = "#FFFFFF18") {
  doc.roundedRect(x, y, w, h, 8).fill(bg);
  doc.roundedRect(x, y, w, h, 8).stroke(stroke);
}

function bullet(x: number, y: number, text: string, color = LGRAY) {
  doc.circle(x + 4, y + 4, 2.5).fill(EMERALD);
  doc.fontSize(9).fillColor(color).font("Helvetica")
    .text(text, x + 14, y, { width: W - PAD * 2 - 14, lineGap: 2 });
  return doc.y;
}

function row(x: number, y: number, label: string, value: string, w = W - PAD * 2) {
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica").text(label, x, y, { width: w * 0.65 });
  doc.fontSize(8.5).fillColor(WHITE).font("Helvetica-Bold").text(value, x + w * 0.68, y, { width: w * 0.3, align: "right" });
  doc.moveTo(x, y + 14).lineTo(x + w, y + 14).strokeColor("#FFFFFF10").lineWidth(0.5).stroke();
}

function slideNumber(n: number, total: number) {
  doc.fontSize(7).fillColor("#FFFFFF25").font("Helvetica")
    .text(`${n} / ${total}`, W - PAD - 30, H - 24, { width: 40, align: "right" });
}

const TOTAL = 11;

// ── SLIDE 1: COVER ────────────────────────────────────────────────────────────
doc.rect(0, 0, W, H).fill(DARK);
doc.circle(W / 2, H / 2, 280).fill("#10B98108");

doc.fontSize(8).fillColor(EMERALD).font("Helvetica-Bold")
  .text("INVESTOR PRESENTATION  ·  2026", 0, 120, { width: W, align: "center", characterSpacing: 2 });

doc.fontSize(52).fillColor(WHITE).font("Helvetica-Bold")
  .text("MarginMix", 0, 175, { width: W, align: "center" });

doc.fontSize(14).fillColor(EMR_TXT).font("Helvetica")
  .text("The Financial Reasoning Engine for Professional Services", 0, 242, { width: W, align: "center" });

doc.moveTo(W / 2 - 40, 272).lineTo(W / 2 + 40, 272).strokeColor(EMERALD).lineWidth(1.5).stroke();

doc.fontSize(10).fillColor(GRAY).font("Helvetica")
  .text("Pricing and margin risk decisions — made before delivery begins,\nwhere the cost of being wrong is highest.", 0, 284, { width: W, align: "center", lineGap: 4 });

const icons = [
  { label: "Deterministic Engine" },
  { label: "60-Second Assessment" },
  { label: "90% Gross Margin" },
];
const iconY = 360;
icons.forEach((ic, i) => {
  const x = PAD + i * 165;
  doc.circle(x + 6, iconY + 5, 4).fill(EMR_DIM);
  doc.fontSize(9).fillColor(GRAY).font("Helvetica").text(ic.label, x + 16, iconY, { width: 140 });
});

doc.fontSize(7).fillColor("#FFFFFF20").font("Helvetica")
  .text("1 / 11", W - PAD - 30, H - 24, { width: 40, align: "right" });

// ── SLIDE 2: PROBLEM ──────────────────────────────────────────────────────────
newSlide(DARK);
slideNumber(2, TOTAL);

// Left panel
const lw = 340;
tag("THE PROBLEM", PAD, 60);
h1("Firms price work before\nthey understand how it\nwill be delivered.", PAD, 76, lw - 20);
divider(PAD, 168);

const probs = [
  "Timesheets are inaccurate and lagging",
  "Historical data is noisy and backward-looking",
  "Complexity and coordination costs are underestimated",
  "AI adoption changes effort patterns — ROI is unclear",
  "Judgment lives in senior operators' heads, not systems",
];
let py = 180;
probs.forEach(p => {
  bullet(PAD, py, p);
  py = doc.y + 6;
});

// Right panel
const rx = 355;
const rw = W - rx - PAD / 2;
doc.roundedRect(rx, 44, rw, H - 88, 10).fill(RED_BG);

doc.fontSize(7).fillColor(RED_TXT).font("Helvetica-Bold")
  .text("THE RESULT", rx, 70, { width: rw, align: "center", characterSpacing: 2 });

doc.fontSize(28).fillColor(WHITE).font("Helvetica-Bold")
  .text("$300K–$1M", rx, 96, { width: rw, align: "center" });
doc.fontSize(8).fillColor(GRAY).font("Helvetica")
  .text("margin destroyed per year\nfrom 1–2 mispriced engagements", rx, 133, { width: rw, align: "center", lineGap: 2 });

doc.moveTo(rx + 20, 165).lineTo(rx + rw - 20, 165).strokeColor("#7F1D1D").lineWidth(0.5).stroke();

doc.fontSize(18).fillColor(RED_TXT).font("Helvetica-Bold")
  .text("Discovered\ntoo late", rx, 178, { width: rw, align: "center", lineGap: 3 });
doc.fontSize(8).fillColor(GRAY).font("Helvetica")
  .text("Margin erosion is only visible\nafter damage is done", rx, 226, { width: rw, align: "center", lineGap: 2 });

doc.roundedRect(rx + 10, H - 200, rw - 20, 80, 6).fill("#7F1D1D40");
doc.fontSize(8.5).fillColor(RED_TXT).font("Helvetica")
  .text('"This is not a margin leakage problem.\nIt is a pricing and commitment risk problem."', rx + 20, H - 188, { width: rw - 40, align: "center", lineGap: 3 });

// ── SLIDE 3: SOLUTION ─────────────────────────────────────────────────────────
newSlide(DARK);
slideNumber(3, TOTAL);

tag("THE SOLUTION", PAD, 60);
h1("One question. One verdict.\nBefore commitment is locked.", PAD, 76, W - PAD * 2);
doc.fontSize(11).fillColor(EMR_TXT).font("Helvetica")
  .text('"Given how this engagement will actually be delivered, is the pricing economically viable?"', PAD, 142, { width: W - PAD * 2, lineGap: 3 });
divider(PAD, 174);

const colW = (W - PAD * 2 - 12) / 2;

// Left card: outputs
card(PAD, 186, colW, 250);
doc.fontSize(7).fillColor(EMERALD).font("Helvetica-Bold")
  .text("WHAT MARGINMIX OUTPUTS", PAD + 14, 200, { characterSpacing: 1.5 });
const outputs = [
  "Margin risk verdict (5-level classification)",
  "Structural risk drivers identified",
  "Effort concentration bands — Senior / Mid / Execution",
  "Pricing & governance implications",
  "Decision memo usable at CXO / partner level",
  "Estimated margin erosion on current margin",
];
let oy = 218;
outputs.forEach(o => {
  doc.circle(PAD + 20, oy + 4, 2).fill(EMERALD);
  doc.fontSize(8.5).fillColor(LGRAY).font("Helvetica").text(o, PAD + 28, oy, { width: colW - 42, lineGap: 1 });
  oy = doc.y + 5;
});

// Right cards
const rx2 = PAD + colW + 12;
card(rx2, 186, colW, 110);
doc.fontSize(7).fillColor(GRAY).font("Helvetica-Bold")
  .text("WHAT IT IS NOT", rx2 + 14, 200, { characterSpacing: 1.5 });
const notThis = [
  "Does not ingest timesheets or ERP data",
  "Does not model delivery performance",
  "Does not replace finance systems",
];
let ny = 218;
notThis.forEach(n => {
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica").text(`— ${n}`, rx2 + 14, ny, { width: colW - 28 });
  ny = doc.y + 5;
});

card(rx2, 308, colW, 128, EMR_DIM + "80", EMERALD + "40");
doc.fontSize(7).fillColor(EMERALD).font("Helvetica-Bold")
  .text("THE ENGINE", rx2 + 14, 322, { characterSpacing: 1.5 });
doc.fontSize(8.5).fillColor(LGRAY).font("Helvetica")
  .text("Deterministic. Rule-based. No ML. No AI in verdict logic.\nEncodes expert judgment into a repeatable, auditable decision system that gives the same answer to identical inputs — every time.", rx2 + 14, 338, { width: colW - 28, lineGap: 3 });

// ── SLIDE 4: WHY NOW ──────────────────────────────────────────────────────────
newSlide(DARK);
slideNumber(4, TOTAL);

tag("WHY NOW", PAD, 60);
h1("Four forces converging —\nright now.", PAD, 76, W - PAD * 2);
divider(PAD, 140);

const reasons = [
  {
    title: "AI is reshaping delivery economics",
    body: "Firms are adopting AI tools rapidly — but have no framework to price AI-augmented work. The effort mix has changed. The pricing model hasn't.",
  },
  {
    title: "CFOs want predictive confidence",
    body: "Post-pandemic margin pressure means finance leaders are demanding forward-looking risk signals — not post-mortems built on lagging timesheet data.",
  },
  {
    title: "No system sits before commitment",
    body: "Every existing tool — ERP, PSA, BI — operates after delivery begins. The pre-commitment gap is entirely unaddressed. MarginMix owns that moment.",
  },
  {
    title: "The window is open — briefly",
    body: "AI-native firms will build this capability. The window to establish 'Margin Risk Clarity' as the category standard is 18–24 months.",
  },
];

const cw4 = (W - PAD * 2 - 10) / 2;
const ch4 = 140;
reasons.forEach((r, i) => {
  const cx = PAD + (i % 2) * (cw4 + 10);
  const cy = 158 + Math.floor(i / 2) * (ch4 + 10);
  card(cx, cy, cw4, ch4);
  doc.fontSize(8).fillColor(EMERALD).font("Helvetica-Bold").text(`0${i + 1}`, cx + 14, cy + 14);
  doc.fontSize(10).fillColor(WHITE).font("Helvetica-Bold").text(r.title, cx + 14, cy + 30, { width: cw4 - 28 });
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica").text(r.body, cx + 14, doc.y + 4, { width: cw4 - 28, lineGap: 2 });
});

// ── SLIDE 5: TARGET CUSTOMER ──────────────────────────────────────────────────
newSlide(DARK);
slideNumber(5, TOTAL);

tag("TARGET CUSTOMER", PAD, 60);
h1("Phase 1 Wedge: Mid-tier\nProfessional Services", PAD, 76, W - PAD * 2);
divider(PAD, 140);

const cw5 = (W - PAD * 2 - 20) / 3;
const cards5 = [
  {
    label: "FIRM PROFILE",
    content: [
      { big: "200–2,000", sub: "employees" },
    ],
    bullets: ["Mid-tier & independent agencies", "Consulting firms", "Digital transformation firms"],
  },
  {
    label: "KEY BUYERS",
    rows: [
      { title: "CFO", desc: "Owns margin accountability" },
      { title: "COO", desc: "Owns delivery risk" },
      { title: "Partner / MD", desc: "Owns deal commitment" },
    ],
  },
  {
    label: "WHY THESE FIRMS",
    list: [
      "70–80 pricing decisions annually",
      "Cannot afford large consulting projects",
      "Lack internal decision systems",
      "Feel margin risk acutely",
      "Fewer decisions = higher stakes per decision",
    ],
    cardColor: EMR_DIM + "60",
    stroke: EMERALD + "40",
  },
];

cards5.forEach((c, i) => {
  const cx = PAD + i * (cw5 + 10);
  const cy = 158;
  card(cx, cy, cw5, 290, i === 2 ? EMR_DIM + "60" : "#FFFFFF08", i === 2 ? EMERALD + "40" : "#FFFFFF18");
  doc.fontSize(7).fillColor(i === 2 ? EMERALD : GRAY).font("Helvetica-Bold")
    .text(c.label, cx + 14, cy + 14, { width: cw5 - 28, characterSpacing: 1.5 });

  if (c.content) {
    doc.fontSize(24).fillColor(WHITE).font("Helvetica-Bold").text(c.content[0].big, cx + 14, cy + 36, { width: cw5 - 28 });
    doc.fontSize(8).fillColor(GRAY).font("Helvetica").text(c.content[0].sub, cx + 14, cy + 66, { width: cw5 - 28 });
    let by = cy + 86;
    (c.bullets || []).forEach(b => {
      doc.circle(cx + 18, by + 4, 2).fill(EMERALD);
      doc.fontSize(8.5).fillColor(LGRAY).font("Helvetica").text(b, cx + 26, by, { width: cw5 - 40 });
      by = doc.y + 6;
    });
  }
  if (c.rows) {
    let ry = cy + 38;
    (c.rows || []).forEach((r: any, ri: number) => {
      if (ri > 0) {
        doc.moveTo(cx + 10, ry - 4).lineTo(cx + cw5 - 10, ry - 4).strokeColor("#FFFFFF10").lineWidth(0.5).stroke();
      }
      doc.fontSize(10).fillColor(WHITE).font("Helvetica-Bold").text(r.title, cx + 14, ry, { width: cw5 - 28 });
      doc.fontSize(8).fillColor(GRAY).font("Helvetica").text(r.desc, cx + 14, ry + 14, { width: cw5 - 28 });
      ry += 48;
    });
  }
  if (c.list) {
    let ly = cy + 36;
    (c.list || []).forEach(item => {
      doc.fontSize(8).fillColor(EMERALD).font("Helvetica").text("→", cx + 14, ly);
      doc.fontSize(8.5).fillColor(LGRAY).font("Helvetica").text(item, cx + 26, ly, { width: cw5 - 40 });
      ly = doc.y + 7;
    });
  }
});

// ── SLIDE 6: REVENUE MODEL ────────────────────────────────────────────────────
newSlide(DARK);
slideNumber(6, TOTAL);

tag("REVENUE MODEL", PAD, 60);
h1("Value-based. Decision-anchored.\nNot seat-based.", PAD, 76, W - PAD * 2);
small("Pricing reflects the value of the decision being protected — not the number of users.", PAD, 136, W - PAD * 2);
divider(PAD, 154);

const plans = [
  {
    label: "ENTRY / ASSESSMENT",
    price: "$89",
    unit: "per submission",
    items: ["Instant output", "No free trial", "Decision memo + PDF"],
    highlight: false,
  },
  {
    label: "SUBSCRIPTION",
    price: "$1,250",
    unit: "/mo  ·  ~$15K ACV",
    items: ["Unlimited submissions", "Portfolio-level views", "Deal desk workflows", "AI ROI simulation"],
    highlight: true,
    badge: "Phase 1 Core",
  },
  {
    label: "PHASE 2 EXPANSION",
    price: "$2,100",
    unit: "/mo  ·  ~$25K ACV",
    items: ["Everything in Phase 1", "Engineering / SI firms", "Full expansion tier"],
    highlight: false,
  },
];

const cw6 = (W - PAD * 2 - 20) / 3;
plans.forEach((p, i) => {
  const cx = PAD + i * (cw6 + 10);
  const cy = 170;
  const ch = 220;
  card(cx, cy, cw6, ch, p.highlight ? EMR_DIM + "80" : "#FFFFFF08", p.highlight ? EMERALD + "60" : "#FFFFFF18");
  if (p.highlight) {
    doc.roundedRect(cx + cw6 / 2 - 35, cy - 8, 70, 16, 8).fill(EMERALD);
    doc.fontSize(7).fillColor(DARK).font("Helvetica-Bold").text(p.badge!, cx + cw6 / 2 - 35, cy - 4, { width: 70, align: "center", characterSpacing: 0.5 });
  }
  doc.fontSize(7).fillColor(p.highlight ? EMERALD : GRAY).font("Helvetica-Bold")
    .text(p.label, cx + 14, cy + 16, { width: cw6 - 28, characterSpacing: 1.5 });
  doc.fontSize(26).fillColor(WHITE).font("Helvetica-Bold").text(p.price, cx + 14, cy + 34, { width: cw6 - 28 });
  doc.fontSize(8).fillColor(GRAY).font("Helvetica").text(p.unit, cx + 14, cy + 66, { width: cw6 - 28 });
  doc.moveTo(cx + 10, cy + 84).lineTo(cx + cw6 - 10, cy + 84).strokeColor("#FFFFFF15").lineWidth(0.5).stroke();
  let iy = cy + 94;
  p.items.forEach(item => {
    doc.fontSize(8.5).fillColor(LGRAY).font("Helvetica").text(`— ${item}`, cx + 14, iy, { width: cw6 - 28 });
    iy = doc.y + 5;
  });
});

doc.roundedRect(PAD, 406, W - PAD * 2, 36, 6).fill("#FFFFFF08");
doc.fontSize(8.5).fillColor(LGRAY).font("Helvetica")
  .text("Trigger for subscription launch: 300 paying customers within 6 months. Assessment-tier revenue funds this transition.", PAD + 14, 415, { width: W - PAD * 2 - 28 });

// ── SLIDE 7: MARKET OPPORTUNITY ───────────────────────────────────────────────
newSlide(DARK);
slideNumber(7, TOTAL);

tag("MARKET OPPORTUNITY", PAD, 60);
h1("Large, underserved, and\nstructured for expansion.", PAD, 76, W - PAD * 2);
divider(PAD, 140);

const mkts = [
  { label: "TAM", value: "$600M–$1B", color: LGRAY, sub: "~40K firms globally (developed markets + Brazil, South Africa). Agencies, consulting, SIs, ITeS at 200+ employees. $15K–$25K ACV." },
  { label: "SAM · PHASE 1", value: "$213M", color: EMR_TXT, sub: "14,200 agencies & consulting firms across 13 core markets at $15K ACV. 2–3 year horizon." },
  { label: "SOM · 3 YEARS", value: "$7.5M ARR", color: EMERALD, sub: '500 firms in top 13 markets at $15K ACV. Establishes "Margin Risk Clarity" as the decision-support standard.', highlight: true },
];

const cw7 = (W - PAD * 2 - 20) / 3;
mkts.forEach((m, i) => {
  const cx = PAD + i * (cw7 + 10);
  const cy = 158;
  card(cx, cy, cw7, 170, m.highlight ? EMR_DIM + "60" : "#FFFFFF08", m.highlight ? EMERALD + "40" : "#FFFFFF18");
  doc.fontSize(7).fillColor(m.highlight ? EMERALD : GRAY).font("Helvetica-Bold")
    .text(m.label, cx + 14, cy + 14, { characterSpacing: 1.5 });
  doc.fontSize(22).fillColor(m.color).font("Helvetica-Bold").text(m.value, cx + 14, cy + 30, { width: cw7 - 28 });
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica").text(m.sub, cx + 14, cy + 68, { width: cw7 - 28, lineGap: 2 });
});

// Phase 2 band
card(PAD, 346, W - PAD * 2, 80, "#FFFFFF05", "#FFFFFF10");
doc.fontSize(7).fillColor(EMERALD).font("Helvetica-Bold")
  .text("PHASE 2  ·  5–7 YEARS", PAD + 14, 358, { characterSpacing: 1.5 });
doc.fontSize(20).fillColor(WHITE).font("Helvetica-Bold").text("$25M ARR", PAD + 14, 374);
doc.fontSize(8.5).fillColor(GRAY).font("Helvetica")
  .text("27,090 firms (adding Engineering / SIs) at $24K ACV. 2.5% of TAM capture.\nTransition to the 5-minute AI Deal Desk utility — from advisory product to essential operational guardrail.", PAD + 140, 362, { width: W - PAD * 2 - 160, lineGap: 2 });

// ── SLIDE 8: UNIT ECONOMICS ───────────────────────────────────────────────────
newSlide(DARK);
slideNumber(8, TOTAL);

tag("UNIT ECONOMICS", PAD, 60);
h1("High-margin decision product.\nNot services-heavy SaaS.", PAD, 76, W - PAD * 2);
small("The cost structure is built for scale. The value proposition is built for retention.", PAD, 136, W - PAD * 2);
divider(PAD, 154);

const metrics = [
  { label: "Gross Margin", value: "90%", sub: "Minimal COGS — LLM narration + infra only", color: EMERALD },
  { label: "Onboarding Cost", value: "$0", sub: "No integrations. No implementation required", color: "#818CF8" },
  { label: "ACV", value: "~$15K", sub: "Phase 1 subscription", color: AMBER },
  { label: "Decision Frequency", value: "70–80/yr", sub: "Per firm — episodic, high-stakes", color: "#F472B6" },
  { label: "CAC", value: "Low", sub: "Founder-led sales in early stage", color: EMR_TXT },
  { label: "Payback", value: "< 1 deal", sub: "One avoided bad engagement > annual fee", color: EMERALD },
];

const cw8 = (W - PAD * 2 - 20) / 3;
const ch8 = 104;
metrics.forEach((m, i) => {
  const cx = PAD + (i % 3) * (cw8 + 10);
  const cy = 168 + Math.floor(i / 3) * (ch8 + 10);
  card(cx, cy, cw8, ch8);
  doc.fontSize(22).fillColor(m.color).font("Helvetica-Bold").text(m.value, cx + 14, cy + 14, { width: cw8 - 28 });
  doc.fontSize(9.5).fillColor(WHITE).font("Helvetica-Bold").text(m.label, cx + 14, cy + 44, { width: cw8 - 28 });
  doc.fontSize(8).fillColor(GRAY).font("Helvetica").text(m.sub, cx + 14, cy + 60, { width: cw8 - 28, lineGap: 1 });
});

// ── SLIDE 9: SCALABILITY ──────────────────────────────────────────────────────
newSlide(DARK);
slideNumber(9, TOTAL);

tag("WHY THIS SCALES", PAD, 60);
h1("Decision infrastructure\ncompounds. It doesn't erode.", PAD, 76, W - PAD * 2);
divider(PAD, 140);

const scale = [
  { n: "01", title: "Judgment is systemized", body: "Expert knowledge encoded once. Delivered infinitely. No per-client consulting required." },
  { n: "02", title: "AI amplifies speed, not logic", body: "GPT generates narratives only. The verdict logic is deterministic — auditable, repeatable, trustworthy." },
  { n: "03", title: "Same engine, every industry", body: "Agencies, consulting, SIs, ITeS. The Workforce Intensity Matrix applies universally across professional services." },
  { n: "04", title: "No integration overhead", body: "Zero ERP/PSA connections needed. Assessment runs on structured inputs alone — no IT project, no implementation risk." },
  { n: "05", title: "Decision infrastructure, not software", body: "Customers don't churn from decision infrastructure. Once embedded in the pricing process, switching cost is high." },
];

let sy = 158;
scale.forEach(s => {
  card(PAD, sy, W - PAD * 2, 52, "#FFFFFF05", "#FFFFFF10");
  doc.fontSize(10).fillColor(EMERALD).font("Helvetica-Bold").text(s.n, PAD + 14, sy + 16, { width: 24 });
  doc.fontSize(10).fillColor(WHITE).font("Helvetica-Bold").text(s.title, PAD + 46, sy + 10, { width: 180 });
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica").text(s.body, PAD + 46, sy + 26, { width: W - PAD * 2 - 60 });
  sy += 62;
});

// ── SLIDE 10: FOUNDER ADVANTAGE ───────────────────────────────────────────────
newSlide(DARK);
slideNumber(10, TOTAL);

tag("FOUNDER ADVANTAGE", PAD, 60);
h1("The insight can't be\nreverse-engineered without\nthe experience.", PAD, 76, W - PAD * 2);
small("MarginMix exists because of a specific, hard-won operating perspective — one that took years of front-line pricing decisions to develop.", PAD, 170, W - PAD * 2);
divider(PAD, 196);

const advantages = [
  "Deep operating experience across large, labor-intensive professional services organisations",
  "First-hand understanding of how pricing decisions are actually made at the senior level",
  "Ability to encode judgment that others treat as intuition — and make it repeatable",
  "Built the World's first Workforce Intensity Matrix — the proprietary framework powering the engine",
  "Category creator advantage: defined the problem space before the market named it",
];

let ay = 210;
advantages.forEach(a => {
  doc.circle(PAD + 5, ay + 4, 3).fill(EMERALD);
  doc.fontSize(9.5).fillColor(LGRAY).font("Helvetica").text(a, PAD + 18, ay, { width: W - PAD * 2 - 18, lineGap: 2 });
  ay = doc.y + 10;
});

doc.roundedRect(PAD, ay + 8, W - PAD * 2, 66, 8).fill(EMR_DIM + "60");
doc.roundedRect(PAD, ay + 8, W - PAD * 2, 66, 8).stroke(EMERALD + "30");
doc.fontSize(10).fillColor(EMR_TXT).font("Helvetica")
  .text('"MarginMix helps professional services firms price work with confidence by systematising margin risk decisions before delivery begins — where mistakes are most expensive."', PAD + 18, ay + 20, { width: W - PAD * 2 - 36, lineGap: 3 });

// ── SLIDE 11: THE OPPORTUNITY ──────────────────────────────────────────────────
newSlide(DARK);
slideNumber(11, TOTAL);

tag("THE OPPORTUNITY", PAD, 60);
h1("A category-defining product\nat the right moment.", PAD, 76, W - PAD * 2);
small("The pre-commitment margin risk window is open, unoccupied, and structurally important to every professional services firm.", PAD, 136, W - PAD * 2);
divider(PAD, 154);

const milestones = [
  { phase: "0 – 6 months", goal: "300 paying assessment customers", metric: "$89 × 300 = $26.7K MRR run-rate" },
  { phase: "6 – 18 months", goal: "Subscription launch + 50 firms", metric: "$62.5K MRR  ·  $750K ARR" },
  { phase: "18 – 36 months", goal: "500 subscription firms", metric: "$625K MRR  ·  $7.5M ARR" },
];

const cw11 = (W - PAD * 2 - 20) / 3;
milestones.forEach((m, i) => {
  const cx = PAD + i * (cw11 + 10);
  const cy = 170;
  card(cx, cy, cw11, 110, "#FFFFFF05", "#FFFFFF15");
  doc.moveTo(cx, cy).lineTo(cx + cw11, cy).strokeColor(EMERALD).lineWidth(2).stroke();
  doc.fontSize(7).fillColor(EMERALD).font("Helvetica-Bold").text(m.phase.toUpperCase(), cx + 14, cy + 12, { characterSpacing: 1 });
  doc.fontSize(9.5).fillColor(WHITE).font("Helvetica-Bold").text(m.goal, cx + 14, cy + 28, { width: cw11 - 28 });
  doc.fontSize(8.5).fillColor(GRAY).font("Helvetica").text(m.metric, cx + 14, cy + 70, { width: cw11 - 28 });
});

// Use of funds + why wins
const cw11b = (W - PAD * 2 - 10) / 2;
card(PAD, 298, cw11b, 130, "#FFFFFF05", "#FFFFFF12");
doc.fontSize(7).fillColor(GRAY).font("Helvetica-Bold").text("USE OF FUNDS", PAD + 14, 312, { characterSpacing: 1.5 });
const funds = [
  ["Product & Engineering", "40%"],
  ["GTM & Founder-led Sales", "35%"],
  ["Infrastructure & Ops", "15%"],
  ["Reserve", "10%"],
];
funds.forEach(([label, pct], i) => {
  row(PAD + 14, 330 + i * 18, label, pct, cw11b - 28);
});

const rx11 = PAD + cw11b + 10;
card(rx11, 298, cw11b, 130, EMR_DIM + "50", EMERALD + "35");
doc.fontSize(7).fillColor(EMERALD).font("Helvetica-Bold").text("WHY MARGINMIX WINS", rx11 + 14, 312, { characterSpacing: 1.5 });
doc.fontSize(8.5).fillColor(LGRAY).font("Helvetica")
  .text("First mover. Proprietary framework. Deterministic engine. No integration cost. High gross margin. Founder with operating insight the market hasn't yet systemised.", rx11 + 14, 330, { width: cw11b - 28, lineGap: 3 });

doc.fontSize(9).fillColor(EMERALD).font("Helvetica-Bold").text("marginmix.ai", rx11 + 14, 402, { width: cw11b - 28 });

// ── FOOTER ON ALL SLIDES ──────────────────────────────────────────────────────
doc.end();
stream.on("finish", () => console.log(`✓ PDF saved: ${outputPath}`));
