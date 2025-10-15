# Quiz Builder Application - Developer Guide

This guide provides technical information for developers who want to understand, customize, or extend the Quiz Builder application.

## Architecture Overview

The application follows a modern full-stack architecture:

```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main application component
│
├── server/              # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── auth.ts          # Authentication logic
│   ├── storage.ts       # Database access layer
│   └── vite.ts          # Development server integration
│
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema and types
│
└── db/                  # Database configuration
    ├── index.ts         # Database connection
    └── seed.ts          # Seed data for development
```

## Technology Stack

- **Frontend**:
  - React (with TypeScript)
  - TanStack Query for data fetching
  - Wouter for routing
  - Shadcn UI for component library
  - Tailwind CSS for styling
  - Zod for validation
  - React Hook Form for form handling

- **Backend**:
  - Node.js with Express
  - TypeScript
  - Passport.js for authentication
  - Express-session for session management

- **Database**:
  - PostgreSQL
  - Drizzle ORM for database access
  - Drizzle Kit for schema migrations

## Development Setup

1. **Prerequisites**:
   - Node.js (v16+)
   - npm or yarn
   - PostgreSQL database

2. **Environment Setup**:
   Create a `.env` file in the root directory with:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/quiz_app
   SESSION_SECRET=your_session_secret
   ```

3. **Installation**:
   ```bash
   # Install dependencies
   npm install

   # Push database schema
   npm run db:push

   # Seed the database
   npm run db:seed

   # Start development server
   npm run dev
   ```

## Database Schema

### Entity Relationship Diagram

```
Users(1) -- creates --> Quizzes(n)
Quizzes(1) -- contains --> Questions(n)
Participants(1) -- takes --> Quizzes(n) -- produces --> Results(n)
Participants(1) -- has --> Results(n)
Results(n) -- belongs to --> Quizzes(1)
```

### Main Tables

- **users**: Admin users who create and manage quizzes
- **participants**: End users who take quizzes
- **quizzes**: Quiz content and settings
- **questions**: Individual questions belonging to quizzes
- **results**: Quiz attempt results with scores and answers

## Key APIs

### Authentication Endpoints

- `POST /api/register`: Register new admin user
- `POST /api/login`: Authenticate admin user
- `POST /api/logout`: End admin session
- `GET /api/user`: Get current authenticated user

### Participant Endpoints

- `POST /api/participants`: Register new participant
- `GET /api/participants/:id`: Get participant by ID

### Quiz Endpoints

- `GET /api/quizzes`: Get all quizzes
- `GET /api/quizzes/:id`: Get quiz by ID
- `POST /api/quizzes`: Create new quiz
- `PUT /api/quizzes/:id`: Update quiz
- `DELETE /api/quizzes/:id`: Delete quiz

### Question Endpoints

- `GET /api/questions`: Get all questions
- `GET /api/questions/:id`: Get question by ID
- `POST /api/questions`: Create new question
- `PUT /api/questions/:id`: Update question
- `DELETE /api/questions/:id`: Delete question

### Result Endpoints

- `GET /api/results`: Get all results (with optional filters)
- `GET /api/results/:id`: Get detailed result by ID
- `POST /api/results`: Submit quiz result

## Authentication Flow

1. Admin authenticates via `/api/login`
2. Session cookie is set
3. Authenticated routes check `req.isAuthenticated()`
4. Admin routes also verify `req.user.isAdmin`

## Frontend State Management

The application uses TanStack Query (React Query) for data fetching and state management:

1. **Query Keys**:
   - Follow pattern like `['/api/resource', id]`
   - Use consistent patterns for cache invalidation

2. **Auth Context**:
   - Provides current user state
   - Exposes login/logout/register mutations
   - Handles redirects for protected routes

3. **Form Handling**:
   - Use react-hook-form with zod validation
   - Consistent error handling patterns

## Extending the Application

### Adding New Features

1. **New question types**:
   - Extend the `Question` type in `schema.ts`
   - Update the question component in the UI
   - Modify the scoring algorithm in `quiz-interface.tsx`

2. **User roles and permissions**:
   - Add role field to `User` schema
   - Create middleware for role-based access control
   - Update UI to show/hide features based on role

3. **Quiz categories**:
   - Add `Category` table to schema
   - Create relationship between quizzes and categories
   - Add category filter to quiz list

### Styling Customizations

1. **Theme**:
   - Modify colors in `tailwind.config.ts`
   - Update CSS variables in `index.css`

2. **Layout**:
   - Components like `sidebar.tsx` control main layout
   - Update responsive breakpoints in components

## Best Practices

1. **Type Safety**:
   - Use TypeScript interfaces for all data structures
   - Leverage Zod schemas for validation

2. **API Error Handling**:
   - Consistent error responses
   - Client-side error handling with toasts

3. **Performance**:
   - Use query caching effectively
   - Implement pagination for large result sets

4. **Security**:
   - Validate all inputs with Zod
   - Use prepared statements (built into Drizzle)
   - Implement proper authentication checks

## Testing

1. **Unit Tests**:
   - Test utilities and helpers
   - Test form validation

2. **Integration Tests**:
   - Test API endpoints
   - Test database operations

3. **E2E Tests**:
   - Test complete user flows
   - Test authentication

## Common Issues and Solutions

1. **Database Connection Issues**:
   - Check DATABASE_URL format
   - Verify database user permissions
   - Check for network/firewall issues

2. **Type Errors**:
   - Ensure schema.ts exports correct types
   - Check for nullable fields

3. **Authentication Problems**:
   - Verify session configuration
   - Check CORS settings for cross-origin issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.