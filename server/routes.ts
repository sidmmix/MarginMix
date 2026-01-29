import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import OpenAI from "openai";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { setupOAuth } from "./oauth";
import { 
  insertCampaignBriefSchema,
  insertMarginAssessmentSchema
} from "@shared/schema";
import { scrapeBrandDNA, type BrandBrief } from "./dna-scraper";
import { sendAssessmentEmail } from "./resend";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Multer configuration for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Session configuration
const pgStore = connectPg(session);
const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: false,
  ttl: 2 * 60 * 60, // 2 hours - sessions expire quickly
  tableName: "sessions",
});

// Security: Enhanced authentication middleware with rate limiting
const authAttempts = new Map<string, { count: number; lastAttempt: number }>();

const requireAuth = (req: any, res: any, next: any) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Security: Rate limiting for authentication attempts
  const attempts = authAttempts.get(clientIP);
  if (attempts && attempts.count >= 10 && now - attempts.lastAttempt < 15 * 60 * 1000) {
    return res.status(429).json({ message: "Too many authentication attempts. Try again later." });
  }

  // Check for Passport.js authenticated user (OAuth flow) or session userId (legacy)
  if (req.user || req.session?.userId) {
    // Clear failed attempts on successful auth
    authAttempts.delete(clientIP);
    return next();
  }
  
  // Track failed authentication attempts
  if (attempts) {
    attempts.count++;
    attempts.lastAttempt = now;
  } else {
    authAttempts.set(clientIP, { count: 1, lastAttempt: now });
  }
  
  return res.status(401).json({ message: "Authentication required" });
};

export function registerRoutes(app: Express): Server {
  // Session middleware
  // Security: Fail fast if session secret is missing
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // Removed maxAge - sessions now expire when browser closes
      sameSite: 'strict' // CSRF protection
    },
  }));

  // Setup OAuth authentication
  setupOAuth(app);

  // OAuth-only authentication - no email/password routes



  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      // For OAuth users, req.user is already populated by Passport
      // For legacy session users, fetch from storage
      let user = (req as any).user;
      
      if (!user && (req.session as any)?.userId) {
        user = await storage.getUser((req.session as any).userId);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        isEmailVerified: user.isEmailVerified,
        consentGiven: user.consentGiven,
        marketingConsent: user.marketingConsent,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Legacy campaign brief routes removed - old questionnaire flow deprecated

  // Benchmark import endpoint - accepts Excel file
  app.post("/api/benchmarks/import", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Delete existing benchmarks before importing new data
      await storage.deleteAllBenchmarks();

      let importedCount = 0;
      const errors: string[] = [];

      // Process each row and generate embeddings
      for (let index = 0; index < data.length; index++) {
        try {
          const rowData = data[index] as any;
          
          // Validate required fields
          if (!rowData.Industry || !rowData.Platform || !rowData.Objective) {
            errors.push(`Row ${index + 2}: Missing required fields (Industry, Platform, or Objective)`);
            continue;
          }

          // Create text for embedding: combines industry, objective, targeting for semantic search
          const embeddingText = [
            rowData.Industry,
            rowData.Objective,
            rowData.Targeting || ''
          ].filter(Boolean).join(' - ');

          // Generate embedding using OpenAI
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-large",
            input: embeddingText,
            dimensions: 3072
          });

          const embedding = embeddingResponse.data[0].embedding;

          // Create benchmark record
          await storage.createBenchmark({
            industry: rowData.Industry,
            platform: rowData.Platform,
            objective: rowData.Objective,
            targeting: rowData.Targeting || null,
            cpm: rowData.CPM ? String(rowData.CPM) : null,
            cpa: rowData.CPA ? String(rowData.CPA) : null,
            geo: rowData.Geo || "India",
            embedding: embedding,
            metadata: {
              importDate: new Date().toISOString(),
              sourceFile: req.file.originalname
            }
          });

          importedCount++;
        } catch (rowError: any) {
          console.error(`Error processing row ${index + 2}:`, rowError);
          errors.push(`Row ${index + 2}: ${rowError.message}`);
        }
      }

      res.json({
        success: true,
        message: `Successfully imported ${importedCount} benchmarks`,
        importedCount,
        totalRows: data.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error("Error importing benchmarks:", error);
      res.status(500).json({ 
        message: "Error importing benchmarks", 
        error: error.message 
      });
    }
  });

  // Benchmark search endpoint - hybrid semantic + exact filters
  app.post("/api/benchmarks/search", async (req, res) => {
    try {
      const { query, platform, geo, limit } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query text is required" });
      }

      // Generate embedding for search query
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: query,
        dimensions: 3072
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Search with hybrid approach: semantic similarity + exact filters
      const results = await storage.searchBenchmarksByVector(
        queryEmbedding,
        {
          platform: platform || undefined,
          geo: geo || "India"
        },
        limit || 10
      );

      res.json({
        results,
        query,
        filters: { platform, geo },
        count: results.length
      });
    } catch (error: any) {
      console.error("Error searching benchmarks:", error);
      res.status(500).json({ 
        message: "Error searching benchmarks", 
        error: error.message 
      });
    }
  });

  // Get all benchmarks (for testing/admin)
  app.get("/api/benchmarks", requireAuth, async (req, res) => {
    try {
      const { platform, geo, industry } = req.query;
      const benchmarks = await storage.getBenchmarks({
        platform: platform as string,
        geo: geo as string,
        industry: industry as string
      });
      res.json(benchmarks);
    } catch (error) {
      console.error("Error fetching benchmarks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DNA Scraper endpoint - scrape website and generate Brand Brief
  app.post("/api/dna-scraper", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ 
          success: false,
          message: "URL is required",
          brief: null
        });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ 
          success: false,
          message: "Invalid URL format",
          brief: null
        });
      }

      console.log(`[API] DNA Scraper request for: ${url}`);
      
      // Scrape the website and generate Brand Brief
      const brandBrief = await scrapeBrandDNA(url);
      
      res.json({
        success: true,
        message: "Brand Brief generated successfully",
        brief: brandBrief
      });
      
    } catch (error: any) {
      console.error("DNA Scraper error:", error);
      res.status(500).json({ 
        success: false,
        message: "Error generating Brand Brief",
        error: error.message,
        brief: null
      });
    }
  });

  // Margin Risk Assessment endpoint
  app.post("/api/assessments", async (req, res) => {
    try {
      const validatedData = insertMarginAssessmentSchema.parse(req.body);
      const assessment = await storage.createMarginAssessment(validatedData);
      
      // Send email notification with assessment details
      try {
        await sendAssessmentEmail({
          fullName: validatedData.fullName,
          workEmail: validatedData.workEmail,
          roleTitle: validatedData.roleTitle,
          organisationName: validatedData.organisationName,
          organisationSize: validatedData.organisationSize,
          decisionEvaluating: validatedData.decisionEvaluating,
          engagementType: validatedData.engagementType,
          specifyContext: validatedData.specifyContext,
          engagementClassification: validatedData.engagementClassification,
          clientVolatility: validatedData.clientVolatility,
          stakeholderComplexity: validatedData.stakeholderComplexity,
          seniorLeadershipInvolvement: validatedData.seniorLeadershipInvolvement,
          midLevelOversight: validatedData.midLevelOversight,
          executionThinkingMix: validatedData.executionThinkingMix,
          iterationIntensity: validatedData.iterationIntensity,
          scopeChangeLikelihood: validatedData.scopeChangeLikelihood,
          crossFunctionalCoordination: validatedData.crossFunctionalCoordination,
          aiImpactMeasurement: validatedData.aiImpactMeasurement,
          marginalValueSaturation: validatedData.marginalValueSaturation,
          seniorOversightLoad: validatedData.seniorOversightLoad,
          coordinationDecisionDrag: validatedData.coordinationDecisionDrag,
          deliveryConfidence: validatedData.deliveryConfidence,
          openSignal: validatedData.openSignal,
          submittedAt: new Date()
        });
        console.log(`Assessment email sent for: ${validatedData.organisationName}`);
      } catch (emailError: any) {
        console.error("Failed to send assessment email:", emailError.message);
      }
      
      res.status(201).json({ 
        success: true, 
        message: "Assessment submitted successfully",
        assessmentId: assessment.id 
      });
    } catch (error: any) {
      console.error("Assessment submission error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to submit assessment" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}