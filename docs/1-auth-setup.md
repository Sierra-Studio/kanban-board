# 1. Authentication Setup with Better-Auth

## Overview
Simple email/password authentication using Better-Auth - a modern, type-safe authentication library that works seamlessly with Next.js and Drizzle ORM.

## Core Requirements

### Features
- Email/password authentication only (no OAuth for MVP)
- Session-based authentication (database sessions)
- Protected routes and API endpoints
- User profile management
- No password reset (MVP)
- No email verification (MVP)

### Database Schema
```
users
- id (UUID, primary key)
- email (unique)
- name (optional)
- emailVerified (boolean)
- image (avatar URL, optional)
- role (user/admin)
- timestamps

sessions
- id (UUID, primary key)
- userId (foreign key)
- expiresAt
- ipAddress
- userAgent

accounts
- id (UUID, primary key)
- userId (foreign key)
- providerId ("credential")
- password (hashed)
```

## Technical Architecture

### Server Configuration
- Better-Auth instance with Drizzle adapter
- SQLite database via libsql
- 7-day session expiry
- Cookie-based sessions (httpOnly, secure, sameSite)

### Client Integration
- Better-Auth React client
- Hooks for useSession, useUser
- Type-safe authentication methods

### API Endpoints (Auto-generated)
- `POST /api/auth/sign-up` - Register new user
- `POST /api/auth/sign-in` - Login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session

## Authentication Flows

### Sign Up
1. User submits email, password, name
2. Validate input (email format, password strength)
3. Hash password with bcrypt
4. Create user and account records
5. Auto sign-in after successful signup
6. Redirect to dashboard

### Sign In
1. User submits email and password
2. Validate credentials against database
3. Create new session
4. Set session cookie
5. Redirect to dashboard

### Session Protection
1. Check session cookie on protected routes
2. Validate session in database
3. Redirect to signin if invalid
4. Update session activity timestamp

### Sign Out
1. Delete session from database
2. Clear session cookie
3. Redirect to signin page

## Security Considerations

### Password Security
- Minimum 8 characters
- Bcrypt hashing with salt rounds
- No plain text storage

### Session Security
- HTTP-only cookies (prevent XSS)
- Secure flag in production
- SameSite=lax (CSRF protection)
- Session rotation on privilege escalation

### Rate Limiting
- Limit signup attempts (10 per hour per IP)
- Limit signin attempts (5 per 15 minutes)
- Exponential backoff for failed attempts

## Environment Variables
```
DATABASE_URL
BETTER_AUTH_SECRET (32-byte random string)
BETTER_AUTH_URL
NEXT_PUBLIC_APP_URL
```

## Implementation Checklist
- [ ] Install better-auth and dependencies
- [ ] Create database schema
- [ ] Configure Better-Auth server
- [ ] Set up client authentication
- [ ] Create auth pages (signin, signup)
- [ ] Implement protected route layout
- [ ] Add session middleware for API
- [ ] Test authentication flows