import { createHmac, timingSafeEqual } from 'node:crypto';

export interface FeedbackTokenPayload {
  assessmentId: number;
  name: string;
  email: string;
  timestamp: number;
}

export interface VerifyFeedbackTokenOptions {
  secret?: string;
  now?: number;
  maxAgeMs?: number;
}

export const FEEDBACK_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(secret?: string): string {
  const resolved = secret ?? process.env.SESSION_SECRET;
  if (!resolved) {
    throw new Error('SESSION_SECRET is required to generate or verify feedback tokens');
  }
  return resolved;
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function generateFeedbackToken(
  input: Omit<FeedbackTokenPayload, 'timestamp'> & { timestamp?: number },
  secret?: string
): string {
  const payload: FeedbackTokenPayload = {
    assessmentId: input.assessmentId,
    name: input.name,
    email: input.email,
    timestamp: input.timestamp ?? Date.now(),
  };
  if (!Number.isSafeInteger(payload.assessmentId) || payload.assessmentId < 0) {
    throw new Error('Feedback token assessmentId must be a non-negative safe integer');
  }
  if (!Number.isFinite(payload.timestamp) || payload.timestamp < 0) {
    throw new Error('Feedback token timestamp must be a non-negative number');
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload, getSecret(secret))}`;
}

export function verifyFeedbackToken(
  token: string,
  options: VerifyFeedbackTokenOptions = {}
): FeedbackTokenPayload | null {
  const secret = getSecret(options.secret);
  const [encodedPayload, suppliedSignature, extra] = token.split('.');
  if (!encodedPayload || !suppliedSignature || extra !== undefined) return null;

  const expectedSignature = sign(encodedPayload, secret);
  const supplied = Buffer.from(suppliedSignature, 'base64url');
  const expected = Buffer.from(expectedSignature, 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload: unknown = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (
      !payload ||
      typeof payload !== 'object' ||
      !Number.isSafeInteger((payload as FeedbackTokenPayload).assessmentId) ||
      (payload as FeedbackTokenPayload).assessmentId < 0 ||
      typeof (payload as FeedbackTokenPayload).name !== 'string' ||
      typeof (payload as FeedbackTokenPayload).email !== 'string' ||
      !Number.isFinite((payload as FeedbackTokenPayload).timestamp) ||
      (payload as FeedbackTokenPayload).timestamp < 0
    ) {
      return null;
    }

    const verifiedPayload = payload as FeedbackTokenPayload;
    const now = options.now ?? Date.now();
    if (verifiedPayload.timestamp > now) return null;
    if (now - verifiedPayload.timestamp > (options.maxAgeMs ?? FEEDBACK_TOKEN_TTL_MS)) return null;
    return verifiedPayload;
  } catch {
    return null;
  }
}