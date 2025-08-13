import { eq } from "drizzle-orm";
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

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export const storage = new DatabaseStorage();