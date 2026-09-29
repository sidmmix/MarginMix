import assert from "node:assert/strict";
import test from "node:test";
import { generateFeedbackToken, verifyFeedbackToken } from "./feedback-token";
import { publicRateLimit } from "./rate-limit";

test("feedback links are signed, bound to identity, and expire", () => {
  const secret = "test-only-signing-secret";
  const timestamp = 1_700_000_000_000;
  const token = generateFeedbackToken(
    { assessmentId: 123, name: "Example", email: "example@example.com", timestamp },
    secret,
  );
  assert.deepEqual(
    verifyFeedbackToken(token, { secret, now: timestamp + 1000 }),
    { assessmentId: 123, name: "Example", email: "example@example.com", timestamp },
  );
  assert.equal(verifyFeedbackToken(token, { secret: "different-secret", now: timestamp + 1000 }), null);
  assert.equal(verifyFeedbackToken(token + "tampered", { secret, now: timestamp + 1000 }), null);
  assert.equal(verifyFeedbackToken(token, { secret, now: timestamp + 31 * 24 * 60 * 60_000 }), null);
});

test("public endpoint limits requests and returns a retry hint", () => {
  const limit = publicRateLimit(2, 60_000, 10);
  const headers: Record<string, string> = {};
  let status = 200;
  let body: any;
  let allowed = 0;
  const req = { ip: "198.51.100.1" };
  const res = {
    setHeader: (name: string, value: string) => { headers[name.toLowerCase()] = value; },
    status: (value: number) => { status = value; return res; },
    json: (value: unknown) => { body = value; return res; },
  };

  for (let i = 0; i < 3; i++) {
    limit(req as any, res as any, () => { allowed++; });
  }
  assert.equal(allowed, 2);
  assert.equal(status, 429);
  assert.ok(Number(headers["retry-after"]) > 0);
  assert.equal(body.success, false);
});