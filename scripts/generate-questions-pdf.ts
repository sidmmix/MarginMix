import PDFDocument from "pdfkit";
import * as fs from "fs";

const questions = [
  {
    section: "A. Contact Information",
    questions: [
      { num: 1, label: "Full Name", type: "text" },
      { num: 2, label: "Work Email", type: "text" },
      { num: 3, label: "Role / Title", type: "text" },
      { num: 4, label: "Organization Name", type: "text" },
      { num: 5, label: "Organization Size", type: "select", options: ["200–500", "500–1,000", "1,000–1,500", "1,500–2,000"] },
    ]
  },
  {
    section: "B. Engagement Context",
    questions: [
      { num: 6, label: "What decision are you evaluating with this assessment?", type: "select", options: [
        "New client win / pitch acceptance",
        "Renewal / contract extension",
        "Scope expansion without repricing",
        "Escalation on a live account",
        "Strategic / leadership-driven exception",
        "Exploratory / no active decision"
      ]},
      { num: 7, label: "Specify Context", type: "select", options: ["Single client", "Group of clients - Org level"] },
      { num: 8, label: "How would you classify this engagement today?", type: "select", options: [
        "New (pre-kickoff / onboarding phase)",
        "Ongoing (in delivery for less than 6 months)",
        "Ongoing (in delivery for 6–12 months)",
        "Ongoing (in delivery for 12+ months)",
        "Renewal / scope expansion of an existing engagement"
      ]},
      { num: 9, label: "Engagement Type", type: "select", options: ["Fixed fee", "Retainer", "Hybrid"] },
      { num: 10, label: "Client Volatility", type: "select", options: [
        "Low (stable stakeholders, clear expectations)",
        "Medium",
        "High (frequent changes, multiple decision-makers)"
      ]},
      { num: 11, label: "Stakeholder Complexity", type: "select", options: ["Low", "Medium", "High"] },
    ]
  },
  {
    section: "C. Workforce Intensity",
    questions: [
      { num: 12, label: "Planned Senior Leadership Involvement", type: "select", options: [
        "Minimal (oversight only)",
        "Periodic (key moments)",
        "Frequent (ongoing)",
        "Continuous (embedded)"
      ]},
      { num: 13, label: "Mid-Level Oversight Intensity", type: "select", options: ["Low", "Medium", "High"] },
      { num: 14, label: "Execution vs Thinking Mix", type: "select", options: ["Execution-heavy", "Balanced", "Thinking-heavy"] },
    ]
  },
  {
    section: "D. Coordination & Scope Risk",
    questions: [
      { num: 15, label: "Expected Iteration Intensity", type: "select", options: ["Low", "Medium", "High"] },
      { num: 16, label: "Likelihood of Scope Change", type: "select", options: ["Low", "Medium", "High"] },
      { num: 17, label: "Cross-Functional Coordination Required", type: "select", options: ["Low", "Medium", "High"] },
      { num: 18, label: "Are you measuring the Impact of AI in your Client Delivery?", type: "select", options: ["Yes", "No", "Not Applicable"] },
    ]
  },
  {
    section: "E. Commercial & Value Signals",
    questions: [
      { num: 19, label: "Value Saturation", description: "How much additional value can still be extracted from this engagement?", type: "select", options: [
        "Significant additional value",
        "Some additional value",
        "Minimal additional value",
        "No meaningful additional value"
      ]},
      { num: 20, label: "Senior Oversight Load", description: "Compared to similar engagements, how much senior oversight does this require?", type: "select", options: [
        "Less than usual",
        "About the same",
        "More than usual"
      ]},
      { num: 21, label: "Coordination & Decision Drag", description: "How much coordination is required across teams and stakeholders?", type: "select", options: [
        "Minimal",
        "Moderate",
        "Heavy"
      ]},
      { num: 22, label: "Delivery Confidence (executive gut-check)", description: "How confident are you in the delivery model for this engagement?", type: "select", options: [
        "High confidence",
        "Some concerns",
        "Low confidence"
      ]},
    ]
  },
  {
    section: "F. Open Signal (Optional)",
    questions: [
      { num: 23, label: "Is there anything about this particular client engagement that feels risky or unusual?", type: "textarea", description: "Free-text response for additional context" },
    ]
  }
];

interface Question {
  num: number;
  label: string;
  type: string;
  options?: string[];
  description?: string;
}

const doc = new PDFDocument({ margin: 50, size: "A4" });
const output = fs.createWriteStream("MarginMix_Assessment_Questions.pdf");
doc.pipe(output);

doc.fontSize(24).fillColor("#059669").text("MarginMix Assessment Questions", { align: "center" });
doc.moveDown(0.5);
doc.fontSize(12).fillColor("#6b7280").text("Complete Question & Option Reference", { align: "center" });
doc.moveDown(1.5);

doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").stroke();
doc.moveDown(1);

for (const section of questions) {
  doc.fontSize(14).fillColor("#059669").font("Helvetica-Bold").text(section.section);
  doc.moveDown(0.5);
  
  for (const q of section.questions as Question[]) {
    doc.fontSize(11).fillColor("#1f2937").font("Helvetica-Bold").text(`Q${q.num}. ${q.label}`);
    
    if (q.description) {
      doc.fontSize(9).fillColor("#6b7280").font("Helvetica-Oblique").text(q.description);
    }
    
    doc.fontSize(10).fillColor("#6b7280").font("Helvetica");
    if (q.type === "text") {
      doc.text("Type: Text input");
    } else if (q.type === "textarea") {
      doc.text("Type: Free-text area");
    } else if (q.type === "select" && q.options) {
      doc.text("Options:");
      for (const opt of q.options) {
        doc.text(`  • ${opt}`);
      }
    }
    doc.moveDown(0.8);
  }
  
  doc.moveDown(0.5);
}

doc.moveDown(1);
doc.fontSize(8).fillColor("#9ca3af").text(
  `Generated by MarginMix | ${new Date().toLocaleDateString()}`,
  { align: "center" }
);

doc.end();

output.on("finish", () => {
  console.log("PDF generated: MarginMix_Assessment_Questions.pdf");
  const stats = fs.statSync("MarginMix_Assessment_Questions.pdf");
  console.log(`File size: ${stats.size} bytes`);
});
