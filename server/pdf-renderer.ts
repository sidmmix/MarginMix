import PDFDocument from "pdfkit";
import { DecisionObject } from "./decision-engine";
import { NarrativeOutput } from "./narrative-generator";
import path from "path";
import fs from "fs";

const COLORS = {
  primary: "#059669",
  secondary: "#0d9488",
  dark: "#1f2937",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  white: "#ffffff",
  riskLow: "#22c55e",
  riskModerate: "#eab308",
  riskHigh: "#f97316",
  riskVeryHigh: "#ef4444"
};

const LOGO_PATH = path.join(process.cwd(), "server", "assets", "marginmix-logo.png");

function getRiskColor(band: string): string {
  switch (band.toLowerCase()) {
    case "low": return COLORS.riskLow;
    case "moderate": return COLORS.riskModerate;
    case "high": return COLORS.riskHigh;
    case "very high": return COLORS.riskVeryHigh;
    default: return COLORS.riskModerate;
  }
}

function getDimensionColor(level: string): string {
  switch (level.toLowerCase()) {
    case "low": return COLORS.riskLow;
    case "medium": return COLORS.riskModerate;
    case "high": return COLORS.riskHigh;
    default: return COLORS.riskModerate;
  }
}

function addLogoToPage(doc: PDFKit.PDFDocument): void {
  const logoExists = fs.existsSync(LOGO_PATH);
  if (logoExists) {
    const pageWidth = doc.page.width;
    const logoWidth = 100;
    const logoX = pageWidth - 50 - logoWidth;
    const logoY = 20;
    doc.image(LOGO_PATH, logoX, logoY, { width: logoWidth });
  }
}

export async function renderDecisionMemoPDF(
  decision: DecisionObject,
  narrative: NarrativeOutput["decisionMemo"]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.on("pageAdded", () => {
      addLogoToPage(doc);
    });

    addLogoToPage(doc);

    doc.moveDown(3);

    doc.fontSize(24).fillColor(COLORS.primary).text("MarginMix – Decision Memo", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Decision Context");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray).text(narrative.decisionContext, { lineGap: 4 });
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    const riskColor = getRiskColor(decision.riskBand);
    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Margin Risk Verdict");
    doc.moveDown(0.5);
    doc.rect(50, doc.y, 495, 40).fillAndStroke(riskColor, riskColor);
    doc.fontSize(14).fillColor(COLORS.white).font("Helvetica-Bold").text(
      decision.marginRiskVerdict,
      60,
      doc.y - 35,
      { align: "center", width: 475 }
    );
    doc.y += 15;
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text(`Risk Band: ${decision.riskBand}  |  Composite Score: ${decision.compositeRiskScore}/100  |  Effort Band: ${decision.effortBand}`);
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray).text(narrative.marginRiskVerdict, { lineGap: 4 });

    if (decision.marginImpact) {
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor(COLORS.dark).font("Helvetica-Bold").text("Estimated Margin Impact: ", { continued: true });
      const memoLossColor = decision.marginImpact.impactColor === "emerald" ? COLORS.riskLow : decision.marginImpact.impactColor === "amber" ? COLORS.riskModerate : COLORS.riskVeryHigh;
      doc.font("Helvetica").fillColor(COLORS.gray).text(
        `${decision.marginImpact.currentMargin}% → ${decision.marginImpact.effectiveMargin}% (loss: ${decision.marginImpact.estimatedLoss > 0 ? `-${decision.marginImpact.estimatedLoss}%` : "0%"} — ${decision.marginImpact.impactLabel})`
      );
    }
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Primary Drivers of Risk");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray);
    narrative.primaryDriversOfRisk.forEach((driver) => {
      doc.text(`• ${driver}`, { lineGap: 3 });
    });
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Pricing & Governance Implications");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray).text(narrative.pricingGovernanceImplications, { lineGap: 4 });
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("What Would Need to Change");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray);
    narrative.whatWouldNeedToChange.forEach((change, index) => {
      doc.text(`${index + 1}. ${change}`, { lineGap: 3 });
    });
    doc.moveDown(1.5);

    // Force Recommendation section to start on page 2
    doc.addPage();

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Recommendation");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray).text(narrative.recommendation, { lineGap: 4 });

    doc.moveDown(2);
    doc.fontSize(8).fillColor(COLORS.gray).text(
      `Generated by MarginMix | Decision ID: ${decision.id} | ${new Date().toLocaleDateString()}`,
      { align: "center" }
    );

    doc.end();
  });
}

export async function renderAssessmentOutputPDF(
  decision: DecisionObject,
  narrative: NarrativeOutput["assessmentOutput"],
  openSignal: string | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.on("pageAdded", () => {
      addLogoToPage(doc);
    });

    addLogoToPage(doc);

    doc.moveDown(3);

    doc.fontSize(22).fillColor(COLORS.primary).text("MarginMix – Margin Risk Assessment Results", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Executive Snapshot");
    doc.moveDown(0.5);
    const riskColor = getRiskColor(decision.riskBand);
    doc.rect(50, doc.y, 495, 35).fillAndStroke(riskColor, riskColor);
    doc.fontSize(12).fillColor(COLORS.white).font("Helvetica-Bold").text(
      `${decision.riskBand.toUpperCase()} RISK – ${decision.marginRiskVerdict}`,
      60,
      doc.y - 30,
      { align: "center", width: 475 }
    );
    doc.y += 10;
    doc.moveDown(1);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray).text(narrative.executiveSnapshot, { lineGap: 4 });

    if (decision.compositeRiskScore !== undefined) {
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor(COLORS.dark).font("Helvetica-Bold").text(`Composite Risk Score: `, { continued: true });
      doc.font("Helvetica").fillColor(COLORS.gray).text(`${decision.compositeRiskScore}/100`);
    }
    doc.moveDown(1.5);

    if (decision.marginImpact) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
      doc.moveDown(1);

      doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Estimated Margin Impact");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray);
      doc.text(`Current Margin: ${decision.marginImpact.currentMargin}%`);
      const lossColor = decision.marginImpact.impactColor === "emerald" ? COLORS.riskLow : decision.marginImpact.impactColor === "amber" ? COLORS.riskModerate : COLORS.riskVeryHigh;
      doc.text(`Estimated Margin Erosion: `, { continued: true });
      doc.fillColor(lossColor).text(`${decision.marginImpact.estimatedLoss > 0 ? `-${decision.marginImpact.estimatedLoss}%` : "0%"}`);
      doc.fillColor(COLORS.gray).text(`Effective Margin: `, { continued: true });
      doc.fillColor(lossColor).text(`${decision.marginImpact.effectiveMargin}%`);
      doc.fillColor(COLORS.gray).text(`Impact Classification: ${decision.marginImpact.impactLabel}`);
      doc.moveDown(1.5);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Risk Dimension Summary");
    doc.moveDown(0.5);

    const dimensions = [
      { name: "Workforce Intensity", ...narrative.riskDimensionSummary.workforceIntensity },
      { name: "Coordination Entropy", ...narrative.riskDimensionSummary.coordinationEntropy },
      { name: "Commercial Exposure", ...narrative.riskDimensionSummary.commercialExposure },
      { name: "Volatility Control", ...narrative.riskDimensionSummary.volatilityControl }
    ];

    dimensions.forEach((dim) => {
      const dimColor = getDimensionColor(dim.level);
      doc.fontSize(11).fillColor(COLORS.dark).font("Helvetica-Bold").text(`${dim.name}: `, { continued: true });
      doc.fillColor(dimColor).text(dim.level);
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text(dim.description, { lineGap: 2 });
      doc.moveDown(0.6);
    });

    const confidenceLevel = decision.dimensions?.confidenceSignal || "neutral";
    const confidenceColor = getDimensionColor(confidenceLevel === "positive" ? "low" : confidenceLevel === "negative" ? "high" : "medium");
    doc.fontSize(11).fillColor(COLORS.dark).font("Helvetica-Bold").text("Confidence Signal: ", { continued: true });
    doc.fillColor(confidenceColor).text(confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1));
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text(
      confidenceLevel === "negative" ? "Confidence is low — structural issues may prevent safe delivery." :
      confidenceLevel === "positive" ? "Confidence is strong — delivery model assumptions are supported." :
      "Confidence is neutral — some concerns present but manageable.", { lineGap: 2 }
    );
    doc.moveDown(0.6);

    const measMaturityLevel = decision.dimensions?.measurementMaturity || "medium";
    const measColor = getDimensionColor(measMaturityLevel);
    doc.fontSize(11).fillColor(COLORS.dark).font("Helvetica-Bold").text("Measurement Maturity: ", { continued: true });
    doc.fillColor(measColor).text(measMaturityLevel.charAt(0).toUpperCase() + measMaturityLevel.slice(1));
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text(
      measMaturityLevel === "high" ? "Strong measurement capability — early warning systems and data quality support proactive risk management." :
      measMaturityLevel === "medium" ? "Moderate measurement capability — some metrics in place but gaps in early detection remain." :
      "Low measurement maturity — limited data quality and early warning capability increases blind spot risk.", { lineGap: 2 }
    );
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("AI Effort Shift");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray);
    doc.text(`Substitution Layer: ${decision.aiEffortShiftLabel || "Not specified"}`);
    const aiColor = getDimensionColor(decision.aiImpactClassification === "Accretive" ? "low" : decision.aiImpactClassification === "Neutral" ? "medium" : "high");
    doc.text("AI Impact Classification: ", { continued: true });
    doc.fillColor(aiColor).font("Helvetica-Bold").text(decision.aiImpactClassification);
    doc.font("Helvetica").fillColor(COLORS.gray).fontSize(10);
    if (decision.aiImpactClassification === "Accretive") {
      doc.text("AI is reducing cost at the junior execution layer — margin accretive.", { lineGap: 2 });
    } else if (decision.aiImpactClassification === "Neutral") {
      doc.text("AI is substituting mid-level effort — neutral impact on margins.", { lineGap: 2 });
    } else {
      doc.text("AI substitution at senior level or no clear path — oversight burden increases, margin dilutive.", { lineGap: 2 });
    }
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Effort Bands & Allocation");
    doc.moveDown(0.5);

    const effortBands = [
      { name: "Senior Leadership", ...narrative.effortBandsAllocation.senior },
      { name: "Mid-Level (Account / Program)", ...narrative.effortBandsAllocation.midLevel },
      { name: "Execution Layer", ...narrative.effortBandsAllocation.execution }
    ];

    effortBands.forEach((band) => {
      doc.fontSize(11).fillColor(COLORS.dark).font("Helvetica-Bold").text(`${band.name}: `, { continued: true });
      doc.fillColor(COLORS.secondary).text(band.percentage);
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text(band.rationale, { lineGap: 2 });
      doc.moveDown(0.6);
    });
    doc.moveDown(1);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    if (decision.dominantDrivers && decision.dominantDrivers.length > 0) {
      doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Primary Risk Drivers");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray);
      decision.dominantDrivers.forEach((driver) => {
        doc.text(`• ${driver}`, { lineGap: 3 });
      });
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
      doc.moveDown(1);
    }

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Structural Risk Signals");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray);
    narrative.structuralRiskSignals.forEach((signal) => {
      doc.text(`• ${signal}`, { lineGap: 3 });
    });
    doc.moveDown(0.8);

    doc.fontSize(11).fillColor(COLORS.dark).font("Helvetica-Bold").text("Saturation Indicators");
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray);
    doc.text(`Value Saturation Present: ${decision.saturationDetails?.valueSaturationPresent ? "Yes" : "No"}`);
    doc.text(`Optics-Driven Staffing: ${decision.saturationDetails?.opticsDrivenStaffing ? "Yes" : "No"}`);
    doc.text(`Upward Cost Shift: ${decision.saturationDetails?.upwardCostShift ? "Yes" : "No"}`);
    doc.moveDown(0.5);

    doc.fontSize(10).fillColor(COLORS.dark).font("Helvetica-Bold").text("Risk Source: ", { continued: true });
    doc.font("Helvetica").fillColor(COLORS.gray).text(decision.riskSource || "Structural");
    doc.fontSize(10).fillColor(COLORS.dark).font("Helvetica-Bold").text("Correctability: ", { continued: true });
    doc.font("Helvetica").fillColor(COLORS.gray).text(decision.correctability || "Correctable");
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    if (decision.contradictionFlags && decision.contradictionFlags.length > 0) {
      doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Contradiction Flags");
      doc.moveDown(0.5);
      doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray);
      decision.contradictionFlags.forEach((flag) => {
        const severityLabel = flag.severity === "warning" ? "[Warning]" : "[Info]";
        doc.text(`${severityLabel} ${flag.description}`, { lineGap: 3 });
      });
      doc.moveDown(1);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
      doc.moveDown(1);
    }

    doc.fontSize(14).fillColor(COLORS.dark).font("Helvetica-Bold").text("Override Conditions");
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(11).fillColor(COLORS.gray).text(narrative.overrideConditions, { lineGap: 4 });
    doc.moveDown(1.5);

    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.lightGray).stroke();
    doc.moveDown(1);

    doc.fontSize(12).fillColor(COLORS.secondary).font("Helvetica-Bold").text("What This Assessment Measures");
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text(
      "Structural margin risk before commitment. This analysis evaluates workforce intensity, coordination complexity, commercial exposure, AI effort impact, and confidence signals to predict margin erosion risk.",
      { lineGap: 3 }
    );
    doc.moveDown(1);

    doc.fontSize(12).fillColor(COLORS.secondary).font("Helvetica-Bold").text("What This Assessment Does Not Measure");
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.gray).text(
      "Delivery performance, timesheet accuracy, or post-engagement execution quality. This is a pre-commitment structural assessment only.",
      { lineGap: 3 }
    );

    doc.moveDown(2);
    doc.fontSize(8).fillColor(COLORS.gray).text(
      `Generated by MarginMix | Decision ID: ${decision.id} | ${new Date().toLocaleDateString()}`,
      { align: "center" }
    );

    doc.end();
  });
}

export function generatePDFFilename(
  type: "decision_memo" | "assessment_output" | "assessment_results",
  fullName: string,
  organisationName: string
): string {
  const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  const name = sanitize(fullName);
  const org = sanitize(organisationName);
  const timestamp = Date.now();
  
  if (type === "decision_memo") {
    return `MMIX_Decision_Memo_${name}_${org}_${timestamp}.pdf`;
  }
  return `MMIX_Assessment_Results_${name}_${org}_${timestamp}.pdf`;
}
