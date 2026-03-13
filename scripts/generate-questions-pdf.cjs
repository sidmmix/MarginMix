const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const doc = new PDFDocument({ margin: 50, size: "A4" });
const outputPath = path.join(__dirname, "../assessment-questions.pdf");
doc.pipe(fs.createWriteStream(outputPath));

const EMERALD = "#065F46";
const DARK = "#111827";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";
const WHITE = "#FFFFFF";

// Header
doc.rect(0, 0, doc.page.width, 80).fill(EMERALD);
doc.fillColor(WHITE).fontSize(22).font("Helvetica-Bold")
  .text("MarginMix — Full Assessment Questions", 50, 25);
doc.fillColor(WHITE).fontSize(11).font("Helvetica")
  .text("Workforce Intensity Matrix · 23 Questions", 50, 52);
doc.moveDown(3);

const sections = [
  {
    name: "SECTION 1 — CONTACT & CONTEXT",
    questions: [
      { n: 1, title: "What's your full name?", type: "Text input", options: null, context: null },
      { n: 2, title: "What's your work email?", type: "Text input", options: null, context: null },
      { n: 3, title: "What's your role or title?", type: "Text input", options: null, context: null },
      { n: 4, title: "What's your organization name?", type: "Text input", options: null, context: null },
      {
        n: 5, title: "What's your organization size?", type: "Select",
        context: "Larger organizations create more coordination layers that consume margin.",
        options: ["50–500", "500–1000", "1000–1500", "1500–2000"]
      },
      {
        n: 6, title: "What decision are you evaluating with this assessment?", type: "Select",
        context: "The type of decision shapes how much pricing flexibility remains.",
        options: [
          "New client win / pitch acceptance",
          "Renewal / contract extension",
          "Scope expansion without repricing",
          "Escalation on a live account",
          "Strategic / leadership-driven exception",
          "Exploratory / no active decision"
        ]
      },
    ]
  },
  {
    name: "SECTION 2 — CLIENT ENGAGEMENT CONTEXT",
    questions: [
      {
        n: 7, title: "Specify Context", type: "Select",
        context: "Multi-client assessments carry compounding coordination risk.",
        options: ["Single client", "Group of clients - Org level"]
      },
      {
        n: 8, title: "How would you classify this engagement today?", type: "Select",
        context: "Engagement maturity affects how predictable the delivery effort will be.",
        options: [
          "New (pre-kickoff / onboarding phase)",
          "Ongoing (in delivery for less than 6 months)",
          "Ongoing (in delivery for 6–12 months)",
          "Ongoing (in delivery for 12+ months)",
          "Renewal / scope expansion of an existing engagement"
        ]
      },
      {
        n: 9, title: "What's the engagement type?", type: "Select",
        context: "Fixed-fee models absorb scope creep risk that retainers can pass through.",
        options: ["Commission", "Fixed Fees", "Retainer", "Outcome based", "Hybrid - Retainer + Commission", "Hybrid - Retainer + Outcome based"]
      },
      {
        n: 10, title: "How would you rate client volatility?", type: "Select",
        context: "Client stability directly impacts coordination cost and rework risk.",
        options: ["Low (stable stakeholders, clear expectations)", "Medium", "High (frequent changes, multiple decision-makers)"]
      },
      {
        n: 11, title: "What's the stakeholder complexity level?", type: "Select",
        context: "More stakeholders mean more alignment cycles and hidden decision drag.",
        options: ["Low", "Medium", "High"]
      },
    ]
  },
  {
    name: "SECTION 3 — PLANNED DELIVERY STRUCTURE",
    questions: [
      {
        n: 12, title: "What's the planned senior leadership involvement?", type: "Select",
        context: "Senior time is the most expensive resource — its draw shapes margin.",
        options: ["Minimal (oversight only)", "Periodic (key moments)", "Frequent (ongoing)", "Continuous (embedded)"]
      },
      {
        n: 13, title: "What's the mid-level oversight intensity?", type: "Select",
        context: "Mid-level oversight intensity reveals how much management tax the work carries.",
        options: ["Low", "Medium", "High"]
      },
      {
        n: 14, title: "What's the execution vs thinking mix?", type: "Select",
        context: "Thinking-heavy work is harder to scope, price, and delegate.",
        options: ["Execution-heavy", "Balanced", "Thinking-heavy"]
      },
    ]
  },
  {
    name: "SECTION 4 — DELIVERY DYNAMICS",
    questions: [
      {
        n: 15, title: "What's the expected or current iteration intensity?", type: "Select",
        context: "High iteration erodes margin through repeated cycles of rework and refinement.",
        options: ["Low", "Medium", "High"]
      },
      {
        n: 16, title: "What's the likelihood of scope change?", type: "Select",
        context: "Scope changes without repricing are the most common source of margin leak.",
        options: ["Low", "Medium", "High"]
      },
      {
        n: 17, title: "How much cross-functional coordination is required?", type: "Select",
        context: "Cross-team coordination creates invisible overhead that rarely gets priced in.",
        options: ["Low", "Medium", "High"]
      },
      {
        n: 18, title: "Where is AI primarily expected to substitute effort?", type: "Select",
        context: "The layer where AI replaces human effort determines whether it reduces cost or increases oversight burden.",
        options: ["Junior execution", "Mid-level production", "Senior thinking / review", "No clear substitution"]
      },
    ]
  },
  {
    name: "SECTION 5 — VALUE, LOAD & CONFIDENCE",
    questions: [
      {
        n: 19, title: "Value Saturation", type: "Select",
        context: "When adding people stops creating value, staffing becomes a cost center.",
        subtitle: "Compared to similar work, how much incremental value does adding more people create here?",
        options: ["Significant additional value", "Some additional value", "Minimal additional value", "No meaningful additional value"]
      },
      {
        n: 20, title: "Senior Oversight Load", type: "Select",
        context: "Disproportionate senior oversight signals structural delivery risk.",
        subtitle: "Compared to similar engagements, how much senior oversight does this require?",
        options: ["Less than usual", "About the same", "More than usual"]
      },
      {
        n: 21, title: "Coordination & Decision Drag", type: "Select",
        context: "Heavy coordination slows decisions and inflates the cost of every deliverable.",
        subtitle: "How much coordination is required across teams and stakeholders?",
        options: ["Minimal", "Moderate", "Heavy"]
      },
      {
        n: 22, title: "Delivery Confidence", type: "Select",
        context: "Low confidence often signals structural issues that pricing alone cannot fix.",
        subtitle: "How confident are you in the delivery model for this engagement? (executive gut-check)",
        options: ["High confidence", "Some concerns", "Low confidence"]
      },
    ]
  },
  {
    name: "SECTION 6 — OPEN SIGNAL",
    questions: [
      {
        n: 23, title: "Is there anything about this client engagement that feels risky or unusual?", type: "Text area (optional)",
        context: null, subtitle: "Share any concerns or observations",
        options: null
      },
    ]
  },
  {
    name: "MARGIN QUESTION (Pre-Assessment)",
    questions: [
      {
        n: null, title: "What is your current margin on this engagement? (%)", type: "Numeric input",
        context: "Used to calculate Estimated Loss % and Effective Margin % after verdict.",
        options: null
      },
    ]
  },
];

sections.forEach((section, si) => {
  // Section header
  doc.rect(50, doc.y, doc.page.width - 100, 24).fill(EMERALD);
  doc.fillColor(WHITE).fontSize(10).font("Helvetica-Bold")
    .text(section.name, 58, doc.y - 18);
  doc.moveDown(1.5);

  section.questions.forEach((q, qi) => {
    const yBefore = doc.y;

    // Check if we need a new page
    if (doc.y > doc.page.height - 160) {
      doc.addPage();
    }

    // Question number + title
    const numLabel = q.n ? `Q${q.n}` : "–";
    doc.fillColor(EMERALD).fontSize(9).font("Helvetica-Bold").text(numLabel, 50, doc.y, { continued: true });
    doc.fillColor(DARK).fontSize(11).font("Helvetica-Bold").text(`  ${q.title}`);

    // Subtitle
    if (q.subtitle) {
      doc.fillColor(GRAY).fontSize(9).font("Helvetica-Oblique")
        .text(q.subtitle, 50, doc.y, { indent: 0 });
    }

    // Context
    if (q.context) {
      doc.fillColor(GRAY).fontSize(9).font("Helvetica")
        .text(`Context: ${q.context}`, 50, doc.y);
    }

    // Type badge
    doc.fillColor("#6366F1").fontSize(8).font("Helvetica")
      .text(`Type: ${q.type}`, 50, doc.y);

    // Options
    if (q.options && q.options.length) {
      doc.moveDown(0.3);
      q.options.forEach((opt, oi) => {
        doc.fillColor(DARK).fontSize(9).font("Helvetica")
          .text(`  ${String.fromCharCode(9723)} ${opt}`, 60, doc.y);
      });
    }

    // Divider
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
    doc.moveDown(0.6);
  });

  doc.moveDown(0.5);
});

// Footer
doc.fontSize(8).fillColor(GRAY).font("Helvetica")
  .text(`MarginMix — Confidential · marginmix.ai · Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    50, doc.page.height - 40, { align: "center" });

doc.end();
console.log("PDF generated at:", outputPath);
