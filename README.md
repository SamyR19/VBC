# VBC Run Logbook

An attempt logbook for the **DECA Virtual Business Challenge – Entrepreneurship**.
Qualifying rounds allow unlimited attempts and only the best one counts, so the app is built around one loop:

> write a hypothesis → run the sim (app closed) → log the result → compare to your personal best → queue the next single-variable test

- `app/` — the web app (Vite + React + TypeScript + Tailwind, optional Supabase)
- `reports/DECA VBC entrepreneurship tracker.md` — the research report and build plan behind it
- `research_notes/` — raw research notes

## What's in it

| Page | What it does |
|---|---|
| **Home** | Countdown to the next round deadline (ET + your time), personal best, gap to the qualifying cutoff, attempts today, hours logged, progress chart (each run vs. best-so-far), planned runs waiting for results, next queued ideas |
| **Log** | New attempt: required hypothesis, baseline run (defaults to your PB), decisions prefilled from the baseline with changed rows highlighted, results (profit, net worth *and* points), verdict, lesson, tags. "Save plan, run later" lets you write the hypothesis before opening the sim |
| **Attempt detail** | Delta vs. PB and vs. baseline, "new PB by +$X", decision diff table, queue the next idea, "next run from this", mark as bad data (excluded from PBs) |
| **Attempts** | Sortable/filterable table (cards on phones), PB highlighted |
| **Ideas** | Experiment backlog with priority; "Test it" opens a prefilled attempt and marks the idea tested |
| **Round** | ET schedule incl. mini-challenges, round-day checklist (integrity items included), leaderboard snapshots (your rank and the 2nd-place score), hours per member |
| **Team** | Members, join code, rounds (dates, **ranking metric**, cutoff), decision-name presets, CSV export, JSON backup/import |

A **competition-mode banner** turns on automatically while a round or mini-challenge window is open. It reminds you to keep the app off the sim device. There are **no AI features**, no browser extension, and nothing connects to Knowledge Matters. That's deliberate: DECA disqualifies teams for using external tools inside the sim.

### Things the research could not confirm (the app is built to absorb them)
- **Ranking metric.** Sources disagree between cumulative profit, net worth and points. Every attempt stores all three. Each round has a metric setting, and changing it recalculates every PB instantly. It defaults to *profit*, marked **unverified** until you tick "verified" after reading the 2026-27 VBC Guidelines PDF.
- **Mini-challenge times** were quoted for the Accounting track and are seeded as *unverified*. Edit them in Team → Rounds.
- **Decision names** (price, wage, etc.) are suggestions. Rename the presets to match the sim's real screens after your first practice run.

## Two ways to run it

### 1. Local mode (zero setup)
With no Supabase keys the app stores everything in the browser (`localStorage`).
That's fine for one person on one device. Download a JSON backup regularly (Team → Data), because clearing browser data erases it.

```bash
cd app
npm install
npm run dev          # http://localhost:5173
```

### 2. Team mode (shared across phones) — Supabase, free tier
1. Create a free project at supabase.com.
2. In the SQL editor, run `app/supabase/migrations/20260925000000_init.sql`. Alternatively, run `supabase db push` with the Supabase CLI.
3. Under Authentication → URL Configuration, set the Site URL to your deployed URL (and `http://localhost:5173` for dev).
4. Copy `app/.env.example` to `app/.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
5. Sign in with an email magic link, create the team, and share the **join code** from the Team page. Advisors join with the *Advisor* role and get read-only access, enforced by row-level security in the database, not just the UI.

Optional: add `{{ .Token }}` to the Supabase "Magic Link" email template so people can type a 6-digit code instead of clicking the link. That helps when the email opens on a different device.

Moving from local to team mode: download a backup in local mode, then use **Import backup** in team mode. Ids are remapped and rounds are merged, not duplicated.

Free-tier caveat: Supabase pauses free projects after about 7 days without activity (for example, over winter break). Restore it from the dashboard before Round 2.

### Deploy (Vercel, free Hobby plan)
Import the repo into Vercel, set **Root Directory = `app`**, and add the two `VITE_SUPABASE_*` env vars if you use team mode. `app/vercel.json` already rewrites all routes to the SPA. Hobby is for non-commercial use only.

On a phone, open the site and choose "Add to Home Screen" to get an app icon.

## Tests

```bash
cd app
npm test             # unit tests: PB logic, decision diffs, ET/DST conversion, backup round-trip, CSV
npm run test:e2e     # Playwright: full loop on mobile + desktop viewports (local mode)
npm run test:db      # applies the migration to a scratch Postgres DB and checks RLS:
                     # cross-team isolation, advisor read-only, age gate, anon blocked
```
`test:db` needs a local Postgres (`createdb`/`psql` on PATH). `test:e2e` needs Playwright's Chromium. Set `PW_CHROMIUM=/path/to/chrome` to use a preinstalled one.

## Privacy
Collects only a display name, plus an email if you use team mode (for sign-in), and sim numbers. There are no grades, birthdates, ads or trackers. An age attestation (13+) is required to create or join a cloud team. If a chapter or district adopts this officially, run it through the district's approval process first.

Not affiliated with DECA Inc. or Knowledge Matters.
