# Project AI English Speaking Practice Tool

## Tech Stack (严格遵循)
- Frontend Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcnui.
- Backend Python FastAPI.
- AI SDK OpenAI API (Whisper for STT, GPT-4o for chat, TTS-1 for voice).
- State Management Zustand.

## Architecture Constraints
- Follow Frontend-Backend Separation pattern.
- Keep file structures flat and modular.
- Never hardcode API keys. Always use environment variables (.env.local for frontend, os.getenv for backend).

## Development Workflow
- Implement features step-by-step (MVP first).
- Prioritize reusable components and functions (DRY principle).
- Ensure TypeScript type safety across the frontend.
- When running into CORS issues, remind me to configure it in FastAPI middleware.