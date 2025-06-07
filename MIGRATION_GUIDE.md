# Badeblog Migration Guide: Rails + Vue → Nuxt Monorepo + Workers + Supabase

## 1. Overview

This guide walks through consolidating two separate repositories—`badeblog-api` (Rails) and `badeblog-client` (Vue/Vite)—into a single **Nuxt 3 monorepo**. The new worker will be implemented as **Cloudflare Workers** using Supabase (Postgres + Auth) for data and authentication.

### Goals

- Single monorepo for frontend and worker.
- Edge‐first API (Cloudflare Workers) for low latency and zero‐idle costs.
- Supabase as serverless Postgres + Auth provider.
- Preserve existing features: users, sessions, stories, comments, categories, subscriptions, health checks.
- Streamlined deployment via Git and CI.

## 2. High-Level Architecture

```text
┌─────────────────────────┐      ┌──────────────────────┐
│  Nuxt 3 App (monorepo)  │◄─────┤  Workers API         │
│  - UI, SSR, Static      │      │  - HTTP endpoints    │
└─────────────────────────┘      └─────────┬────────────┘
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │  Supabase (Postgres) │
                              │  - Auth              │
                              │  - Realtime/Edge DB  │
                              └──────────────────────┘
``` 

---

## 3. Monorepo Setup

1. Create a new repo (e.g. `badeblog/`) or rename existing client.
2. Add workspace config using bun
3. Install monorepo tooling:
  use Bun for monorepo and Biome for Linting/Formatting
  
4. Create directories:
   ```text
   badeblog/
   ├── apps/
   │   ├── client/    # Nuxt 3 app
   │   └── worker/     # Workers functions
   ├── supabase/       # Supabase migrations + config
   └── package.json
   ```

---

## 4. Client: Nuxt 3 Migration

1. Scaffold a new Nuxt 3 app in `apps/client/`:
   ```bash
   cd apps/client
   npx nuxi init .
   pnpm install
   ```
2. Copy over Vite assets:
   - `src/assets`, `src/components`, `src/views` → `components/`, `pages/`, `assets/`
   - Migrate CSS (Tailwind) config.
3. Update `nuxt.config.ts`:
   - Set runtime config for API URL:  
     ```ts
     export default defineNuxtConfig({
       runtimeConfig: {
         public: { API_URL: process.env.NUXT_API_URL }
       }
     })
     ```
4. Convert router/views → file-based routes in `pages/`.
5. Port Pinia stores and API calls to use `$fetch` against `API_URL`.
6. Integrate Quill editor plugin via Nuxt modules or direct component register.

---

## 5. worker: Cloudflare Workers

### 5.1. Initialize

1. `cd apps/worker`
2. `npm init -y`
3. Install dependencies:
   ```bash
   pnpm add @cloudflare/workers-types supabase-js hono
   ```
4. Scaffold `hono` or `miniflare` project:
   ```bash
   pnpm add -D miniflare
   ```

### 5.2. Directory structure

```
apps/worker/
├── src/
│   ├── routes/
│   │   ├── health.ts
│   │   ├── users.ts
│   │   ├── stories.ts
│   │   └── ...
│   └── index.ts
└── wrangler.toml      # If using Cloudflare Wrangler
```

### 5.3. Environment & Secrets

- Create `.env` or use Wrangler secrets:
  ```bash
  supabase secrets set SUPABASE_URL=... SUPABASE_KEY=...
  ```
- In Workers code, initialize Supabase client:
  ```ts
  import { createClient } from '@supabase/supabase-js';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  ```

### 5.4. API Endpoints

For each Rails route, create a corresponding Worker route:

- `GET /health` → simple 200 OK
- `POST /users` → `supabase.auth.signUp`
- `POST /sessions` → `supabase.auth.signIn`
- `GET/PUT /users/:id` → `supabase.auth.admin.getUser`
- `CRUD /stories` → Supabase `from('stories')...
- Nested routes: handle with dynamic params in Hono.

### 5.5. Authentication

Leverage Supabase Auth:
- Email/password, OAuth (Google) built‐in.
- Use built‐in JWT from Supabase for protected routes.

### 5.6. Email & Notifications

Use a 3rd‐party service (e.g. SendGrid) via `fetch()` in Workers:
```ts
await fetch('https://api.sendgrid.com/v3/mail/send', { ... });
```
Generate unsubscribe tokens via JWT or Supabase Functions.

---

## 6. Supabase Setup

1. `cd supabase`
2. `supabase init`
3. Define schema in `supabase/migrations/*.sql`:
   ```sql
   create table users ( ... );
   create table stories ( ... );
   create table comments ( ... );
   ...
   ```
4. Run:
   ```bash
   supabase db push
   ```
5. Enable Auth providers (email, Google) via Supabase dashboard.

---

## 7. Data & Feature Parity

- **Soft deletes**: add `deleted_at` columns and filter in queries.
- **Serializers**: build response shapes in Workers with `map()`.
- **Stats endpoints**: translate SQL for recent comments, subscriber list.

---

## 8. Testing & Local Development

- client: `pnpm --filter client dev`
- worker: `miniflare --watch --wrangler apps/worker/src/index.ts`
- Supabase: `supabase start`

---

## 9. Deployment

- client: Vercel / Netlify / Cloudflare Pages (point to `apps/client/.output/public`).
- Workers: Deploy via `wrangler publish` or `npm run deploy` using CLI.
- CI/CD: GitHub Actions to run migrations (`supabase db push`) then deploy both apps.

---

## 10. Appendix

- **Endpoint mapping**: Rails → Worker route table
- **Model fields**: Rails schema.rb vs Supabase `schema.sql`
- **JWT flows**: Rails JWT vs Supabase JWT claims

*End of guide.* 