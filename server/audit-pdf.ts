import PDFDocument from "pdfkit";
import { auditSections, getAnswerStatus, getVisibleQuestions, type AuditAnswers, type AuditQuestion } from "../shared/audit-questionnaire";

function displayAnswer(question: AuditQuestion, value: AuditAnswers[string] | undefined): string[] {
  if (value === "__unknown__") return ["Unknown — information not yet available."];
  if (value === undefined) return ["Not provided."];
  if (question.type === "table" && Array.isArray(value)) {
    return (value as Record<string, string>[]).flatMap((row, index) => [
      `Row ${index + 1}`,
      ...(question.columns || []).map((column) => `${column.label}: ${row[column.key] || "Not provided"}`),
      "",
    ]);
  }
  if (Array.isArray(value)) return (value as string[]).map((item) => question.options?.find((o) => o.value === item)?.label || item);
  return [question.options?.find((o) => o.value === value)?.label || String(value)];
}

/** Complete, paginated response copy, not a financial assessment or forecast. */
export function renderAuditResponsesPDF(input: { id: string; submittedAt: string; answers: AuditAnswers }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const date = new Date(input.submittedAt);
    const doc = new PDFDocument({
      size: "A4", margins: { top: 54, bottom: 55, left: 48, right: 48 }, bufferPages: true,
      // Fixed creation date also keeps retry attachments byte-identical for Resend idempotency.
      info: { Title: "MarginMix — Questionnaire Responses", Author: "MarginMix", CreationDate: date, ModDate: date },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    const width = doc.page.width - 96;
    const ensureSpace = (height: number) => {
      if (doc.y + height > doc.page.height - 65) doc.addPage();
    };
    doc.font("Helvetica-Bold").fontSize(23).fillColor("#246d5e").text("MarginMix");
    doc.moveDown(0.25).fontSize(17).fillColor("#253d37").text("Questionnaire Responses");
    doc.moveDown(0.8).font("Helvetica").fontSize(9).fillColor("#65766d");
    doc.text(`Reference: ${input.id}`);
    doc.text(`Submitted: ${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}`);
    doc.moveDown().text("Confidential agency intake. This document records the responses supplied; it is not a margin forecast or risk assessment.", { width });
    const questions = getVisibleQuestions(input.answers);
    for (const section of auditSections) {
      const relevant = questions.filter((q) => q.section === section.id);
      if (!relevant.length) continue;
      ensureSpace(95);
      doc.moveDown(1).font("Helvetica-Bold").fontSize(13).fillColor("#246d5e").text(section.title);
      doc.moveDown(0.4);
      for (const question of relevant) {
        ensureSpace(72);
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#253d37").text(question.title, { width });
        if (!question.contact) {
          const status = getAnswerStatus(question, input.answers[question.id]);
          doc.font("Helvetica").fontSize(8).fillColor("#65766d").text(`Response status: ${status}`);
        }
        doc.moveDown(0.25).font("Helvetica").fontSize(9).fillColor("#33473f");
        for (const line of displayAnswer(question, input.answers[question.id])) {
          // PDFKit wraps long cells and answers across pages instead of truncating them.
          doc.text(line, { width, lineGap: 2 });
        }
        doc.moveDown(0.8);
      }
    }
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page++) {
      doc.switchToPage(page);
      doc.font("Helvetica").fontSize(8).fillColor("#7b877f")
        .text(`MarginMix · Confidential · Page ${page + 1} of ${range.count}`, 48, doc.page.height - 35, { width, lineBreak: false });
    }
    doc.end();
  });
}
