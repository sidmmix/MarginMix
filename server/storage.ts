import { eq, and, isNull, or, sql as drizzleSql } from "drizzle-orm";
import { db } from "./db";
import { users, conversationSessions, campaignBriefs, cpmBenchmarks, marginAssessments } from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  ConversationSession, 
  InsertConversationSession, 
  UpdateConversationSession,
  CampaignBrief,
  InsertCampaignBrief,
  CpmBenchmark,
  InsertCpmBenchmark,
  MarginAssessment,
  InsertMarginAssessment
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByFacebookId(facebookId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;

  // Conversation session operations
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  getConversationSession(id: string): Promise<ConversationSession | undefined>;
  updateConversationSession(id: string, updates: UpdateConversationSession): Promise<ConversationSession>;

  // Campaign brief operations
  createCampaignBrief(brief: InsertCampaignBrief): Promise<CampaignBrief>;
  getUserCampaignBriefs(userId: string): Promise<CampaignBrief[]>;
  getCampaignBriefBySessionId(sessionId: string): Promise<CampaignBrief | undefined>;
  linkAnonymousBriefToUser(sessionId: string, userId: string): Promise<CampaignBrief | undefined>;
  
  // CPM Benchmark operations
  createBenchmark(benchmark: InsertCpmBenchmark): Promise<CpmBenchmark>;
  getBenchmarks(filters?: { platform?: string; geo?: string; industry?: string }): Promise<CpmBenchmark[]>;
  searchBenchmarksByVector(embedding: number[], filters?: { platform?: string; geo?: string }, limit?: number): Promise<Array<CpmBenchmark & { similarity: number }>>;
  deleteAllBenchmarks(): Promise<void>;
  
  // Margin Assessment operations
  createMarginAssessment(assessment: InsertMarginAssessment): Promise<MarginAssessment>;
  getMarginAssessments(): Promise<MarginAssessment[]>;
  
  // Authentication helpers
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByFacebookId(facebookId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.facebookId, facebookId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        consentDate: insertUser.consentGiven ? new Date() : null,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createConversationSession(insertSession: InsertConversationSession): Promise<ConversationSession> {
    const [session] = await db
      .insert(conversationSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getConversationSession(id: string): Promise<ConversationSession | undefined> {
    const [session] = await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.id, id));
    return session || undefined;
  }

  async updateConversationSession(id: string, updates: UpdateConversationSession): Promise<ConversationSession> {
    const [session] = await db
      .update(conversationSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversationSessions.id, id))
      .returning();
    return session;
  }

  async createCampaignBrief(insertBrief: InsertCampaignBrief): Promise<CampaignBrief> {
    const [brief] = await db
      .insert(campaignBriefs)
      .values(insertBrief)
      .returning();
    return brief;
  }

  async getUserCampaignBriefs(userId: string): Promise<CampaignBrief[]> {
    // Only return briefs that belong to the authenticated user
    return await db
      .select()
      .from(campaignBriefs)
      .where(eq(campaignBriefs.userId, userId));
  }

  async getCampaignBriefBySessionId(sessionId: string): Promise<CampaignBrief | undefined> {
    const [brief] = await db
      .select()
      .from(campaignBriefs)
      .where(eq(campaignBriefs.sessionId, sessionId));
    return brief || undefined;
  }

  async linkAnonymousBriefToUser(sessionId: string, userId: string): Promise<CampaignBrief | undefined> {
    // Find brief with sessionId and null userId (anonymous brief)
    const [brief] = await db
      .update(campaignBriefs)
      .set({ userId: userId, updatedAt: new Date() })
      .where(and(
        eq(campaignBriefs.sessionId, sessionId),
        isNull(campaignBriefs.userId)
      ))
      .returning();
    return brief || undefined;
  }

  async getCompletedSessionWithoutBrief(sessionId: string): Promise<ConversationSession | undefined> {
    // First check if this session already has a brief
    const existingBrief = await this.getCampaignBriefBySessionId(sessionId);
    if (existingBrief) return undefined;
    
    // Check if session is completed
    const [session] = await db
      .select()
      .from(conversationSessions)
      .where(and(
        eq(conversationSessions.id, sessionId),
        eq(conversationSessions.isCompleted, "true")
      ));
    
    return session || undefined;
  }

  async generateAndSaveBrief(sessionId: string, userId: string | null = null): Promise<CampaignBrief> {
    const session = await this.getConversationSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const data = session.sessionData as any;

    // Simple brief generation using new schema
    const briefData = {
      userId: userId,
      sessionId: sessionId,
      briefTitle: `Campaign Brief - ${data.industry || "Business Campaign"}`,
      industryVertical: data.industry || "Not specified",
      geoTargeting: {
        primary_markets: data.geo ? [data.geo] : [],
        secondary_markets: []
      },
      demographics: {
        age_range: data.demo || "Not specified",
        hhi_segment: "To be determined"
      },
      affinityBuckets: data.affinity ? [data.affinity] : [],
      inMarketSegments: [],
      rawInputs: {
        geo: data.geo || "",
        demo: data.demo || "",
        affinity: data.affinity || "",
        industry: data.industry || ""
      },
      aiInsights: {
        recommendations: [
          "Refine targeting based on performance data",
          "Test multiple creative variants",
          "Monitor competitive landscape",
          "Optimize budget allocation across segments"
        ],
        fallbackGeneration: true
      }
    };

    return await this.createCampaignBrief(briefData);
  }

  async createBenchmark(insertBenchmark: InsertCpmBenchmark): Promise<CpmBenchmark> {
    const [benchmark] = await db
      .insert(cpmBenchmarks)
      .values(insertBenchmark)
      .returning();
    return benchmark;
  }

  async getBenchmarks(filters?: { platform?: string; geo?: string; industry?: string }): Promise<CpmBenchmark[]> {
    let query = db.select().from(cpmBenchmarks);
    
    const conditions = [];
    if (filters?.platform) {
      conditions.push(eq(cpmBenchmarks.platform, filters.platform));
    }
    if (filters?.geo) {
      conditions.push(eq(cpmBenchmarks.geo, filters.geo));
    }
    if (filters?.industry) {
      conditions.push(eq(cpmBenchmarks.industry, filters.industry));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query;
  }

  async searchBenchmarksByVector(
    embedding: number[], 
    filters?: { platform?: string; geo?: string }, 
    limit: number = 10
  ): Promise<Array<CpmBenchmark & { similarity: number }>> {
    const embeddingStr = `[${embedding.join(',')}]`;
    
    let queryText = `
      SELECT 
        id, industry, platform, objective, targeting, cpm, cpa, geo, metadata, created_at, updated_at,
        1 - (embedding <=> '${embeddingStr}'::vector) as similarity
      FROM cpm_benchmarks
    `;
    
    if (filters?.platform && filters?.geo) {
      queryText += ` WHERE platform = '${filters.platform}' AND geo = '${filters.geo}'`;
    } else if (filters?.platform) {
      queryText += ` WHERE platform = '${filters.platform}'`;
    } else if (filters?.geo) {
      queryText += ` WHERE geo = '${filters.geo}'`;
    }
    
    queryText += ` ORDER BY embedding <=> '${embeddingStr}'::vector LIMIT ${limit}`;
    
    const result = await db.execute(drizzleSql.raw(queryText));
    return result.rows as any;
  }

  async deleteAllBenchmarks(): Promise<void> {
    await db.delete(cpmBenchmarks);
  }

  async createMarginAssessment(insertAssessment: InsertMarginAssessment): Promise<MarginAssessment> {
    const [assessment] = await db
      .insert(marginAssessments)
      .values(insertAssessment)
      .returning();
    return assessment;
  }

  async getMarginAssessments(): Promise<MarginAssessment[]> {
    return await db.select().from(marginAssessments);
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export const storage = new DatabaseStorage();