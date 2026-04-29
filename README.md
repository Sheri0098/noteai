# NoteAI FYP (Frontend + Backend)

This project now includes:

- React + Vite frontend
- Express backend API (`/api/*`)
- Supabase auth/storage/database integration
- OpenAI Whisper transcription + GPT summarization/chat
- SaaS usage quota checks

## Prerequisites

- Node.js 20+
- Supabase project with required tables/buckets
- OpenAI API key

## Environment

Set values in [.env.local](.env.local):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- optional model vars (`OPENAI_TRANSCRIPTION_MODEL`, `OPENAI_SUMMARY_MODEL`, `OPENAI_CHAT_MODEL`)

## Run

1. Install dependencies:
   `npm install`
2. Apply database setup in Supabase SQL editor:
   - `server/schema.sql`
   - `server/rls.sql`
3. Confirm `meeting-audio` bucket exists (created by `rls.sql` if storage schema is available)
4. Start backend:
   `npm run dev:api`
5. In another terminal, start frontend:
   `npm run dev`

Or run both at once:

`npm run dev:full`

## Implemented API Endpoints

- `GET /api/health`
- `GET /api/ops/self-check`
- `GET /api/billing/usage`
- `POST /api/meetings/process-text`
- `POST /api/meetings/process-upload`
- `POST /api/ai/regenerate-summary`
- `POST /api/ai/meeting-chat`
- `POST /api/meetings/update-action-items`
- `POST /api/meetings/delete`

All `/api/*` routes require Supabase bearer token authentication.

## Diagnostics

- `GET /api/health` confirms API process is running.
- `GET /api/ops/self-check` validates:
  - required tables (`meetings`, `subscriptions`, `usage_events`)
  - storage bucket (`meeting-audio`)
  - OpenAI key presence

`/api/ops/self-check` returns:
- `200` when all checks pass
- `503` when configuration is incomplete
- `500` on unexpected server errors

## Notes for FYP Demo Readiness

- `schema.sql` defines required tables (`meetings`, `subscriptions`, `usage_events`).
- `rls.sql` enforces per-user data isolation for database and storage.
- Upload paths are namespaced by user id (`<userId>/...`) and policies enforce that.
