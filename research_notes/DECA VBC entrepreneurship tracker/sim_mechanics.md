# In-Simulation Mechanics of Knowledge Matters' Virtual Business – Entrepreneurship (DECA VBC Entrepreneurship)

> **Research-method caveat (read first):** During this research session the egress proxy blocked *every* direct page fetch (knowledgematters.com, vbcourse.knowledgematters.com, deca.org, decadirect.org, DECA guideline PDFs on cdn.prod.website-files.com, quizlet.com, youtube.com, web.archive.org all returned `connect_rejected`/403). All findings below therefore come from **web-search result snippets/summaries** of the cited pages, not full-page reads. Search summaries can paraphrase or blend sources, so every item should be treated as "likely accurate, verify against the live page." Many granular in-sim details (exact report line items, decision screens, time controls) were **not** retrievable and are listed as Gaps. The single most valuable follow-up is a manual read of the official lesson-plan page (https://vbcourse.knowledgematters.com/publicDocs/generateLessonPlans/VBE1) and the current DECA VBC guidelines PDF.

---

## 1. What business does the player run, and what are the lessons/modules?

### Takeaway
The player picks one of 20 small service/food/entertainment businesses (not a product-manufacturing startup), opens it at one location, finances it (savings, bank loan, investors), hires staff, sets prices and marketing, and can later expand to multiple businesses and locations. The curriculum is 10 chapters/lessons with 18 simulation exercises plus three projects (Shark, Business Plan, Mega-Mogul).

### Cited Findings
- Launched Dec 4, 2019 as Knowledge Matters' ninth high-school business simulation; cloud-based, browser/device accessible — [PR Newswire launch release](https://www.prnewswire.com/news-releases/brand-new-digital-business-simulation-launched-to-teach-entrepreneurship-to-high-school-students-300969035.html)
- "Ten chapters (with reading and math quizzes) and 18 simulation exercises" covering market research, business plan, elevator pitch, raising money, going to market, operations — [PR Newswire](https://www.prnewswire.com/news-releases/brand-new-digital-business-simulation-launched-to-teach-entrepreneurship-to-high-school-students-300969035.html)
- The 10 lessons: Spotting the Opportunity; Market Research; Creating a Business Plan; The Elevator Pitch; Making the Plunge; Raising Money & Financials; Building a Team; Acquiring Resources; Going to Market; Operations & Feedback — [Knowledge Matters – Entrepreneurship](https://www.knowledgematters.com/high-school/entrepreneurship/); [eDynamic Learning course page](https://www.edynamiclearning.com/course/virtual-business-simulation-entrepreneurship/)
- 20 businesses: Smoothie Shop, Pizza Place, Plumbing Business, Electrical Business, Physical Therapy, Hair Salon, Auto Repair Shop, Catering, Online Gift Baskets, Trampoline Park, Bowling Alley, Fitness Center, Coffee Shop, Ice Cream Shop, T-Shirt Printing, Burrito Restaurant, Lawn Care Services, DJ Services, Batting Cage, Go Kart Track — [Knowledge Matters VB Essentials – Entrepreneurship](https://www.knowledgematters.com/vb-essentials/entrepreneurship/); [Knowledge Matters – Entrepreneurship](https://www.knowledgematters.com/high-school/entrepreneurship/)
- Three projects: Shark Project, Business Plan Project, Mega-Mogul Project. Mega-Mogul: "start with one business and one location, and work to grow and expand their entrepreneurial empire to multiple businesses and multiple locations" — [Knowledge Matters – Entrepreneurship](https://www.knowledgematters.com/high-school/entrepreneurship/)
- Shark Project: students pitch to classmates and seek virtual investments; Business Plan Project: teacher awards a loan based on the written business plan; students then continue running the business with the loan money — [Knowledge Matters VB Essentials – Entrepreneurship](https://www.knowledgematters.com/vb-essentials/entrepreneurship/) (via search snippet)
- Student Quizlet sets use finer-grained lesson numbering than 10 (e.g., "Lesson 1 – Spotting the Opportunity", "Lesson 3 – Business Plan Basics", "Lesson 8 – Raising Money & Financials (Savings and Bank Loans)", "Lesson 10 – Building a Team", "Lesson 14 – Operations & Feedback (Workflow and Feedback)"), and another set cites "Chapter 5 (Acquiring Resources)" — [Quizlet L8](https://quizlet.com/561157499/virtual-business-entrepreneurship-lesson-8-raising-money-financials-savings-and-bank-loans-flash-cards/); [Quizlet L10](https://quizlet.com/561159339/virtual-business-entrepreneurship-lesson-10-building-a-team-flash-cards/); [Quizlet L14](https://quizlet.com/561172150/virtual-business-entrepreneurship-lesson-14-operations-feedback-workflow-and-feedback-flash-cards/); [Quizlet L3](https://quizlet.com/577016226/virtual-business-entrepreneurship-lesson-3-business-plan-basics-flash-cards/); [Quizlet VB Entrepreneurship #2](https://quizlet.com/473741639/vb-entrepreneurship-2-flash-cards/)
- Lesson 14 vocabulary includes employee manual (policies/rules), income statement (revenue vs. expenses over a period), and employee-feedback methods (one-on-one meetings, employee surveys, suggestion box, open forums/town halls) — [Quizlet L14](https://quizlet.com/561172150/virtual-business-entrepreneurship-lesson-14-operations-feedback-workflow-and-feedback-flash-cards/)

### Inferences
- The Quizlet numbering (up to at least 14) suggests the 10 chapters are split into ~18 sim exercises/sub-lessons, e.g. "Raising Money & Financials" split into "Savings and Bank Loans" and presumably an investors/equity part; "Operations & Feedback" split into "Workflow and Feedback". Exact list of the 18 exercises was not retrievable.
- The businesses are service/food/recreation — so "inventory/purchasing" is likely lighter than in VB Retailing; "acquiring resources" probably covers equipment/supplies/space. (Unverified.)
- For a tracker data model: `business_type` should be an enum of the 20 names; allow multiple businesses and multiple locations per run (Mega-Mogul-style expansion).

### Gaps
- Exact titles/objectives of the 18 simulation exercises (lesson-plan page blocked).
- Whether the DECA VBC competition sim fixes the business type or lets the player choose; whether multi-location expansion is available in the competition version.

---

## 2. What decisions are available each period, and their constraints?

### Takeaway
Confirmed decision areas: choose business/opportunity, financing (personal savings, bank loans, investor equity/debt), hiring/staffing with wages, acquiring resources, setting prices (tiered pricing suggested), marketing, supervising employee workflow, and expanding to more businesses/locations. Precise per-period controls and numeric constraints were not found.

### Cited Findings
- DECA description: participants "spot opportunities, conduct market research, and open their business... raise finances, build a team, acquire resources, organize workflow, determine risks, and develop marketing strategies" — [DECA VBC-Entrepreneurship](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship)
- Knowledge Matters DECA page: "implement new business strategies via requesting financing, building their team, acquiring resources, setting prices, developing their marketing and more, while analyzing market data, interpreting financial reports" — [Knowledge Matters – DECA](https://www.knowledgematters.com/high-school/competitions/deca/)
- Financing: savings and bank loans are a lesson topic — [Quizlet L8](https://quizlet.com/561157499/virtual-business-entrepreneurship-lesson-8-raising-money-financials-savings-and-bank-loans-flash-cards/); investor deals can be equity or debt with different risk/return — [Knowledge Matters VB Essentials – Entrepreneurship](https://www.knowledgematters.com/vb-essentials/entrepreneurship/) (search snippet; mixed with non-KM results, moderate confidence)
- Staffing: students "must staff the business by paying sustainable wages to quality employees", guided through an "employee search-and-hire process" — [eDynamic Learning](https://www.edynamiclearning.com/course/virtual-business-simulation-entrepreneurship/) / [VB Essentials](https://www.knowledgematters.com/vb-essentials/entrepreneurship/) (search snippet)
- Workflow: a "Supervise Employees" screen shows target time each task should take vs. actual time employees take — search snippet attributed to [Knowledge Matters – Entrepreneurship](https://www.knowledgematters.com/high-school/entrepreneurship/) (**uncertain attribution** — this may describe the VB Management/Hotel sim)
- Pricing: "consider using a tier level pricing methodology" — search snippet attributed to [Knowledge Matters – Entrepreneurship](https://www.knowledgematters.com/high-school/entrepreneurship/) (**uncertain**)
- Market research includes competitor analysis noting customer ratings — search snippet, [Knowledge Matters – Entrepreneurship](https://www.knowledgematters.com/high-school/entrepreneurship/) (**uncertain**)
- Students "control all aspects of managing their growing business and see the impact of their decisions immediately" — [VB Essentials – Entrepreneurship](https://www.knowledgematters.com/vb-essentials/entrepreneurship/)

### Inferences
- Candidate decision fields for logging forms (inferred from the above, needs verification in-sim): business type; location(s); starting savings invested; loan amount/term; investor amount & equity % given up; number of employees, role, wage; equipment/resources purchased; price per service/product (possibly tiered: basic/standard/premium); marketing channel and spend; expansion events (new business / new location).
- "Sustainable wages to quality employees" implies a wage–quality/retention trade-off (low wages → worse employees or turnover). Unverified mechanics.
- Equity investment likely dilutes the owner's share of business value, reducing personal net worth relative to debt — plausible but not confirmed.

### Gaps
- Whether decisions are made continuously while time runs (like VB Retailing) or at discrete period boundaries.
- Exact marketing channels, loan interest rates/terms, loan limits, wage ranges, hours-of-operation controls, product-mix controls, inventory ordering, equipment catalog.
- Any hard constraints (e.g., cannot go below $0 cash, max loan based on business plan/credit).

---

## 3. What reports/dashboards appear in-sim and what metrics are shown?

### Takeaway
Confirmed: an income statement is taught/used, and there is a "Reports >> Personal Financial Summary" report showing the value of the player's business(es) and investments in classmates' businesses — the basis for "personal net worth." Other report names were not retrievable.

### Cited Findings
- Students "can see the value of their business and all their investments in classmates businesses by clicking Reports>>Personal Financial Summary" — search snippet attributed to [Knowledge Matters VB Essentials – Entrepreneurship](https://www.knowledgematters.com/vb-essentials/entrepreneurship/) / [lesson plans](https://vbcourse.knowledgematters.com/publicDocs/generateLessonPlans/VBE1)
- Students "watch as their personal net worth increases in the simulation" — [PR Newswire](https://www.prnewswire.com/news-releases/brand-new-digital-business-simulation-launched-to-teach-entrepreneurship-to-high-school-students-300969035.html)
- Income statement defined in Operations & Feedback lesson (revenue vs. expenses over a period) — [Quizlet L14](https://quizlet.com/561172150/virtual-business-entrepreneurship-lesson-14-operations-feedback-workflow-and-feedback-flash-cards/)
- Competitors "analyze market data, interpret financial reports" — [Knowledge Matters – DECA](https://www.knowledgematters.com/high-school/competitions/deca/)
- Supervise Employees screen: target vs. actual task time (uncertain attribution, see §2)

### Inferences
- Minimum metrics to track per snapshot: Personal net worth; business value; cash; loan balance; revenue; expenses; net income (profit); employee count; any customer-satisfaction/rating metric; employee efficiency (actual vs target time).
- Given other VB sims, a balance sheet and cash-flow view likely exist, but this is unconfirmed for Entrepreneurship.

### Gaps
- Full list of reports and exact line items (income statement categories, balance-sheet items, how "business value" is computed).
- Whether a customer satisfaction score, market share, or employee morale metric is displayed.

---

## 4. How does simulated time work and how long is a competition run?

### Takeaway
DECA qualifying rounds are ~10-day windows (late Oct and mid-Jan) with unlimited attempts/time per submission; ICDC has two ~15-minute timed sessions. The in-sim time unit (days/weeks) and speed controls for Entrepreneurship were not found.

### Cited Findings
- Two sets of qualifying rounds, "generally occur in late-October and mid-January"; "during each ten-day round, teams are free to experiment with the competition simulation and have no time restrictions for each submission"; rounds start 10am ET and end 5pm ET on final day — [DECA Direct: Beginner's Guide to the VBCs](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)
- Earlier guideline PDFs reportedly referenced ~11 days per qualifying round (search summary; **uncertain**) — [DECA 2023-24 VBC guidelines PDF](https://assets-global.website-files.com/635c470cc81318fc3e9c1e0e/649b555a73245428071ae169_HS_VBC_Guidelines.pdf)
- Teams of one to three members — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)
- ICDC: two sessions, each approximately 15 minutes — [DECA 2026-27 VBC guidelines PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf) (search snippet)
- Competing "for a specified period of time" (simulated duration unspecified) — [DECA VBC-Entrepreneurship](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship)
- BPA's VBC also has an Entrepreneurship track (2026: Oct 13 – Nov 6) — [Knowledge Matters – BPA](https://www.knowledgematters.com/high-school/competitions/bpa/)

### Inferences
- A tracker should model an "attempt/run" entity (round, date, attempt #, team members) with multiple time-stamped snapshots, since students can re-run many times during a 10-day round.
- VB sims typically run in simulated days/weeks with pause/play/speed; this is plausible but unverified for Entrepreneurship — make time unit a configurable field (e.g., `sim_week` integer plus optional `sim_day`).

### Gaps
- Simulated length of a competition run (e.g., N weeks/months), time controls, whether decisions can be changed mid-run.

---

## 5. What determines score, and any known formulas/penalties?

### Takeaway
DECA's event page states the objective is "the highest net worth possible while running the simulation for a specified period of time." Snippets about ICDC final ranking conflict (cumulative "total profit (or net worth for Personal Finance)" vs. "cumulative total points"). No formula for net worth or loan/cash penalties was found.

### Cited Findings
- "DECA members will be challenged to earn the highest net worth possible while running the simulation for a specified period of time" — [DECA VBC-Entrepreneurship](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship); [DECA+](https://www.decaplus.org/competitive-events/virtual-business-challenge-entrepreneurship)
- ICDC: "final rankings will be determined based on their cumulative total profit (or net worth for the Personal Finance sim) from both sessions" — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges); **contradicted/updated by** 2026-27 guidelines snippet: "cumulative total points from both sessions" — [DECA 2026-27 VBC guidelines](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- Net worth in-sim appears tied to "personal net worth" = value of own business(es) + investments in other businesses (Personal Financial Summary) — [VB Essentials](https://www.knowledgematters.com/vb-essentials/entrepreneurship/) / [PR Newswire](https://www.prnewswire.com/news-releases/brand-new-digital-business-simulation-launched-to-teach-entrepreneurship-to-high-school-students-300969035.html)

### Inferences
- Scoring metric for the tracker should be `net_worth` as primary for Entrepreneurship qualifying rounds; also store `cumulative_profit` and an ICDC `points` field because DECA's ICDC wording varies by year.
- Standard accounting would make net worth ≈ assets − liabilities, so loans likely do not add to net worth (cash in offset by liability) but interest reduces it; not confirmed.

### Gaps
- Exact net worth formula, treatment of loans/equity, penalties for negative cash/bankruptcy, and how "points" are computed at ICDC.

---

## 6. Differences vs other VB sims (Retailing, Restaurant)

### Takeaway
Retailing (convenience store: pricing, purchasing, promotion) and Restaurant (menu design/pricing, advertising, purchasing) are scored on profit; Entrepreneurship is scored on net worth and adds financing, business choice, team-building, and expansion.

### Cited Findings
- VBC Retailing: pricing, purchasing and promotion within a convenience store; optimize profitability — [DECA VBC-Retail](https://www.deca.org/compete/virtual-business-challenge-retail)
- VBC Restaurant: market research, menu design and pricing, advertising, purchasing; optimize profitability — [DECA VBC-Restaurant](https://www.deca.org/compete/virtual-business-challenge-restaurant)
- Entrepreneurship: net worth objective — [DECA VBC-Entrepreneurship](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship)
- DECA runs eight VBC tracks: Accounting, Entrepreneurship, Fashion, Hotel, Personal Finance, Restaurant, Retailing, Sports — [DECA Direct: Get Ready for Round One 2026](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)
- A student-written VBC Retailing tips document exists (useful template for tracker "strategy notes") — [DECA Canada – VBC Retail Tips (Rachel Lin)](http://www.deca.ca/documents/Masters./VBCRetailTipsandNotes.pdf)

### Inferences
- If the tracker may later support other tracks, keep `score_metric` configurable per track (profit vs net worth).

### Gaps
- Detailed side-by-side of UI/decision screens across sims.

---

## 7. Teacher guides, lesson lists, glossary, help content

### Takeaway
Official lesson plans exist at a public Knowledge Matters URL (blocked here); Quizlet vocab sets mirror lesson glossaries. Knowledge Matters has historically posted annual "VBC Hints" blog posts (latest found: 2017-18, outdated).

### Cited Findings
- Lesson plans: [ENTREPRENEURSHIP Lesson Plans (VBE1)](https://vbcourse.knowledgematters.com/publicDocs/generateLessonPlans/VBE1)
- VBC hints blog (2017-18; predates Entrepreneurship sim, which launched Dec 2019) — [Knowledge Matters VBC Hints 2017-2018](https://www.knowledgematters.com/blog/virtual-business-challenge-hints-2017-2018/)
- Launch video — [YouTube: VB Entrepreneurship](https://www.youtube.com/watch?v=XYDQcTz1Xuo); Mega-Mogul walkthrough — [YouTube: Mega-Mogul Project](https://www.youtube.com/watch?v=qVQWkDtpVOg); [Namahoro write-up](https://www.namahoro.com/mega-mogul-project-virtual-business-entrepreneurship/)
- Knowledge Matters DECA VBC info packet 2023-24 — [PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/64ecf66f14ac583ece543a98_DECA%20VBC%20Info%20Packet%202023-24%20MG%20Edits%5B39%5D.pdf)
- Summer 2020 VB updates blog — [Knowledge Matters blog](https://www.knowledgematters.com/blog/virtual-business-simulations-summer-2020-updates/)

### Inferences
- Student posts (TikTok) mention Mega-Mogul net worth goals like $35,000 for a level — seen only in a search summary, **unverified**.

### Gaps
- No Reddit r/DECA threads with Entrepreneurship-specific strategy surfaced. No accessible help-center/glossary content. Nothing found describing 2024-2026 version changes specifically.
