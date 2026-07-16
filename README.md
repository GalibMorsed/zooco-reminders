# ZOOCO Daily Reminders

A Progressive Web App for pet parents to manage daily care reminders — built with
Next.js (App Router), TypeScript, Tailwind CSS, and Supabase (Postgres) behind
a proper API layer.

## Architecture

The frontend **never** talks to Supabase directly. All reads/writes go through
`app/api/*` route handlers, which are the "own backend" the assignment asks for.
Supabase is used purely as the managed Postgres database + client library, kept
server-side only (`lib/supabase-server.ts` uses the service role key, which is
never exposed to the browser).

```
Frontend components → lib/api-client.ts → /api/reminders, /api/pets → Supabase (Postgres)
```

## Getting started

1. **Create a Supabase project** at supabase.com (free tier is fine).
2. Open the SQL Editor in your Supabase dashboard and run `supabase/schema.sql`
   — this creates the `pets` and `reminders` tables, constraints, and seed data.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Project Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — from Project Settings → API (keep secret,
     used only server-side)
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000

## Deploying

- Push this repo to GitHub.
- Import it into Vercel.
- Add the same env vars from `.env.local` in Vercel's Project Settings → Environment Variables.
- Deploy. `next-pwa` automatically generates the service worker on production builds.

## What's implemented

- **Reminders Overview**: reminders grouped by time slot (Morning/Afternoon/Evening)
  and status (Pending/Completed); current day highlighted on the calendar strip;
  filtering by pet and category.
- **Add Reminder**: bottom-sheet form with all required fields, inline validation
  with error states, saved via the API.
- **Edit Reminder**: same form component reused, pre-filled, with save/cancel.
- **Delete Reminder**: permanent delete with confirmation via the danger button.
- **Mark as done**: toggles completion for the selected calendar date via
  `PUT /api/reminders/:id`, moves the card to the Completed section, and stores
  completion history for streaks.
- **Streaks**: real completion dates are stored in `reminder_completions`; the
  calendar strip highlights the current consecutive streak instead of mock data.
- **Offline-first**: API reads are cached in `localStorage`, offline creates/
  updates/deletes are queued locally, and queued work syncs automatically when
  the browser comes back online.
- **PWA**: manifest + service worker via `next-pwa`, installable on mobile/desktop,
  with network-first API caching for production builds.

## Design matching

The Tailwind tokens in `tailwind.config.ts` (`accent`, `background`, `surface`,
`surfaceMuted`, etc.) are placeholders based on the shared screenshots. **Before
building further UI polish, pull the exact hex/spacing values from Figma Dev
Mode** (right-click any layer → Inspect) and update `tailwind.config.ts`
accordingly so colors, radii, and spacing match 1:1.

Icons in `public/icons/` are placeholders — export the real pet/walk/calendar
icons from Figma as SVGs and drop them into `public/icons/` or inline them as
components.

## Polish notes

- Empty/loading states are intentionally lightweight to keep the mobile flow fast.
- The API routes in `app/api/*` are the Node.js backend layer required by the
  assignment; Supabase remains server-side only.

## Folder structure

```
app/
  api/reminders/route.ts        GET (list+filter), POST (create)
  api/reminders/[id]/route.ts   GET, PUT (edit + status toggle), DELETE
  api/pets/route.ts             GET, POST
  pets/page.tsx                 Pet setup screen
  page.tsx                      Reminders Overview screen
  layout.tsx, manifest.ts       App shell + PWA manifest
components/
  calendar-strip/               Week strip with streak highlight
  reminder-card/                Individual reminder card
  reminder-form/                Shared add/edit form
  filters/                      Pet + category filter chips
  ui/                           Button, Input, Select, Sheet, BottomNav
lib/
  api-client.ts                 Frontend fetch wrappers (only Supabase-adjacent code)
  offline-storage.ts            localStorage cache + offline mutation queue
  supabase-server.ts             Server-only Supabase client
  store.ts                      Zustand store
  group-reminders.ts             Groups reminders by time slot
types/reminder.ts                Shared TS types
supabase/schema.sql               Table definitions + seed data
```
