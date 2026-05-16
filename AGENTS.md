# express-mvc

Express 5 web app with a small **MVC** layout: routes → controllers → views (EJS) or JSON responses. TypeScript, ESM (`"type": "module"`), strict mode.

## Stack

- **Runtime**: Node.js
- **Framework**: Express 5
- **Views**: EJS (`views/`), static assets in `public/`
- **Tooling**: TypeScript, `tsx` (dev), `tsc` (build)

## Project layout

```
src/
  index.ts              # Entry: starts HTTP server (PORT from env)
  app.ts                # Express app: EJS, static, JSON, routes, error handler
  routes/               # Route modules (mount paths, wire controllers)
  controllers/          # Request handlers (render or res.json)
  middleware/           # e.g. centralized error handler
views/                  # EJS templates
public/                 # CSS and static files
dist/                   # Compiled output (gitignored in normal workflow)
```

## Commands

| Script        | Purpose                          |
|---------------|----------------------------------|
| `npm run dev` | Dev server with watch + `.env`   |
| `npm run build` | Compile `src/` → `dist/`       |
| `npm start`   | Run compiled `dist/index.js`     |
| `npm run typecheck` | `tsc --noEmit`               |

Copy `.env.example` to `.env`. Default `PORT=5500`.

## Routes

| Method | Path     | Handler        | Response        |
|--------|----------|----------------|-----------------|
| GET    | `/`      | `getHome`      | Renders `home`  |
| GET    | `/health`| `getHealth`    | `{ status: 'ok' }` |

## Conventions

- **Imports**: Use `.js` extensions in TypeScript import paths (NodeNext resolution).
- **MVC**: Add routes in `src/routes/`, handlers in `src/controllers/`, shared logic in `src/middleware/` or future `src/services/`.
- **Return types**: Prefer implicit return types; see `.cursor/rules/typescript-implicit-return-types.mdc`.

## When extending

- New pages: EJS under `views/`, controller + route registration.
- New APIs: controller returns JSON; mount route under `src/routes/`.
- Errors: Use `status` on thrown errors; `errorHandler` maps them to JSON.
