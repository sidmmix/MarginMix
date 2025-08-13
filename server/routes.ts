import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { setupOAuth } from "./oauth";
import OpenAI from "openai";
import { 
  insertConversationSessionSchema, 
  updateConversationSessionSchema,
  insertCampaignBriefSchema,
  registerSchema,
  loginSchema,
  type ConversationData,
  type Question
} from "@shared/schema";
import { 
  generatePredictiveResponse, 
  generateDynamicQuestion, 
  validateAndEnhanceAnswer,
  generateContextualInsights,
  type ConversationContext 
} from "./ai-conversation";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const questions: Question[] = [
  { 
    id: 'name', 
    question: "What's your name?", 
    type: 'text',
    placeholder: "Enter your name...",
    validation: { required: true, minLength: 2 }
  },
  { 
    id: 'company', 
    question: "What's your company/brand's name?", 
    type: 'text',
    placeholder: "Enter company name...",
    validation: { required: true, minLength: 2 }
  },
  { 
    id: 'product', 
    question: "What kind of product/service is this campaign promoting?", 
    type: 'text',
    placeholder: "Describe your product/service...",
    validation: { required: true, minLength: 10 }
  },
  { 
    id: 'platforms', 
    question: "Where do you want to deploy your digital media campaign?", 
    type: 'platform',
    placeholder: "Select your preferred platforms...",
    validation: { required: true }
  },
  { 
    id: 'objective', 
    question: "What's the objective of your campaign?", 
    type: 'text',
    placeholder: "E.g., Brand awareness, Lead generation, Sales...",
    validation: { required: true, minLength: 5 }
  },
  { 
    id: 'audience', 
    question: "Define your target audience and geo location", 
    type: 'text',
    placeholder: "E.g., Women 25-45, United States, interested in fashion...",
    validation: { required: true, minLength: 10 }
  },
  { 
    id: 'budget', 
    question: "What's your budget?", 
    type: 'text',
    placeholder: "E.g., $10,000 or $10K...",
    validation: { required: true, minLength: 2 }
  },
  { 
    id: 'duration', 
    question: "How long do you want to run the campaign? Give specific dates.", 
    type: 'text',
    placeholder: "E.g., March 1 - March 31, 2024...",
    validation: { required: true, minLength: 5 }
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

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.session?.userId) {
    return next();
  }
  return res.status(401).json({ message: "Authentication required" });
};

export function registerRoutes(app: Express): Server {
  // Session middleware
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  }));

  // Setup OAuth authentication
  setupOAuth(app);

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password and create user
      const hashedPassword = await storage.hashPassword(userData.password);
      const user = await storage.createUser({
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: userData.company,
        consentGiven: userData.consentGiven,
        marketingConsent: userData.marketingConsent || false,
        dataRetentionConsent: true,
      });

      // Set session
      (req.session as any).userId = user.id;
      
      res.json({ 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await storage.comparePassword(loginData.password, user.passwordHash || "");
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session
      (req.session as any).userId = user.id;
      
      res.json({ 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

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
      const step = parseInt(req.params.step);
      const sessionId = req.query.sessionId as string;

      if (step >= questions.length) {
        return res.status(404).json({ message: "Question not found" });
      }

      let context: ConversationContext = {
        userResponses: {},
        currentStep: step,
        sessionData: {}
      };

      // Get conversation context if sessionId provided
      if (sessionId) {
        const session = await storage.getConversationSession(sessionId);
        if (session) {
          context = {
            userResponses: session.sessionData || {},
            currentStep: step,
            sessionData: session.sessionData || {}
          };
        }
      }

      // Generate dynamic question based on context
      const dynamicQuestion = await generateDynamicQuestion(context, questions);
      res.json(dynamicQuestion);
    } catch (error) {
      console.error("Error generating dynamic question:", error);
      res.json(questions[parseInt(req.params.step)] || questions[0]);
    }
  });

  // Get predictive suggestions for current input
  app.post("/api/conversation/:id/predict", async (req, res) => {
    try {
      const { currentInput, questionId } = req.body;
      const session = await storage.getConversationSession(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const question = questions.find(q => q.id === questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      const context: ConversationContext = {
        userResponses: session.sessionData || {},
        currentStep: session.currentStep,
        sessionData: session.sessionData || {}
      };

      const predictions = await generatePredictiveResponse(question, currentInput, context);
      res.json(predictions);
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

      const context: ConversationContext = {
        userResponses: session.sessionData || {},
        currentStep: session.currentStep,
        sessionData: session.sessionData || {}
      };

      const insights = await generateContextualInsights(context);
      res.json(insights);
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
      const { questionId, answer } = req.body;
      const session = await storage.getConversationSession(req.params.id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Find the current question for validation
      const question = questions.find(q => q.id === questionId);
      if (question) {
        // Validate and enhance the answer using AI
        const context: ConversationContext = {
          userResponses: session.sessionData || {},
          currentStep: session.currentStep,
          sessionData: session.sessionData || {}
        };

        const validation = await validateAndEnhanceAnswer(question, answer, context);
        
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
      const session = await storage.getConversationSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const data = session.sessionData as ConversationData;

      // Generate AI insights
      try {
        const prompt = `Create a comprehensive media planning strategy for this campaign:

Campaign Details:
- Client: ${data.name}
- Company: ${data.company}
- Product/Service: ${data.product}
- Target Audience: ${data.audience}
- Budget: ${data.budget}
- Duration: ${data.duration}
- Platforms: ${data.platforms}
- Objectives: ${data.objective}

Please provide detailed insights including budget allocation, platform strategies, estimated reach, CPM estimates, and specific recommendations. Return as valid JSON with this structure:
{
  "estimatedReach": "X million users",
  "estimatedCPM": "$X.XX",
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "budgetAllocation": {"platform1": "percentage", "platform2": "percentage"},
  "platformStrategies": {"platform1": "strategy", "platform2": "strategy"},
  "kpis": ["kpi1", "kpi2", "kpi3"]
}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });

        const aiInsights = JSON.parse(completion.choices[0].message.content || "{}");

        const brief = {
          sessionId: req.params.id,
          clientName: data.name || "Unknown Client",
          campaignName: `${data.company} - ${data.product}`,
          targetAudience: data.audience || "Not specified",
          budget: data.budget || "Not specified",
          platforms: data.platforms || "Not specified",
          objectives: data.objective || "Not specified",
          timeline: data.duration || "Not specified",
          keyMessages: `Campaign promoting ${data.product} targeting ${data.audience}`,
          aiInsights
        };

        res.json(brief);
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        
        // Fallback brief without AI insights
        const brief = {
          sessionId: req.params.id,
          clientName: data.name || "Unknown Client",
          campaignName: `${data.company} - ${data.product}`,
          targetAudience: data.audience || "Not specified",
          budget: data.budget || "Not specified",
          platforms: data.platforms || "Not specified",
          objectives: data.objective || "Not specified",
          timeline: data.duration || "Not specified",
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
      const session = await storage.getConversationSession(req.params.id);
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
      
      // Generate AI insights
      console.log("Generating AI insights for campaign brief...");
      
      try {
        const prompt = `Create a comprehensive media planning strategy for this campaign:
        Client: ${briefData.clientName}
        Product/Service: ${briefData.product}
        Target Audience: ${briefData.targetAudience}
        Budget: ${briefData.budget}
        Duration: ${briefData.timeline}
        Platforms: ${briefData.platforms}
        Objectives: ${briefData.objectives}
        
        Please provide detailed insights including:
        1. Platform-specific strategies
        2. Budget allocation recommendations
        3. Target audience insights
        4. Content recommendations
        5. Performance forecasts
        
        Return the response as JSON with structured data.`;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an expert media planner. Provide comprehensive, actionable insights for digital media campaigns."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
        });

        const aiInsights = JSON.parse(completion.choices[0].message.content || "{}");
        console.log("AI insights generated successfully");

        // Save the brief with AI insights
        const brief = await storage.createCampaignBrief({
          ...briefData,
          userId: (req.session as any).userId,
          aiInsights
        });
        
        res.json(brief);
      } catch (aiError) {
        console.error("AI generation error:", aiError);
        
        // Fallback: Save without AI insights
        const brief = await storage.createCampaignBrief({
          ...briefData,
          userId: (req.session as any).userId,
          aiInsights: { error: "AI insights temporarily unavailable" }
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