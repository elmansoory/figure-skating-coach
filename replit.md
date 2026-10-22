# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run cleanup-orphans` — remove rows pointing at deleted athletes/sessions (needed once before pushing the foreign keys)
- `pnpm --filter @workspace/db run seed` — insert the ISU rules reference (idempotent)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Running locally (outside Replit)

Requires Node.js 22+, pnpm 10 and PostgreSQL.

```bash
pnpm install
export DATABASE_URL=postgres://user:password@localhost:5432/skating
pnpm --filter @workspace/db run push    # create tables
pnpm --filter @workspace/db run seed    # ISU rules reference

# terminal 1 – API on :8080
PORT=8080 pnpm --filter @workspace/api-server run dev
# terminal 2 – web app on http://localhost:5173, forwarding /api to the API
PORT=5173 BASE_PATH=/ API_PROXY_TARGET=http://localhost:8080 pnpm --filter @workspace/figure-skating-coach run dev
```
