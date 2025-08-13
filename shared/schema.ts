import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionData: jsonb("session_data").notNull(),
  currentStep: integer("current_step").notNull().default(0),
  isCompleted: text("is_completed").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const campaignBriefs = pgTable("campaign_briefs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => conversationSessions.id),
  name: text("name").notNull(),
  company: text("company").notNull(),
  product: text("product").notNull(),
  platforms: text("platforms").notNull(),
  objective: text("objective").notNull(),
  audience: text("audience").notNull(),
  budget: text("budget").notNull(),
  duration: text("duration").notNull(),
  aiInsights: jsonb("ai_insights"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSessionSchema = createInsertSchema(conversationSessions).pick({
  sessionData: true,
  currentStep: true,
  isCompleted: true,
});

export const insertCampaignBriefSchema = createInsertSchema(campaignBriefs).omit({
  id: true,
  createdAt: true,
});

export const updateConversationSessionSchema = createInsertSchema(conversationSessions).pick({
  sessionData: true,
  currentStep: true,
  isCompleted: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;
export type UpdateConversationSession = z.infer<typeof updateConversationSessionSchema>;
export type CampaignBrief = typeof campaignBriefs.$inferSelect;
export type InsertCampaignBrief = z.infer<typeof insertCampaignBriefSchema>;

// Question types for the conversation flow
export const questionSchema = z.object({
  id: z.enum(['name', 'company', 'product', 'platforms', 'objective', 'audience', 'budget', 'duration']),
  question: z.string(),
  type: z.enum(['text', 'platform']),
  placeholder: z.string(),
  validation: z.object({
    required: z.boolean(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
  }).optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const conversationDataSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  product: z.string().optional(),
  platforms: z.string().optional(),
  objective: z.string().optional(),
  audience: z.string().optional(),
  budget: z.string().optional(),
  duration: z.string().optional(),
});

export type ConversationData = z.infer<typeof conversationDataSchema>;
