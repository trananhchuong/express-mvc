# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server with watch + .env loaded (tsx)
npm run build      # prisma generate && tsc → dist/
npm start          # run compiled dist/index.js with .env loaded
npm run typecheck  # tsc --noEmit

npm run db:migrate # prisma migrate dev (creates migration + updates DB)
npm run db:push    # prisma db push (no migration files, for quick schema sync)
npm run db:studio  # open Prisma Studio
```

There are no tests yet. `npm run typecheck` is the main correctness check.

Copy `.env.example` to `.env`. The app requires `DATABASE_URL` (MySQL) and reads `PORT` (default `5500`).

## Architecture

Express 5 MVC app, ESM (`"type": "module"`), TypeScript strict mode, NodeNext module resolution.

Request flow: `src/index.ts` (startup + graceful shutdown) → `src/app.ts` (Express config) → `src/routes/` → `src/controllers/` → EJS views in `views/` or `res.json`.

**Database**: Prisma ORM over MySQL. The singleton client lives in `src/lib/prisma.ts` (global guard pattern). Schema covers a shop domain: `User`, `Role`, `UserRole` (M:N junction), `Product`, `Order`, `OrderItem`. `src/index.ts` calls `prisma.$connect()` at startup and `$disconnect()` on SIGINT/SIGTERM.

**Error handling**: Throw an error with a `.status` property; `src/middleware/error.middleware.ts` maps it to `{ error: message }` JSON at that HTTP status. Both HTML and API routes use this single handler.

## Conventions

**Import paths**: always use `.js` extensions in TypeScript imports (NodeNext resolution requires it).

**Return types**: prefer implicit — omit explicit `: void` and other annotations TypeScript can infer. Add explicit types only when inference is wrong or the function is a public API contract.

**Commits**: Conventional Commits format (`feat`, `fix`, `build`, `chore`, `refactor`, `test`, `ci`, `docs`). Prefer several focused commits over one large one. Never add `Co-authored-by` trailers unless the user asks.

**Changes**: touch only what the task requires; don't improve adjacent code, add speculative abstractions, or handle impossible error paths.
