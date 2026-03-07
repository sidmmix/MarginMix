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

const W   = 595.28;
const H   = 841.89;
const PAD = 52;

// ── Clean palette ─────────────────────────────────────────────────────────────
const BG        = "#FFFFFF";   // slide background
const INK       = "#111111";   // headings
const BODY      = "#444444";   // body text
const MUTED     = "#777777";   // secondary / captions
const RULE      = "#E0E0E0";   // dividers / card borders
const ACCENT    = "#065F46";   // single green accent (sparingly)
const ACCENT_BG = "#F0FDF4";   // very light green tint for highlight cards
const LABEL_BG  = "#F4F4F4";   // card background

const TOTAL = 11;

// ── Helpers ───────────────────────────────────────────────────────────────────
function newSlide() {
  doc.addPage();
  doc.rect(0, 0, W, H).fill(BG);
}

function pageNum(n: number) {
  doc.fontSize(7).fillColor(MUTED).font("Helvetica")
    .text(`${n} / ${TOTAL}`, W - PAD - 24, H - 22, { width: 30, align: "right" });
}

function tag(text: string, x: number, y: number) {
  doc.fontSize(7).fillColor(ACCENT).font("Helvetica-Bold")
    .text(text.toUpperCase(), x, y, { characterSpacing: 2 });
}

function h1(text: string, x: number, y: number, w = W - PAD * 2) {
  doc.fontSize(26).fillColor(INK).font("Helvetica-Bold")
    .text(text, x, y, { width: w, lineGap: 3 });
}

function h2(text: string, x: number, y: number, w = W - PAD * 2) {
  doc.fontSize(13).fillColor(INK).font("Helvetica-Bold")
    .text(text, x, y, { width: w });
}

function body(text: string, x: number, y: number, w = W - PAD * 2) {
  doc.fontSize(9.5).fillColor(BODY).font("Helvetica")
    .text(text, x, y, { width: w, lineGap: 2 });
}

function caption(text: string, x: number, y: number, w = W - PAD * 2) {
  doc.fontSize(8).fillColor(MUTED).font("Helvetica")
    .text(text, x, y, { width: w, lineGap: 1.5 });
}

function rule(x: number, y: number, w = W - PAD * 2) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor(RULE).lineWidth(0.75).stroke();
}

function accentBar(x: number, y: number, w = 36) {
  doc.rect(x, y, w, 3).fill(ACCENT);
}

function card(x: number, y: number, w: number, h: number, tinted = false) {
  doc.rect(x, y, w, h).fill(tinted ? ACCENT_BG : LABEL_BG);
  doc.rect(x, y, w, h).stroke(RULE);
}

function bullet(x: number, y: number, text: string, color = BODY) {
  doc.rect(x + 2, y + 5, 4, 4).fill(ACCENT);
  doc.fontSize(9).fillColor(color).font("Helvetica")
    .text(text, x + 14, y, { width: W - PAD * 2 - 14, lineGap: 1.5 });
  return doc.y;
}

function numBullet(n: string, x: number, y: number, title: string, desc: string, cardW: number) {
  doc.fontSize(9).fillColor(ACCENT).font("Helvetica-Bold").text(n, x + 12, y + 12, { width: 20 });
  doc.fontSize(10).fillColor(INK).font("Helvetica-Bold").text(title, x + 36, y + 8, { width: cardW - 50 });
  doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(desc, x + 36, doc.y + 2, { width: cardW - 50, lineGap: 1.5 });
}

// ── SLIDE 1: COVER ────────────────────────────────────────────────────────────
doc.rect(0, 0, W, H).fill(BG);
doc.rect(0, 0, 6, H).fill(ACCENT);

doc.fontSize(8).fillColor(MUTED).font("Helvetica")
  .text("Investor Presentation  ·  2026", PAD + 10, 80, { characterSpacing: 1 });

doc.fontSize(48).fillColor(INK).font("Helvetica-Bold")
  .text("MarginMix", PAD + 10, 120);

accentBar(PAD + 10, 182, 48);

doc.fontSize(14).fillColor(BODY).font("Helvetica")
  .text("The Financial Reasoning Engine\nfor Professional Services", PAD + 10, 194, { lineGap: 4 });

doc.fontSize(10).fillColor(MUTED).font("Helvetica")
  .text("Pricing and margin risk decisions — made before delivery begins,\nwhere the cost of being wrong is highest.", PAD + 10, 252, { width: W - PAD * 2 - 10, lineGap: 3 });

rule(PAD + 10, 310, W - PAD * 2 - 10);

const stats = [
  { v: "Deterministic Engine", l: "No ML, no AI in verdict logic" },
  { v: "60-Second Assessment", l: "Instant margin risk verdict" },
  { v: "90% Gross Margin",      l: "Minimal COGS" },
];
stats.forEach((s, i) => {
  const x = PAD + 10 + i * 168;
  doc.fontSize(10).fillColor(INK).font("Helvetica-Bold").text(s.v, x, 324, { width: 158 });
  doc.fontSize(8).fillColor(MUTED).font("Helvetica").text(s.l, x, 338, { width: 158 });
});

pageNum(1);

// ── SLIDE 2: THE PROBLEM ──────────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(2);

tag("The Problem", PAD + 10, 60);
h1("Firms price work before\nthey understand how\nit will be delivered.", PAD + 10, 76);
accentBar(PAD + 10, 164, 36);

body("Professional services firms commit to price before they have clarity on delivery load. The gap between pricing and delivery reality is where margin is destroyed.", PAD + 10, 174, W - PAD * 2 - 120);

rule(PAD + 10, 222, W - PAD * 2 - 10);

const causes = [
  "Timesheets are inaccurate and lagging",
  "Historical data is noisy and backward-looking",
  "Complexity and coordination costs are underestimated",
  "AI adoption changes effort patterns — but ROI is unclear",
  "Judgment lives in senior operators' heads, not in systems",
];
let py = 234;
causes.forEach(c => {
  bullet(PAD + 10, py, c);
  py = doc.y + 7;
});

// Impact box
const bx = W - 190;
doc.rect(bx, 60, 138, 220).fill(LABEL_BG).stroke(RULE);
doc.fontSize(7).fillColor(ACCENT).font("Helvetica-Bold")
  .text("THE RESULT", bx + 12, 76, { characterSpacing: 1.5 });
doc.fontSize(22).fillColor(INK).font("Helvetica-Bold")
  .text("$300K–$1M", bx + 12, 96, { width: 114 });
doc.fontSize(8).fillColor(BODY).font("Helvetica")
  .text("margin destroyed per year from 1–2 mispriced engagements", bx + 12, 126, { width: 114, lineGap: 2 });

doc.moveTo(bx + 12, 168).lineTo(bx + 126, 168).strokeColor(RULE).lineWidth(0.75).stroke();

doc.fontSize(10).fillColor(INK).font("Helvetica-Bold")
  .text("Discovered\ntoo late", bx + 12, 178, { width: 114, lineGap: 3 });
doc.fontSize(8).fillColor(MUTED).font("Helvetica")
  .text("Erosion is only visible after damage is done", bx + 12, 210, { width: 114, lineGap: 2 });

rule(PAD + 10, py + 14, W - PAD * 2 - 10);
doc.fontSize(9).fillColor(ACCENT).font("Helvetica-Bold")
  .text("This is not a margin leakage problem. It is a pricing and commitment risk problem.", PAD + 10, py + 24, { width: W - PAD * 2 - 10 });

// ── SLIDE 3: THE SOLUTION ─────────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(3);

tag("The Solution", PAD + 10, 60);
h1("One question. One verdict.\nBefore commitment is locked.", PAD + 10, 76);
accentBar(PAD + 10, 148);

doc.fontSize(11).fillColor(ACCENT).font("Helvetica")
  .text('"Given how this engagement will actually be delivered, is the pricing economically viable?"', PAD + 10, 158, { width: W - PAD * 2 - 10, lineGap: 3 });

rule(PAD + 10, 202, W - PAD * 2 - 10);

const colW3 = (W - PAD * 2 - 22) / 2;

// Left: outputs
card(PAD + 10, 216, colW3, 230);
doc.fontSize(7).fillColor(ACCENT).font("Helvetica-Bold")
  .text("WHAT MARGINMIX OUTPUTS", PAD + 22, 228, { characterSpacing: 1.5 });
const outputs = [
  "Margin risk verdict (5-level classification)",
  "Structural risk drivers identified",
  "Effort bands — Senior / Mid / Execution",
  "Pricing & governance implications",
  "Decision memo at CXO / partner level",
  "Estimated margin erosion on stated margin",
];
let oy = 244;
outputs.forEach(o => {
  doc.rect(PAD + 22, oy + 4, 3, 3).fill(ACCENT);
  doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(o, PAD + 32, oy, { width: colW3 - 40, lineGap: 1 });
  oy = doc.y + 6;
});

// Right
const rx3 = PAD + 10 + colW3 + 12;
card(rx3, 216, colW3, 104);
doc.fontSize(7).fillColor(MUTED).font("Helvetica-Bold")
  .text("WHAT IT IS NOT", rx3 + 12, 228, { characterSpacing: 1.5 });
["Does not ingest timesheets or ERP data", "Does not model delivery performance", "Does not replace finance systems"].forEach((n, i) => {
  doc.fontSize(8.5).fillColor(MUTED).font("Helvetica").text(`— ${n}`, rx3 + 12, 244 + i * 18, { width: colW3 - 24 });
});

card(rx3, 332, colW3, 114, true);
doc.fontSize(7).fillColor(ACCENT).font("Helvetica-Bold")
  .text("THE ENGINE", rx3 + 12, 344, { characterSpacing: 1.5 });
doc.fontSize(8.5).fillColor(BODY).font("Helvetica")
  .text("Deterministic. Rule-based. No ML. No AI in verdict logic.\nEncodes expert judgment into a repeatable, auditable decision system. Identical inputs always produce an identical verdict.", rx3 + 12, 360, { width: colW3 - 24, lineGap: 2 });

// ── SLIDE 4: WHY NOW ──────────────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(4);

tag("Why Now", PAD + 10, 60);
h1("Four forces converging\nright now.", PAD + 10, 76);
accentBar(PAD + 10, 140);
caption("The window to define this category as a standard is 18–24 months.", PAD + 10, 150);

rule(PAD + 10, 172, W - PAD * 2 - 10);

const cw4 = (W - PAD * 2 - 22) / 2;
const reasons4 = [
  { n: "01", title: "AI is reshaping delivery economics", body: "Firms are adopting AI tools rapidly but have no framework to price AI-augmented work. The effort mix has changed. The pricing model hasn't." },
  { n: "02", title: "CFOs want predictive confidence", body: "Post-pandemic margin pressure means finance leaders demand forward-looking risk signals — not post-mortems built on lagging timesheet data." },
  { n: "03", title: "No system sits before commitment", body: "Every existing tool — ERP, PSA, BI — operates after delivery begins. The pre-commitment gap is entirely unaddressed. MarginMix owns that moment." },
  { n: "04", title: "The window is open — briefly", body: "AI-native firms will build this capability. The window to establish 'Margin Risk Clarity' as the category standard is 18–24 months." },
];

reasons4.forEach((r, i) => {
  const cx = PAD + 10 + (i % 2) * (cw4 + 12);
  const cy = 186 + Math.floor(i / 2) * 152;
  card(cx, cy, cw4, 140);
  numBullet(r.n, cx, cy, r.title, r.body, cw4);
});

// ── SLIDE 5: TARGET CUSTOMER ──────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(5);

tag("Target Customer", PAD + 10, 60);
h1("Phase 1 Wedge:\nMid-tier Professional Services", PAD + 10, 76);
accentBar(PAD + 10, 148);

rule(PAD + 10, 158, W - PAD * 2 - 10);

const cw5 = (W - PAD * 2 - 24) / 3;
const cards5 = [
  {
    label: "FIRM PROFILE",
    tinted: false,
    content: () => {
      doc.fontSize(22).fillColor(INK).font("Helvetica-Bold").text("200–2,000", PAD + 22, 194, { width: cw5 - 24 });
      doc.fontSize(8).fillColor(MUTED).font("Helvetica").text("employees", PAD + 22, 220, { width: cw5 - 24 });
      let by = 240;
      ["Mid-tier & independent agencies", "Consulting firms", "Digital transformation firms"].forEach(b => {
        doc.rect(PAD + 22, by + 4, 3, 3).fill(ACCENT);
        doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(b, PAD + 32, by, { width: cw5 - 40 });
        by = doc.y + 7;
      });
    },
  },
  {
    label: "KEY BUYERS",
    tinted: false,
    content: () => {
      const bx = PAD + 22 + cw5 + 12;
      [
        { title: "CFO", desc: "Owns margin accountability" },
        { title: "COO", desc: "Owns delivery risk" },
        { title: "Partner / MD", desc: "Owns deal commitment" },
      ].forEach((b, i) => {
        const by = 194 + i * 60;
        doc.fontSize(11).fillColor(INK).font("Helvetica-Bold").text(b.title, bx, by, { width: cw5 - 24 });
        doc.fontSize(8.5).fillColor(MUTED).font("Helvetica").text(b.desc, bx, by + 16, { width: cw5 - 24 });
        if (i < 2) doc.moveTo(bx, by + 42).lineTo(bx + cw5 - 24, by + 42).strokeColor(RULE).lineWidth(0.5).stroke();
      });
    },
  },
  {
    label: "WHY THESE FIRMS",
    tinted: true,
    content: () => {
      const bx = PAD + 22 + (cw5 + 12) * 2;
      let ly = 194;
      [
        "70–80 pricing decisions annually",
        "Cannot afford large consulting projects",
        "Lack internal decision systems",
        "Feel margin risk acutely",
        "High stakes per decision",
      ].forEach(item => {
        doc.fontSize(8).fillColor(ACCENT).font("Helvetica-Bold").text("→", bx, ly);
        doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(item, bx + 14, ly, { width: cw5 - 30 });
        ly = doc.y + 8;
      });
    },
  },
];

cards5.forEach((c, i) => {
  const cx = PAD + 10 + i * (cw5 + 12);
  card(cx, 172, cw5, 290, c.tinted);
  doc.fontSize(7).fillColor(c.tinted ? ACCENT : MUTED).font("Helvetica-Bold")
    .text(c.label, cx + 12, 180, { characterSpacing: 1.5 });
});
cards5.forEach(c => c.content());

// ── SLIDE 6: REVENUE MODEL ────────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(6);

tag("Revenue Model", PAD + 10, 60);
h1("Value-based. Decision-anchored.\nNot seat-based.", PAD + 10, 76);
accentBar(PAD + 10, 148);
caption("Pricing reflects the value of the decision being protected — not the number of users.", PAD + 10, 158);
rule(PAD + 10, 178, W - PAD * 2 - 10);

const cw6 = (W - PAD * 2 - 24) / 3;
const plans = [
  {
    label: "ENTRY / ASSESSMENT",
    price: "$89",
    unit: "per submission",
    items: ["Instant output", "No free trial", "Decision memo + PDF"],
    tinted: false,
  },
  {
    label: "SUBSCRIPTION",
    badge: "Phase 1 Core",
    price: "$1,250",
    unit: "/month  ·  ~$15K ACV",
    items: ["Unlimited submissions", "Portfolio-level views", "Deal desk workflows", "AI ROI simulation"],
    tinted: true,
  },
  {
    label: "PHASE 2 EXPANSION",
    price: "$2,100",
    unit: "/month  ·  ~$25K ACV",
    items: ["Everything in Phase 1", "Engineering / SI firms", "Full expansion tier"],
    tinted: false,
  },
];

plans.forEach((p, i) => {
  const cx = PAD + 10 + i * (cw6 + 12);
  card(cx, 192, cw6, 230, p.tinted);
  if (p.tinted) {
    doc.rect(cx, 192, cw6, 3).fill(ACCENT);
  }
  doc.fontSize(7).fillColor(p.tinted ? ACCENT : MUTED).font("Helvetica-Bold")
    .text(p.label, cx + 12, 204, { characterSpacing: 1.5 });
  doc.fontSize(26).fillColor(INK).font("Helvetica-Bold").text(p.price, cx + 12, 220, { width: cw6 - 24 });
  doc.fontSize(8).fillColor(MUTED).font("Helvetica").text(p.unit, cx + 12, 252, { width: cw6 - 24 });
  doc.moveTo(cx + 10, 270).lineTo(cx + cw6 - 10, 270).strokeColor(RULE).lineWidth(0.5).stroke();
  let iy = 280;
  p.items.forEach(item => {
    doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(`— ${item}`, cx + 12, iy, { width: cw6 - 24 });
    iy = doc.y + 5;
  });
});

doc.rect(PAD + 10, 440, W - PAD * 2 - 10, 34).fill(LABEL_BG).stroke(RULE);
doc.fontSize(8.5).fillColor(BODY).font("Helvetica")
  .text("Subscription launches after 300 paying assessment customers (target: within 6 months). Assessment-tier revenue funds this transition.", PAD + 22, 449, { width: W - PAD * 2 - 34 });

// ── SLIDE 7: MARKET OPPORTUNITY ───────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(7);

tag("Market Opportunity", PAD + 10, 60);
h1("Large, underserved, and\nstructured for expansion.", PAD + 10, 76);
accentBar(PAD + 10, 148);
rule(PAD + 10, 158, W - PAD * 2 - 10);

const cw7 = (W - PAD * 2 - 24) / 3;
const mkts = [
  { label: "TAM", value: "$600M–$1B", sub: "~40K firms globally (developed markets + Brazil, South Africa). Agencies, consulting, SIs, ITeS at 200+ employees. $15K–$25K ACV.", tinted: false },
  { label: "SAM  ·  Phase 1", value: "$213M", sub: "14,200 agencies & consulting firms across 13 core markets at $15K ACV. 2–3 year horizon.", tinted: false },
  { label: "SOM  ·  3 Years", value: "$7.5M ARR", sub: "500 firms in top 13 markets at $15K ACV. Establishes Margin Risk Clarity as the decision-support standard.", tinted: true },
];

mkts.forEach((m, i) => {
  const cx = PAD + 10 + i * (cw7 + 12);
  card(cx, 172, cw7, 170, m.tinted);
  if (m.tinted) doc.rect(cx, 172, cw7, 3).fill(ACCENT);
  doc.fontSize(7).fillColor(m.tinted ? ACCENT : MUTED).font("Helvetica-Bold")
    .text(m.label, cx + 12, 184, { characterSpacing: 1.5 });
  doc.fontSize(22).fillColor(INK).font("Helvetica-Bold").text(m.value, cx + 12, 200, { width: cw7 - 24 });
  doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(m.sub, cx + 12, 234, { width: cw7 - 24, lineGap: 2 });
});

// Phase 2 band
doc.rect(PAD + 10, 360, W - PAD * 2 - 10, 80).fill(LABEL_BG).stroke(RULE);
doc.fontSize(7).fillColor(ACCENT).font("Helvetica-Bold")
  .text("PHASE 2  ·  5–7 YEARS", PAD + 22, 372, { characterSpacing: 1.5 });
doc.fontSize(20).fillColor(INK).font("Helvetica-Bold").text("$25M ARR", PAD + 22, 388);
doc.fontSize(8.5).fillColor(BODY).font("Helvetica")
  .text("27,090 firms (adding Engineering / SIs) at $24K ACV. 2.5% of TAM capture.\nTransition to the 5-minute AI Deal Desk — from advisory product to essential operational guardrail.", PAD + 150, 376, { width: W - PAD * 2 - 170, lineGap: 2 });

// ── SLIDE 8: UNIT ECONOMICS ───────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(8);

tag("Unit Economics", PAD + 10, 60);
h1("High-margin decision product.\nNot services-heavy SaaS.", PAD + 10, 76);
accentBar(PAD + 10, 148);
caption("The cost structure is built for scale. The value proposition is built for retention.", PAD + 10, 158);
rule(PAD + 10, 178, W - PAD * 2 - 10);

const cw8 = (W - PAD * 2 - 24) / 3;
const metrics = [
  { label: "Gross Margin", value: "90%",       sub: "Minimal COGS — LLM narration + infra only" },
  { label: "Onboarding",   value: "$0",         sub: "No integrations. No implementation required" },
  { label: "ACV",          value: "~$15K",      sub: "Phase 1 subscription" },
  { label: "Decisions/yr", value: "70–80",      sub: "Per firm — episodic, high-stakes pricing events" },
  { label: "CAC",          value: "Low",        sub: "Founder-led sales in early stage" },
  { label: "Payback",      value: "< 1 deal",  sub: "One avoided bad engagement exceeds the annual fee" },
];

metrics.forEach((m, i) => {
  const cx = PAD + 10 + (i % 3) * (cw8 + 12);
  const cy = 192 + Math.floor(i / 3) * 110;
  card(cx, cy, cw8, 98, i === 0);
  doc.fontSize(22).fillColor(i === 0 ? ACCENT : INK).font("Helvetica-Bold").text(m.value, cx + 12, cy + 12, { width: cw8 - 24 });
  doc.fontSize(9.5).fillColor(INK).font("Helvetica-Bold").text(m.label, cx + 12, cy + 42, { width: cw8 - 24 });
  doc.fontSize(8).fillColor(MUTED).font("Helvetica").text(m.sub, cx + 12, cy + 58, { width: cw8 - 24, lineGap: 1.5 });
});

// ── SLIDE 9: WHY THIS SCALES ──────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(9);

tag("Why This Scales", PAD + 10, 60);
h1("Decision infrastructure\ncompounds. It doesn't erode.", PAD + 10, 76);
accentBar(PAD + 10, 148);
rule(PAD + 10, 158, W - PAD * 2 - 10);

const scale = [
  { n: "01", title: "Judgment is systemized", body: "Expert knowledge encoded once. Delivered infinitely. No per-client consulting required." },
  { n: "02", title: "AI amplifies speed, not logic", body: "GPT generates narratives only. The verdict logic is deterministic — auditable, repeatable, trustworthy." },
  { n: "03", title: "Same engine, every industry", body: "Agencies, consulting, SIs, ITeS. The Workforce Intensity Matrix applies universally across professional services." },
  { n: "04", title: "No integration overhead", body: "Zero ERP/PSA connections needed. Assessment runs on structured inputs alone — no IT project, no implementation risk." },
  { n: "05", title: "Decision infrastructure, not software", body: "Customers don't churn from decision infrastructure. Once embedded in the pricing process, switching cost is high." },
];

let sy = 172;
scale.forEach(s => {
  doc.rect(PAD + 10, sy, W - PAD * 2 - 10, 54).fill(LABEL_BG).stroke(RULE);
  doc.fontSize(9).fillColor(ACCENT).font("Helvetica-Bold").text(s.n, PAD + 22, sy + 10, { width: 24 });
  doc.fontSize(10).fillColor(INK).font("Helvetica-Bold").text(s.title, PAD + 52, sy + 8, { width: 200 });
  doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(s.body, PAD + 52, sy + 24, { width: W - PAD * 2 - 70, lineGap: 1.5 });
  sy += 64;
});

// ── SLIDE 10: FOUNDER ADVANTAGE ───────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(10);

tag("Founder Advantage", PAD + 10, 60);
h1("The insight can't be\nreverse-engineered without\nthe experience.", PAD + 10, 76);
accentBar(PAD + 10, 182);
caption("MarginMix exists because of a specific, hard-won operating perspective — one that took years of front-line pricing decisions to develop.", PAD + 10, 192, W - PAD * 2 - 100);

rule(PAD + 10, 230, W - PAD * 2 - 10);

const advantages = [
  "Deep operating experience across large, labor-intensive professional services organisations",
  "First-hand understanding of how pricing decisions are actually made at the senior level",
  "Ability to encode judgment that others treat as intuition — and make it repeatable",
  "Built the World's first Workforce Intensity Matrix — the proprietary framework powering the engine",
  "Category creator advantage: defined the problem space before the market named it",
];

let ay = 244;
advantages.forEach(a => {
  doc.rect(PAD + 10, ay + 5, 3, 3).fill(ACCENT);
  doc.fontSize(9.5).fillColor(BODY).font("Helvetica").text(a, PAD + 22, ay, { width: W - PAD * 2 - 22, lineGap: 1.5 });
  ay = doc.y + 12;
});

rule(PAD + 10, ay + 4, W - PAD * 2 - 10);
doc.fontSize(10).fillColor(ACCENT).font("Helvetica")
  .text('"MarginMix helps professional services firms price work with confidence by systematising margin risk decisions before delivery begins — where mistakes are most expensive."', PAD + 10, ay + 14, { width: W - PAD * 2 - 10, lineGap: 3 });

// ── SLIDE 11: THE OPPORTUNITY ──────────────────────────────────────────────────
newSlide();
doc.rect(0, 0, 6, H).fill(ACCENT);
pageNum(11);

tag("The Opportunity", PAD + 10, 60);
h1("A category-defining product\nat the right moment.", PAD + 10, 76);
accentBar(PAD + 10, 148);
caption("The pre-commitment margin risk window is open, unoccupied, and structurally important to every professional services firm.", PAD + 10, 158, W - PAD * 2 - 10);
rule(PAD + 10, 188, W - PAD * 2 - 10);

const milestones = [
  { phase: "0 – 6 months",  goal: "300 paying assessment customers", metric: "$89 × 300 = $26.7K MRR run-rate" },
  { phase: "6 – 18 months", goal: "Subscription launch + 50 firms",  metric: "$62.5K MRR  ·  $750K ARR" },
  { phase: "18 – 36 months",goal: "500 subscription firms",           metric: "$625K MRR  ·  $7.5M ARR" },
];

const cw11 = (W - PAD * 2 - 24) / 3;
milestones.forEach((m, i) => {
  const cx = PAD + 10 + i * (cw11 + 12);
  card(cx, 202, cw11, 100, i === 2);
  doc.rect(cx, 202, cw11, 3).fill(ACCENT);
  doc.fontSize(7).fillColor(ACCENT).font("Helvetica-Bold")
    .text(m.phase.toUpperCase(), cx + 12, 214, { characterSpacing: 1 });
  doc.fontSize(9.5).fillColor(INK).font("Helvetica-Bold").text(m.goal, cx + 12, 230, { width: cw11 - 24 });
  doc.fontSize(8.5).fillColor(MUTED).font("Helvetica").text(m.metric, cx + 12, 268, { width: cw11 - 24 });
});

const cw11b = (W - PAD * 2 - 22) / 2;
card(PAD + 10, 320, cw11b, 124);
doc.fontSize(7).fillColor(MUTED).font("Helvetica-Bold").text("USE OF FUNDS", PAD + 22, 332, { characterSpacing: 1.5 });
const funds = [
  ["Product & Engineering",   "40%"],
  ["GTM & Founder-led Sales", "35%"],
  ["Infrastructure & Ops",    "15%"],
  ["Reserve",                 "10%"],
];
funds.forEach(([label, pct], i) => {
  const fy = 350 + i * 20;
  doc.fontSize(8.5).fillColor(BODY).font("Helvetica").text(label, PAD + 22, fy, { width: cw11b - 80 });
  doc.fontSize(8.5).fillColor(INK).font("Helvetica-Bold").text(pct, PAD + 22 + cw11b - 80, fy, { width: 50, align: "right" });
  doc.moveTo(PAD + 22, fy + 14).lineTo(PAD + 10 + cw11b - 12, fy + 14).strokeColor(RULE).lineWidth(0.5).stroke();
});

const rx11 = PAD + 10 + cw11b + 12;
card(rx11, 320, cw11b, 124, true);
doc.rect(rx11, 320, cw11b, 3).fill(ACCENT);
doc.fontSize(7).fillColor(ACCENT).font("Helvetica-Bold").text("WHY MARGINMIX WINS", rx11 + 12, 332, { characterSpacing: 1.5 });
doc.fontSize(8.5).fillColor(BODY).font("Helvetica")
  .text("First mover. Proprietary framework. Deterministic engine. No integration cost. High gross margin. Founder with operating insight the market hasn't yet systemised.", rx11 + 12, 350, { width: cw11b - 24, lineGap: 2 });
doc.fontSize(9).fillColor(ACCENT).font("Helvetica-Bold").text("marginmix.ai", rx11 + 12, 418);

doc.end();
stream.on("finish", () => console.log(`✓ PDF saved: ${outputPath}`));
