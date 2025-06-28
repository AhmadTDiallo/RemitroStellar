# replit.md

## Overview

Remitro is a B2B money remittance platform built as a full-stack web application that enables businesses to send and receive payments using the Stellar blockchain network. The application provides a modern web interface for business registration, wallet management, and cross-border money transfers using USDC stablecoin.

## System Architecture

The application follows a client-server architecture with clear separation of concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Blockchain Integration**: Stellar SDK for wallet creation and transaction management

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend server
├── shared/          # Shared TypeScript types and schemas
└── migrations/      # Database migration files
```

## Key Components

### Database Schema (PostgreSQL + Drizzle)
- **businesses**: User accounts with encrypted passwords
- **wallets**: Stellar wallet keypairs linked to businesses
- **transactions**: Payment transaction records with Stellar transaction hashes

The database uses Drizzle ORM for type-safe database operations and schema management. Drizzle Kit handles migrations and schema synchronization.

### Authentication System
- JWT token-based authentication
- Secure password hashing with bcrypt
- Token validation middleware for protected routes
- Session management using localStorage on the client

### Stellar Integration
- Automatic wallet creation for new business registrations
- USDC trustline establishment for each wallet
- Testnet integration for development and testing
- Transaction submission and status tracking

### UI Components
- Comprehensive component library using shadcn/ui
- Responsive design with mobile-first approach
- Form validation using React Hook Form with Zod schemas
- Toast notifications for user feedback

## Data Flow

1. **User Registration**: Business registers → Stellar wallet created → USDC trustline added → JWT token issued
2. **Authentication**: Login credentials validated → JWT token issued → Token stored in localStorage
3. **Money Transfer**: Form submission → Stellar transaction created → Transaction status tracked → Database updated
4. **Dashboard**: Real-time balance display → Transaction history → Wallet management

## External Dependencies

### Blockchain Services
- **Stellar Testnet**: Horizon API for transaction submission and account management
- **Friendbot**: Testnet XLM funding for new accounts
- **USDC Asset**: Circle's USDC stablecoin on Stellar testnet

### Database
- **Neon Database**: Serverless PostgreSQL hosting (configured via DATABASE_URL)
- Connection pooling and automatic scaling

### Development Tools
- **Replit Integration**: Custom Vite plugins for development environment
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast production builds

## Deployment Strategy

### Development Environment
- Vite dev server with hot module replacement
- Express server with development middleware
- In-memory storage fallback for local development
- Replit-specific development tooling integration

### Production Build
- Client: Vite production build to `dist/public`
- Server: ESBuild bundle to `dist/index.js`
- Static file serving from Express
- Environment-based configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Environment mode (development/production)
