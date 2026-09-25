# Ship a Lean Run Logbook Before Round One

The app a DECA VBC Entrepreneurship team needs is an experiment notebook, not a dashboard or a strategy engine. The competition ranks teams only on a simulation score, gives unlimited attempts during each 10-day qualifying round, and counts only the best one. What wins, then, is how many disciplined attempts a team makes: write a hypothesis, run the sim, log the result, compare it with the personal best, then pick the next single-variable test. Build a phone-friendly attempt log with a required hypothesis field, a personal-best (PB) comparison, a round countdown and a pre-round checklist. It can be built in the 18 days before Round 1 opens (Oct 13, 2026, 10:00 a.m. ET) with Next.js and Supabase at no cost. Postpone charts, screenshot extraction, advisor comments and AI to Round 2 and ICDC. Two caveats shape everything else. First, the sources disagree on what the score is: some say cumulative profit over five simulated years, others say net worth, and the 2026-27 ICDC text says "points". Second, the app must stay completely outside the Knowledge Matters simulation, because external tools used inside it bring immediate disqualification. Every finding below comes from search-engine snippets, because the research environment's proxy blocked deca.org, decadirect.org, knowledgematters.com and the DECA Guide PDFs. Treat each number as "reported, to be verified". The 2026-27 VBC Guidelines PDF is the first thing to read.

## A score-only contest that rewards iteration volume

VBC Entrepreneurship is one of **eight VBC tracks**. Students "conduct market research, spot new business opportunities" and run a venture chosen from **20 different businesses**. The levers are "requesting financing, building their team, acquiring resources, setting prices, developing their marketing" ([DECA](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship)). Knowledge Matters lists those businesses: smoothie shop, pizza place, plumbing, electrical, physical therapy, hair salon, auto repair, catering, online gift baskets, trampoline park, bowling alley, fitness center, coffee shop, ice cream shop, T-shirt printing, burrito restaurant, lawn care, DJ services, batting cage and go-kart track ([Knowledge Matters](https://www.knowledgematters.com/vb-essentials/entrepreneurship/)). The classroom version begins with one business at one location and grows to "multiple businesses and multiple locations". It also shows a **Reports » Personal Financial Summary** of business value and investments ([Knowledge Matters](https://www.knowledgematters.com/high-school/entrepreneurship/)). Entry is **free** for DECA high school members, and teams have **one to three members** ([Knowledge Matters](https://www.knowledgematters.com/high-school/competitions/deca/); [DECA Direct](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)). Students register on the Knowledge Matters platform, and the advisor approves them from the instructor account at vb.knowledgematters.com ([Knowledge Matters blog](https://www.knowledgematters.com/blog/deca-virtual-business-challenge-deca-advisors/)).

The 2026-27 calendar is fixed and tight. **Registration opens Tuesday, Sep 29, 2026**. **Round 1 runs Oct 13, 10:00 a.m. ET, to Oct 23, 5:00 p.m. ET**. **Round 2 runs Jan 12–22, 2027** in the same daily window ([DECA Direct](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge); [DECA Guide 2026-27](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)). Each round has **three mini-challenges**. For Round 1 they run from 8:30 p.m. ET to 5:00 p.m. ET the next day, starting Oct 14, Oct 19 and Oct 21; for Round 2 they start Jan 12, Jan 14 and Jan 20. Those windows were quoted in the Accounting section, so they may not be the Entrepreneurship schedule. It is also unclear whether mini-challenge results feed into qualification. The **top two teams per track per round in each of DECA's four regions** qualify, and only **one team per chapter per track per round** can advance ([DECA Guide 2026-27](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)). That puts a ceiling of about 16 ICDC finalist teams per track. **ICDC 2027 runs April 17–20 in Anaheim**, according to state-association pages; deca.org has not confirmed those dates ([California DECA](https://californiadeca.org/conferences/icdc/); [Georgia DECA](https://gadeca.org/events/icdc)).

The rule that matters most for app design: "the competition sim may be completed multiple times within the challenge period, with **only the best total score being counted**". Teams have **no time limit per submission**, and a live scoreboard ranks every team that has finished a run ([DECA Direct](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)). Winners describe working in volume. Jerry Huang's team reported **about 80 hours over the 10-day round** on the way to first place internationally in a 2024 Round 1 (Restaurant track) ([Medium](https://medium.com/@jerryhuang1128/from-zero-to-first-place-my-strategy-for-winning-decas-vbc-qualifying-round-29a2125688f1)). Eric Yang warns that a team not "willing to put in a good few hours everyday" should pick another event ([Medium](https://medium.com/@eric8yang/the-ins-and-out-s-of-the-deca-fbla-virtual-business-challenge-9928c227eddd)). None of the notes found evidence of a presentation, judge interview or rubric. The only judged Knowledge Matters event is the separate Digital Presentation Skills Challenge ([Knowledge Matters](https://www.knowledgematters.com/high-school/competitions/presentation-skills/)). The app therefore needs no presentation-prep features.

### Sources conflict on the score itself and on the ICDC format

The notes contain four open contradictions, and the app should absorb them instead of settling them early. **Qualifying metric:** snippets tied to DECA Direct's beginner's guide and the guideline PDFs say Entrepreneurship ranks on **cumulative profit after five simulated years**. DECA's own event page says members "earn the **highest net worth** possible while running the simulation for a specified period of time" ([DECA](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship)). The BPA version of the same sim also scores on net worth ([Knowledge Matters BPA](https://www.knowledgematters.com/high-school/competitions/bpa/)). **ICDC metric:** older text says "cumulative total profit (or net worth for Personal Finance) from both sessions", but a 2026-27 guideline snippet says "cumulative total **points**" ([DECA Guide 2026-27](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)). **ICDC format:** the guidelines describe two ~15-minute timed sessions, while DECA Direct describes eight teams at podiums in a **double-elimination** bracket ([DECA Direct](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)). **Round length:** sources give both 10 and 11 days ([DECA Direct](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-deca-virtual-business-challenge)). The design answer is to store both `final_profit` and `final_net_worth` on every attempt, plus an optional `points` value. The round's official ranking metric then becomes one configurable field, so "best attempt" gets recalculated once the 2026-27 PDF is read.

The in-sim mechanics are also poorly documented. Nobody could confirm the simulated time unit, whether decisions happen continuously or at period boundaries, loan terms, marketing channels, or the full Reports menu. A snippet about a "Supervise Employees" screen comparing target and actual task time may describe a different VB sim ([Knowledge Matters](https://www.knowledgematters.com/high-school/entrepreneurship/)). Knowledge Matters also says a practice file restarts from the File menu, but once it reaches the stop date the team has to contact Knowledge Matters ([Knowledge Matters](https://www.knowledgematters.com/high-school/competitions/deca/)). That is operationally important and needs checking hands-on. As a result, the app cannot hard-code a decision form. It should hold decisions as flexible key-value data, and the team's first practice session should record what the sim actually shows.

## The whole product is one loop: hypothesize, run, log, compare

No companion attempt tracker exists for Knowledge Matters VBC, or for Capsim or GoVenture. The vendors build instructor analytics and in-sim decision tools, such as Capsim's report builder and Capstone spreadsheet ([Capsim](https://www.capsim.com/blog/product-update-custom-report-builder)), and students fall back on their own spreadsheets. The best designs to borrow come from other domains. Speedrun timers compare every attempt against a **personal best** and a "Sum of Best" ceiling, colour each checkpoint against the comparison, and let users purge bad data so it does not distort the best ([LiveSplit](https://github.com/LiveSplit/LiveSplit); [livesplit-core](https://docs.rs/livesplit-core/latest/livesplit_core/comparison/index.html)). ML experiment trackers put runs in one sortable, taggable table and use **parallel-coordinates** plots to link input settings with outcomes ([W&B](https://docs.wandb.ai/models/app/features/panels/parallel-coordinates)). Capstone's 10-category analyst scorecard suggests showing a "run health" panel instead of profit alone ([Capsim guide](https://ww3.capsim.com/guides/capstone_harvard2011/website-and-spreadsheets.html)).

Those patterns become five user flows. The first (core loop) is the MVP, the second ships with it, and the rest follow.

| Flow | Steps | Phase |
|---|---|---|
| **Core experiment loop** | Open "New attempt" → the app prefills decisions from the current PB → the student edits the one variable to test and writes a required one-line hypothesis ("raise premium price 10% in year 2") → runs the sim **on a separate device or tab, with the app closed during competition** → logs final profit, net worth, cash low point, time spent and status (completed / aborted / bad data) → the app shows the delta vs. PB and a "what changed" diff of decisions → the student marks keep/discard and a lesson learned → the app suggests re-queuing an untested idea from the backlog | MVP |
| **Round-day checklist** | Countdown to the next window opening or closing (stored in ET) → checklist: correct round file, advisor approval confirmed, no extensions or overlays running in the sim browser, roles assigned (operator/analyst), PB decisions printed or on the second screen, app set to Competition mode → after the session: log leaderboard rank and gap to the estimated qualifying cutoff | MVP (checklist + countdown), Phase 2 (cutoff) |
| **Advisor review** | The advisor gets a read-only login → sees the team's attempt table, PB trend and hours logged per member → leaves comments on a specific attempt or checkpoint (esports-style "VOD review") → gets a weekly digest | Phase 2 |
| **Post-round retrospective** | Once the round closes: import the published qualifier list and top scores → compare the final PB to the cutoff → tag which experiments moved the PB → write a "next round playbook" of opening decisions | Phase 2 |
| **ICDC timed practice** | Choose "ICDC session" mode → the app runs a 15-minute timer → the team rehearses a fixed opening script (the first N decisions) → logs the result of two sessions as a cumulative total → tracks mean and variance across timed runs, not just the best | Phase 4 |

The main screens are Home (round countdown, current PB, attempts today, hours logged), New Attempt, Attempt Detail with a diff against PB, the Attempts table (sort, filter, tag), Round Checklist, and Team & Settings, which covers members, the round metric toggle and export. Later phases add a Checkpoint chart (profit or net worth over sim time, overlaid on the PB), a Decision-Space view (a scatter or parallel-coordinates plot once the team has 10 or more attempts), Advisor View, Retrospective and ICDC Timer.

## A schema built for fields nobody has documented yet

The stack should cost nothing and be something one student can build with AI coding help: **Next.js (App Router, TypeScript, Tailwind, shadcn/ui) on Vercel Hobby, plus Supabase Free** for Postgres, Auth, row-level security and Storage. Supabase Free includes **500 MB of database, 1 GB of storage and 50,000 MAU**, and **projects pause after seven days without database queries**. Paused projects are restored from the dashboard, and Pro costs $25/month ([Supabase pricing](https://supabase.com/pricing); [Supabase docs](https://supabase.com/docs/guides/platform/free-project-pausing)). Pausing does no harm during a season with daily use, but the project will be asleep after the November–December gap. Vercel Hobby is free but **limited to non-commercial personal use**, and when a limit is hit the service stops rather than billing ([Vercel](https://vercel.com/docs/plans/hobby)). That rules out selling the app to other chapters without upgrading. There are two lighter options. A Google Sheet is a zero-code v0 to use this weekend. A local-first single-page app on IndexedDB with JSON export needs no accounts and avoids nearly all privacy exposure, but it gives up shared team data. For a two- or three-person team logging from different phones, Supabase is worth the setup.

The schema follows three rules. Attempts carry **both** candidate score metrics. Decisions live in **JSONB**, so the form can change as the team learns the sim. Rounds and their windows are data, not code, so mini-challenge times can be corrected without a deploy.

```sql
-- Identity & teams (RLS: every table filtered by team membership)
create table profiles (
  id uuid primary key references auth.users,
  display_name text not null,          -- first name / nickname only
  age_attested_13_plus boolean not null default false,
  created_at timestamptz default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  track text not null default 'entrepreneurship',  -- enum of 8 VBC tracks
  chapter text, region text check (region in ('central','north_atlantic','southern','western')),
  created_at timestamptz default now()
);

create table team_members (
  team_id uuid references teams on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text not null check (role in ('student','advisor')),   -- advisor = read + comment
  primary key (team_id, user_id)
);

-- Season calendar as data
create table rounds (
  id uuid primary key default gen_random_uuid(),
  season text not null,                 -- '2026-27'
  kind text not null check (kind in ('practice','round1','round2','icdc')),
  opens_at timestamptz, closes_at timestamptz,          -- stored UTC, displayed ET
  ranking_metric text not null default 'profit'
    check (ranking_metric in ('profit','net_worth','points')),  -- flip once PDF verified
  est_qualifying_cutoff numeric                          -- from past qualifier lists
);

create table round_windows (             -- mini-challenges, ICDC sessions
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds on delete cascade,
  label text not null,                   -- 'Mini-challenge 1'
  opens_at timestamptz not null, closes_at timestamptz not null,
  verified boolean default false         -- Accounting-sourced dates start unverified
);

-- Core loop
create table attempts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams on delete cascade,
  round_id uuid references rounds,
  window_id uuid references round_windows,
  operator_id uuid references profiles,
  parent_attempt_id uuid references attempts,  -- the PB/baseline this varies from
  business_type text,                    -- one of the 20 businesses
  hypothesis text not null,              -- mandatory, student-written
  variables_changed text[],              -- e.g. {'price.premium','marketing.social'}
  decisions jsonb not null default '{}', -- opening/key decisions, schema-flexible
  status text not null default 'completed'
    check (status in ('in_progress','completed','aborted','bad_data')),
  final_profit numeric, final_net_worth numeric, final_points numeric,
  cash_low_point numeric, loan_taken boolean,
  sim_periods_completed int, minutes_spent int,
  verdict text check (verdict in ('keep','discard','inconclusive')),
  lesson text, tags text[],
  started_at timestamptz default now(), finished_at timestamptz
);

create table checkpoints (               -- "splits" at sim-time marks (Phase 2)
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references attempts on delete cascade,
  sim_period int not null,               -- unit configurable: week/month/year
  profit numeric, net_worth numeric, cash numeric, revenue numeric, expenses numeric,
  employees int, locations int, customer_rating numeric,
  decisions jsonb default '{}', note text
);

create table experiments_backlog (       -- queued ideas not yet tested
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade,
  idea text not null, variable text, priority int default 0,
  status text default 'queued' check (status in ('queued','tested','dropped')),
  tested_attempt_id uuid references attempts
);

create table leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade,
  round_id uuid references rounds,
  captured_at timestamptz default now(),
  our_rank_region int, our_best numeric, cutoff_rank2_score numeric
);

create table time_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade,
  user_id uuid references profiles, round_id uuid references rounds,
  minutes int not null, logged_on date default current_date
);

create table comments (                   -- advisor/teammate review (Phase 2)
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references attempts on delete cascade,
  checkpoint_id uuid references checkpoints on delete cascade,
  author_id uuid references profiles, body text not null,
  created_at timestamptz default now()
);

create table attachments (                -- screenshots, auto-expiring (Phase 3)
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references attempts on delete cascade,
  storage_path text not null, extracted jsonb, confirmed boolean default false,
  expires_at timestamptz not null default now() + interval '7 days'
);

-- Personal best per team/round, driven by the round's configured metric
create view round_best as
select distinct on (a.team_id, a.round_id) a.*
from attempts a join rounds r on r.id = a.round_id
where a.status = 'completed'
order by a.team_id, a.round_id,
  case r.ranking_metric when 'profit' then a.final_profit
                        when 'net_worth' then a.final_net_worth
                        else a.final_points end desc nulls last;
```

Row-level security should restrict every table to rows whose `team_id` belongs to the caller's team, and allow advisors only `select`, plus `insert` on `comments`. For the MVP, only `profiles`, `teams`, `team_members`, `rounds`, `round_windows`, `attempts`, `experiments_backlog` and `time_logs` need to exist. The rest can wait until they are used.

## Integrity rules keep the app outside the simulation

The hard constraint is DECA's rule that "the use of external applications, browser extensions or built-in browser tools **within our competition simulations is strictly forbidden**". The penalty is **immediate disqualification**, and participants are told to ask Knowledge Matters when unsure ([DECA Guide](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf)). Knowledge Matters has no public API. That settles the architecture: data goes in by hand or from screenshots **after** a run, and the app never gets an extension, overlay, scraper, auto-clicker or live screen reader. The shared CTSO pledge adds two softer constraints. Participants affirm they "received **no outside help** with the challenge" and have "not shared information about the competition simulation" ([FBLA](https://www.fbla.org/virtual-business-challenge/); [FCCLA](https://fcclainc.org/compete/competitive-events/virtual-business-challenge)). That text comes from FBLA and FCCLA pages, and DECA's own wording is unconfirmed. The pledge makes AI strategy advice a real grey area. A cautious reading treats an LLM suggesting the next experiment as outside help. So the app needs a **Competition mode switch** that turns off every AI feature during round windows, keeps team data private, and blocks public sharing of competition-round details. Until Knowledge Matters (Support@KnowledgeMatters.com) answers in writing, AI stays limited to practice runs ([Knowledge Matters Support](https://support.knowledgematters.com/support/solutions/3000005368)).

AI helps most with data capture, and that is also where it needs guardrails. Vision LLMs place fields from complex report layouts much better than Tesseract, which reportedly scores near zero on tables. One estimate puts a cost of about **$0.006 per screenshot** ([Joshua8.AI](https://joshua8.ai/ocr-models-vs-vision-llms-vs-tesseract/); [DEV](https://dev.to/gabrielanhaia/vision-models-for-ocr-when-they-beat-tesseract-and-when-they-dont-54a6)). Extraction still makes mistakes, so the design needs a mandatory human-confirm step, range validation, and deletion of each image seven days after upload. Many LLM API terms require an adult account holder, so the advisor or a parent should probably own the key. That point is unverified.

Privacy is manageable if the app stays small. COPPA covers users **under 13**. Its amended rule took effect June 23, 2025, and the compliance deadline was **April 22, 2026** ([FTC](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data)). DECA members are high-schoolers, so an age attestation and a policy of no under-13 accounts are enough. FERPA governs education records held by schools, and a vendor gets access only as a "school official" under the school's direct control, usually with a data privacy agreement ([studentprivacy.ed.gov](https://studentprivacy.ed.gov/faq/i-want-use-online-tool-or-application-part-my-course-however-i-am-worried-it-violation-ferpa)). A tool run by students that stores nicknames, emails and sim numbers, with no grades, rosters or birthdates, no ads or trackers, and data export and delete, stays out of FERPA scope. If an advisor adopts it chapter-wide, that changes, and the district's approval process applies. State laws such as California's SOPIPA were not researched.

## An 18-day MVP, then three phases paced to the season

The schedule is the binding constraint. From Friday, Sep 25 to Round 1's opening at 10:00 a.m. ET on Tuesday, Oct 13, there are about **12 evenings and two weekends**. The plan uses a Google Sheet as a fallback, sets a go/no-go gate on Oct 6, and freezes code the day before the round opens.

| Dates | Tasks | Screens / outputs | Milestone |
|---|---|---|---|
| **Fri Sep 25 – Mon Sep 28** | Read the 2026-27 VBC Guidelines PDF and record the ranking metric, mini-challenge windows for Entrepreneurship, and ICDC format. Email Knowledge Matters about AI analysis and screenshots. Build the **v0 Google Sheet** (attempts tab with the MVP columns). Create the Supabase project and Next.js repo, and deploy a hello-world to Vercel | Sheet v0; blank deployed app | Fallback exists before any code |
| **Tue Sep 29 – Thu Oct 1** | Register the team and get advisor approval. Build magic-link auth, profiles with age attestation, team creation and invites. Run migrations for the MVP tables and RLS. Seed `rounds` and `round_windows` for 2026-27 in ET | Sign-in, Team & Settings | Registration done; two members can log in |
| **Fri Oct 2 – Mon Oct 5** | Build the New Attempt form: hypothesis (required), business type, decisions as editable key-value rows prefilled from PB, final profit, net worth, cash low, minutes, status, verdict, lesson. Build the Attempts table with sort, filter and tags. Add the `round_best` view and the metric toggle | New Attempt, Attempts table | Logging an attempt takes under 60 seconds on a phone |
| **Tue Oct 6** | **Go/no-go gate.** If auth plus attempt logging is not working end to end, use the Sheet for Round 1 and continue the app for Round 2 | — | Decision recorded |
| **Tue Oct 6 – Fri Oct 9** | Build Attempt Detail with a field-level diff and KPI delta vs. PB. Add the experiments backlog, Home (countdown in ET, PB, attempts today, hours this round), time logging and CSV export | Attempt Detail, Home, Backlog | Full core loop works |
| **Sat Oct 10 – Sun Oct 11** | Run practice sessions in the classroom sim if the chapter has access, and use them to record the real Reports fields and turn them into named decision keys. Build the Round Checklist and a Competition-mode banner. Fix bugs | Round Checklist | Team dry-run of the whole loop |
| **Mon Oct 12** | **Code freeze.** Back up via CSV | — | MVP shipped |
| **Oct 13 – Oct 23 (Round 1)** | Use the app only; fix only blocking bugs. Log leaderboard rank each day. Keep AI off | — | Round 1 PB logged; qualifiers published later |
| **Oct 24 – Nov 20 (Phase 2)** | Round 1 retrospective. Add checkpoints/splits and a PB-overlay line chart, advisor role with comments, leaderboard snapshots, and a cutoff estimate from past qualifier lists ([R1 2025 qualifiers](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/673caf8a420ac0362208cc59_Copy%20of%20DECA%20VBC%20Round%201%202025ICDC%20Qualifiers.pdf)) | Checkpoint chart, Advisor View, Retrospective | Advisor reviews one attempt in-app |
| **Nov 21 – Jan 4 (Phase 3)** | Add screenshot upload, vision extraction with confirm step, and auto-expiry. Add practice-only AI: "summarize vs. PB" and "suggest next single-variable test", grounded only in the team's own attempts, rate-limited and switched off in Competition mode. Add the parallel-coordinates Decision-Space view. Restore the Supabase project if it paused over break | Upload & Confirm, Decision Space | AI features gated by mode and tested |
| **Jan 5 – Jan 11** | Load Round 2 windows, rehearse the Round-day checklist, freeze code on Jan 11 | — | Round 2 ready |
| **Jan 12 – Jan 22 (Round 2)** | Run the loop at volume; parallel experiments per member | — | Round 2 PB |
| **Feb – Apr 16 (Phase 4, if qualified)** | Build ICDC mode: 15-minute timer, opening-script rehearsal, two-session cumulative scoring, variance tracking. Adjust to whichever format (two sessions or bracket) the 2026-27 guide confirms | ICDC Timer, Script | Ten timed runs before Anaheim, Apr 17–20 |

The MVP deliberately leaves out charts, screenshots, AI, advisor comments and checkpoints. Those help in Round 2, but none of them can be built safely in 18 days alongside schoolwork, and none is needed for the core loop. The single most valuable MVP feature is the **required hypothesis field paired with the PB diff**, because it turns 80 hours of clicking into a sequence of controlled experiments.

### What to verify before relying on this plan

Verify these first, roughly in priority order. (1) The **2026-27 HS VBC Guidelines PDF** ([link](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)): whether the Entrepreneurship metric is profit, net worth or points, how many simulated years a run lasts, the Entrepreneurship mini-challenge windows and whether they affect qualification, and whether ICDC uses two sessions or a bracket. (2) A written answer from Knowledge Matters on whether **AI-generated advice or analysis between runs counts as "outside help"**, and whether keeping screenshots of competition-round reports is allowed. (3) DECA's exact pledge wording, since the version cited here comes from FBLA and FCCLA. (4) Hands-on in the sim: the actual Reports screens, the time unit, how restarting works in the competition file versus a practice file, and whether the business type is fixed or chosen per run. (5) ICDC 2027 dates on deca.org. (6) Current Supabase and Vercel free-tier terms, and the age requirements of whichever LLM API is used. (7) The district's position, if the advisor plans chapter-wide adoption. No Reddit or r/DECA content could be retrieved. Public strategy advice specific to Entrepreneurship is thin and mostly dates from Knowledge Matters' 2017-18 retail hints, which predate this sim's December 2019 launch ([PR Newswire](https://www.prnewswire.com/news-releases/brand-new-digital-business-simulation-launched-to-teach-entrepreneurship-to-high-school-students-300969035.html); [KM hints](https://www.knowledgematters.com/blog/virtual-business-challenge-hints-2017-2018/)). The team's own attempt log will quickly become the best strategy source it has.

## Conclusion

The research turns the question around. The app does not need to know how to win VBC Entrepreneurship, and it cannot, because nobody has published the sim's mechanics or even agreed on its scoring metric. What it needs is a way for a team to find out quickly and without breaking the rules. That makes a humble logbook a stronger design than a clever analytics tool: flexible decision fields, both candidate score metrics, rounds stored as data, and a mandatory hypothesis. The same uncertainty explains why a paper-simple MVP before October 13 is worth more than a polished Phase 3 in January. Round 1 data is what will reveal which fields and charts actually matter.

Integrity is the second lesson. The features that sound most useful (live overlays, auto-capture, in-round AI coaching) are the ones most likely to get a team disqualified. Keeping the app strictly after the fact and AI-off in competition protects the team, and it also keeps the tool simple enough to build in time. If Knowledge Matters confirms that between-run AI analysis is acceptable, Phase 3 can grow. If it says no, nothing in the MVP or Phase 2 has to change.
