import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

// Validate required environment variables at startup
const REQUIRED_ENV_VARS = ["NEON_DATABASE_URL"] as const;
const WARNED_ENV_VARS = ["OPENAI_API_KEY", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const;

for (const v of REQUIRED_ENV_VARS) {
  if (!process.env[v]) {
    throw new Error(`Missing required environment variable: ${v}`);
  }
}
for (const v of WARNED_ENV_VARS) {
  if (!process.env[v]) {
    console.warn(`[startup] Warning: ${v} is not set — related features will be unavailable`);
  }
}

const app = express();
// The app is served behind Replit's reverse proxy. Use the closest forwarded
// client address for per-client limits; global limits still cap spoofed traffic.
app.set("trust proxy", 1);

// Health check — must be first, before all middleware, so it responds instantly
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Must be mounted before body parsers because the proxy streams raw bytes.
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
const allowedOrigins = process.env.NODE_ENV === "production"
  ? ["https://marginmix.ai", "https://www.marginmix.ai"]
  : ["http://localhost:5000", "http://127.0.0.1:5000"];
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// Security: Add request size limits to prevent DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Security: Add CORS and security headers
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Cache control for static assets (hashed files get long cache, HTML gets no cache)
  if (req.path.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (req.path.match(/\.(js|css|woff2?|ttf|eot|ico|svg|png|jpg|jpeg|gif|webp)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    console.error("Unhandled request error:", err);
    if (!res.headersSent) {
      res.status(status).json({ message: status >= 500 ? "Internal Server Error" : err.message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
