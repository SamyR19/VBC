# App Patterns and Lean Tech Stack for a DECA VBC Entrepreneurship Run Tracker

Research notes, compiled 2026-09-25. Note on method: direct page fetches to supabase.com, vercel.com, knowledgematters.com and decadirect.org were blocked by the network proxy in this environment, so many findings below come from search-result summaries of those pages (primary URLs are cited, but the exact wording was not read in full). Numbers that matter (pricing, limits, rules) should be re-checked on the live pages before the report is finalized.

## 1. Existing tools for tracking business-simulation runs (Capsim, Marketplace, Knowledge Matters VB, GoVenture)

### Takeaway
The sim vendors build analytics for instructors and for making decisions inside the sim (for example Capsim's decision spreadsheet and report builder). I found no dedicated companion app that tracks a student's attempts across runs for any of these sims, and none at all for Knowledge Matters VBC. Students who want run history build their own spreadsheets, so a purpose-built VBC attempt tracker would be filling a real gap.

### Cited Findings
- Capsim offers a "Custom Report Builder" (CapsimCore, CapsimGlobal, CapsimOps, Capstone 2.0). It builds reports on participant activity and sim results that are searchable, sortable, downloadable and exportable to Excel. It is aimed mainly at instructors and administrators. — [Capsim blog](https://www.capsim.com/blog/product-update-custom-report-builder)
- Capstone students enter decisions and review pro formas for each round in the "Capstone Spreadsheet", which runs in Excel or in the browser. This is the vendor's own decision/what-if tool. — [Capsim guide: The Capstone Spreadsheet](https://ww3.capsim.com/guides/capstone_harvard2011/the-guide/1-introduction231b.html)
- Capstone's Analyst Report scores teams in 10 categories: margins, profits, emergency loans, working capital, market share, forecasting, customer satisfaction, productivity, financial structure and wealth creation. This is a useful model for a multi-KPI scorecard. — [Capsim guide](https://ww3.capsim.com/guides/capstone_harvard2011/website-and-spreadsheets.html) (via search summary)
- Some students build and share their own analysis spreadsheets for Capsim, for example a personal Weebly site and a paid Gumroad "capsim2024" product. — [rogercapsim.weebly.com](https://rogercapsim.weebly.com/); [Gumroad listing](https://chandrikadeb7.gumroad.com/l/capsim2024)
- Knowledge Matters VB Entrepreneurship: students pick one of 20 businesses, start with one business and one location, and expand to several businesses and locations. There is a "Reports" menu, and the sim tracks personal net worth. — [Knowledge Matters VB Essentials: Entrepreneurship](https://www.knowledgematters.com/vb-essentials/entrepreneurship/); [Knowledge Matters DECA page](https://www.knowledgematters.com/high-school/competitions/deca/) (via search summary)
- Teams can restart a practice file from the File menu. After reaching the stop date, they have to contact Knowledge Matters to restart. — [Knowledge Matters DECA page](https://www.knowledgematters.com/high-school/competitions/deca/) (via search summary)
- DECA VBC runs two online qualifying rounds per track, and Round 2 began January 13, 2026 in the 2025–26 season. Members can compete alone or in teams of up to three. At ICDC there are two sessions of about 15 minutes each, ranked on **cumulative total profit** (net worth only for Personal Finance). — [DECA: VBC-Entrepreneurship](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship); [DECA Guide VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf)
- **Conflict:** one Knowledge Matters summary says members compete to "earn the highest net worth possible", while the DECA ICDC guidelines rank Entrepreneurship on cumulative total profit. The app should let users choose which headline metric to track, and the ranking metric for each round should be confirmed from the current season's DECA guide. — [Knowledge Matters DECA page](https://www.knowledgematters.com/high-school/competitions/deca/) vs. [DECA Guide PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf)
- Knowledge Matters publishes a "hints" blog post for each season's challenge (FBLA and FCCLA examples found). A tracker could link to these official hints. — [KM FBLA hints](https://www.knowledgematters.com/blog/fbla-pbl-virtual-business-challenge-hints-2017-2018/)

### Inferences
- The metrics the tracker should capture per attempt: business type chosen, number of locations and businesses over time, sim date or week reached, profit, net worth, cash, and key decisions such as pricing, staffing, marketing and expansion timing. The exact fields depend on what the VB Entrepreneurship Reports menu shows, which should be checked hands-on.
- Capsim's 10-category scorecard is a good template for a "run health" panel that shows several KPIs instead of profit alone.

### Gaps
- I found no public community tracker, Discord bot, or Notion or Airtable template aimed specifically at Knowledge Matters VBC. Searches only turned up "answers" pages and TikTok content, which are low quality and possibly integrity-violating.
- I did not find evidence of student companion trackers for Marketplace Simulations or GoVenture.
- I could not read the exact list of Reports-menu screens in VB Entrepreneurship because fetches were blocked.

## 2. Analogous patterns worth borrowing (run logs, splits, run comparison, diffs, tags, deadlines, collaboration)

### Takeaway
Speedrun timers and ML experiment trackers have already solved "compare many attempts against my best" well. The patterns to copy are: sim-time checkpoints (splits), personal-best and best-segment comparisons, a sortable and taggable run table, a side-by-side "what changed" view of decisions, and a round countdown.

### Cited Findings
- LiveSplit compares the current run against comparisons the user defines, or against automatically generated ones such as Sum of Best Segments and Average run. — [LiveSplit GitHub](https://github.com/LiveSplit/LiveSplit); [livesplit-core comparison docs](https://docs.rs/livesplit-core/latest/livesplit_core/comparison/index.html)
- Sum of Best is the theoretical best time built from the best result on each segment. After many attempts it indicates the runner's realistic ceiling. — [LiveSplit](http://livesplit.github.io/)
- LiveSplit has a "Balanced PB" style comparison with the same final time as the PB, but with intermediate splits balanced by history so that mistakes inside the PB are smoothed out. It also has "Best Split Times" (the best pace ever reached at each checkpoint). — [livesplit-core comparison docs](https://docs.rs/livesplit-core/latest/livesplit_core/comparison/index.html)
- LiveSplit includes a "Sum of Best Cleaner" for finding and deleting bad segment data. This is the data-hygiene lesson: let users mark bad or aborted attempts so they don't distort the "best" numbers. — [LiveSplit GitHub](https://github.com/LiveSplit/LiveSplit)
- Community LiveSplit components color-grade each split against the comparison (for example gold for a best segment). — [LiveSplit.GradedSplits](https://github.com/Komarulon/LiveSplit.GradedSplits)
- W&B parallel-coordinates charts draw one line per run, with axes for config (inputs) and metrics (outputs). They are for seeing which input settings go with better outcomes. — [W&B docs: Parallel coordinates](https://docs.wandb.ai/models/app/features/panels/parallel-coordinates)
- W&B's run comparison puts structured run data into one table where users can group by any config key, highlight the best runs and drill into a single run. Consistent tags and descriptive run names keep this organized. — [Run comparison views](https://theneuralbase.com/weights-biases/learn/intermediate/run-comparison-views/); [W&B tables comparison](https://wandb.ai/stacey/xtable/reports/How-to-Compare-Tables-in-Workspaces--Vmlldzo4MTc0MTA)

### Inferences (proposed feature set, adapted to VBC)
- **Attempt log:** one record per attempt with mode (practice, Round 1, Round 2, ICDC session), date, who drove the attempt, business chosen, final profit and net worth, a status of completed, aborted or "bad data", tags such as "aggressive-expansion" or "low-price", and free-text notes.
- **Checkpoints = splits:** log KPIs at fixed sim-time checkpoints (for example each sim week or month, or each expansion event). With these, the app can show "ahead or behind PB at week N" and a VBC version of "sum of best checkpoints".
- **Decision snapshot and diff:** store the key decisions for each checkpoint as structured fields. A "vs. best run" view highlights the fields that changed, with the KPI deltas next to them, in the style of GitHub-diff or W&B compare.
- **Dashboard:** a line chart of profit or net worth over sim time with this attempt overlaid on PB; a scatter or parallel-coordinates view of decision inputs against final profit once the team has 10 or more attempts; and a sortable table of all runs.
- **Experiment framing:** before each practice attempt, the student writes a one-line hypothesis ("raise price 10% at week 3"). After it, they record the result. This borrows A/B-log discipline and keeps each attempt tied to one variable.
- **Round countdown and checklist:** show time remaining until each round window closes, plus a pre-round checklist (confirm the correct file or round, confirm no extensions are active, confirm team roles).
- **Collaboration:** a team workspace for 1–3 students with a read-only advisor role that can comment. Esports VOD-review practice (time-stamped comments on a replay) maps onto comments attached to a particular attempt or checkpoint.

### Gaps
- I did not gather specific sources on esports VOD-review tools, Notion or Airtable competition templates, or study-planner apps. These patterns come from general product knowledge and are not cited here.

## 3. Data-entry realities and ToS / academic-integrity concerns

### Takeaway
Knowledge Matters has no public API, so data has to be entered manually, pasted, or extracted from screenshots **after the fact**. Anything that runs alongside or inside the competition sim (an extension, overlay, auto-clicker or screen reader) risks immediate disqualification. The app must be a separate logbook, used away from the sim, and must never touch the sim.

### Cited Findings
- VBC rule: "The use of external applications, browser extensions or built-in browser tools within our competition simulations is strictly forbidden", and violations lead to **immediate disqualification**. Participants are to ask Knowledge Matters when unsure whether something counts as a cheat. — [DECA Guide VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf); [DECA: VBC-Entrepreneurship](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship) (via search summary)
- Participants pledge that submitted work is solely their own, that they received **no outside help** with the challenge, that they have **not shared information about the competition simulation** with others, and that they will not hack or cheat. — [FBLA VBC page](https://www.fbla.org/virtual-business-challenge/); [FCCLA VBC page](https://fcclainc.org/compete/competitive-events/virtual-business-challenge) (the pledge language is shared across CTSO VBC partners; confirm the DECA-specific wording)
- Contact for rule questions: Support@KnowledgeMatters.com. — [Knowledge Matters Support](https://support.knowledgematters.com/support/solutions/3000005368) (via search summary)
- OCR options: Tesseract (including Tesseract.js in the browser) is free and does well on clean printed text, but reportedly scores near zero on tables in one benchmark. Vision LLMs are much better at placing fields from complex layouts into a schema. One estimate puts a 1500×1000 image through Claude Sonnet 4.5 at about $0.006. — [Joshua8.AI 2026 comparison](https://joshua8.ai/ocr-models-vs-vision-llms-vs-tesseract/); [DEV: Vision models vs Tesseract](https://dev.to/gabrielanhaia/vision-models-for-ocr-when-they-beat-tesseract-and-when-they-dont-54a6) (secondary blog sources; treat the numbers as indicative)

### Inferences
- **Recommended data-capture ladder, from simplest to most advanced:**
  1. A quick manual form with only 5–8 required fields, usable on a phone, filled in right after an attempt.
  2. Paste a copied table or text into a textarea and parse it into fields, if the Reports screens allow copying text.
  3. Screenshot upload with AI extraction into a fixed JSON schema, then a **mandatory human confirm and edit step**. Tesseract.js is a free fallback for simple numeric fields.
- **Integrity guardrails to build in and state in the UI:**
  - No browser extension, no overlay, and no scraping of the Knowledge Matters site.
  - Screenshots are taken and uploaded after a session, never processed in real time during a competition round.
  - AI features are disabled or hidden during "Competition round" attempts. Teams use the analysis only between practice sessions.
  - The advisor view is read-only.
  - No public sharing of competition-round sim details, which respects the "not shared information about the competition simulation" pledge.
- **Unresolved grey area:** whether AI-generated strategy advice counts as "outside help" under the pledge. The safe position is that AI analysis applies to *practice* runs only, and a student or advisor should confirm with Knowledge Matters in writing before relying on it for competition rounds.
- Keeping screenshots private and short-lived (auto-delete the image after extraction) reduces both privacy exposure and the risk of competition content being redistributed.

### Gaps
- I could not access the full Knowledge Matters website Terms of Use (fetch blocked). Whether it prohibits screenshots or storing sim data for personal use is unconfirmed.
- The exact 2026–27 DECA VBC guideline text still needs to be checked. The PDF cited is the 2024–25 guide.

## 4. Recommended lean stack for 2026, costs, and minors' privacy (COPPA/FERPA)

### Takeaway
Next.js (App Router) on Vercel Hobby plus Supabase Free (Postgres, Auth, Storage, row-level security) costs $0 for a 1–3 person team and fits a solo high-schooler working with AI coding help. The main operational catch is that a Supabase free project pauses after 7 days without database activity. On privacy: collect the minimum, avoid users under 13, and keep the tool personal or team-run rather than presenting it as a school-adopted edtech product.

### Cited Findings
- **Supabase Free:** 500 MB database, 1 GB file storage, 50,000 MAU, 5 GB egress, limit of 2 active projects, no backups. Projects **pause after 1 week of inactivity**, measured as no actual database queries, and are restored from the dashboard. Pro costs $25/month per project and removes pausing. — [Supabase pricing](https://supabase.com/pricing); [Supabase Docs: Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing); [UI Bakery 2026 summary](https://uibakery.io/blog/supabase-pricing) (numbers via search summaries; confirm on the live page)
- **Vercel Hobby:** free, and restricted to **non-commercial personal use**. It includes 100 GB of fast data transfer, 1M edge requests, 1M function invocations, 4 CPU-hours of active function CPU and 100 deployments a day. Once a limit is exceeded, the feature stops until the 30-day window resets, and extra usage cannot be bought. Commercial use requires Pro. — [Vercel Docs: Hobby plan](https://vercel.com/docs/plans/hobby); [Vercel Fair Use](https://vercel.com/docs/limits/fair-use-guidelines)
- **COPPA:** applies to operators collecting personal information from children **under 13**. The FTC's amended rule took effect June 23, 2025, with a **compliance deadline of April 22, 2026**. It expands parental-consent requirements and requires a written information security program. — [FTC press release, Jan 2025](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-finalizes-changes-childrens-privacy-rule-limiting-companies-ability-monetize-kids-data); [Federal Register, Apr 22 2025](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule); [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- **FERPA:** covers education records held by schools. Vendors receive PII from education records under the "school official" exception only if they perform a function for the school, stay under the school's direct control, and generally sign a data privacy agreement. A teacher should check with the district before adopting an online tool. — [studentprivacy.ed.gov FAQ](https://studentprivacy.ed.gov/faq/i-want-use-online-tool-or-application-part-my-course-however-i-am-worried-it-violation-ferpa); [PIPC: FERPA exceptions](https://pipc.tech/ferpa-exceptions/); [ED 2014 guidance PDF](https://studentprivacy.ed.gov/sites/default/files/resource_document/file/Student%20Privacy%20and%20Online%20Educational%20Services%20(February%202014)_0.pdf)

### Inferences
- **Suggested stack:**
  - Next.js with TypeScript, Tailwind and shadcn/ui.
  - Supabase Auth (magic link, or Google sign-in via the school account if the district allows it) with Postgres and row-level security by `team_id`.
  - Supabase Storage for temporary screenshots.
  - A charting library such as Recharts or Chart.js.
  - Deploy on Vercel Hobby.
  - Optional AI endpoint in a server route using a vision-capable LLM API key kept server-side. This is likely a few cents per season at about $0.006 per image. It is the one item that may need a small paid API balance, or a free-tier LLM.
- **Simpler alternatives:**
  - A Google Sheet plus Looker Studio, or a Notion or Airtable base, is a zero-code version 0 worth prototyping first.
  - A local-first single-page app (IndexedDB, JSON export) avoids accounts and almost all privacy issues for a 1–2 person team.
- **Schema sketch:** `teams`, `members` (role: student or advisor), `attempts` (mode, business_type, hypothesis, status, tags, final_profit, final_net_worth, notes), `checkpoints` (attempt_id, sim_period, profit, net_worth, cash, locations, decisions JSONB), `comments`, and `rounds` (name, opens_at, closes_at).
- **Supabase pausing workaround:** regular use during the season keeps the project active. Off-season pauses are harmless if restored manually. Don't rely on "keep-alive" cron hacks if they breach the fair-use spirit; just restore when needed.
- **Privacy basics for this tool:**
  - Collect only first name or nickname and an email.
  - Don't collect birthdates, and don't target or allow under-13 users. DECA members are high schoolers, so this is mostly moot, but add an age attestation.
  - No ads or analytics trackers.
  - Keep the data private to the team.
  - Provide delete-my-data and export.
  - Don't import grades or school records. That keeps the app out of FERPA "education record" territory, since it is a student-run personal tool rather than a school-contracted vendor.
  - If an advisor wants to adopt it chapter-wide, check district approval and data-privacy-agreement requirements first.
- Hobby's non-commercial clause fits a free student tool. Selling it to other chapters would require Vercel Pro and a proper privacy policy.

### Gaps
- I could not verify current Supabase or Vercel pricing pages directly because fetches were blocked. The figures come from secondary summaries and should be rechecked.
- I did not check state student-privacy laws (such as California SOPIPA or state DPAs), which could apply if the app is adopted by a school.
- I did not verify the free-tier terms or age requirements of LLM providers. Many API terms require users to be 18 or older, or require developer accounts held by adults, so an advisor or parent may need to own the API key. This should be confirmed.

## 5. Useful AI features and their risks

### Takeaway
The safest high-value AI uses are after-the-fact helpers on the team's own practice data: extracting numbers from screenshots with human confirmation, summarizing notes into "lessons learned", and suggesting the next single-variable experiment. The risks are hallucinated numbers or strategy, over-reliance, and possibly breaching the "no outside help" pledge during competition rounds.

### Cited Findings
- Vision LLMs extract structured fields from complex layouts much better than traditional OCR, but they can still make errors, and the same model performs differently on transcription than on field extraction. — [Joshua8.AI](https://joshua8.ai/ocr-models-vs-vision-llms-vs-tesseract/); [DEV Community](https://dev.to/gabrielanhaia/vision-models-for-ocr-when-they-beat-tesseract-and-when-they-dont-54a6)
- The VBC pledge includes having "received no outside help with the challenge", and external applications are forbidden within competition simulations. — [FBLA VBC](https://www.fbla.org/virtual-business-challenge/); [DECA Guide PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf)

### Inferences
- **Candidate AI features:**
  1. Screenshot to fields, with a confirm step.
  2. "Summarize this attempt's notes and deltas vs. PB."
  3. "Given the last N attempts' tags and results, which one variable should we test next?" The answer should cite the team's own attempts only.
  4. Weekly digest for the advisor.
  5. Auto-tagging of notes.
- **Risks and mitigations:**
  - Hallucinated sim mechanics: ground prompts only in the team's logged data, and label outputs as hypotheses.
  - Wrong extracted numbers: require human confirmation, and validate ranges.
  - Integrity: a hard "competition mode" switch that disables AI, and a visible disclaimer.
  - Privacy: strip names from images and prompts, and use an API tier that does not train on inputs.
  - Cost runaway: rate-limit requests per team.
  - Over-reliance: keep the student-written hypothesis field mandatory.

### Gaps
- I found no published guidance from Knowledge Matters or DECA that specifically addresses AI tools for between-round practice analysis. This should be asked of Knowledge Matters directly.
