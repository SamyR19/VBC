# AI coach — design notes and setup

## What it's for

Only your best run counts in VBC, so the thing that matters is **how quickly each run teaches you something**. The coach is
built to speed up that loop. It's a planning and review partner used *between* runs. It isn't an autopilot.

| Job | How the coach helps | Button |
|---|---|---|
| Pick the next test | Proposes 3–5 single-change experiments with exact from→to values, built from your best run's decisions, mixing *exploit* (keep pushing what worked) and *explore* (areas you've never changed). One tap adds each one to Ideas. | 💡 Suggest next experiments |
| Understand a result | Compares your latest run with its baseline and your best run, says whether it was a clean test, and suggests a follow-up | 🔍 Analyze my last run |
| See patterns | Reads the decision-effects table (which changes raised or lowered your score, clean tests only) and says how much to trust each result | 📈 What's working? |
| Use limited time well | Turns about 60 minutes into an ordered run plan and saves the runs as ideas | 🗓 Plan my session |
| Write better hypotheses | Checks your draft on the Log page for one change, exact values and a clear expected effect | ✍️ Check my hypothesis |
| Know where you stand | Compares your best score with the leaderboard cutoff, your trend and the time left in the round | 🎯 Am I on track? |
| Learn concepts | Explains break-even, cash flow, pricing and loans using your own business as the example | 📚 Explain a concept |
| Carry lessons forward | Writes a round retrospective and an opening playbook for the next round | 🧾 Round retrospective |

### Why it's built this way

- **Grounded, not guessing.** Knowledge Matters doesn't publish the simulation's formulas, and a language model has no
  reliable knowledge of them. So the coach is told to base every recommendation on *your* logged data. The app calculates
  the facts first: your best run, per-decision effects from clean single-change runs, recent runs and what changed in each,
  your ideas and the cutoff gap. It then sends that summary to the model. The model's job is reasoning and explanation, not
  recalling facts.
- **Structured output.** Replies come back as strict JSON (OpenAI Structured Outputs), so suggested ideas are real objects
  with an area, decision, from, to, expected effect and rationale. That lets them be added to your Ideas list with one tap
  and pre-filled into the next attempt.
- **Page-aware.** Each page tells the coach what you're looking at, for example your draft hypothesis on the Log page or
  the two runs you're comparing.
- **Privacy.** Only sim numbers, decisions and your own notes are sent. No names or emails go to OpenAI.

## Integrity: read this

- DECA disqualifies teams that use **external apps, extensions or browser tools inside the competition sim**. The coach never
  touches the sim: no overlays, no scraping, no automation. It only reads what you type into this app.
- Participants also pledge they received **no outside help**. Nobody has confirmed whether AI advice between runs counts as
  outside help. So:
  - The coach is **off while a round or mini-challenge window is open**. The server checks this too, so it can't be bypassed
    from the browser.
  - A teammate can turn on **"Allow the coach while a competition round is open"** in Team settings. Only do that after your
    advisor, or Knowledge Matters (Support@KnowledgeMatters.com), confirms in writing that it's allowed.
  - Practice rounds and the time between rounds aren't locked.

## Architecture

```
Browser (team mode) ──► Supabase Edge Function `coach` ──► OpenAI Responses API
   builds context          • checks the sign-in (JWT) and team membership (RLS)
   from your data          • competition lock (423 while a window is open)
                           • daily cap per team (AI_DAILY_LIMIT, default 150)
                           • holds OPENAI_API_KEY; the browser never sees it
```

- Code: `app/supabase/functions/coach/index.ts`, with the shared prompt, schema, quick actions and parser in
  `app/supabase/functions/_shared/coach.ts`. The web app imports the same file for local mode.
- Local mode (no Supabase) calls OpenAI straight from the browser with a key you paste in Team settings. It's only
  appropriate on your own device.

## Setup (team mode): add your OpenAI key

1. Create a key at platform.openai.com → API keys. Set a monthly **usage limit** on the OpenAI billing page.
2. In Supabase, open project **vbc-run-logbook** → Edge Functions → **Secrets** and add:
   - `OPENAI_API_KEY` = your key (required)
   - `OPENAI_MODEL` = optional, defaults to `gpt-5-mini`. Any model that supports the Responses API and Structured Outputs works.
   - `AI_DAILY_LIMIT` = optional, requests per team per day (default 150)
3. That's it. No redeploy is needed. Open the app and tap 💡 in the coach panel.

The function is already deployed. Until the key is added, the coach answers "not set up yet".

**Cost:** each request sends about 3–10k tokens of context. At gpt-5-mini's list price (about $0.25 per million input tokens
and $2 per million output tokens), that's roughly a cent or less per request, so a heavy week of 200 requests costs
around $1–2. Check OpenAI's current pricing page, because prices change.

**Account age:** OpenAI's terms require account holders to be 18+, or 13+ with parental permission. Having a parent or
advisor own the key is the safe route.

## Tests

- `npm test` covers the prompt and schema (strict-mode rules), response parsing (refusals, truncation, errors), the
  competition lock and the context builder (which must not include names).
- `node supabase/tests/coach_mock_test.mjs <deno>` runs the real function under Deno against mock Supabase and OpenAI. It
  checks: no sign-in and bad sign-in → 401, non-member → 403, competition lock → 423 before any OpenAI call, a normal
  reply → 200, and the daily limit → 429.
- `npm run test:e2e` runs the coach panel in the browser with a mocked OpenAI and checks that ideas are added to the Ideas
  page, tagged AI.
