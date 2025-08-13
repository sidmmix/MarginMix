# Digital Media Campaign Planner

## Overview

This is a full-stack web application that helps users create comprehensive digital media campaign plans through an AI-powered conversational interface. The application features a professional landing page that introduces the platform, then guides users through a structured questionnaire to gather campaign requirements and generates intelligent insights and recommendations using OpenAI's GPT models. Built with React, Express, and PostgreSQL, it features a modern UI with shadcn/ui components and integrates with multiple advertising platforms including Google Ads, DV360/YouTube, and Meta Marketing APIs.

## Recent Changes

- **Google OAuth Integration Complete (August 13, 2025)**: Successfully configured Google OAuth with live credentials, users can now sign in with Google accounts alongside email/password authentication
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
Brand messaging: Prominently feature YourBrief's AI media strategist positioning and live data capabilities on landing page.

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
- **API Design**: RESTful endpoints with structured error handling
- **Session Management**: In-memory storage with extensible interface for database integration
- **AI Integration**: OpenAI API for generating campaign insights and recommendations

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Type-safe database schemas with automatic TypeScript generation
- **Migration System**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

### Authentication and Authorization
- **Current State**: Basic session-based authentication structure in place
- **Storage**: User credentials stored in PostgreSQL with bcrypt hashing capability
- **Session Management**: Extensible session storage interface supporting both memory and database persistence

### Conversation Flow Management
- **Multi-step Process**: Structured questionnaire with 8 predefined questions
- **State Persistence**: Session data stored as JSONB for flexible data structures
- **Progress Tracking**: Current step and completion status maintained per session
- **Validation**: Client and server-side validation using Zod schemas

### AI-Powered Insights
- **OpenAI Integration**: GPT-4 models for campaign analysis and recommendations
- **Campaign Brief Generation**: Automated creation of comprehensive campaign documents
- **Platform-specific Strategies**: Tailored recommendations for Google Ads, YouTube/DV360, and Meta platforms
- **Budget Allocation**: Intelligent distribution across selected advertising platforms

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