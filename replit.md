# Margin Mix - Financial Reasoning Engine

## Overview

Margin Mix is a full-stack web application that serves as an Intelligent Financial Reasoning Engine built on the World's first Workforce Intensity Matrix. Designed specifically for Media Agencies to be more profitable, it helps identify margin leaks, optimize resource allocation, and maximize agency profitability. Built with React, Express, and PostgreSQL, it features a modern UI with shadcn/ui components and an emerald/teal color scheme.

## Recent Changes

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
