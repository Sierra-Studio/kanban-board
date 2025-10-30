# 2. API Architecture with Hono

## Overview
Hono is an ultra-fast web framework embedded within Next.js API routes, providing type-safe, performant API endpoints with excellent developer experience.

## Core Architecture

### Why Hono?
- 3-4x faster than Express/Next.js API routes
- Full TypeScript support
- Zero dependencies, ~20kb bundle
- Excellent middleware ecosystem
- Works seamlessly with Next.js App Router

### Integration Pattern
- Single catch-all route: `/app/api/[[...route]]/route.ts`
- Hono handles all API routing internally
- REST API with JSON responses
- Middleware pipeline for cross-cutting concerns

## API Structure

### Route Organization
```
/api
├── /auth/*        (Better-Auth handles these)
├── /boards        (Board CRUD)
├── /boards/:id/members (Board sharing)
├── /boards/:id/columns (Column management)
├── /columns/:id/cards (Card operations)
├── /cards/:id/*   (Card details, comments, etc.)
└── /users         (User profiles, search)
```

### Middleware Stack
1. **CORS** - Configure allowed origins
2. **Logger** - Request/response logging
3. **Auth** - Session validation via Better-Auth
4. **Validation** - Zod schema validation
5. **Error Handler** - Consistent error responses

## Type-Safe Development

### API Definition
- Define routes with full TypeScript types
- Zod schemas for request validation
- Automatic type inference for responses
- Shared types between frontend and backend

## Authentication Integration

### Session Validation
1. Extract session cookie from request
2. Validate with Better-Auth
3. Attach user context to request
4. Pass to route handlers

### Protected Routes
- Auth middleware on sensitive endpoints
- Role-based access control
- Board membership verification
- Resource ownership checks

## API Endpoints

### Board Management
- `GET /boards` - List user's boards
- `POST /boards` - Create new board
- `GET /boards/:id` - Get board details
- `PATCH /boards/:id` - Update board
- `DELETE /boards/:id` - Delete board

### Column Management
- `GET /boards/:id/columns` - List columns
- `POST /boards/:id/columns` - Create column
- `PATCH /columns/:id` - Update column
- `DELETE /columns/:id` - Delete column
- `POST /columns/reorder` - Reorder columns

### Card Management
- `GET /columns/:id/cards` - List cards
- `POST /columns/:id/cards` - Create card
- `GET /cards/:id` - Get card details
- `PATCH /cards/:id` - Update card
- `DELETE /cards/:id` - Delete card
- `POST /cards/:id/move` - Move between columns

### Card Features
- `POST /cards/:id/comments` - Add comment
- `POST /cards/:id/attachments` - Upload file
- `POST /cards/:id/labels` - Add label
- `POST /cards/:id/checklist` - Create checklist

## Request/Response Patterns

### Standard Response Format
```
Success: { data: T, success: true }
Error: { error: string, code?: string, success: false }
List: { data: T[], total: number, page: number }
```

### Error Handling
- 400 - Bad Request (validation errors)
- 401 - Unauthorized (no session)
- 403 - Forbidden (no permission)
- 404 - Not Found
- 500 - Internal Server Error

### Validation Strategy
- Zod schemas for all inputs
- Type-safe validation errors
- Clear error messages
- Input sanitization

## Performance Optimizations

### Database Queries
- Use Drizzle's `with` for eager loading
- Minimize N+1 queries
- Implement pagination for lists
- Add database indexes

### Caching Strategy
- Cache user permissions
- Cache board metadata
- Use ETags for static resources
- Implement stale-while-revalidate

### Response Optimization
- Compress responses with gzip
- Implement pagination
- Lazy load nested resources
- Use partial responses where appropriate

## Security Considerations

### Input Validation
- Validate all user inputs
- Sanitize strings to prevent XSS
- Use parameterized queries (Drizzle handles this)
- Limit request body size

### Rate Limiting
- Implement per-user rate limits
- Throttle expensive operations
- Use sliding window algorithm
- Return 429 Too Many Requests

### CORS Configuration
- Restrict origins in production
- Allow credentials for cookies
- Configure allowed methods
- Set appropriate headers

## Testing Strategy
- Unit tests for middleware
- Integration tests for endpoints
- Type checking with TypeScript
- API contract testing

## Implementation Checklist
- [ ] Install Hono and dependencies
- [ ] Create catch-all API route
- [ ] Set up middleware pipeline
- [ ] Implement auth middleware
- [ ] Create board endpoints
- [ ] Create column endpoints
- [ ] Create card endpoints
- [ ] Add error handling
- [ ] Implement rate limiting