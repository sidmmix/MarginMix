import { 
  type User, 
  type InsertUser, 
  type ConversationSession, 
  type InsertConversationSession,
  type UpdateConversationSession,
  type CampaignBrief,
  type InsertCampaignBrief
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getConversationSession(id: string): Promise<ConversationSession | undefined>;
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  updateConversationSession(id: string, session: UpdateConversationSession): Promise<ConversationSession | undefined>;
  
  createCampaignBrief(brief: InsertCampaignBrief): Promise<CampaignBrief>;
  getCampaignBriefBySessionId(sessionId: string): Promise<CampaignBrief | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversationSessions: Map<string, ConversationSession>;
  private campaignBriefs: Map<string, CampaignBrief>;

  constructor() {
    this.users = new Map();
    this.conversationSessions = new Map();
    this.campaignBriefs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversationSession(id: string): Promise<ConversationSession | undefined> {
    return this.conversationSessions.get(id);
  }

  async createConversationSession(insertSession: InsertConversationSession): Promise<ConversationSession> {
    const id = randomUUID();
    const now = new Date();
    const session: ConversationSession = { 
      id,
      sessionData: insertSession.sessionData,
      currentStep: insertSession.currentStep,
      isCompleted: insertSession.isCompleted,
      createdAt: now,
      updatedAt: now
    };
    this.conversationSessions.set(id, session);
    return session;
  }

  async updateConversationSession(id: string, updateSession: UpdateConversationSession): Promise<ConversationSession | undefined> {
    const existingSession = this.conversationSessions.get(id);
    if (!existingSession) return undefined;

    const updatedSession: ConversationSession = {
      ...existingSession,
      sessionData: updateSession.sessionData,
      currentStep: updateSession.currentStep ?? existingSession.currentStep,
      isCompleted: updateSession.isCompleted ?? existingSession.isCompleted,
      updatedAt: new Date()
    };
    this.conversationSessions.set(id, updatedSession);
    return updatedSession;
  }

  async createCampaignBrief(insertBrief: InsertCampaignBrief): Promise<CampaignBrief> {
    const id = randomUUID();
    const brief: CampaignBrief = { 
      ...insertBrief, 
      id,
      aiInsights: insertBrief.aiInsights || null,
      createdAt: new Date()
    };
    this.campaignBriefs.set(id, brief);
    return brief;
  }

  async getCampaignBriefBySessionId(sessionId: string): Promise<CampaignBrief | undefined> {
    return Array.from(this.campaignBriefs.values()).find(
      (brief) => brief.sessionId === sessionId
    );
  }
}

export const storage = new MemStorage();
