# Robot Database & Query System — Merged Platform

This project merges two source repos into one full-stack application:

- **`Robot_Mobile_Manipulator_Query_System`** (the engine) — React + tRPC + Express +
  Drizzle/MySQL + NextAuth. Provided the database, auth/roles, search, comparison, and
  admin CRUD.
- **`humanoid_database_website`** (the dashboard) — provided the weighted **Evaluation
  Matrix**, the chart visualizations (radar / bar / recommendation cards), and the 6
  humanoid robot records.

## The four capabilities

1. **Search** — `client/src/pages/Home.tsx`
   - *Natural language* tab (OpenAI `gpt-4o-mini` parses a query into structured filters).
   - *Criteria & Filters* tab: type/category, manufacturer, country, payload, reach, ROS2
     support, DOF, year, plus a **required-capabilities checkbox list** (ROS, force sensor,
     onboard LLM, open-source).
2. **Compare** — `client/src/pages/Compare.tsx`
   - Side-by-side grouped spec table (only fields with data are shown) **plus** the full
     visual suite in `client/src/components/ComparisonCharts.tsx` (capability radar, spec
     bar charts, recommendation cards).
3. **Evaluation Matrix** — `client/src/pages/Matrix.tsx` + `client/src/lib/matrix.ts`
   - Pick any robots, add/remove **any numeric criterion** (mapped to a live spec field),
     flip each criterion's direction (higher/lower is better), and tune weights with sliders.
   - Scores are derived from the **live database** values, normalized 0–100 across the
     selected robots. State is session-only (nothing is persisted).
   - Presets: "Research" (curated 1–5 scores) and "Hardware" (raw specs).
4. **Admin** — `client/src/pages/AdminDashboard.tsx`
   - Add / edit / delete robots and CSV/Excel **bulk upload**.
   - Gated to the **admin role** (`role === "admin"`); the tRPC mutations use
     `adminProcedure` (`server/_core/trpc.ts`).

## Unified data model

`drizzle/schema.ts` holds a single `robots` table that is a **superset** of both source
schemas (`type` enum now includes `humanoid`). The field catalog in
`client/src/lib/robotFields.ts` is the single source of truth that drives the comparison
table columns, the matrix criteria picker, and the admin form — add a column there and it
appears everywhere.

## Running it

> Requires Node.js + pnpm and a MySQL database. (Note: the environment this was built in
> had no Node toolchain, so the project was not installed/built/run here — do that locally.)

```bash
pnpm install

# .env
DATABASE_URL="mysql://user:pass@host:3306/robots"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."        # required for the natural-language search tab
VITE_APP_TITLE="Robot Database & Query System"

pnpm db:push            # drizzle-kit generate && migrate — creates/updates the schema,
                        # including the incremental migration for the new humanoid columns
node seed-robots.mjs    # seeds mobile manipulators + the 6 humanoids
pnpm dev                # http://localhost:3000
```

To grant yourself admin: sign in once, then set your user's `role` to `admin` in the
`users` table (or configure the owner via the existing auth/`ENV.ownerOpenId` path).
