# Digital Media Campaign Planner

## Overview

This is a full-stack web application that helps users create comprehensive digital media campaign plans through an AI-powered conversational interface. The application features a professional landing page that introduces the platform, then guides users through a structured questionnaire to gather campaign requirements and generates intelligent insights and recommendations using OpenAI's GPT models. Built with React, Express, and PostgreSQL, it features a modern UI with shadcn/ui components and integrates with multiple advertising platforms including Google Ads, DV360/YouTube, and Meta Marketing APIs.

## Recent Changes

- **11-Question Comprehensive Brief System (October 21, 2025)**: Expanded questionnaire to 11 strategic open-ended questions covering Geo, Demo, Industry, Budget, Timeline, KPIs, Creative, Competitive, Platforms, Affinity, and InMarket segments. Enhanced VP of Media Strategy AI to generate comprehensive briefs including budget_details, campaign_objectives, creative_strategy, competitive_analysis, and platform_strategy. Dashboard updated to display all enhanced brief sections with structured insights.
- **Dashboard UI Overhaul (October 2, 2025)**: Removed PDF generation, rebuilt dashboard with clean React components showing campaign details, AI recommendations, budget allocation, KPIs, and platform strategies displayed on-page
- **Comprehensive Security Audit & Hardening (August 19, 2025)**: Completed full backend security review and implemented enterprise-grade security measures including input validation, rate limiting, CORS protection, security headers, and environment validation
- **OAuth-Only Authentication (August 13, 2025)**: Removed email/password authentication, now using only Google and Meta OAuth for streamlined social sign-in experience
- **AI Features Cost-Optimized (August 13, 2025)**: Migrated all OpenAI API calls from GPT-4o to GPT-4o mini for better cost efficiency while maintaining intelligent conversation quality
- **Landing Page Brand Enhancement (August 13, 2025)**: Added prominent brand highlight statement emphasizing YourBrief's AI media strategist positioning and live data capabilities
- **Intelligent Conversation System (August 13, 2025)**: Enhanced campaign planner with AI-powered predictive responses, contextual insights, dynamic question adaptation, and intelligent input suggestions using OpenAI GPT-4o mini
- **Smart Input Components**: Implemented IntelligentInput component with real-time suggestions, contextual hints, validation feedback, and next question previews
- **Real-time AI Analysis**: Added ConversationInsights panel with live strategy insights, recommendations, and potential challenge identification
- **Enhanced Chat Experience**: Upgraded chat interface with intelligent features including answer enhancement, quality scoring, and contextual conversation flow
- **OAuth Authentication Framework (August 13, 2025)**: Implemented complete OAuth system for Google and Meta authentication with proper strategy configuration, credential validation, and comprehensive setup guide
- **Authentication Flow Stabilization**: Fixed infinite loops and strategy errors, established stable email/password authentication as primary method with OAuth as optional enhancement
- **Landing Page Implementation (August 13, 2025)**: Created professional dedicated landing page for yourbrief.co featuring hero section, features overview, how-it-works steps, benefits, and clear call-to-action buttons leading to the campaign planner
- **Campaign Planner Completion**: Full 8-step questionnaire with AI brief generation working end-to-end
- **User Journey Optimization**: Landing page → Campaign planner → Authentication → Dashboard flow established and tested

## User Preferences

Preferred communication style: Simple, everyday language.
OAuth setup priority: Deferred for later refinement, focus on core functionality first.
Brand messaging: Prominently feature YourBrief's AI media strategist positioning on landing page.
AI Policy: OpenAI enabled for backend brief generation and insights. Smart suggestions disabled in questionnaire interface to maintain clean user experience.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
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

### Authentication and Authorization
- **OAuth-Only System**: Google and Meta OAuth providers for secure authentication
- **Session Security**: Enhanced session management with CSRF protection and secure cookies
- **Rate Limiting**: Brute force protection with IP-based attempt tracking
- **Security Headers**: Comprehensive security headers including XSS, CSRF, and clickjacking protection

### Conversation Flow Management
- **Comprehensive 11-Question System**: Open-ended textarea questions collecting: Geo, Demo, Industry, Budget, Timeline, KPIs, Creative, Competitive, Platforms, Affinity, InMarket segments
- **State Persistence**: Session data stored as JSONB for flexible data structures
- **Progress Tracking**: Current step and completion status maintained per session
- **Validation**: Client and server-side validation using Zod schemas

### AI-Powered Media Brief Generation
- **VP of Media Strategy Role**: OpenAI GPT-4o-mini acting as VP with 15 years experience processing 11 comprehensive inputs
- **Natural Language Processing**: Converts raw user inputs into professional industry-standard media planning terminology (e.g., 'rich people' → 'High-Net-Worth Individual (HNI)', '$50K monthly' → 'Monthly Investment: $50,000 USD')
- **Structured JSON Output**: Forces JSON response format with comprehensive schema validation (2500 max tokens)
- **Enhanced Brief Schema**: Outputs briefTitle, industryVertical, geoTargeting, demographics, budget_details (total_budget, flight_duration, allocation_strategy), campaign_objectives (primary_kpi, secondary_kpis, target_timeline), creative_strategy (messaging_theme, key_messages), competitive_analysis (key_competitors, differentiation), platform_strategy (recommended_platforms, rationale), affinityBuckets, inMarketSegments
- **Fallback Handling**: Graceful degradation with structured fallback briefs when AI processing fails
- **Dashboard Display**: Comprehensive on-page brief display with dedicated cards for Budget Strategy, Campaign Objectives, Creative Strategy, Competitive Analysis, Platform Strategy, plus all raw inputs

## External Dependencies

### Core Technology Stack
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **openai**: Official OpenAI API client for GPT integration
- **express**: Web application framework for Node.js
- **react**: Frontend UI library with TypeScript support
- **@tanstack/react-query**: Data fetching and caching library

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

### Planned Integrations
- **Google Ads API**: Campaign forecasting and audience estimation
- **DV360 API**: Display and video advertising reach planning
- **YouTube Reach Planner API**: Video campaign reach forecasting
- **Meta Marketing API**: Facebook and Instagram reach and frequency planning
- **Google Cloud Platform**: Backend API hosting and orchestration

### Data Processing and Validation
- **zod**: TypeScript-first schema validation
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas
- **date-fns**: Date manipulation and formatting utilities