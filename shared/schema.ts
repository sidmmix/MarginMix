import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean, index, vector } from "drizzle-orm/pg-core";
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
  briefTitle: varchar("brief_title", { length: 500 }),
  industryVertical: varchar("industry_vertical", { length: 255 }),
  geoTargeting: jsonb("geo_targeting"),
  demographics: jsonb("demographics"),
  affinityBuckets: jsonb("affinity_buckets"),
  inMarketSegments: jsonb("in_market_segments"),
  rawInputs: jsonb("raw_inputs"),
  aiInsights: jsonb("ai_insights"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const cpmBenchmarks = pgTable(
  "cpm_benchmarks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    industry: text("industry").notNull(),
    platform: text("platform").notNull(),
    objective: text("objective").notNull(),
    targeting: text("targeting"),
    cpm: text("cpm"),
    cpa: text("cpa"),
    geo: text("geo").notNull().default("India"),
    embedding: vector("embedding", { dimensions: 3072 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_cpm_platform").on(table.platform),
    index("idx_cpm_geo").on(table.geo),
    index("idx_cpm_industry").on(table.industry),
  ],
);

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

export const insertCpmBenchmarkSchema = createInsertSchema(cpmBenchmarks).omit({
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
export type CpmBenchmark = typeof cpmBenchmarks.$inferSelect;
export type InsertCpmBenchmark = z.infer<typeof insertCpmBenchmarkSchema>;

// Question types for the conversation flow - 11 questions
export const questionSchema = z.object({
  id: z.enum(['geo', 'demo', 'industry', 'budget', 'timeline', 'kpis', 'creative', 'competitive', 'platforms', 'affinity', 'inmarket']),
  question: z.string(),
  type: z.literal('textarea'),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  validation: z.object({
    required: z.boolean(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
  }).optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const conversationDataSchema = z.object({
  geo: z.string().optional(),
  demo: z.string().optional(),
  industry: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  kpis: z.string().optional(),
  creative: z.string().optional(),
  competitive: z.string().optional(),
  platforms: z.string().optional(),
  affinity: z.string().optional(),
  inmarket: z.string().optional(),
});

export type ConversationData = z.infer<typeof conversationDataSchema>;

// Media Brief output schema matching the JSON structure
export const mediaBriefSchema = z.object({
  brief_title: z.string(),
  industry_vertical: z.string(),
  geo_targeting: z.object({
    primary_markets: z.array(z.string()),
    secondary_markets: z.array(z.string()).optional(),
  }),
  demographics: z.object({
    age_range: z.string(),
    hhi_segment: z.string(),
  }),
  affinity_buckets: z.array(z.string()).optional(),
  in_market_segments: z.array(z.string()).optional(),
});

export type MediaBrief = z.infer<typeof mediaBriefSchema>;

// Margin Risk Assessment table
export const marginAssessments = pgTable("margin_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  workEmail: varchar("work_email", { length: 255 }).notNull(),
  roleTitle: varchar("role_title", { length: 255 }).notNull(),
  organisationName: varchar("organisation_name", { length: 255 }).notNull(),
  organisationSize: varchar("organisation_size", { length: 50 }).notNull(),
  decisionEvaluating: varchar("decision_evaluating", { length: 100 }).notNull().default("exploratory"),
  engagementType: varchar("engagement_type", { length: 50 }).notNull(),
  specifyContext: varchar("specify_context", { length: 50 }).notNull().default("single-client"),
  engagementDuration: varchar("engagement_duration", { length: 50 }).notNull(),
  clientVolatility: varchar("client_volatility", { length: 100 }).notNull(),
  stakeholderComplexity: varchar("stakeholder_complexity", { length: 50 }).notNull(),
  seniorLeadershipInvolvement: varchar("senior_leadership_involvement", { length: 50 }).notNull(),
  midLevelOversight: varchar("mid_level_oversight", { length: 50 }).notNull(),
  executionThinkingMix: varchar("execution_thinking_mix", { length: 50 }).notNull(),
  iterationIntensity: varchar("iteration_intensity", { length: 50 }).notNull(),
  scopeChangeLikelihood: varchar("scope_change_likelihood", { length: 50 }).notNull(),
  crossFunctionalCoordination: varchar("cross_functional_coordination", { length: 50 }).notNull(),
  aiImpactMeasurement: varchar("ai_impact_measurement", { length: 50 }).notNull().default("not_applicable"),
  openSignal: text("open_signal"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertMarginAssessmentSchema = createInsertSchema(marginAssessments).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type MarginAssessment = typeof marginAssessments.$inferSelect;
export type InsertMarginAssessment = z.infer<typeof insertMarginAssessmentSchema>;
