import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { 
  insertConversationSessionSchema, 
  updateConversationSessionSchema,
  insertCampaignBriefSchema,
  type ConversationData,
  type Question
} from "@shared/schema";

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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get conversation questions
  app.get("/api/questions", (_req, res) => {
    res.json(questions);
  });

  // Create new conversation session
  app.post("/api/conversation/start", async (req, res) => {
    try {
      const session = await storage.createConversationSession({
        sessionData: {},
        currentStep: 0,
        isCompleted: "false"
      });
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get conversation session
  app.get("/api/conversation/:sessionId", async (req, res) => {
    try {
      const session = await storage.getConversationSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Process user response with AI
  app.post("/api/conversation/:sessionId/respond", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { answer, questionId } = req.body;

      if (!answer || !questionId) {
        return res.status(400).json({ message: "Answer and questionId are required" });
      }

      const session = await storage.getConversationSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Validate and process answer with AI
      let aiResult = { isValid: true, insights: "Great answer! Moving to the next question.", suggestions: [] };
      
      try {
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert media planning assistant. Your job is to validate and provide insights on user responses for campaign brief creation. For the question about "${questionId}", analyze the user's answer and provide validation feedback and insights. Respond with JSON in this format: { "isValid": true, "insights": "Brief insight about the answer", "suggestions": [] }`
            },
            {
              role: "user",
              content: `Question: ${questions.find(q => q.id === questionId)?.question}\nUser Answer: ${answer}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const content = aiResponse.choices[0].message.content;
        if (content) {
          aiResult = JSON.parse(content);
        }
      } catch (error: any) {
        console.error("OpenAI API error:", error?.message || error);
        // Continue with default validation if OpenAI fails
      }

      // Update session data
      const currentData = session.sessionData as ConversationData;
      const updatedData = { ...currentData, [questionId]: answer };
      const nextStep = session.currentStep + 1;

      const updatedSession = await storage.updateConversationSession(sessionId, {
        sessionData: updatedData,
        currentStep: nextStep,
        isCompleted: nextStep >= questions.length ? "true" : "false"
      });

      res.json({
        session: updatedSession,
        aiResponse: aiResult,
        nextQuestion: nextStep < questions.length ? questions[nextStep] : null,
        isComplete: nextStep >= questions.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Go back to previous step
  app.post("/api/conversation/:sessionId/back", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getConversationSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.currentStep <= 0) {
        return res.status(400).json({ message: "Already at the first step" });
      }

      const previousStep = Math.max(0, session.currentStep - 1);
      
      const updatedSession = await storage.updateConversationSession(sessionId, {
        sessionData: session.sessionData,
        currentStep: previousStep,
        isCompleted: "false"
      });

      res.json({
        session: updatedSession,
        currentQuestion: questions[previousStep]
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate final campaign brief
  app.post("/api/conversation/:sessionId/generate-brief", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getConversationSession(sessionId);
      if (!session || session.isCompleted !== "true") {
        return res.status(400).json({ message: "Session not found or not completed" });
      }

      const data = session.sessionData as ConversationData;

      // Generate AI insights for the campaign
      let aiInsights = {
        budgetAllocation: { [data.platforms || "Digital Platforms"]: "100%" },
        platformStrategies: { [data.platforms || "Selected Platforms"]: "Targeted campaign strategy" },
        kpis: ["Reach", "Impressions", "Click-through Rate", "Conversions"],
        recommendations: ["Optimize targeting", "Test creative variations", "Monitor performance"],
        estimatedReach: "50K-100K users",
        estimatedCPM: "$5-12"
      };

      try {
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const insightsResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a senior media planning strategist. Generate comprehensive insights and recommendations for a digital media campaign based on the provided brief data. Include budget allocation suggestions, platform-specific strategies, and key performance indicators. Respond with JSON in this format: { 'budgetAllocation': object, 'platformStrategies': object, 'kpis': string[], 'recommendations': string[], 'estimatedReach': string, 'estimatedCPM': string }"
            },
            {
              role: "user",
              content: `Campaign Brief Data: ${JSON.stringify(data)}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const content = insightsResponse.choices[0].message.content;
        if (content) {
          aiInsights = JSON.parse(content);
        }
      } catch (error: any) {
        console.error("OpenAI API error for insights:", error?.message || error);
        // Continue with default insights if OpenAI fails
      }

      // Create campaign brief
      const brief = await storage.createCampaignBrief({
        sessionId,
        name: data.name || "",
        company: data.company || "",
        product: data.product || "",
        platforms: data.platforms || "",
        objective: data.objective || "",
        audience: data.audience || "",
        budget: data.budget || "",
        duration: data.duration || "",
        aiInsights
      });

      res.json({ brief, insights: aiInsights });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get campaign brief by session
  app.get("/api/campaign-brief/:sessionId", async (req, res) => {
    try {
      const brief = await storage.getCampaignBriefBySessionId(req.params.sessionId);
      if (!brief) {
        return res.status(404).json({ message: "Campaign brief not found" });
      }
      res.json(brief);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
