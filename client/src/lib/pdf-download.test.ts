import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { prepareAssessmentDownloads, releaseAssessmentDownloads, downloadPdf } from "./pdf-download";

const bytes = Buffer.from("%PDF-1.4\nDownload regression fixture\n%%EOF");
const pdfs = {
  decisionMemo: { filename: "decision-memo.pdf", data: bytes.toString("base64") },
  assessmentOutput: { filename: "assessment-results.pdf", data: bytes.toString("base64") },
};

test("both PDF links serve the original bytes with PDF MIME type and filenames", async () => {
  const files = prepareAssessmentDownloads(pdfs);
  try {
    assert.notEqual(files.decisionMemo.url, files.assessmentOutput.url);
    for (const key of ["assessmentOutput", "decisionMemo"] as const) {
      assert.ok(files[key].url.startsWith("blob:"));
      assert.equal(files[key].filename, pdfs[key].filename);
      const response = await fetch(files[key].url);
      assert.equal(response.headers.get("content-type"), "application/pdf");
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
    }
  } finally {
    releaseAssessmentDownloads(files);
  }
  await assert.rejects(fetch(files.assessmentOutput.url));
});

test("missing or invalid PDFs fail explicitly and release any already-created link", () => {
  const revoke = mock.method(URL, "revokeObjectURL");
  try {
    assert.throws(() => prepareAssessmentDownloads(undefined), /Missing PDF/);
    assert.throws(() => prepareAssessmentDownloads({ decisionMemo: pdfs.decisionMemo }), /missing/);
    assert.equal(revoke.mock.calls.length, 1);
    assert.throws(() => prepareAssessmentDownloads({
      ...pdfs, assessmentOutput: { filename: "broken.pdf", data: btoa("Not a PDF") },
    }), /invalid/);
    assert.equal(revoke.mock.calls.length, 2);
  } finally {
    revoke.mock.restore();
  }
});

test("download clicks a real file link synchronously, without timers or data URLs", () => {
  const calls: string[] = [];
  const link = {
    href: "", download: "",
    click() { calls.push("click"); },
    remove() { calls.push("remove"); },
  };
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => link,
      body: { appendChild: () => calls.push("append") },
    },
  });
  try {
    downloadPdf({ filename: "results.pdf", url: "blob:test-download" });
    assert.equal(link.href, "blob:test-download");
    assert.equal(link.download, "results.pdf");
    assert.deepEqual(calls, ["append", "click", "remove"]);
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
