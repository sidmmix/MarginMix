import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuditSubmissionHandler, type SaveAuditSubmission, type DeliverAuditSubmission } from "./audit-intake";
import { renderAuditResponsesPDF } from "./audit-pdf";
import { buildAuditQuestionnaireEmail } from "./audit-email";
import {
  auditQuestions, getVisibleQuestions, getApplicableAnswers, getAnswerStatus, validateAuditAnswer,
  type AuditAnswers,
} from "../shared/audit-questionnaire";

function completeAnswers(overrides: AuditAnswers = {}): AuditAnswers {
  const answers: AuditAnswers = {
    name: "Test Person", email: "audit-test@example.invalid", agency: "Intake Test Agency",
    services: ["marketing"], models: ["fixed"], lifecycle: "new", reviewers: ["not-yet"],
    ...overrides,
  };
  for (const q of getVisibleQuestions(answers)) {
    if (answers[q.id] === undefined) answers[q.id] = "__unknown__";
  }
  return answers;
}
async function invoke(body: unknown, save: SaveAuditSubmission, deliver: DeliverAuditSubmission = async () => {}) {
  let status = 200;
  let response: any;
  await createAuditSubmissionHandler(save, deliver)({ body } as any, {
    status(code: number) { status = code; return this; },
    json(value: unknown) { response = value; return this; },
  } as any, (() => {}) as any);
  return { status, response };
}
const stored: SaveAuditSubmission = async ({ id, payloadHash }) => ({ id, payloadHash, submittedAt: "2026-10-26T00:00:00.000Z" });

test("contacts are first, unique and excluded from noncontact map", () => {
  assert.deepEqual(auditQuestions.slice(0, 3).map((q) => q.id), ["name", "email", "agency"]);
  assert.equal(auditQuestions.filter((q) => q.contact).length, 3);
  assert.equal(new Set(auditQuestions.map((q) => q.id)).size, auditQuestions.length);
});
test("commercial model branches, hybrid and service overlays cover every supported family", () => {
  const mapping = { commission: "commissionRates", fixed: "fixedFees", retainer: "retainerTerms", tm: "tmRates", outcome: "outcomeFormula", saas: "saasRevenue" };
  for (const [model, question] of Object.entries(mapping)) {
    const visible = getVisibleQuestions({ models: [model] }).map((q) => q.id);
    assert.ok(visible.includes(question));
    assert.ok(!visible.includes("hybridAllocation"));
    for (const [other, otherQuestion] of Object.entries(mapping)) {
      if (other !== model) assert.ok(!visible.includes(otherQuestion));
    }
  }
  const all = getVisibleQuestions({
    models: Object.keys(mapping), services: ["marketing", "consulting", "ites", "software", "implementation", "managed"],
    aiUse: "yes", lifecycle: "renewal", marginDefinition: "operating",
  }).map((q) => q.id);
  for (const id of ["hybridAllocation", "managedDemand", "implementation", "sectorMarketing", "sectorConsulting", "actuals", "renewal", "aiEvidence", "overhead"]) assert.ok(all.includes(id), id);
});
test("lifecycle branches and stale answers are filtered", () => {
  const answers = completeAnswers({ lifecycle: "new", models: ["retainer"], fixedFees: [{ fee: "999" }], actuals: "__unknown__" });
  const visible = getVisibleQuestions(answers);
  assert.ok(!visible.some((q) => q.id === "actuals" || q.id === "fixedFees"));
  const applicable = getApplicableAnswers(answers);
  assert.ok(!("actuals" in applicable));
  assert.ok(!("fixedFees" in applicable));
  assert.ok(getVisibleQuestions({ lifecycle: "recovery" }).some((q) => q.id === "recovery"));
  assert.ok(getVisibleQuestions({ lifecycle: "strategic" }).some((q) => q.id === "strategic"));
});
test("validates unknown, email, reviewer conflict, numeric tables and evidence states", () => {
  const question = (id: string) => auditQuestions.find((q) => q.id === id)!;
  assert.ok(validateAuditAnswer(question("email"), "bad"));
  assert.ok(validateAuditAnswer(question("name"), "__unknown__"));
  assert.equal(validateAuditAnswer(question("targetMargin"), "-5"), null);
  assert.ok(validateAuditAnswer(question("targetMargin"), "101"));
  assert.ok(validateAuditAnswer(question("reviewers"), ["finance", "not-yet"]));
  assert.equal(getAnswerStatus(question("scope"), []), "unanswered");
  assert.equal(getAnswerStatus(question("scope"), "__unknown__"), "unknown");
  const row = { role: "Delivery", location: "Remote", hours: "20", cost: "50", source: "Internal", basis: "estimated" };
  assert.equal(getAnswerStatus(question("staffing"), [row]), "estimated");
  assert.equal(validateAuditAnswer(question("staffing"), [row]), null);
  assert.ok(validateAuditAnswer(question("staffing"), [{ ...row, hours: "-1" }]));
  assert.ok(validateAuditAnswer(question("staffing"), [{ ...row, cost: "NaN" }]));
  assert.ok(validateAuditAnswer(question("staffing"), [{ ...row, role: "" }]));
});
test("accepts a valid intake, returns only receipt and excludes hidden data", async () => {
  const answers = completeAnswers({ fixedFees: "__unknown__", saasUsage: "stale hidden data" });
  let savedAnswers: AuditAnswers = {};
  const result = await invoke({ version: 1, submissionId: "test-intake-001", answers }, async (input) => {
    savedAnswers = input.answers;
    return stored(input);
  });
  assert.equal(result.status, 201);
  assert.deepEqual(Object.keys(result.response).sort(), ["id", "submittedAt"]);
  assert.ok(!("saasUsage" in savedAnswers));
});
test("rejects incomplete or malformed submissions before storage", async () => {
  let saves = 0;
  const save: SaveAuditSubmission = async (input) => { saves++; return stored(input); };
  const invalid = completeAnswers({ email: "invalid" });
  assert.equal((await invoke({ version: 1, submissionId: "test-intake-002", answers: invalid }, save)).status, 400);
  assert.equal((await invoke({ version: 1, submissionId: "test-intake-002", answers: {} }, save)).status, 400);
  assert.equal((await invoke({ version: 1, submissionId: "test-intake-002", answers: { ...invalid, scope: [{ bad: 123 }] } }, save)).status, 400);
  assert.equal((await invoke({ version: 2, submissionId: "test-intake-002", answers: invalid }, save)).status, 400);
  assert.equal(saves, 0);
});
test("stable retries return one receipt and changed payloads conflict", async () => {
  const rows = new Map<string, Awaited<ReturnType<SaveAuditSubmission>>>();
  const save: SaveAuditSubmission = async (input) => {
    if (!rows.has(input.id)) rows.set(input.id, await stored(input));
    return rows.get(input.id)!;
  };
  const body = { version: 1, submissionId: "test-intake-003", answers: completeAnswers() };
  assert.equal((await invoke(body, save)).status, 201);
  const reordered = { ...body, answers: Object.fromEntries(Object.entries(body.answers).reverse()) };
  assert.equal((await invoke(reordered, save)).status, 201);
  assert.equal(rows.size, 1);
  assert.equal((await invoke({ ...body, answers: { ...body.answers, name: "Different Person" } }, save)).status, 409);
});
test("reports storage failures rather than false success", async () => {
  const result = await invoke({ version: 1, submissionId: "test-intake-004", answers: completeAnswers() }, async () => { throw new Error("unavailable"); });
  assert.equal(result.status, 503);
  assert.match(result.response.message, /could not save/i);
});

test("generates an actual, deterministic PDF and the exact email for respondent and Sid", async () => {
  const answers = completeAnswers();
  const input = { id: "pdf-test-reference", submittedAt: "2026-10-26T01:00:00.000Z", answers };
  const pdf = await renderAuditResponsesPDF(input);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.ok(pdf.length > 3000);
  assert.deepEqual(await renderAuditResponsesPDF(input), pdf, "retry attachments must be byte-identical");
  const email = buildAuditQuestionnaireEmail({ id: input.id, name: String(answers.name), email: String(answers.email), pdf });
  assert.deepEqual(email.to, ["audit-test@example.invalid"]);
  assert.deepEqual(email.bcc, ["sid@dilexicon.com"]);
  assert.equal(email.text, "Dear Test Person\n\nThank you for filling the questionnaire, we will be in touch with you. Please find your responses attached.\n\nRegards\nSid");
  assert.equal(email.attachments[0].content, pdf);
  assert.match(email.attachments[0].filename, /\.pdf$/);
  const escaped = buildAuditQuestionnaireEmail({ id: input.id, name: "<script>bad</script>", email: "sid@dilexicon.com", pdf });
  assert.ok(!escaped.html.includes("<script>"));
  assert.equal(escaped.bcc, undefined, "Sid should not receive two copies when he is the respondent");
});

test("email errors retain the saved intake and permit retry instead of reporting success", async () => {
  const body = { version: 1, submissionId: "test-intake-mail", answers: completeAnswers() };
  const failed = await invoke(body, stored, async () => { throw new Error("Provider unavailable"); });
  assert.equal(failed.status, 503);
  assert.match(failed.response.message, /responses are saved/);
  let delivered = 0;
  const successful = await invoke(body, stored, async (submission) => {
    assert.equal(submission.answers.name, "Test Person");
    delivered++;
  });
  assert.equal(successful.status, 201);
  assert.equal(delivered, 1);
});
