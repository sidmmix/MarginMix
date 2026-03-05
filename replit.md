# Margin Mix - Financial Reasoning Engine

## Overview

Margin Mix is a full-stack web application that serves as an Intelligent Financial Reasoning Engine built on the World's first Workforce Intensity Matrix. Designed specifically for Media Agencies to be more profitable, it helps identify margin leaks, optimize resource allocation, and maximize agency profitability. Built with React, Express, and PostgreSQL, it features a modern UI with shadcn/ui components and an emerald/teal color scheme.

## Recent Changes

- **Final Decision Page & Heatmap (February 6, 2026)**: Added comprehensive Final Decision Page after assessment submission replacing the simple confirmation dialog. Shows: verdict banner, 6 risk dimension cards (WI/CE/Commercial/Volatility/Confidence/Measurement), 5 bucket scores with progress bars, effort allocation bars, dominant drivers, structural risk signals (saturation/AI impact/risk source/correctability), contradiction flags, and actionable recommendations per verdict type. Progressive heatmap added to assessment header matching profiler style (green/amber/red cells per question). PDFs auto-download during decision page display. Decision logic verified consistent between profiler and full assessment (identical precedence rules from decisionTable.ts).
- **Quick Risk Profiler (February 6, 2026)**: Added 60-second Quick Margin Risk Profiler using 6 key questions (Q6, Q8, Q10, Q12, Q14, Q22). Full assessment skips these 6 when coming from profiler, leaving 17 questions correctly numbered 1–17. Features Typeform-style full-screen gradient UI matching main assessment, progressive heatmap that updates in real-time, risk calculation aligned with decision engine logic (same verdict precedence rules), and "Get Full Margin Risk Decision Clarity" button that passes answers to the full assessment. Full assessment detects `?from=profiler` param to skip already-answered questions and renumber remaining ones. Route: /quick-profiler.
- **PDF Template Updates (February 1, 2026)**: Updated Decision Memo and Assessment Output PDFs to match latest template specifications. Decision Memo now includes: Decision Context (with pricing structure), Margin Risk Verdict, Primary Drivers of Risk, Pricing & Governance Implications, What Would Need to Change, Recommendation. Assessment Output includes: Executive Snapshot, Risk Dimension Summary (WI/CE/Commercial/Volatility), Effort Bands & Allocation, Structural Risk Signals, Override Conditions, What This Assessment Measures/Does Not Measure.
- **Weighted Scoring Model (March 5, 2026)**: Replaced first-match precedence verdict logic with a weighted scoring model to improve accuracy and catch accumulated medium-risk engagements. Confidence Signal = Negative retained as a hard override (non-negotiable, fires before scoring). Remaining 5 dimensions scored with weights: Workforce Intensity 30%, Coordination Entropy 25%, Commercial Exposure 20%, Volatility Control 15%, Measurement Maturity 10%. Score thresholds: 0–19 Safe, 20–39 Execution Heavy, 40–59 Price Sensitive, 60–79 Structurally Fragile, 80–100 Do Not Proceed. Key fix: all-medium scenario now correctly returns Price Sensitive (score 50) instead of Structurally Safe. compositeRiskScore on decision page now reflects actual weighted score.
- **Pure Rule-Based Decision Engine Refactor (February 1, 2026)**: Complete refactoring of decision engine to be purely rule-based with NO scoring math, NO ML, NO AI in verdict logic. New 7-layer architecture: types.ts (canonical Level/Confidence/Verdict types), questionMapper.ts (Q6-Q23→signals), dimensionMapper.ts (if-then rules only), decisionTable.ts (strict precedence: Low Confidence override takes priority over Structural Overload), effortAllocator.ts (verdict→effort), contradictionDetector.ts (soft flags), engine.ts (orchestrator). Numeric scores retained for PDF display only.
- **PDF Generation & GPT-4.1 Narratives (January 30, 2026)**: Added dual PDF output system (Decision Memo + Assessment Output). PDFs auto-download on submission and are sent via email as attachments. GPT-4.1 generates narrative explanations only - it cannot recalculate scores, change bands, or override verdicts. Fallback narrative provided if GPT fails. Files: narrative-generator.ts, pdf-renderer.ts.
- **Brand Rebrand to Margin Mix (December 26, 2025)**: Complete rebrand from YourBrief to Margin Mix with new value proposition: "The Financial Reasoning Engine for Media Agencies - Stopping Margin Leak!" Updated all branding, colors (blue → emerald/teal), messaging, and feature descriptions across the entire application.
- **DNA_Scraper Capability (December 26, 2025)**: Added Playwright-based web scraper that analyzes websites and generates Brand Briefs with brand_name, industry_category, top_3_usps, and complexity_score using GPT-4o-mini.
- **11-Question Comprehensive Brief System with Platform CPM/Impressions (October 21, 2025)**: Expanded questionnaire to 11 strategic open-ended questions covering Geo, Demo, Industry, Budget, Timeline, KPIs, Creative, Competitive, Platforms, Affinity, and InMarket segments.
- **Dashboard UI Overhaul (October 2, 2025)**: Removed PDF generation, rebuilt dashboard with clean React components showing campaign details, AI recommendations, budget allocation, KPIs, and platform strategies displayed on-page
- **Comprehensive Security Audit & Hardening (August 19, 2025)**: Completed full backend security review and implemented enterprise-grade security measures including input validation, rate limiting, CORS protection, security headers, and environment validation
- **OAuth-Only Authentication (August 13, 2025)**: Removed email/password authentication, now using only Google and Meta OAuth for streamlined social sign-in experience
- **AI Features Cost-Optimized (August 13, 2025)**: Migrated all OpenAI API calls from GPT-4o to GPT-4o mini for better cost efficiency

## User Preferences

Preferred communication style: Simple, everyday language.
OAuth setup priority: Deferred for later refinement, focus on core functionality first.
Brand messaging: Prominently feature Margin Mix's Financial Reasoning Engine positioning and Workforce Intensity Matrix on landing page.
AI Policy: OpenAI enabled for backend brief generation and insights. Smart suggestions disabled in questionnaire interface to maintain clean user experience.
Product Focus: Financial reasoning engine for media planning margins and media mix optimization.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (emerald/teal color scheme)
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with comprehensive input validation and security middleware
- **Security**: Enterprise-grade protection with rate limiting, CORS, input sanitization, and security headers
- **Session Management**: Database-backed session storage with PostgreSQL
- **AI Integration**: OpenAI API for generating campaign insights and recommendations

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Type-safe database schemas with automatic TypeScript generation
- **Migration System**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

### DNA_Scraper Module
- **Web Scraping**: Playwright with Chromium for JavaScript-rendered websites
- **Data Extraction**: Cheerio for parsing HTML (page title, meta description, headers, nav items)
- **AI Analysis**: GPT-4o-mini generates structured Brand Brief JSON
- **Output Schema**: brand_name, industry_category, top_3_usps, complexity_score (1-10)
- **Error Handling**: Generic Brief fallback ensures user flow never breaks
- **Endpoint**: POST /api/dna-scraper

### Authentication and Authorization
- **OAuth-Only System**: Google and Meta OAuth providers for secure authentication
- **Session Security**: Enhanced session management with CSRF protection and secure cookies
- **Rate Limiting**: Brute force protection with IP-based attempt tracking
- **Security Headers**: Comprehensive security headers including XSS, CSRF, and clickjacking protection

### Deterministic Decision Engine (server/decision-engine/)
A pure rule-based decision system for margin risk assessment. NO scoring math, NO ML, NO AI in verdict logic.

**Layer 1 - types.ts**: Canonical Type Definitions
- Level: "low" | "medium" | "high"
- Confidence: "positive" | "neutral" | "negative"
- Verdict: 5 possible outcomes (Structurally Safe → Do Not Proceed Without Repricing)
- Signals: 15 atomic indicators derived from assessment questions

**Layer 2 - questionMapper.ts**: Question → Signal Extraction
- Maps Q6-Q23 responses to atomic signals (Q1-Q5 are context only)
- Pure mapping functions, no scoring

**Layer 3 - dimensionMapper.ts**: Signal → Dimension Promotion
- If-then rules ONLY (no numeric calculations)
- Dimensions: workforceIntensity, coordinationEntropy, commercialExposure, volatilityControl, confidenceSignal, measurementMaturity

**Layer 4 - decisionTable.ts**: Verdict Logic with Strict Precedence
- OVERRIDES (highest priority): Low Confidence → Do Not Proceed, Structural Overload → Fragile
- PRIMARY: High Commercial → Price Sensitive, High Workforce → Execution Heavy
- DEFAULT: Structurally Safe

**Layer 5 - effortAllocator.ts**: Verdict → Effort Allocation
- Derived AFTER verdict is determined (never influences verdict)
- Senior/Mid/Junior percentages based on verdict

**Layer 6 - contradictionDetector.ts**: Soft Flags
- Detects inconsistent inputs (confidence mismatch, effort mismatch, scope contradiction)

**Layer 7 - engine.ts**: Orchestrator
- Runs all layers in sequence
- Returns canonical {signals, dimensions, verdict, flags, effortAllocation}

**index.ts**: Integration Layer
- Bridges decision engine with PDF/email systems
- Numeric scores are for DISPLAY ONLY (not used in verdict logic)
- Saturation detection: Value saturation, optics-driven staffing, upward cost shift
- AI impact classification: Accretive, Neutral, Fragile, Dilutive
- Risk source attribution: Structural, Behavioral, Technology-Amplified, Mixed

**Layer 4 - verdict.ts**: Margin Risk Classification
- Risk bands: Low, Moderate, High, Very High
- Verdicts: Structurally Viable, Conditionally Viable, Structurally Fragile, Economically Non-Viable
- Effort distribution: Senior/Mid/Junior percentages
- Dominant driver identification

**Layer 5 - decisionObject.ts**: Immutable System-of-Record
- Canonical output object with readonly properties
- Contains all computed values for rendering
- GPT uses this for narrative generation only (no recalculation)

### AI-Powered Financial Reasoning
- **Workforce Intensity Matrix**: World's first framework correlating workforce effort with media planning margins
- **Margin Leak Detection**: Automatically identify where agencies lose money on media planning
- **Media Mix Optimization**: Data-driven recommendations for optimal budget allocation
- **Profitability Insights**: Clear visibility into margins, costs, and profit potential per campaign

## External Dependencies

### Core Technology Stack
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **openai**: Official OpenAI API client for GPT integration
- **express**: Web application framework for Node.js
- **react**: Frontend UI library with TypeScript support
- **@tanstack/react-query**: Data fetching and caching library
- **playwright**: Browser automation for DNA_Scraper
- **cheerio**: HTML parsing for web scraping

### UI and Design System
- **@radix-ui/***: Accessible UI primitives (40+ components including dialogs, dropdowns, forms)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Comprehensive icon library

### Development and Build Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

### Data Processing and Validation
- **zod**: TypeScript-first schema validation
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas
- **date-fns**: Date manipulation and formatting utilities
