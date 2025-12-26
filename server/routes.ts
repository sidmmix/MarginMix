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
  insertConversationSessionSchema, 
  updateConversationSessionSchema,
  insertCampaignBriefSchema,
  type ConversationData,
  type Question
} from "@shared/schema";
import { scrapeBrandDNA, type BrandBrief } from "./dna-scraper";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Multer configuration for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Open-ended questions for natural language input - 11 questions
const questions: Question[] = [
  { 
    id: 'geo', 
    question: "Geographic Targeting", 
    type: 'textarea',
    placeholder: "Describe your target markets (e.g., 'USA and UK, focusing on major cities' or 'Southeast Asia - Singapore, Malaysia')",
    helpText: "Tell us where you want to reach your audience. Be as specific or broad as you need.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'demo', 
    question: "Demographics", 
    type: 'textarea',
    placeholder: "Describe your target audience (e.g., 'wealthy professionals aged 30-50' or 'college students interested in tech')",
    helpText: "Who is your ideal customer? Include age, income level, interests, or any other relevant details.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'industry', 
    question: "Industry & Campaign Goal", 
    type: 'textarea',
    placeholder: "What's your business and campaign goal? (e.g., 'DTC skincare brand, driving online sales' or 'Fintech app, user acquisition')",
    helpText: "Tell us about your business type and what you want to achieve with this campaign.",
    validation: { required: true, minLength: 10 }
  },
  { 
    id: 'budget', 
    question: "Budget / Investment Level", 
    type: 'textarea',
    placeholder: "What's your campaign budget? (e.g., '$50K monthly' or '€100K for 3 months' or 'flexible, looking for ROI guidance')",
    helpText: "Share your budget range or investment level. This helps us recommend the right platforms and strategies.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'timeline', 
    question: "Campaign Timeline", 
    type: 'textarea',
    placeholder: "When do you want to run this campaign? (e.g., 'Q4 2025 holiday season' or 'Starting Jan 2026, 6-month flight')",
    helpText: "Tell us about timing, duration, seasonality, or any important dates.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'kpis', 
    question: "Key Performance Indicators (KPIs)", 
    type: 'textarea',
    placeholder: "What defines success? (e.g., 'Drive 10K conversions, $50 CPA' or 'Brand awareness lift, 20M impressions')",
    helpText: "Share your success metrics, target KPIs, or performance goals.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'creative', 
    question: "Creative / Messaging Theme", 
    type: 'textarea',
    placeholder: "What's your brand message or creative approach? (e.g., 'Premium, aspirational lifestyle' or 'Fun, quirky, Gen-Z humor')",
    helpText: "Describe your brand voice, creative themes, or key messaging points.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'competitive', 
    question: "Competitive Landscape", 
    type: 'textarea',
    placeholder: "Who are your competitors? (e.g., 'Nike, Adidas in athletic wear' or 'New entrant vs. legacy banks')",
    helpText: "Share competitive context, market positioning, or differentiation.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'platforms', 
    question: "Platform Preferences", 
    type: 'textarea',
    placeholder: "Any platform preferences? (e.g., 'Must include Meta, considering YouTube' or 'Open to all channels')",
    helpText: "Tell us if you have specific platform requirements or preferences.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'affinity', 
    question: "Affinity / Interest Segments", 
    type: 'textarea',
    placeholder: "What interests define your audience? (e.g., 'luxury shoppers, travel enthusiasts' or 'gamers, tech early adopters')",
    helpText: "Describe affinity segments, interests, hobbies, or lifestyle preferences.",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'inmarket', 
    question: "InMarket / Behaviour Segments", 
    type: 'textarea',
    placeholder: "What purchase behaviors or signals? (e.g., 'In-market for SUVs' or 'Recently searched for mortgages')",
    helpText: "Share behavioral signals, purchase intent, or in-market categories.",
    validation: { required: true, minLength: 5 }
  }
];

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

  // Enhanced questions endpoint for the chat interface
  app.get("/api/questions", (req, res) => {
    res.json(questions);
  });

  // Get dynamic question based on conversation context
  app.get("/api/questions/:step", async (req, res) => {
    try {
      // Security: Validate step parameter
      const step = parseInt(req.params.step);
      if (isNaN(step) || step < 0 || step > 20) {
        return res.status(400).json({ message: "Invalid step parameter" });
      }
      
      const sessionId = req.query.sessionId as string;
      if (sessionId && (typeof sessionId !== 'string' || sessionId.length > 100)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      if (step >= questions.length) {
        return res.status(404).json({ message: "Question not found" });
      }

      // Return static question (AI enhancement disabled)
      res.json(questions[step] || questions[0]);
    } catch (error) {
      console.error("Error generating dynamic question:", error);
      res.json(questions[parseInt(req.params.step)] || questions[0]);
    }
  });

  // Get predictive suggestions for current input (stubbed out - not used with new schema)
  app.post("/api/conversation/:id/predict", async (req, res) => {
    // Stubbed out - return empty predictions
    res.json({
      suggestions: [],
      contextualHints: [],
      validationFeedback: null,
      nextQuestionPreview: null
    });
  });

  // Get contextual insights for current conversation (stubbed out - not used with new schema)
  app.get("/api/conversation/:id/insights", async (req, res) => {
    // Stubbed out - return empty insights
    res.json({
      strategicInsights: [],
      recommendations: [],
      potentialChallenges: []
    });
  });

  // Conversation routes
  app.post("/api/conversation/start", async (req, res) => {
    try {
      const sessionData = {
        sessionData: {},
        currentStep: 0,
        isCompleted: "false"
      };
      const session = await storage.createConversationSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error starting conversation session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/conversation/:id/respond", async (req, res) => {
    try {
      // Security: Validate and sanitize inputs
      const { questionId, answer } = req.body;
      
      if (!answer || typeof answer !== 'string' || answer.length > 5000) {
        return res.status(400).json({ message: "Invalid answer" });
      }
      
      if (!questionId || typeof questionId !== 'string') {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const session = await storage.getConversationSession(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Find the current question for validation
      const question = questions.find(q => q.id === questionId);
      if (question) {
        // AI validation disabled - basic validation only
        const validation = { 
          isValid: true, 
          enhancedAnswer: answer,
          qualityScore: 8,
          suggestions: []
        };
        
        // Use enhanced answer if available and quality score is high
        const finalAnswer = validation.enhancedAnswer && validation.qualityScore >= 7 
          ? validation.enhancedAnswer 
          : answer;

        // Update session data with the processed answer
        const currentData = session.sessionData || {};
        const updatedSessionData = {
          ...currentData,
          [questionId]: finalAnswer,
          [`${questionId}_original`]: answer !== finalAnswer ? answer : undefined,
          [`${questionId}_qualityScore`]: validation.qualityScore
        };

        const updatedSession = await storage.updateConversationSession(req.params.id, {
          sessionData: updatedSessionData,
          currentStep: session.currentStep + 1,
          isCompleted: session.currentStep + 1 >= questions.length ? "true" : "false"
        });

        res.json({
          ...updatedSession,
          aiValidation: {
            isValid: validation.isValid,
            suggestions: validation.suggestions,
            qualityScore: validation.qualityScore,
            wasEnhanced: validation.enhancedAnswer && validation.qualityScore >= 7
          }
        });
      } else {
        // Fallback to original behavior if question not found
        const currentData = session.sessionData || {};
        const updatedSessionData = {
          ...currentData,
          [questionId]: answer
        };

        const updatedSession = await storage.updateConversationSession(req.params.id, {
          sessionData: updatedSessionData,
          currentStep: session.currentStep + 1,
          isCompleted: session.currentStep + 1 >= questions.length ? "true" : "false"
        });

        res.json(updatedSession);
      }
    } catch (error) {
      console.error("Error updating conversation session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/conversation/:id/brief", async (req, res) => {
    try {
      // Security: Validate session ID format
      const sessionId = req.params.id;
      if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const brief = await generateAIBriefForSession(sessionId, null);
      res.json(brief);
    } catch (error) {
      console.error("Error generating campaign brief:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/conversation/:id", async (req, res) => {
    try {
      // Security: Validate session ID format
      const sessionId = req.params.id;
      if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 100) {
        return res.status(400).json({ message: "Invalid session ID" });
      }

      const session = await storage.getConversationSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching conversation session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Campaign brief routes (require authentication for creation)
  // Note: Direct brief creation is deprecated - use /api/conversation/:id/brief instead
  app.post("/api/campaign-brief", requireAuth, async (req, res) => {
    res.status(410).json({ 
      message: "Direct brief creation is deprecated. Please use the conversation flow: POST /api/conversation/:id/brief",
      redirectTo: "/api/conversation/start"
    });
  });

  app.get("/api/campaign-brief/session/:sessionId", async (req, res) => {
    try {
      const brief = await storage.getCampaignBriefBySessionId(req.params.sessionId);
      if (!brief) {
        return res.status(404).json({ message: "Campaign brief not found" });
      }
      res.json(brief);
    } catch (error) {
      console.error("Error fetching campaign brief:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/campaign-briefs", requireAuth, async (req, res) => {
    try {
      // Get user ID from OAuth (req.user.id) or session (req.session.userId) 
      const userId = (req as any).user?.id || (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "User ID not found" });
      }
      
      const briefs = await storage.getUserCampaignBriefs(userId);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching user campaign briefs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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

  const httpServer = createServer(app);
  return httpServer;
}

// Exported helper function for AI-powered campaign brief generation (used in OAuth and API routes)
export async function generateAIBriefForSession(sessionId: string, userId: string | null = null) {
  const session = await storage.getConversationSession(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }

  const data = session.sessionData as ConversationData;

  // RAG: Retrieve relevant benchmarks before AI generation
  let youtubeBenchmarks: any[] = [];
  let metaBenchmarks: any[] = [];

  try {
    // Build search query from user inputs
    const searchQuery = [
      data.industry || '',
      data.kpis || '',
      data.demo || '',
      data.affinity || ''
    ].filter(Boolean).join(' ');

    // Search for YouTube benchmarks
    if (searchQuery) {
      const youtubeEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: searchQuery,
        dimensions: 3072
      });

      const youtubeResults = await storage.searchBenchmarksByVector(
        youtubeEmbedding.data[0].embedding,
        { platform: 'YouTube', geo: 'India' },
        5
      );
      youtubeBenchmarks = youtubeResults;

      // Search for Meta benchmarks
      const metaEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: searchQuery,
        dimensions: 3072
      });

      const metaResults = await storage.searchBenchmarksByVector(
        metaEmbedding.data[0].embedding,
        { platform: 'Meta', geo: 'India' },
        5
      );
      metaBenchmarks = metaResults;
    }
  } catch (ragError) {
    console.error("RAG benchmark retrieval failed, continuing with AI estimates:", ragError);
  }

  // Generate AI-powered campaign brief
  try {
    // Format benchmarks for AI context
    const youtubeBenchmarkContext = youtubeBenchmarks.length > 0
      ? `\n\nREAL YOUTUBE CPM BENCHMARKS (Historical India data 2024-2025):\n${youtubeBenchmarks.map(b => 
          `- ${b.industry} | ${b.objective} | ${b.targeting || 'General'} | CPM: ${b.cpm || 'N/A'}${b.cpa ? ` | CPA: ${b.cpa}` : ''} (Similarity: ${(b.similarity * 100).toFixed(1)}%)`
        ).join('\n')}`
      : '';

    const metaBenchmarkContext = metaBenchmarks.length > 0
      ? `\n\nREAL META CPM BENCHMARKS (Historical India data 2024-2025):\n${metaBenchmarks.map(b => 
          `- ${b.industry} | ${b.objective} | ${b.targeting || 'General'} | CPM: ${b.cpm || 'N/A'}${b.cpa ? ` | CPA: ${b.cpa}` : ''} (Similarity: ${(b.similarity * 100).toFixed(1)}%)`
        ).join('\n')}`
      : '';

    const prompt = `
Process the following raw campaign inputs and generate a comprehensive, formal Media Brief in JSON format.

Raw Inputs:
- Geographic Targeting: ${data.geo || 'Not specified'}
- Demographics: ${data.demo || 'Not specified'}
- Industry & Campaign Goal: ${data.industry || 'Not specified'}
- Budget / Investment Level: ${data.budget || 'Not specified'}
- Campaign Timeline: ${data.timeline || 'Not specified'}
- KPIs & Success Metrics: ${data.kpis || 'Not specified'}
- Creative / Messaging Theme: ${data.creative || 'Not specified'}
- Competitive Landscape: ${data.competitive || 'Not specified'}
- Platform Preferences: ${data.platforms || 'Not specified'}
- Affinity / Interest Segments: ${data.affinity || 'Not specified'}
- InMarket / Behaviour Segments: ${data.inmarket || 'Not specified'}
${youtubeBenchmarkContext}
${metaBenchmarkContext}

Transform this raw input into professional, industry-standard media planning terminology. For example:
- "rich people" → "High-Net-Worth Individual (HNI)"
- "USA" → specific DMA markets (e.g., "New York, Los Angeles, Chicago DMAs")
- "$50K monthly" → "Monthly Investment: $50,000 USD"
- "young people who like tech" → "Tech-Savvy Millennials, Age 25-34"

CRITICAL INSTRUCTIONS FOR CPM & IMPRESSIONS:

1. SELECT EXACT CPM FROM BENCHMARKS:
   - Look at the REAL BENCHMARKS provided above (from Excel data: Industry, Objective, Platform, Targeting, CPM)
   - For YouTube: Find the benchmark that BEST MATCHES the campaign's Industry, Objective, and Targeting
   - For Meta: Find the benchmark that BEST MATCHES the campaign's Industry, Objective, and Targeting  
   - Use the EXACT CPM VALUE from the matched benchmark (e.g., if benchmark shows CPM: ₹850, use ₹850)
   - Prioritize benchmarks with higher similarity scores (they're more relevant)
   - If multiple similar benchmarks exist, use the average or provide a range

2. BUDGET ALLOCATION (60:40 SPLIT):
   - YouTube gets 60% of total budget
   - Meta gets 40% of total budget
   - Example: Total budget ₹10,000 → YouTube ₹6,000, Meta ₹4,000

3. CALCULATE IMPRESSIONS USING BENCHMARK CPM:
   Step-by-step formula:
   - YouTube Impressions = (Total Budget × 0.60) ÷ [CPM from YouTube benchmark] × 1000
   - Meta Impressions = (Total Budget × 0.40) ÷ [CPM from Meta benchmark] × 1000
   
   WORKED EXAMPLE:
   Total Budget: ₹10,000/month
   YouTube Benchmark: Ecommerce | Brand Awareness | General | CPM: ₹800 (from Excel)
   Meta Benchmark: Ecommerce | Brand Awareness | General | CPM: ₹500 (from Excel)
   
   Calculations:
   - YouTube Budget: ₹10,000 × 0.60 = ₹6,000
   - YouTube Impressions: 6,000 ÷ 800 × 1000 = 7,500 impressions/month
   - Meta Budget: ₹10,000 × 0.40 = ₹4,000  
   - Meta Impressions: 4,000 ÷ 500 × 1000 = 8,000 impressions/month

4. OUTPUT THE EXACT BENCHMARK CPM:
   - In estimated_cpm field, use the exact CPM from the benchmark (e.g., "₹850" not "₹800-900")
   - In estimated_impressions field, show the calculated impressions (e.g., "7,500 monthly impressions")
   - Always include benchmark_source: "Historical campaigns 2024-2025, India"

Return a JSON object with this exact structure:
{
  "brief_title": "Descriptive campaign title based on industry and goals",
  "industry_vertical": "Industry category (e.g., E-commerce, Finance, Healthcare)",
  "geo_targeting": {
    "primary_markets": ["List of primary target markets/regions with professional terminology"],
    "secondary_markets": ["List of secondary markets if applicable"]
  },
  "demographics": {
    "age_range": "Age range (e.g., 25-54, 18-34)",
    "hhi_segment": "Household income segment (e.g., HNI, Upper-Middle Class, Mass Market)"
  },
  "budget_details": {
    "total_budget": "Budget amount with currency",
    "flight_duration": "Campaign duration",
    "allocation_strategy": "Recommended budget allocation approach"
  },
  "campaign_objectives": {
    "primary_kpi": "Main success metric",
    "secondary_kpis": ["Supporting metrics"],
    "target_timeline": "Campaign flight dates"
  },
  "creative_strategy": {
    "messaging_theme": "Creative approach and brand voice",
    "key_messages": ["Core messaging points"]
  },
  "competitive_analysis": {
    "key_competitors": ["Main competitors"],
    "differentiation": "Unique positioning"
  },
  "youtube_strategy": {
    "recommended": true/false,
    "rationale": "Strategic rationale for YouTube",
    "suggested_formats": ["Video ad formats"],
    "estimated_cpm": "CPM value or range from historical benchmarks (e.g., '₹850' or '₹650-850')",
    "estimated_impressions": "Monthly impression estimate based on budget",
    "benchmark_source": "Source attribution (e.g., 'Historical campaigns 2024-2025, India' if using real data, or omit if estimated)"
  },
  "meta_strategy": {
    "recommended": true/false,
    "rationale": "Strategic rationale for Meta (Facebook/Instagram)",
    "suggested_formats": ["Ad formats"],
    "estimated_cpm": "CPM value or range from historical benchmarks (e.g., '₹550' or '₹450-650')",
    "estimated_impressions": "Monthly impression estimate based on budget",
    "benchmark_source": "Source attribution (e.g., 'Historical campaigns 2024-2025, India' if using real data, or omit if estimated)"
  },
  "affinity_buckets": ["List of interest categories and affinities with professional terminology"],
  "in_market_segments": ["List of in-market purchase intent segments with industry-standard categories"]
}
`;

    const systemPrompt = youtubeBenchmarks.length > 0 || metaBenchmarks.length > 0
      ? "You are a Vice President of Media Strategy with 15 years of experience. Process comprehensive campaign inputs from a planner and output a formal, detailed Media Brief JSON. Transform all raw inputs into professional, industry-standard media planning terminology. CRITICAL CPM SELECTION: You have been provided with REAL CPM benchmarks from Excel data (India 2024-2025) showing Industry, Objective, Platform, Targeting, and CPM values. You MUST: (1) Find the benchmark that BEST MATCHES the campaign's Industry, Objective, and Targeting for each platform, (2) Use the EXACT CPM VALUE from that matched benchmark - DO NOT estimate or modify, (3) Use 60:40 budget split (YouTube 60%, Meta 40%), (4) Calculate impressions: YouTube = (Budget × 0.60) ÷ YouTube_CPM × 1000, Meta = (Budget × 0.40) ÷ Meta_CPM × 1000. Include 'benchmark_source: Historical campaigns 2024-2025, India' in both strategies."
      : "You are a Vice President of Media Strategy with 15 years of experience. Process comprehensive campaign inputs from a planner and output a formal, detailed Media Brief JSON. Transform all raw inputs into professional, industry-standard media planning terminology. For YouTube and Meta strategies: Use realistic CPM ranges (YouTube: ₹600-1200, Meta: ₹400-800 depending on targeting). BUDGET ALLOCATION: Always use a 60:40 split (YouTube 60%, Meta 40%). Calculate impressions using: YouTube Impressions = (Total Budget × 0.60) ÷ YouTube CPM × 1000, Meta Impressions = (Total Budget × 0.40) ÷ Meta CPM × 1000.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content || "{}";
    const mediaBrief = JSON.parse(aiResponse);
    
    // Generate recommendations
    const recommendations = [
      "Leverage audience lookalike modeling for scale",
      "Implement A/B testing for creative optimization",
      "Monitor frequency caps to prevent ad fatigue",
      "Track incremental lift with brand studies",
      "Optimize bidding based on performance data"
    ];

    const briefData = {
      userId,
      sessionId: sessionId,
      briefTitle: mediaBrief.brief_title || "Campaign Brief",
      industryVertical: mediaBrief.industry_vertical || "Not specified",
      geoTargeting: mediaBrief.geo_targeting || { primary_markets: [], secondary_markets: [] },
      demographics: mediaBrief.demographics || { age_range: "", hhi_segment: "" },
      affinityBuckets: mediaBrief.affinity_buckets || [],
      inMarketSegments: mediaBrief.in_market_segments || [],
      aiInsights: { 
        generatedBrief: mediaBrief, 
        recommendations 
      }
    };
    
    // Save the brief to database
    const savedBrief = await storage.createCampaignBrief(briefData);
    return savedBrief;
  } catch (aiError) {
    console.error("AI brief generation failed:", aiError);
    
    // Fallback brief
    const fallbackBriefData = {
      userId,
      sessionId: sessionId,
      briefTitle: "Campaign Brief",
      industryVertical: "Not specified",
      geoTargeting: { primary_markets: [], secondary_markets: [] },
      demographics: { age_range: "", hhi_segment: "" },
      affinityBuckets: [],
      inMarketSegments: [],
      aiInsights: {
        generatedBrief: {},
        recommendations: ["Complete campaign setup", "Review targeting parameters", "Set performance benchmarks"]
      }
    };
    
    const savedFallbackBrief = await storage.createCampaignBrief(fallbackBriefData);
    return savedFallbackBrief;
  }
}