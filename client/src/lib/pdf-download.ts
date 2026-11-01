export interface PdfDownload {
  filename: string;
  url: string;
}

export interface AssessmentDownloads {
  decisionMemo: PdfDownload;
  assessmentOutput: PdfDownload;
}

/** Prepare real file URLs once, so manual links retain the user's click gesture. */
export function prepareAssessmentDownloads(value: unknown): AssessmentDownloads {
  const urls: string[] = [];
  try {
    if (!value || typeof value !== "object") throw new Error("Missing PDF reports.");
    const reports = value as Record<string, unknown>;
    const prepare = (key: string): PdfDownload => {
      const report = reports[key] as { filename?: unknown; data?: unknown } | undefined;
      if (!report || typeof report.filename !== "string" || !report.filename.trim() ||
          typeof report.data !== "string" || !report.data) {
        throw new Error("A PDF report is missing. Please submit again.");
      }
      const decoded = atob(report.data);
      if (!decoded.startsWith("%PDF-")) throw new Error("The PDF report is invalid. Please submit again.");
      const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes.buffer], { type: "application/pdf" }));
      urls.push(url);
      return { filename: report.filename, url };
    };
    return { decisionMemo: prepare("decisionMemo"), assessmentOutput: prepare("assessmentOutput") };
  } catch (error) {
    urls.forEach((url) => URL.revokeObjectURL(url));
    throw error;
  }
}

export function releaseAssessmentDownloads(files: AssessmentDownloads): void {
  URL.revokeObjectURL(files.decisionMemo.url);
  URL.revokeObjectURL(files.assessmentOutput.url);
}

export function downloadPdf(file: PdfDownload): void {
  const link = document.createElement("a");
  link.href = file.url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
