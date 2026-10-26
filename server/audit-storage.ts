import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { auditSubmissions } from "../shared/schema";
import type { SaveAuditSubmission, DeliverAuditSubmission } from "./audit-intake";
import { renderAuditResponsesPDF } from "./audit-pdf";
import { sendAuditQuestionnaireEmail } from "./resend";

let tableReady: Promise<unknown> | undefined;

/** Additive, idempotent provisioning for the existing custom PostgreSQL database.
 * No existing tables or assessment records are modified.
 * Also allows the new route to work on publishing without a destructive schema push.
 */
function ensureAuditTable() {
  if (!tableReady) {
    tableReady = (async () => {
      await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_submissions (
        id varchar(100) PRIMARY KEY,
        version integer NOT NULL DEFAULT 1,
        answers jsonb NOT NULL,
        payload_hash varchar(64) NOT NULL,
        submitted_at timestamp with time zone NOT NULL DEFAULT now(),
        email_sent_at timestamp with time zone,
        email_id varchar(100)
      )
    `);
      await db.execute(sql`ALTER TABLE audit_submissions
        ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone,
        ADD COLUMN IF NOT EXISTS email_id varchar(100)`);
    })().catch((error) => {
      tableReady = undefined;
      throw error;
    });
  }
  return tableReady;
}

export const saveAuditSubmission: SaveAuditSubmission = async ({ id, answers, payloadHash }) => {
  await ensureAuditTable();
  const inserted = await db.insert(auditSubmissions).values({ id, answers, payloadHash })
    .onConflictDoNothing({ target: auditSubmissions.id }).returning();
  const row = inserted[0] ?? (await db.select().from(auditSubmissions).where(eq(auditSubmissions.id, id)).limit(1))[0];
  if (!row) throw new Error("Audit submission was not persisted");
  return { id: row.id, submittedAt: row.submittedAt.toISOString(), payloadHash: row.payloadHash, emailSentAt: row.emailSentAt?.toISOString() ?? null };
};

export const deliverAuditSubmission: DeliverAuditSubmission = async (submission) => {
  if (submission.emailSentAt) return;
  const pdf = await renderAuditResponsesPDF(submission);
  const emailId = await sendAuditQuestionnaireEmail({
    id: submission.id, name: String(submission.answers.name), email: String(submission.answers.email), pdf,
  });
  await db.update(auditSubmissions).set({ emailId, emailSentAt: new Date() }).where(eq(auditSubmissions.id, submission.id));
};
