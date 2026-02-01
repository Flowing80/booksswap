# BooksSwap

## Overview

A community book swapping platform where users can exchange books with people in their local postcode area. The application supports both adult and children's books, features a subscription-based model (£0.50/month) for premium access, gamification through badges, and includes safety guidelines for in-person meetups.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2026-01-31**: Implemented full authentication system with JWT tokens, email/password login
- **2026-01-31**: Added Stripe subscription integration (£0.50/month) with webhook handling
- **2026-01-31**: Added SendGrid email notifications for swap workflow events
- **2026-01-31**: Enhanced swap flow: request → accept/reject → complete with status tracking
- **2026-01-31**: Added book condition tracking (like-new, good, fair, poor)
- **2026-01-31**: Implemented badge system with milestones (First Swap, 5 Swaps, 10 Swaps, Book Uploader, etc.)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with custom theme variables
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Build Tool**: Vite with custom plugins for Replit deployment

The frontend follows a single-page application pattern with client-side routing. Components are organized in `client/src/components/ui/` for reusable UI primitives and `client/src/pages/` for route-specific views.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx for development, esbuild for production
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: JWT tokens stored in localStorage, with Bearer token headers

The server handles both API routes and serves the static frontend in production. Development uses Vite's middleware mode for hot module replacement.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with `db:push` command for schema sync

Key entities: users, books, badges, swap_requests. Users have postcode-based filtering, subscription status tracking, and swap count for leaderboards.

### Authentication & Authorization
- **Method**: Email/password with bcrypt hashing
- **Session**: Stateless JWT tokens (no session store)
- **Protected Routes**: Middleware function `authenticateToken` validates JWT
- **Subscription Gating**: `requireSubscription` middleware checks user's subscription status

### Payment Integration
- **Provider**: Stripe for subscription payments
- **Webhook Handling**: Raw body parsing for Stripe signature verification
- **Subscription Management**: Checkout sessions, cancellation, and status tracking

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing and subscription management (requires `STRIPE_SECRET_KEY`)
- **SendGrid**: Transactional emails for swap notifications and welcome messages (requires `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing (has fallback for development)
- `STRIPE_SECRET_KEY`: Stripe API key (optional - payment features disabled if not set)
- `STRIPE_PRICE_ID`: Stripe Price ID for the £0.50/month subscription
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `SENDGRID_API_KEY`: SendGrid API key (optional - emails skipped if not set)
- `SENDGRID_FROM_EMAIL`: Sender email address for notifications

### Key NPM Dependencies
- `drizzle-orm` / `drizzle-kit`: Database ORM and migration tooling
- `pg`: PostgreSQL client
- `jsonwebtoken`: JWT handling
- `bcrypt`: Password hashing
- `@sendgrid/mail`: Email delivery
- `stripe`: Payment processing
- `zod`: Schema validation (shared between client/server)