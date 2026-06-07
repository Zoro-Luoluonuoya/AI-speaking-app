# Project: AI English Speaking Practice Tool

## Tech Stack (strict)
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- Backend: Python FastAPI
- AI SDK: OpenAI API (Whisper STT, GPT-4o chat, TTS-1 voice)
- State Management: Zustand

## Architecture Constraints
- Frontend-Backend Separation pattern
- Flat, modular file structures
- Never hardcode API keys — use `.env.local` (frontend) and `os.getenv` (backend)

## Development Workflow
- MVP first, step-by-step
- Reusable components/functions (DRY)
- Full TypeScript type safety on frontend
- CORS: configure in FastAPI middleware if needed

## Directory Layout
```
frontend/    → Next.js app
backend/     → FastAPI app
```
