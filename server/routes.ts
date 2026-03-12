import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import OpenAI from "openai";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupOAuth } from "./oauth";
import { 
  insertCampaignBriefSchema,
  insertMarginAssessmentSchema
} from "@shared/schema";

import { scrapeBrandDNA, type BrandBrief } from "./dna-scraper";
import { sendAssessmentEmail, sendFeedbackNotificationEmail, PDFAttachment } from "./resend";
import { executeDecisionEngine, DecisionObject } from "./decision-engine";
import { generateNarrative } from "./narrative-generator";
import { renderDecisionMemoPDF, renderAssessmentOutputPDF, generatePDFFilename } from "./pdf-renderer";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-09-30.clover" });
const STRIPE_PRICE_ID = "price_1TA0pJ6bE2gY9hpWcNUokblM";

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

  // Track processed feedback to prevent duplicates
  const processedFeedback = new Set<string>();

  // Feedback response endpoint - handles Yes/No clicks from feedback email
  app.get("/api/feedback", async (req, res) => {
    try {
      const { response, name, email, token } = req.query;
      
      if (!response || !name || !email) {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
          <head><title>Invalid Request</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc2626;">Invalid Request</h1>
            <p>Missing required parameters.</p>
          </body>
          </html>
        `);
      }
      
      const feedbackResponse = response === 'yes' ? 'yes' : 'no';
      const fullName = decodeURIComponent(name as string);
      const userEmail = decodeURIComponent(email as string);
      
      // Create unique key to prevent duplicate processing
      const feedbackKey = `${userEmail}:${token || Date.now()}`;
      
      // Only send notification if not already processed
      if (!processedFeedback.has(feedbackKey)) {
        processedFeedback.add(feedbackKey);
        
        // Send notification email to Sid
        try {
          await sendFeedbackNotificationEmail(fullName, userEmail, feedbackResponse);
          console.log(`Feedback notification sent: ${feedbackResponse} from ${fullName} (${userEmail})`);
        } catch (notifyError: any) {
          console.error("Failed to send feedback notification:", notifyError.message);
        }
      } else {
        console.log(`Duplicate feedback ignored for: ${userEmail}`);
      }
      
      // Return a thank you page
      const responseMessage = feedbackResponse === 'yes' 
        ? "Thank you for your interest! We'll be in touch soon with more details."
        : "Thank you for your feedback. We appreciate your honesty!";
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Thank You - MarginMix</title>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f9fafb;">
          <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">MarginMix</h1>
              <p style="color: #d1fae5; margin: 5px 0 0 0; font-style: italic;">Margin Risk Clarity</p>
            </div>
            <h2 style="color: #059669; margin-bottom: 20px;">Thank You!</h2>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">${responseMessage}</p>
            <p style="color: #6b7280; margin-top: 30px; font-size: 14px;">
              Regards,<br>
              <strong>Siddhartha</strong><br>
              Founder, MarginMix
            </p>
          </div>
        </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Feedback endpoint error:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #dc2626;">Something went wrong</h1>
          <p>Please try again later.</p>
        </body>
        </html>
      `);
    }
  });

  // Margin Risk Assessment endpoint
  app.post("/api/assessments", async (req, res) => {
    try {
      const validatedData = insertMarginAssessmentSchema.parse(req.body);
      const assessment = await storage.createMarginAssessment(validatedData);
      
      // Execute the deterministic decision engine
      const decisionObject = executeDecisionEngine({
        fullName: validatedData.fullName,
        workEmail: validatedData.workEmail,
        roleTitle: validatedData.roleTitle,
        organisationName: validatedData.organisationName,
        organisationSize: validatedData.organisationSize,
        decisionType: validatedData.decisionEvaluating || "exploratory",
        specifyContext: validatedData.specifyContext || "single-client",
        engagementType: validatedData.engagementType,
        engagementClassification: validatedData.engagementClassification || "new",
        clientVolatility: validatedData.clientVolatility,
        stakeholderComplexity: validatedData.stakeholderComplexity,
        seniorLeadershipInvolvement: validatedData.seniorLeadershipInvolvement,
        midLevelOversight: validatedData.midLevelOversight,
        executionThinkingMix: validatedData.executionThinkingMix,
        iterationIntensity: validatedData.iterationIntensity,
        scopeChangeLikelihood: validatedData.scopeChangeLikelihood,
        crossFunctionalCoordination: validatedData.crossFunctionalCoordination,
        aiEffortShift: validatedData.aiEffortShift || "no_clear_substitution",
        marginalValueSaturation: validatedData.marginalValueSaturation || "significant",
        seniorOversightLoad: validatedData.seniorOversightLoad || "about_same",
        coordinationDecisionDrag: validatedData.coordinationDecisionDrag || "moderate",
        deliveryConfidence: validatedData.deliveryConfidence || "high",
        openSignal: validatedData.openSignal ?? undefined,
        currentMargin: req.body.currentMargin ? parseFloat(req.body.currentMargin) : undefined
      });
      
      console.log(`Decision Engine executed for ${validatedData.organisationName}:`, {
        verdict: decisionObject.marginRiskVerdict,
        riskBand: decisionObject.riskBand,
        compositeScore: decisionObject.compositeRiskScore
      });
      
      const openSignal = validatedData.openSignal || null;
      
      // Generate narrative using GPT-4.1 (narrative only, no score recalculation)
      let narrative;
      try {
        narrative = await generateNarrative(decisionObject, openSignal);
        console.log(`Narrative generated for: ${validatedData.organisationName}`);
      } catch (narrativeError: any) {
        console.error("Failed to generate narrative:", narrativeError.message);
        // Use fallback narrative if GPT fails
        narrative = {
          decisionMemo: {
            decisionContext: `${decisionObject.engagementContext.type} engagement for ${decisionObject.engagementContext.organisationName}, classified as ${decisionObject.engagementContext.classification}. Pricing structure: ${decisionObject.engagementContext.decisionType}.`,
            marginRiskVerdict: `This engagement has been classified as ${decisionObject.marginRiskVerdict} with a ${decisionObject.riskBand} risk band based on the assessment inputs.`,
            primaryDriversOfRisk: decisionObject.dominantDrivers.length > 0
              ? decisionObject.dominantDrivers.map(d => `${d} contributes to structural margin pressure`)
              : ["No significant risk drivers identified"],
            pricingGovernanceImplications: `${decisionObject.riskBand} risk band requires ${decisionObject.riskBand === "Low" ? "standard" : "enhanced"} pricing review and governance oversight.`,
            whatWouldNeedToChange: decisionObject.marginRiskVerdict === "Structurally Safe"
              ? ["Current conditions support proceeding as planned"]
              : ["Reduce workforce intensity through scope refinement", "Strengthen coordination governance structures"],
            recommendation: `Proceed with appropriate governance controls for a ${decisionObject.riskBand.toLowerCase()} risk engagement.`
          },
          assessmentOutput: {
            executiveSnapshot: `${decisionObject.marginRiskVerdict}. This assessment identifies ${decisionObject.riskBand.toLowerCase()} overall margin risk based on structural factors including ${decisionObject.dominantDrivers.join(", ") || "standard operating conditions"}.`,
            riskDimensionSummary: {
              workforceIntensity: { level: decisionObject.dimensions.workforceIntensity, description: `Workforce requirements are ${decisionObject.dimensions.workforceIntensity}.` },
              coordinationEntropy: { level: decisionObject.dimensions.coordinationEntropy, description: `Coordination complexity is ${decisionObject.dimensions.coordinationEntropy}.` },
              commercialExposure: { level: decisionObject.dimensions.commercialExposure, description: `Commercial exposure is ${decisionObject.dimensions.commercialExposure}.` },
              volatilityControl: { level: decisionObject.dimensions.volatilityControl, description: `Volatility control is ${decisionObject.dimensions.volatilityControl}.` }
            },
            effortBandsAllocation: {
              senior: { percentage: decisionObject.effortPercentages.senior, rationale: "Senior involvement should be capped to preserve margins." },
              midLevel: { percentage: decisionObject.effortPercentages.mid, rationale: "Mid-level should absorb majority of delivery volatility." },
              execution: { percentage: decisionObject.effortPercentages.junior, rationale: "Junior layer handles execution velocity." }
            },
            structuralRiskSignals: decisionObject.triggeredBy.length > 0
              ? [...decisionObject.triggeredBy.map(t => `${t} signal detected in assessment`), `AI Effort Shift: ${decisionObject.aiImpactClassification}`]
              : ["No significant structural risk signals detected"],
            overrideConditions: decisionObject.triggeredBy.length > 0
              ? `Override triggered by: ${decisionObject.triggeredBy.join(", ")}`
              : "No override conditions were triggered."
          }
        };
      }
      
      // Generate PDFs
      let decisionMemoPdf: Buffer;
      let assessmentOutputPdf: Buffer;
      
      try {
        [decisionMemoPdf, assessmentOutputPdf] = await Promise.all([
          renderDecisionMemoPDF(decisionObject, narrative.decisionMemo),
          renderAssessmentOutputPDF(decisionObject, narrative.assessmentOutput, openSignal)
        ]);
        console.log(`PDFs generated for: ${validatedData.organisationName}`);
      } catch (pdfError: any) {
        console.error("Failed to generate PDFs:", pdfError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to generate PDF reports"
        });
      }
      
      const decisionMemoFilename = generatePDFFilename("decision_memo", validatedData.fullName, validatedData.organisationName);
      const assessmentOutputFilename = generatePDFFilename("assessment_results", validatedData.fullName, validatedData.organisationName);

      // Store the processed result — released only after payment is confirmed
      const pending = await storage.createPendingResult({
        assessmentId: String(assessment.id),
        decisionObject,
        pdfs: {
          decisionMemo: { filename: decisionMemoFilename, data: decisionMemoPdf.toString("base64") },
          assessmentOutput: { filename: assessmentOutputFilename, data: assessmentOutputPdf.toString("base64") },
        },
        formData: {
          fullName: validatedData.fullName,
          workEmail: validatedData.workEmail,
          roleTitle: validatedData.roleTitle,
          organisationName: validatedData.organisationName,
          organisationSize: validatedData.organisationSize,
          openSignal,
          assessmentId: String(assessment.id),
        },
      });

      // Create Stripe Checkout session
      const origin = `${req.protocol}://${req.get("host")}`;
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        mode: "payment",
        customer_email: validatedData.workEmail,
        client_reference_id: pending.id,
        success_url: `${origin}/assessment?stripe_session={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/assessment?payment_cancelled=true`,
        metadata: { pendingId: pending.id, organisation: validatedData.organisationName },
      });

      // Persist the Stripe session ID
      await storage.updatePendingResultStripeSession(pending.id, checkoutSession.id);

      console.log(`Stripe checkout created for ${validatedData.organisationName}: ${checkoutSession.id}`);

      res.status(201).json({
        success: true,
        requiresPayment: true,
        checkoutUrl: checkoutSession.url,
        assessmentId: assessment.id,
        decisionObject,
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

  // ── Stripe: complete checkout and release PDFs ──────────────────────────────
  app.get("/api/checkout-complete", async (req, res) => {
    try {
      const { session_id } = req.query as { session_id?: string };
      if (!session_id) {
        return res.status(400).json({ success: false, message: "Missing session_id" });
      }

      // Verify payment with Stripe
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);
      if (checkoutSession.payment_status !== "paid") {
        return res.status(402).json({ success: false, message: "Payment not completed" });
      }

      // Retrieve the pending result using client_reference_id
      const pendingId = checkoutSession.client_reference_id;
      if (!pendingId) {
        return res.status(404).json({ success: false, message: "No pending result linked to this session" });
      }

      const pending = await storage.getPendingResult(pendingId);
      if (!pending) {
        return res.status(404).json({ success: false, message: "Pending result not found" });
      }

      const formData = pending.formData as any;
      const pdfsData = pending.pdfs as any;

      // Prevent replay attacks — send emails only on first claim
      if (!pending.claimed) {
        await storage.claimPendingResult(pendingId);

        const openSignal = formData.openSignal || null;
        const decisionMemoBuffer = Buffer.from(pdfsData.decisionMemo.data, "base64");
        const assessmentOutputBuffer = Buffer.from(pdfsData.assessmentOutput.data, "base64");
        const pdfAttachments: PDFAttachment[] = [
          { filename: pdfsData.decisionMemo.filename, content: decisionMemoBuffer },
          { filename: pdfsData.assessmentOutput.filename, content: assessmentOutputBuffer },
        ];

        try {
          await sendAssessmentEmail(pending.decisionObject as any, openSignal, pdfAttachments);
          console.log(`Assessment email sent after payment for: ${formData.organisationName}`);
        } catch (emailError: any) {
          console.error("Failed to send assessment email:", emailError.message);
        }

      }

      return res.json({
        success: true,
        decisionObject: pending.decisionObject,
        pdfs: pdfsData,
        assessmentId: pending.assessmentId,
      });
    } catch (error: any) {
      console.error("Checkout complete error:", error);
      res.status(500).json({ success: false, message: "Failed to retrieve assessment result" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}