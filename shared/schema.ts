import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  company: varchar("company", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  // OAuth provider information
  googleId: varchar("google_id", { length: 100 }).unique(),
  facebookId: varchar("facebook_id", { length: 100 }).unique(),
  authProvider: varchar("auth_provider", { length: 50 }).notNull().default("email"), // 'email', 'google', 'facebook'
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  resetPasswordToken: varchar("reset_password_token", { length: 255 }),
  resetPasswordExpires: timestamp("reset_password_expires"),
  consentGiven: boolean("consent_given").default(false).notNull(),
  consentDate: timestamp("consent_date"),
  marketingConsent: boolean("marketing_consent").default(false),
  dataRetentionConsent: boolean("data_retention_consent").default(true).notNull(),
  // Stripe subscription fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").references(() => conversationSessions.id),
  clientName: varchar("client_name", { length: 255 }),
  campaignName: varchar("campaign_name", { length: 255 }),
  product: text("product"),
  targetAudience: text("target_audience"),
  budget: varchar("budget", { length: 100 }),
  platforms: varchar("platforms", { length: 500 }),
  objectives: text("objectives"),
  timeline: varchar("timeline", { length: 255 }),
  keyMessages: text("key_messages"),
  aiInsights: jsonb("ai_insights"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  company: z.string().optional(),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to terms and conditions"),
  agreeToPrivacy: z.boolean().refine(val => val === true, "You must agree to privacy policy"),
  consentGiven: z.boolean().refine(val => val === true, "Consent is required"),
  marketingConsent: z.boolean().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEmailVerified: true,
  emailVerificationToken: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  consentDate: true,
  googleId: true,
  facebookId: true,
  profileImageUrl: true,
});

export const insertConversationSessionSchema = createInsertSchema(conversationSessions).pick({
  sessionData: true,
  currentStep: true,
  isCompleted: true,
});

export const insertCampaignBriefSchema = createInsertSchema(campaignBriefs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateConversationSessionSchema = createInsertSchema(conversationSessions).pick({
  sessionData: true,
  currentStep: true,
  isCompleted: true,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;
export type UpdateConversationSession = z.infer<typeof updateConversationSessionSchema>;
export type CampaignBrief = typeof campaignBriefs.$inferSelect;
export type InsertCampaignBrief = z.infer<typeof insertCampaignBriefSchema>;

// Question types for the conversation flow
export const questionSchema = z.object({
  id: z.enum(['name', 'company', 'product', 'platforms', 'objective', 'audience', 'timeframe', 'season', 'budget']),
  question: z.string(),
  type: z.enum(['text', 'single_choice', 'multiple_choice']),
  placeholder: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).optional(),
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
  timeframe: z.string().optional(),
  season: z.string().optional(),
  budget: z.string().optional(),
});

export type ConversationData = z.infer<typeof conversationDataSchema>;
