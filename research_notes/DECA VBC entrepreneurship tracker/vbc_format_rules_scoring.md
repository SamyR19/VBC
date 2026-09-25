# DECA Virtual Business Challenge (VBC): Format, Rules, Timeline and Scoring, with a Focus on Entrepreneurship (2025-26 and 2026-27)

**Methodology caveat:** The network egress proxy blocked direct fetches of deca.org, decadirect.org, decaplus.org, knowledgematters.com and the DECA Guide PDFs on cdn.prod.website-files.com. `curl` confirmed a policy 403 on CONNECT. Every finding below therefore comes from **web-search result snippets and search-engine summaries** of those official pages. The underlying pages were not read in full. Treat exact wording as close to the source but not verbatim, and check key numbers against the PDFs linked below before relying on them. Official PDFs that exist and should be read directly:
- DECA Guide 2026-27 VBC guidelines: https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf
- DECA Guide 2025-26 VBC guidelines: https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/68558aad1554c0d934b88d9a_HS_VBC_Guidelines.pdf
- DECA Guide 2024-25 VBC guidelines: https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf
- DECA VBC Info Packet 2023-24 (older): https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/64ecf66f14ac583ece543a98_DECA%20VBC%20Info%20Packet%202023-24%20MG%20Edits%5B39%5D.pdf
- DECA 2026-27 Challenges guide: https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a5a555554821bce64a3d510_DECA-26-27-Challenges.pdf

## Q1. VBC categories, and what the Entrepreneurship track covers

### Takeaway
There are eight VBC tracks: Accounting, Entrepreneurship, Fashion, Hotel Management (branded as the "DECA Hotel Challenge"), Personal Finance, Restaurant, Retailing and Sports. In the Entrepreneurship track, students choose one of about 20 business types. They do market research, then launch and run the business: financing, staffing, resources, pricing and marketing.

### Cited Findings
- DECA's VBC program has eight tracks: Accounting, Entrepreneurship, Fashion, Hotel Management, Personal Finance, Restaurant, Retailing and Sports. — [DECA Direct: Beginner's Guide to the DECA VBCs](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)
- The 2026 Round One article names the tracks as "VBC Entrepreneurship, VBC Fashion, VBC Accounting, DECA Hotel Challenge, VBC Personal Finance, VBC Restaurant, VBC Retailing and VBC Sports". — [DECA Direct: Get Ready for Round One of the 2026 DECA VBC](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)
- In Entrepreneurship, participants "conduct market research, spot new business opportunities and take the plunge by embarking on their very own entrepreneurial venture with 20 different businesses to choose from." They "implement new business strategies via requesting financing, building their team, acquiring resources, setting prices, developing their marketing and more, while analyzing market data and applying critical thinking and decision making skills." — [DECA: VBC-Entrepreneurship event page](https://www.deca.org/compete/virtual-business-challenge-entrepreneurship); [DECA+: VBC-Entrepreneurship](https://www.decaplus.org/competitive-events/virtual-business-challenge-entrepreneurship)
- Knowledge Matters describes the same Entrepreneurship sim for BPA: spot opportunities, do market research, open the business, raise finances, build a team, acquire resources, organize workflow, assess risks and develop marketing strategies. — [Knowledge Matters: BPA competitions page](https://www.knowledgematters.com/high-school/competitions/bpa/)
- The DECA event code for VBC Accounting is "VBCAC". Each track has its own code in the DECA Guide. — [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)

### Inferences
- The tracker app should store "track" as an enum of 8 values. Entrepreneurship should also record which of the roughly 20 business types the team chose, because each run can differ.
- The Entrepreneurship event code is probably something like "VBCEN", following the "VBCAC" pattern. This is not confirmed.

### Gaps
- I could not confirm the exact Entrepreneurship event code or the full list of the 20 business types, because the Knowledge Matters and DECA pages could not be fetched.

## Q2. Team size, eligibility, registration, cost, administration and platform

### Takeaway
VBC is free for DECA high school members. Students can compete alone or in teams of up to 3. DECA runs the event with sponsor Knowledge Matters, whose parent company is eDynamic Learning. Students register on the Knowledge Matters Virtual Business platform, and the chapter advisor approves them at vb.knowledgematters.com. For 2026-27, team registration opens on Tuesday, September 29, 2026.

### Cited Findings
- The event is open to all DECA high school members at no cost. — [Knowledge Matters: DECA competitions](https://www.knowledgematters.com/high-school/competitions/deca/)
- Members may compete "individually or as a team of up to 3 members". — [DECA Direct 2026 Round One article](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)
- Teams can have one to three members. — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)
- Teams can enter Round 1, Round 2 or both. — [DECA Direct: Get Ready for Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-deca-virtual-business-challenge)
- 2026-27 team registration begins on Tuesday, September 29, 2026. — [DECA Direct 2026 Round One article](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)
- DECA's calendar also lists a "Virtual Business Challenge Registration Opens" event. — [DECA calendar](https://www.deca.org/calendar/virtual-business-challenge-registration-opens)
- Knowledge Matters sponsors the event. The DECA Guide lists it as "VIRTUAL BUSINESS CHALLENGE ACCOUNTING VBCAC Sponsored by Knowledge Matters". — [DECA Guide VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/668ff399e0d385eb83e84a1f_HS_VBC_Guidelines.pdf)
- Advisors log in at vb.knowledgematters.com. DECA sends participants to the Knowledge Matters website and the VBC Info Packet for full rules. — [DECA Guide 2025-26 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/68558aad1554c0d934b88d9a_HS_VBC_Guidelines.pdf)
- Registration steps: students register at knowledgematters.com, and the advisor approves them from the instructor account before they can compete. Students with an existing Virtual Business account do not need a new one. The first member to join forms the team and picks the team name, other members are dragged onto the team, and advisors can rename teams. — [Knowledge Matters blog: DECA VBC for DECA Advisors](https://www.knowledgematters.com/blog/deca-virtual-business-challenge-deca-advisors/); [Knowledge Matters blog: Registration Has Begun](https://www.knowledgematters.com/blog/deca-virtual-business-challenge-registration-has-begun/)
  - The same search summary said advisor credentials are "emailed via BPA". That text probably came from the parallel BPA page and should not be applied to DECA.
- Knowledge Matters VBC support articles, such as "VBC How to Register as a Student", are hosted on the eDynamic Learning support site. — [eDynamic Learning support](https://support.edynamiclearning.com/s/article/VBC-How-to-Register-as-a-Student)
- The simulation runs in the browser with nothing to download. It works on Mac, PC and Chromebook, and students can log in from home. — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)
- Knowledge Matters hosts public leaderboards at leaderboard.knowledgematters.com. Example: "icdc qualifying leaders" for code DECACC23. — [Knowledge Matters leaderboard](https://leaderboard.knowledgematters.com/vbc/leaderboard/dec/DECACC23/0)
- Students who compete in VBC at ICDC may not compete in any other ICDC event or activity. — [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)

### Inferences
- Data model: Team has 1 to 3 members, a team name, one track, and a chapter/advisor. Registration is per round.
- Whether one student can sit on teams in several tracks during qualifying rounds is not confirmed. The ICDC rule (VBC competitors can do no other ICDC event) suggests a student can only take one VBC slot at ICDC.

### Gaps
- It is not confirmed whether a student may enter more than one track, or be on more than one team, in the same qualifying round.
- It is not confirmed whether ICDC qualifiers must pay ICDC conference registration and travel. They almost certainly do, since ICDC is an in-person conference, but I found no source that says so.

## Q3. Rounds and timeline, including ICDC

### Takeaway
There are two online qualifying rounds, each 10 days long. Round 1 is in late October and Round 2 is in mid-January. Each round opens at 10:00 a.m. ET and closes at 5:00 p.m. ET, and includes three shorter "mini-challenges". In each round, the top 2 teams per track per DECA region qualify for ICDC, with a limit of one team per chapter per track per round. Finalists then compete live and in person at ICDC in two timed sessions of about 15 minutes each.

### Cited Findings
**2026-27 season (current)**
- Registration opens on Tuesday, Sep 29, 2026. — [DECA Direct 2026 Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)
- Round 1 runs from Oct 13, 2026, 10:00 a.m. ET to Oct 23, 2026, 5:00 p.m. ET. "All qualifying competition rounds begin at 10am Eastern Time on the start date, and end at 5pm Eastern Time on the final day of the round." — [DECA Direct 2026 Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge); [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- Round 1 mini-challenge windows. These were quoted in the Accounting section of the guidelines, and the same windows appear in the 2026 Round One article:
  - Oct 14, 8:30 p.m. to Oct 15, 5:00 p.m. EST
  - Oct 19, 8:30 p.m. to Oct 20, 5:00 p.m. EST
  - Oct 21, 8:30 p.m. to Oct 22, 5:00 p.m. EST

  Sources: [DECA Direct 2026 Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge); [DECA Guide 2026-27](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- Round 2 runs from Jan 12, 2027 to Jan 22, 2027, 10:00 a.m. to 5:00 p.m. ET. Its mini-challenges, quoted for Accounting, are:
  - Jan 12, 8:30 p.m. to Jan 13, 5:00 p.m.
  - Jan 14, 8:30 p.m. to Jan 15, 5:00 p.m.
  - Jan 20, 8:30 p.m. to Jan 21, 5:00 p.m. EST

  Source: [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- ICDC 2027 is April 17-20, 2027 at the Anaheim Convention Center in Anaheim, CA. — [California DECA ICDC page](https://californiadeca.org/conferences/icdc/); [Georgia DECA 2027 ICDC](https://gadeca.org/events/icdc)
  - This comes from state association pages. The ICDC 2027 dates were not confirmed on deca.org.

**2025-26 season (just completed)**
- Round 1 ran from Oct 14, 2025, 10:00 a.m. EST to Oct 24, 2025, 5:00 p.m. EST. Round 2 ran from Jan 13, 2026, 10:00 a.m. ET to Jan 23, 2026, 5:00 p.m. ET. The final round was live at ICDC, April 25-28, 2026, in Atlanta, GA. — [DECA Direct: Get Ready for Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-deca-virtual-business-challenge)
- DECA published the Round 1 qualifiers in "Announcing the 2025-2026 VBC Round 1 ICDC Qualifiers". — [DECA Direct](https://www.decadirect.org/articles/announcing-the-2025-2026-virtual-business-challenge-round-1-icdc-qualifiers)

**Advancement**
- The top two teams per track, per round, per region are eligible for ICDC, as long as they meet their chartered association's rules. Only one team per chapter per track per round may qualify. — [DECA Guide 2025-26 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/68558aad1554c0d934b88d9a_HS_VBC_Guidelines.pdf); [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- DECA has four regions: Central, North Atlantic, Southern and Western. — [DECA Direct: 2025-26 Round 1 qualifiers article](https://www.decadirect.org/articles/announcing-the-2025-2026-virtual-business-challenge-round-1-icdc-qualifiers) (search summary)

**ICDC format**
- At ICDC, every VBC track competes in two sessions. Final rankings use cumulative total profit from both sessions, or net worth for the Personal Finance sim. Each session runs about 15 minutes. — [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf) (search summary)
- "Unlike the qualifying rounds, competition sessions held at ICDC will be timed events." — [DECA Direct: Get Ready for Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-deca-virtual-business-challenge)
- Knowledge Matters published a video of the VBC Hotel final round at ICDC in Atlanta, won by Team Oof from Oak Harbor HS (WA). — [Knowledge Matters blog](https://www.knowledgematters.com/blog/virtual-business-challenge-hotel-final-round-video/)

### Inferences
- Maximum ICDC qualifiers per track: 2 rounds × 4 regions × 2 teams = 16 teams per track. This is an upper bound. Duplicates, declined spots, and teams that fail the one-team-per-chapter rule could lower it.
- Phases the tracker should model: registration opens → practice → R1 (10 days, with 3 mini-challenge windows) → R1 qualifiers announced → R2 (10 days, with 3 mini-challenges) → R2 qualifiers announced → ICDC (2 × ~15-minute live sessions, cumulative profit).
- Dates should be stored with time zones: opens 10:00 ET, closes 17:00 ET, and mini-challenges run 20:30 to 17:00 ET the next day.

### Gaps
- Mini-challenge dates were confirmed for Accounting and appear in the general 2026 article. I could not confirm that Entrepreneurship uses the same windows. Some tracks may have track-specific mini-challenge schedules.
- The exact date qualifiers are announced after each round was not found.
- I found no dedicated official "practice round". The "practice" described is unlimited replay during a round, plus classroom Virtual Business licences.

## Q4. How teams are scored and ranked

### Takeaway
In qualifying rounds, Entrepreneurship teams are ranked on **cumulative profit after running the sim for five virtual years**. There is no time limit per attempt and attempts are unlimited within the round, and **only the best total score counts**. A live scoreboard shows every team that has completed at least one run. At ICDC, the ranking is cumulative total profit across two timed sessions of about 15 minutes.

### Cited Findings
- "The competition sim may be completed multiple times within the challenge period, with only the best total score being counted in the overall rankings." — [DECA Direct: Get Ready for Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-deca-virtual-business-challenge); [DECA Guide VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf)
- "The system always keeps track of the highest score that they've submitted." — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)
- During each ten-day round, teams can experiment freely and have no time limit per submission. A live scoreboard shows every team with at least one completed run, ranked by final calculated score. — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges) (search summary)
- For Entrepreneurship, teams are ranked on the business's cumulative profit after running the sim for five virtual years. — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges) and [DECA Guide VBC PDFs](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf) (search summary; the source for this exact sentence is not certain)
- Knowledge Matters' BPA version of the Entrepreneurship event scores on **net worth**: members aim for the highest net worth over a set period. — [Knowledge Matters: BPA](https://www.knowledgematters.com/high-school/competitions/bpa/)
  - This **conflicts** with DECA's "cumulative profit" metric. DECA's own guidelines take precedence for DECA. BPA's rules may differ.
- Each qualifying round has three mini-challenges, and teams are ranked at the end of each one. — [Knowledge Matters blog: DECA Advisors](https://www.knowledgematters.com/blog/deca-virtual-business-challenge-deca-advisors/); [DECA Guide 2026-27](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- ICDC ranking is cumulative total profit across both sessions (net worth for Personal Finance), and sessions last about 15 minutes. — [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)

### Inferences
- Tracker data model: each attempt should store the date/time, round, business type, 5-year cumulative profit, year-by-year profit if possible, and key decisions. A team's round score is MAX over its attempts. Rank position comes from the public leaderboard.
- Model mini-challenges as separate scored events, each with its own ranking window.
- For ICDC practice, the relevant figure is the sum of profit over two short timed runs. That differs from the qualifying format (a full 5-year run with no time limit), so the tracker should support both modes.

### Gaps
- It is unclear how, or whether, mini-challenge results feed into ICDC qualification or the main round ranking. They may be standalone with separate recognition. I could not read the primary text.
- I found no tie-break rules.
- I could not confirm what a "session" covers at ICDC for Entrepreneurship, such as how many simulated periods fit into about 15 minutes.

## Q5. Presentation or judging component, and rubrics

### Takeaway
I found no presentation, judge interview or rubric in the VBC itself, either in qualifying rounds or at ICDC. Ranking is purely the simulation's numeric score. The Knowledge Matters event that involves judges is a **separate** competition, the "Digital Presentation Skills Challenge". It should not be confused with VBC.

### Cited Findings
- ICDC VBC rankings are determined by cumulative total profit from two sessions, with no judged component mentioned. — [DECA Guide 2026-27 VBC PDF](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- In the separate Knowledge Matters Digital Presentation Skills Challenge, the top 8 finalists give a live 5-10 minute Zoom presentation with judge Q&A. Its top 3 win $2,500, $1,000 and $500 and are recognised on stage at ICDC 2026. — [Knowledge Matters: Digital Presentation Skills Challenge](https://www.knowledgematters.com/high-school/competitions/presentation-skills/)

### Inferences
- The tracker does not need rubric or judge-score fields for VBC.

### Gaps
- Absence of a judged component comes from the scoring descriptions. I have not confirmed it from the full guideline text.

## Q6. Awards, recognition and submissions

### Takeaway
More than $20,000 in scholarships is shared across the VBC. ICDC 1st, 2nd and 3rd place teams in each track receive scholarships and are recognised at ICDC. Qualifying earns a trip to ICDC. Nothing is submitted beyond the simulation runs, which are recorded automatically.

### Cited Findings
- "Participate and you could earn a trip to ICDC and a share of over $20,000 in scholarship money." — [DECA Direct 2026 Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)
- "Scholarships will be awarded to the first, second and third place winners at ICDC." — [DECA Direct: Get Ready for Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-deca-virtual-business-challenge)
- DECA publishes the ICDC qualifiers after each round. — [DECA Direct 2025-26 R1 qualifiers](https://www.decadirect.org/articles/announcing-the-2025-2026-virtual-business-challenge-round-1-icdc-qualifiers)
- The best score is kept automatically, and there is no separate submission. — [DECA Direct Beginner's Guide](https://www.decadirect.org/articles/beginners-guide-to-the-deca-virtual-business-challenges)

### Gaps
- Per-place scholarship amounts per track were not found.
- Whether mini-challenge winners get prizes was not found.

## Q7. Rule changes in recent seasons

### Takeaway
I found no explicit "what's new" statement for the VBC. Across seasons, the structure (two 10-day qualifying rounds, 1 to 3 member teams, best score counts, top 2 per track per round per region, free entry, two-session ICDC final) looks stable from 2022-23 through 2026-27. The mini-challenges and the one-team-per-chapter cap appear in the 2025-26 and 2026-27 materials.

### Cited Findings
- DECA Guide VBC guidelines exist for 2022-23, 2023-24, 2024-25, 2025-26 and 2026-27 (the 2026-27 edition is on page 118 of the DECA Guide). — [2022-23](https://assets-global.website-files.com/635c470cc81318fc3e9c1e0e/639a9a20aea0053a7acb5198_HS_VBC_Guidelines.pdf), [2023-24](https://assets-global.website-files.com/635c470cc81318fc3e9c1e0e/649b555a73245428071ae169_HS_VBC_Guidelines.pdf), [2024-25](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/669956fed8bb6fe96f6721b6_HS_VBC_Guidelines.pdf), [2025-26](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/68558aad1554c0d934b88d9a_HS_VBC_Guidelines.pdf), [2026-27](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/6a3c7ec48e4955853e4382d4_HS_VBC_Guidelines.pdf)
- The one-team-per-chapter-per-track-per-round cap appears in the 2025-26 guideline summary. — [DECA Guide 2025-26](https://cdn.prod.website-files.com/635c470cc81318fc3e9c1e0e/68558aad1554c0d934b88d9a_HS_VBC_Guidelines.pdf)
- The Hotel track is branded "DECA Hotel Challenge" in 2026 materials, while older materials call it "Hotel Management". — [DECA Direct 2026 Round One](https://www.decadirect.org/articles/get-ready-for-round-one-of-the-2026-deca-virtual-business-challenge)

### Gaps
- I could not compare the PDFs directly, so I cannot say which year introduced the mini-challenges or the chapter cap, or whether the Entrepreneurship scoring metric changed (for example, from net worth to profit, or in the number of simulated years).
- The Info Packet I found is from 2023-24 and may be **outdated**. A 2025-26 or 2026-27 Info Packet was not found in search.
