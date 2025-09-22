import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { setupOAuth } from "./oauth";
import { 
  insertConversationSessionSchema, 
  updateConversationSessionSchema,
  insertCampaignBriefSchema,
  type ConversationData,
  type Question
} from "@shared/schema";


// Updated questions to match new schema
const questions: Question[] = [
  { id: 'name', question: "What's your name?", type: 'text', placeholder: "Enter your name...", validation: { required: true, minLength: 2 } },
  { 
    id: 'product', 
    question: "What kind of product/service is this campaign promoting?", 
    type: 'single_choice',
    options: [
      { value: 'ecommerce', label: 'Ecommerce app/Superapp' },
      { value: 'fmcg', label: 'FMCG/CPG' },
      { value: 'd2c_beauty', label: 'D2C Beauty/Skincare/Personal Care/Haircare/Wellness' },
      { value: 'fintech', label: 'Fintech/Financial Services' }
    ],
    validation: { required: true }
  },
  { id: 'company', question: "What's your company/brand's name?", type: 'text', placeholder: "Enter company name...", validation: { required: true, minLength: 2 } },
  { 
    id: 'platforms', 
    question: "Where do you want to deploy your digital media campaign?", 
    type: 'single_choice',
    options: [
      { value: 'youtube', label: 'YouTube' },
      { value: 'meta', label: 'Meta' },
      { value: 'both', label: 'Both' }
    ],
    validation: { required: true }
  },
  { 
    id: 'objective', 
    question: "What's the objective of your campaign?", 
    type: 'single_choice',
    options: [
      { value: 'awareness', label: 'Awareness' },
      { value: 'consideration', label: 'Consideration' },
      { value: 'sales_lead_gen', label: 'Sales/Lead Generation' }
    ],
    validation: { required: true }
  },
  { 
    id: 'audience', 
    question: "Define your target audience and geo location", 
    type: 'single_choice',
    options: [
      { value: 'india_inmarket_shoppers', label: '18–54, Male and Female, India Top 8 cities, InMarket Shoppers' },
      { value: 'india_affinity_shoppers', label: '18–54, Male and Female, India Top 8 cities, Affinity Shoppers' },
      { value: 'us_inmarket_shoppers', label: '18–54, Male and Female, US Metro Areas, InMarket Shoppers' },
      { value: 'us_affinity_shoppers', label: '18–54, Male and Female, US Metro Areas, Affinity Shoppers' },
      { value: 'india_inmarket_financial', label: '18–54, Male and Female, India Top 8 cities, InMarket Financial Services' },
      { value: 'india_affinity_financial', label: '18–54, Male and Female, India Top 8 cities, Affinity Financial Services' },
      { value: 'us_inmarket_financial', label: '18–54, Male and Female, US Metro Areas, InMarket Financial Services' },
      { value: 'us_affinity_financial', label: '18–54, Male and Female, US Metro Areas, Affinity Financial Services' }
    ],
    validation: { required: true }
  },
  { 
    id: 'timeframe', 
    question: "How long do you want to run the campaign?", 
    type: 'single_choice',
    options: [
      { value: '1_2_weeks', label: '1-2 weeks' },
      { value: '1_month', label: '1 month' },
      { value: '2_3_months', label: '2-3 months' }
    ],
    validation: { required: true }
  },
  { 
    id: 'season', 
    question: "Will this campaign run during the festive season (India) / Holiday season (USA)?", 
    type: 'single_choice',
    options: [
      { value: 'only_festive', label: 'Only Festive Season/Holiday Season' },
      { value: 'beyond_festive', label: 'Beyond Festive Season/Holiday Season' }
    ],
    validation: { required: true }
  },
  { 
    id: 'budget', 
    question: "What's your budget?", 
    type: 'single_choice',
    options: [
      { value: 'inr_under_10l', label: '< INR 10 lakhs' },
      { value: 'inr_10_20l', label: '10 lakhs to 20 lakhs' },
      { value: 'inr_20_40l', label: '20 lakhs to 40 lakhs' },
      { value: 'inr_40_80l', label: '40 lakhs to 80 lakhs' },
      { value: 'inr_80l_plus', label: '80 lakhs+' },
      { value: 'inr_2cr_plus', label: '2 crores+' },
      { value: 'usd_under_100k', label: '< US$ 100,000' },
      { value: 'usd_100_200k', label: 'US$ 100,000 to 200,000' },
      { value: 'usd_200_500k', label: 'US$ 200,000 to 500,000' },
      { value: 'usd_500_800k', label: 'US$ 500,000 to 800,000' },
      { value: 'usd_800_1500k', label: 'US$ 800,000 to 1,500,000' },
      { value: 'usd_1500_3000k', label: 'US$ 1,500,000 to 3,000,000' },
      { value: 'usd_3m_plus', label: 'US$ 3 mn+' },
      { value: 'usd_5m_plus', label: 'US$ 5 mn+' }
    ],
    validation: { required: true }
  }
];

// Session configuration
const pgStore = connectPg(session);
const sessionStore = new pgStore({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: false,
  ttl: 7 * 24 * 60 * 60, // 1 week
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

  if (req.session?.userId) {
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      sameSite: 'strict' // CSRF protection
    },
  }));

  // Setup OAuth authentication
  setupOAuth(app);

  // OAuth-only authentication - no email/password routes



  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
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

  // Get predictive suggestions for current input
  app.post("/api/conversation/:id/predict", async (req, res) => {
    try {
      // Security: Validate and sanitize inputs
      const { currentInput, questionId } = req.body;
      
      if (!currentInput || typeof currentInput !== 'string' || currentInput.length > 1000) {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      if (!questionId || typeof questionId !== 'string') {
        return res.status(400).json({ message: "Invalid question ID" });
      }

      const session = await storage.getConversationSession(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const question = questions.find(q => q.id === questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      // AI suggestions disabled - return empty response
      res.json({
        suggestions: [],
        contextualHints: [],
        validationFeedback: null,
        nextQuestionPreview: null
      });
    } catch (error) {
      console.error("Error generating predictions:", error);
      // Return empty predictions when API fails instead of error
      res.json({
        suggestions: [],
        contextualHints: [],
        validationFeedback: null,
        nextQuestionPreview: null
      });
    }
  });

  // Get contextual insights for current conversation
  app.get("/api/conversation/:id/insights", async (req, res) => {
    try {
      const session = await storage.getConversationSession(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // AI insights disabled - return empty response
      res.json({
        strategicInsights: [],
        recommendations: [],
        potentialChallenges: []
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      // Return empty insights when API fails instead of error
      res.json({
        strategicInsights: [],
        recommendations: [],
        potentialChallenges: []
      });
    }
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

      // AI insights disabled - return static brief
      {
        
        // Fallback brief without AI insights
        const brief = {
          sessionId: sessionId,
          clientName: data.name || "Unknown Client",
          campaignName: `${data.company} - ${data.product}`,
          targetAudience: data.audience || "Not specified",
          budget: data.budget || "Not specified",
          platforms: data.platforms || "Not specified",
          objectives: data.objective || "Not specified",
          timeline: data.timeframe || "Not specified",
          keyMessages: `Campaign promoting ${data.product} targeting ${data.audience}`,
          aiInsights: {
            estimatedReach: "Analysis pending",
            estimatedCPM: "Analysis pending",
            recommendations: ["Complete campaign setup", "Review targeting parameters", "Set performance benchmarks"],
            budgetAllocation: {},
            platformStrategies: {},
            kpis: ["Reach", "Engagement", "Conversions"]
          }
        };
        
        res.json(brief);
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
  app.post("/api/campaign-brief", requireAuth, async (req, res) => {
    try {
      const briefData = insertCampaignBriefSchema.parse(req.body);
      
      // AI insights disabled - save brief without AI processing
      {
        
        // Save brief without AI insights
        const brief = await storage.createCampaignBrief({
          ...briefData,
          userId: (req.session as any).userId,
          aiInsights: {
            estimatedReach: "Analysis available after campaign setup",
            estimatedCPM: "Analysis available after campaign setup",
            recommendations: ["Complete campaign configuration", "Review targeting parameters", "Set performance benchmarks"],
            budgetAllocation: {},
            platformStrategies: {},
            kpis: ["Reach", "Engagement", "Conversions"]
          }
        });
        
        res.json(brief);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating campaign brief:", error);
      res.status(500).json({ message: "Internal server error" });
    }
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
      const briefs = await storage.getUserCampaignBriefs((req.session as any).userId);
      res.json(briefs);
    } catch (error) {
      console.error("Error fetching user campaign briefs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}