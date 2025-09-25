import { eq, and, isNull, or } from "drizzle-orm";
import { db } from "./db";
import { users, conversationSessions, campaignBriefs } from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  ConversationSession, 
  InsertConversationSession, 
  UpdateConversationSession,
  CampaignBrief,
  InsertCampaignBrief 
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

  // Conversation session operations
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  getConversationSession(id: string): Promise<ConversationSession | undefined>;
  updateConversationSession(id: string, updates: UpdateConversationSession): Promise<ConversationSession>;

  // Campaign brief operations
  createCampaignBrief(brief: InsertCampaignBrief): Promise<CampaignBrief>;
  getUserCampaignBriefs(userId: string): Promise<CampaignBrief[]>;
  getCampaignBriefBySessionId(sessionId: string): Promise<CampaignBrief | undefined>;
  linkAnonymousBriefToUser(sessionId: string, userId: string): Promise<CampaignBrief | undefined>;
  
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

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export const storage = new DatabaseStorage();