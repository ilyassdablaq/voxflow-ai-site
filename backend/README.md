# VoxAI Backend

Production-ready backend for VoxAI SaaS voice platform.

## Stack
- Node.js + TypeScript
- Fastify (REST + WebSocket)
- PostgreSQL + Prisma
- Redis + BullMQ
- Docker + Compose

## Architecture
Clean modular architecture:
- `modules/*`: controller/routes + service + repository
- `services/*`: cross-domain services (AI orchestration, RAG)
- `infra/*`: technical adapters (DB, cache, queue, WS)
- `common/*`: middleware, errors, plugins
- `config/*`: environment and logger

## Implemented Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/contact`
- `GET /api/plans`
- `POST /api/conversations`
- `GET /api/conversations/:id/messages`
- `GET /health`
- `WS /ws/conversations/:id`

## Quick Start
1. Copy env file:
   - `cp .env.example .env`
2. Start infra (from repo root):
   - `docker compose -f docker-compose.backend.yml up -d postgres redis`
3. Install deps:
   - `cd backend && npm install`
4. Generate prisma client:
   - `npm run prisma:generate`
5. Run migrations:
   - `npm run prisma:migrate`
6. Seed plans:
   - `npx tsx prisma/seed.ts`
7. Start backend:
   - `npm run dev`

## Docker Full Stack
From repo root:
- `docker compose -f docker-compose.backend.yml up --build`

## Security
- JWT access + refresh token flow
- bcrypt password hashing
- RBAC helpers (`USER`, `ADMIN`)
- API key middleware support (`x-api-key`)
- Helmet, CORS, rate limiting via Redis
- Centralized error format

## Billing & Usage
- `UsageService` tracks minutes/tokens
- Enforces active plan limits before conversation creation
- Designed for Stripe integration extension in billing module

## RAG
- Uses `pgvector` extension in PostgreSQL
- `KnowledgeChunk.embedding` stores vectors (`vector(1536)`)
- Retrieval by nearest neighbor (`<->`) and prompt injection in `RagService`

## Queue Jobs (BullMQ)
- `transcription`
- `webhook` (retry/backoff)
- `aiTasks`

## Notes
- AI providers are modular; mock providers included.
- Replace `Mock*Provider` classes with real SDK providers (OpenAI, Deepgram, ElevenLabs, etc.).
