import type { Express, RequestHandler } from "express";
import { createHash } from "node:crypto";
import { z } from "zod/v4";
import { getApplicableAnswers, getVisibleQuestions, validateAuditAnswer, type AuditAnswers } from "../shared/audit-questionnaire";
import { publicRateLimit } from "./rate-limit";

const answerSchema = z.union([
  z.string().max(12000),
  z.array(z.string().max(2000)).max(30),
  z.array(z.record(z.string().max(80), z.string().max(2000))).max(100),
]);
const intakeSchema = z.object({
  version: z.literal(1),
  submissionId: z.string().min(10).max(100).regex(/^[a-zA-Z0-9-]+$/),
  answers: z.record(z.string().max(80), answerSchema),
}).strict();

export interface StoredAuditSubmission {
  id: string;
  submittedAt: string;
  payloadHash: string;
  emailSentAt?: string | null;
}
export type SaveAuditSubmission = (input: {
  id: string;
  answers: AuditAnswers;
  payloadHash: string;
}) => Promise<StoredAuditSubmission>;
export type DeliverAuditSubmission = (input: StoredAuditSubmission & { answers: AuditAnswers }) => Promise<void>;

export function createAuditSubmissionHandler(save: SaveAuditSubmission, deliver: DeliverAuditSubmission): RequestHandler {
  return async (req, res) => {
    // Bound this endpoint below the application's general JSON body limit.
    if (Buffer.byteLength(JSON.stringify(req.body ?? {})) > 512_000) {
      res.status(413).json({ message: "This intake is too large. Shorten long answers or reduce table rows." });
      return;
    }
    const parsed = intakeSchema.safeParse(req.body);
    if (!parsed.success || Object.keys(parsed.data.answers).length > 120) {
      res.status(400).json({ message: "Invalid audit submission. Review your answers and try again." });
      return;
    }
    const answers = getApplicableAnswers(parsed.data.answers as AuditAnswers);
    const questions = getVisibleQuestions(answers);
    for (const question of questions) {
      const error = validateAuditAnswer(question, answers[question.id]);
      if (error) {
        res.status(400).json({ message: `${question.title} ${error}`, questionId: question.id });
        return;
      }
    }
    // Stable order (including table cell keys) makes retries independent of JSON key order.
    const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
      : value !== null && typeof value === "object"
        ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
        : value;
    const payloadHash = createHash("sha256").update(JSON.stringify(canonical(answers))).digest("hex");
    let persisted = false;
    try {
      const saved = await save({ id: parsed.data.submissionId, answers, payloadHash });
      persisted = true;
      if (saved.payloadHash !== payloadHash) {
        res.status(409).json({ message: "This reference already contains different answers. Edit an answer to start a new submission, then retry." });
        return;
      }
      await deliver({ ...saved, answers });
      res.status(201).json({ id: saved.id, submittedAt: saved.submittedAt });
    } catch {
      // Never log contact details or agency financial data.
      console.error(`[audit-intake] ${persisted ? "Email delivery was not confirmed" : "Could not persist submission"}`);
      res.status(503).json({ message: persisted
        ? "Your responses are saved, but we could not confirm the PDF email. Please retry submission; your answers will not be duplicated."
        : "We could not save your intake. Your draft is still available; please retry." });
    }
  };
}

export function registerAuditRoutes(app: Express, save: SaveAuditSubmission, deliver: DeliverAuditSubmission) {
  app.post("/api/audit-submissions", publicRateLimit(10, 15 * 60_000, 150), createAuditSubmissionHandler(save, deliver));
}
