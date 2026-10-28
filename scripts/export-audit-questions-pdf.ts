import { createWriteStream } from "node:fs";
import { resolve } from "node:path";
import PDFDocument from "pdfkit";
import { auditQuestions, auditSections, type AuditQuestion } from "../shared/audit-questionnaire";

const outputPath = resolve(process.cwd(), "MarginMix_Audit_Questions.pdf");
const pageMargins = { top: 52, bottom: 54, left: 48, right: 48 };
const green = "#246d5e";
const ink = "#253d37";
const muted = "#65766d";
const rule = "#dce6e0";
const contentWidth = 595.28 - pageMargins.left - pageMargins.right;

function responseType(question: AuditQuestion): string {
  if (question.type === "single") return "Select one";
  if (question.type === "multi") return "Select all that apply";
  if (question.type === "table") return "Complete a table";
  if (question.type === "textarea") return "Written response";
  if (question.type === "email") return "Email address";
  if (question.type === "number") return "Number";
  return "Short response";
}

function addQuestion(doc: PDFKit.PDFDocument, question: AuditQuestion, number: number): void {
  const questionLabel = `Q${number}. ${question.title}`;
  const titleHeight = doc.font("Helvetica-Bold").fontSize(10.5).heightOfString(questionLabel, { width: contentWidth });
  const descriptionHeight = question.description
    ? doc.font("Helvetica").fontSize(8.5).heightOfString(question.description, { width: contentWidth })
    : 0;
  const detailCount = (question.options?.length || 0) + (question.columns?.length || 0);
  const estimate = titleHeight + descriptionHeight + Math.max(24, detailCount * 12) + 34;
  if (doc.y + estimate > doc.page.height - pageMargins.bottom) doc.addPage();

  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(ink).text(questionLabel, { width: contentWidth });
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(7.5).fillColor(green)
    .text(`${responseType(question)}  ·  ${question.required === false ? "Optional" : "Required"}${question.allowUnknown ? "  ·  Unknown allowed" : ""}`);
  if (question.description) {
    doc.moveDown(0.2).font("Helvetica").fontSize(8.5).fillColor(muted)
      .text(question.description, { width: contentWidth, lineGap: 1.5 });
  }

  if (question.options?.length) {
    doc.moveDown(0.25).font("Helvetica").fontSize(8.5).fillColor(ink);
    question.options.forEach((option) => {
      doc.text(`[ ] ${option.label}`, { width: contentWidth - 8, indent: 8, lineGap: 1 });
    });
  }

  if (question.columns?.length) {
    doc.moveDown(0.25).font("Helvetica-Bold").fontSize(8).fillColor(ink)
      .text("Table fields", { width: contentWidth });
    doc.moveDown(0.1).font("Helvetica").fontSize(8.25).fillColor(ink);
    question.columns.forEach((column) => {
      doc.text(`• ${column.label}${column.type === "number" ? " (number)" : column.type === "date" ? " (date)" : ""}`, {
        width: contentWidth - 8,
        indent: 8,
        lineGap: 1,
      });
    });
  }

  doc.moveDown(0.75);
  doc.strokeColor(rule).lineWidth(0.6).moveTo(pageMargins.left, doc.y).lineTo(doc.page.width - pageMargins.right, doc.y).stroke();
  doc.moveDown(0.55);
}

async function main(): Promise<void> {
  const doc = new PDFDocument({
    size: "A4",
    margins: pageMargins,
    bufferPages: true,
    info: {
      Title: "MarginMix Agency Audit Questions",
      Author: "MarginMix",
      Subject: "Complete blank question bank for the agency audit intake questionnaire",
    },
  });
  const output = createWriteStream(outputPath);
  doc.pipe(output);

  doc.font("Helvetica-Bold").fontSize(22).fillColor(green).text("MarginMix");
  doc.moveDown(0.25).fontSize(17).fillColor(ink).text("Agency Audit Questions");
  doc.moveDown(0.3).font("Helvetica").fontSize(9).fillColor(muted)
    .text("Complete question bank · Blank questionnaire reference", { width: contentWidth });
  doc.moveDown(0.7).fontSize(9).fillColor(ink)
    .text("This document lists every question in the audit intake, including conditional questions for different service types, commercial models and engagement stages. Some questions appear in the online form only when earlier answers make them relevant.", {
      width: contentWidth,
      lineGap: 2,
    });
  doc.moveDown(0.45).fontSize(8).fillColor(muted)
    .text(`${auditQuestions.length} questions across ${auditSections.length} sections`, { width: contentWidth });
  doc.moveDown(1);

  let questionNumber = 0;
  for (const section of auditSections) {
    const questions = auditQuestions.filter((question) => question.section === section.id);
    if (!questions.length) continue;
    if (doc.y + 58 > doc.page.height - pageMargins.bottom) doc.addPage();
    doc.font("Helvetica-Bold").fontSize(13).fillColor(green).text(section.title, { width: contentWidth });
    doc.moveDown(0.2).font("Helvetica").fontSize(8.5).fillColor(muted)
      .text(section.description, { width: contentWidth });
    doc.moveDown(0.65);
    for (const question of questions) {
      questionNumber += 1;
      addQuestion(doc, question, questionNumber);
    }
  }

  const pageRange = doc.bufferedPageRange();
  for (let page = pageRange.start; page < pageRange.start + pageRange.count; page++) {
    doc.switchToPage(page);
    doc.font("Helvetica").fontSize(7.5).fillColor(muted)
      .text(`MarginMix · Agency Audit Questions · Page ${page + 1} of ${pageRange.count}`, pageMargins.left, doc.page.height - 32, {
        width: contentWidth,
        lineBreak: false,
      });
  }
  doc.end();
  await new Promise<void>((resolvePromise, rejectPromise) => {
    output.on("finish", resolvePromise);
    output.on("error", rejectPromise);
  });
  console.log(`Created ${outputPath} with ${auditQuestions.length} questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
