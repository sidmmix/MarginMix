import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupOAuth } from "./oauth";
import { 
  insertConversationSessionSchema, 
  updateConversationSessionSchema,
  insertCampaignBriefSchema,
  type ConversationData,
  type Question
} from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Open-ended questions for natural language input
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
    id: 'affinity', 
    question: "Interests & Affinities", 
    type: 'textarea',
    placeholder: "What are they interested in? (e.g., 'luxury shoppers, travel enthusiasts' or 'gamers, tech early adopters')",
    helpText: "What hobbies, interests, or behaviors define your target audience?",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'industry', 
    question: "Industry & Campaign Goal", 
    type: 'textarea',
    placeholder: "What's your business and campaign goal? (e.g., 'DTC skincare brand, driving online sales' or 'Fintech app, user acquisition')",
    helpText: "Tell us about your business type and what you want to achieve with this campaign.",
    validation: { required: true, minLength: 10 }
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

      const session = await storage.getConversationSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const data = session.sessionData as ConversationData;

      // Generate AI-powered campaign brief using VP of Media Strategy role
      try {
        const prompt = `
Process the following raw targeting inputs and generate a formal, structured Media Brief in JSON format.

Raw Inputs:
- Geographic Targeting: ${data.geo || 'Not specified'}
- Demographics: ${data.demo || 'Not specified'}
- Interests & Affinities: ${data.affinity || 'Not specified'}
- Industry & Campaign Goal: ${data.industry || 'Not specified'}

Transform this raw input into professional, industry-standard targeting terminology. For example:
- "rich people" → "High-Net-Worth Individual (HNI)"
- "USA" → specific DMA markets
- "young people who like tech" → "Tech-Savvy Millennials, Age 25-34"

Return a JSON object with this exact structure:
{
  "brief_title": "Descriptive campaign title based on industry and goals",
  "industry_vertical": "Industry category (e.g., E-commerce, Finance, Healthcare)",
  "geo_targeting": {
    "primary_markets": ["List of primary target markets/regions"],
    "secondary_markets": ["List of secondary markets if applicable"]
  },
  "demographics": {
    "age_range": "Age range (e.g., 25-54, 18-34)",
    "hhi_segment": "Household income segment (e.g., HNI, Upper-Middle Class, Mass Market)"
  },
  "affinity_buckets": ["List of interest categories and affinities"],
  "in_market_segments": ["List of in-market purchase intent segments"]
}
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a Vice President of Media Strategy with 15 years of experience. Your sole purpose is to process raw, open-ended targeting inputs from a planner and output a formal, structured Media Brief JSON. Analyze the user's raw input (Geo, Demo, Affinity, Industry) and map it into actionable, high-level, industry-standard targeting terminology. For example, turn 'rich people' into 'High-Net-Worth Individual (HNI)'."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1500,
          temperature: 0.7,
        });

        const aiResponse = completion.choices[0]?.message?.content || "{}";
        const mediaBrief = JSON.parse(aiResponse);
        
        // Generate recommendations based on the brief
        const recommendations = [
          "Leverage audience lookalike modeling for scale",
          "Implement A/B testing for creative optimization",
          "Monitor frequency caps to prevent ad fatigue",
          "Track incremental lift with brand studies",
          "Optimize bidding based on performance data"
        ];

        const briefData = {
          userId: null, // Anonymous user - will be linked later if they log in
          sessionId: sessionId,
          briefTitle: mediaBrief.brief_title || "Campaign Brief",
          industryVertical: mediaBrief.industry_vertical || "Not specified",
          geoTargeting: mediaBrief.geo_targeting || { primary_markets: [], secondary_markets: [] },
          demographics: mediaBrief.demographics || { age_range: "", hhi_segment: "" },
          affinityBuckets: mediaBrief.affinity_buckets || [],
          inMarketSegments: mediaBrief.in_market_segments || [],
          rawInputs: { 
            geo: data.geo || "", 
            demo: data.demo || "", 
            affinity: data.affinity || "", 
            industry: data.industry || "" 
          },
          aiInsights: { 
            generatedBrief: mediaBrief, 
            recommendations 
          }
        };
        
        // Save the brief to database
        const savedBrief = await storage.createCampaignBrief(briefData);
        res.json(savedBrief);
      } catch (aiError) {
        console.error("AI brief generation failed:", aiError);
        
        // Fallback brief without AI insights on AI failure
        const fallbackBriefData = {
          userId: null,
          sessionId: sessionId,
          briefTitle: "Campaign Brief",
          industryVertical: "Not specified",
          geoTargeting: { primary_markets: [], secondary_markets: [] },
          demographics: { age_range: "", hhi_segment: "" },
          affinityBuckets: [],
          inMarketSegments: [],
          rawInputs: { 
            geo: data.geo || "", 
            demo: data.demo || "", 
            affinity: data.affinity || "", 
            industry: data.industry || "" 
          },
          aiInsights: {
            generatedBrief: {},
            recommendations: ["Complete campaign setup", "Review targeting parameters", "Set performance benchmarks"]
          }
        };
        
        // Save the fallback brief to database
        const savedFallbackBrief = await storage.createCampaignBrief(fallbackBriefData);
        res.json(savedFallbackBrief);
      }
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

  const httpServer = createServer(app);
  return httpServer;
}