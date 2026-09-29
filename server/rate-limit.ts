import type { RequestHandler } from "express";

// Limits expensive public endpoints without requiring a new infrastructure service.
// Apply both per-client and aggregate caps so a shared proxy IP cannot bypass the
// overall safety limit. A distributed deployment should use a shared store instead.
export function publicRateLimit(limit: number, windowMs: number, globalLimit: number): RequestHandler {
  const attempts = new Map<string, { count: number; expiresAt: number }>();
  let lastCleanup = Date.now();

  return (req, res, next) => {
    const now = Date.now();
    if (now - lastCleanup > windowMs) {
      attempts.forEach((entry, key) => {
        if (entry.expiresAt <= now) attempts.delete(key);
      });
      lastCleanup = now;
    }

    const client = req.ip || req.socket.remoteAddress || "unknown";
    for (const [key, cap] of [["global", globalLimit], [`client:${client}`, limit]] as const) {
      let entry = attempts.get(key);
      if (!entry || entry.expiresAt <= now) {
        entry = { count: 0, expiresAt: now + windowMs };
        attempts.set(key, entry);
      }
      if (entry.count >= cap) {
        res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))));
        return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
      }
    }

    attempts.get(`client:${client}`)!.count++;
    attempts.get("global")!.count++;
    next();
  };
}