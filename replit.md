# Quiz Builder Application

## Overview

A full-stack web application for creating, managing, and taking timed quizzes. The application serves two user types: administrators who create and manage quizzes, and participants who take quizzes and receive instant feedback. Built with a modern React frontend and Express backend, featuring session-based authentication, real-time quiz timers, and comprehensive results tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Wouter for lightweight client-side routing
- TanStack Query for server state management and caching
- React Hook Form with Zod for form validation
- Shadcn UI component library with Tailwind CSS for styling

**Design Patterns:**
- Component-based architecture with shared UI components in `/client/src/components/ui`
- Custom hooks for reusable logic (`use-auth`, `use-mobile`, `use-toast`)
- Protected routes for admin-only pages using authentication middleware
- Form validation using Zod schemas that match backend database schemas

**Key Architectural Decisions:**
- **Client-side routing with Wouter**: Chosen for its minimal bundle size and simplicity over React Router
- **Query-based state management**: TanStack Query handles all server state, eliminating need for Redux/Context for API data
- **Shadcn UI over component libraries**: Provides copy-paste components that can be fully customized, avoiding vendor lock-in
- **LocalStorage for participant session**: Enables participants to resume sessions without authentication complexity

### Backend Architecture

**Technology Stack:**
- Node.js with Express for REST API server
- TypeScript for type safety across the stack
- Passport.js with local strategy for admin authentication
- Express-session with PostgreSQL store for session persistence
- Drizzle ORM for type-safe database queries

**Design Patterns:**
- RESTful API endpoints with consistent error handling
- Middleware-based authentication and authorization (isAuthenticated, isAdmin)
- Storage abstraction layer separating database logic from route handlers
- Shared schema types between frontend and backend via `/shared/schema.ts`

**Key Architectural Decisions:**
- **Session-based authentication**: Chosen over JWT for simplicity and built-in session management, better suited for admin dashboard
- **Storage abstraction interface**: The `IStorage` interface in `server/storage.ts` allows for potential database migration without changing route logic
- **Shared TypeScript schemas**: Database schemas defined once in `/shared/schema.ts` and used by both Drizzle ORM and Zod validation
- **Scrypt password hashing**: Using Node.js crypto module for secure, salted password storage

### Database Design

**Schema Architecture:**
- **users**: Admin accounts with hashed passwords and admin flags
- **participants**: Quiz takers with identifying information (roll number, class, department)
- **quizzes**: Quiz metadata including time limits, passing scores, and optional passwords
- **questions**: Multiple-choice questions linked to quizzes with correct answer tracking
- **results**: Quiz attempt records with scores and individual answer tracking (stored as JSON)

**Key Decisions:**
- **Drizzle ORM with Neon PostgreSQL**: Drizzle provides type-safe queries with minimal runtime overhead; Neon offers serverless PostgreSQL
- **JSON storage for answers**: Individual question answers stored as JSON array in results table for flexible querying without complex joins
- **Roll number as participant identifier**: Allows participants to retake quizzes or check previous results without full authentication
- **Soft-delete pattern for quizzes**: Quizzes use `isActive` flag rather than deletion to preserve historical results

### Authentication & Authorization

**Admin Authentication:**
- Passport.js local strategy with username/password
- Sessions stored in PostgreSQL for persistence across server restarts
- CSRF protection implicit through same-origin session cookies
- Protected routes check both authentication and admin status

**Participant Flow:**
- No authentication required - identified by roll number
- Participant records created on first quiz attempt
- LocalStorage caching for seamless UX across sessions

**Security Considerations:**
- Passwords hashed with scrypt (64-byte derived key with random salt)
- Session cookies with secure flag in production
- Admin-only routes protected with dual middleware (authentication + admin check)
- Quiz passwords optional for access control

### API Structure

**Route Organization:**
- `/api/login`, `/api/logout`, `/api/register`: Authentication endpoints
- `/api/participants`: Participant CRUD operations
- `/api/quizzes`: Quiz management endpoints (admin-protected)
- `/api/questions`: Question management (admin-protected)
- `/api/results`: Quiz result tracking and retrieval

**Data Flow Pattern:**
1. Frontend makes typed request using `apiRequest` utility
2. Express middleware validates authentication/authorization
3. Route handler validates input with Zod schemas
4. Storage layer executes Drizzle ORM queries
5. Response sent with consistent error handling

## External Dependencies

### Database
- **Neon PostgreSQL (@neondatabase/serverless)**: Serverless PostgreSQL with WebSocket support for Drizzle ORM
- **Drizzle ORM**: Type-safe SQL query builder and migration manager
- **connect-pg-simple**: PostgreSQL session store for express-session

### Authentication
- **Passport.js**: Authentication middleware with local strategy
- **express-session**: Session management with PostgreSQL persistence

### UI Components
- **Radix UI (@radix-ui/react-*)**: Headless UI primitives for accessible components
- **Shadcn UI**: Pre-built component patterns using Radix and Tailwind
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **Vite**: Build tool with HMR for development and optimized production builds
- **Replit plugins**: Cartographer and theme integration for Replit environment
- **TypeScript**: Type checking across frontend and backend

### Validation & Forms
- **Zod**: Schema validation for forms and API requests
- **React Hook Form**: Form state management with validation
- **@hookform/resolvers**: Zod integration for React Hook Form