# VoxFlow AI Site

VoxFlow AI Site is a full-stack application with a React frontend and a Fastify backend. It provides authentication, conversation workflows, subscription management, integrations, analytics, and voice-related features.

## Project Structure

- `src/`: Frontend application (React + Vite + TypeScript)
- `backend/src/`: Backend API (Fastify + Prisma + TypeScript)
- `public/`: Static frontend assets
- `backend/prisma/`: Database schema, migrations, and seed data

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- React Router
- React Query
- Tailwind CSS
- Vitest + Testing Library

### Backend
- Fastify
- Prisma
- PostgreSQL
- TypeScript
- Stripe
- OpenAI SDK
- Vitest

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL (for backend)

## Setup

1. Install frontend dependencies from repository root:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

3. Configure environment variables.

Frontend: create `.env` in the repository root.

```env
VITE_API_URL=http://localhost:4000
```

Backend: create `.env` in `backend/`.

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voxflow
JWT_SECRET=replace_with_secure_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
STRIPE_SECRET_KEY=replace_if_using_stripe
STRIPE_WEBHOOK_SECRET=replace_if_using_stripe
OPENAI_API_KEY=replace_if_using_openai
```

4. Run Prisma migrations and generate client:

```bash
cd backend
npm run prisma:generate
npm run prisma:deploy
cd ..
```

Optional seed:

```bash
cd backend
npm run prisma:seed
cd ..
```

## Run the Application

### Frontend (from root)

```bash
npm run dev
```

### Backend (from `backend/`)

```bash
npm run dev
```

## Build

### Frontend

```bash
npm run build
```

### Backend

```bash
cd backend
npm run build
```

## Test

### Frontend

```bash
npm run test
```

### Backend

```bash
cd backend
npm run test
```

## Lint

### Frontend

```bash
npm run lint
```

### Backend

```bash
cd backend
npm run lint
```

## Main Features

- Authentication with access and refresh tokens
- Password reset flow
- Subscription and plan management
- Stripe checkout and webhook handling
- Conversation and workflow modules
- Analytics and dashboard endpoints
- Integration and developer portal modules

## Production Notes

- Use strong secrets for JWT and external providers
- Restrict CORS origins in backend configuration
- Ensure database migrations are applied before deployment
- Configure Stripe and OpenAI keys only in secure environments
- Run both frontend and backend test suites in CI before release
