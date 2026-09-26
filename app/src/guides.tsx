import type { ReactNode } from 'react'

export interface GuideStep {
  title: string
  body: ReactNode
}

export interface Guide {
  title: string
  intro: ReactNode
  steps: GuideStep[]
  tips?: ReactNode[]
}

const B = ({ children }: { children: ReactNode }) => <strong>{children}</strong>

export const GUIDES: Record<string, Guide> = {
  home: {
    title: 'Home — your dashboard',
    intro: 'Check this at the start of every session. It tells you where you stand and what to do next.',
    steps: [
      {
        title: 'Check the round selector (top right)',
        body: 'Make sure it shows the round you are working on. Before Round 1 opens it defaults to Practice. Everything on the page follows this choice.',
      },
      {
        title: 'Read the deadline card',
        body: 'Shows when the next round opens or closes, in Eastern Time (what DECA uses) and your local time. Rounds open 10:00 a.m. ET and close 5:00 p.m. ET.',
      },
      {
        title: 'Read your four numbers',
        body: (
          <>
            <B>Best</B> = your personal best (PB) — the only score that counts. <B>Gap to cutoff</B> = how far above/below the
            qualifying line you are (set it on the Round page). <B>Attempts today</B> and <B>Hours logged</B> track effort; top
            teams report ~80 hours per round.
          </>
        ),
      },
      {
        title: 'Finish any “Planned” runs',
        body: 'If you saved a plan before running the sim, it appears here. Tap “Log results” as soon as the run ends.',
      },
      {
        title: 'Look at the progress chart',
        body: 'Blue dots = each run. Orange step line = best so far. You want the orange line stepping up; a flat line for many runs means it is time to try a different area.',
      },
      {
        title: 'Pick your next experiment',
        body: 'Under “Next experiments”, tap Test on the top idea, or ask the AI coach (right side) to suggest some.',
      },
    ],
    tips: ['Press “+ Log attempt” any time to start a new run.'],
  },

  log: {
    title: 'Logging an attempt — step by step',
    intro: (
      <>
        Do <B>steps 1–2 before</B> you open the sim, then close this app on the sim device. Do <B>steps 3–5 right after</B> the
        run ends, while the reports are on screen.
      </>
    ),
    steps: [
      {
        title: '1 · Plan the run',
        body: (
          <>
            Write the <B>hypothesis</B>: “Change [decision] from [old] to [new] because [reason]; I expect [score] to go up.” Check the{' '}
            <B>Round</B>, <B>Operator</B> (you, by default) and <B>Business</B>. The <B>Baseline run</B> is the run you are copying —
            leave it on your PB unless you are deliberately testing from another run. Tip: tap “✍️ Check my hypothesis” in the coach.
          </>
        ),
      },
      {
        title: '2 · Record your decisions',
        body: (
          <>
            Your baseline’s decisions are already filled in. Open the area you are testing (e.g. <B>Pricing</B>) and change{' '}
            <B>exactly one</B> field to the new value. It turns amber and shows “was: …”. The line under the step title lists what
            changed — it should name one decision. Fields the sim doesn’t use can stay blank.
          </>
        ),
      },
      {
        title: 'Run the sim',
        body: 'Save plan, run later if you want to fill results from another device. Use the exact values you wrote down. Note anything surprising on paper.',
      },
      {
        title: '3 · Final results',
        body: (
          <>
            From the end-of-run reports copy: <B>Final profit</B> and <B>Final net worth</B> (both, even if only one ranks),{' '}
            <B>Total revenue</B> and <B>Total expenses</B> (income statement), <B>Ending cash</B> and <B>Lowest cash</B>, loan info
            (<B>Debt remaining</B>, <B>Interest paid</B>), <B>Customer satisfaction</B>, <B>Employees</B> and <B>Locations</B> at the
            end. Blank is fine if the sim doesn’t show it.
          </>
        ),
      },
      {
        title: '4 · Year-by-year (recommended)',
        body: 'Tap “+ Add year-by-year numbers” and enter profit, net worth and cash at the end of each sim year. This shows WHEN a change helped — e.g. expansion hurt Year 3 but paid off by Year 5.',
      },
      {
        title: '5 · Review',
        body: (
          <>
            <B>Status</B>: Completed, Aborted (stopped early) or Bad data (typo/wrong file — excluded from your PB). <B>Verdict</B>:
            Keep if the change beat the baseline and you’ll build on it. Write <B>What happened</B> and a one-sentence{' '}
            <B>Lesson</B>. Then press <B>Save results</B>.
          </>
        ),
      },
    ],
    tips: [
      'Changed more than one thing? Still log it honestly — the app marks it as “confounded” so it doesn’t mislead your stats.',
      'Money fields accept $ and commas.',
    ],
  },

  attempt: {
    title: 'Reading an attempt',
    intro: 'Use this page right after saving to decide what to try next.',
    steps: [
      {
        title: 'Check the score and badges',
        body: 'The big number is the round’s ranking metric. A gold PB badge means this is now your best run. “New personal best — +$X” shows by how much.',
      },
      {
        title: 'Compare vs. PB and vs. baseline',
        body: 'Green = better, red = worse. “vs. baseline” is the fair comparison (same run, one change). “vs. personal best” shows how far you are from your top.',
      },
      {
        title: 'Read “What changed”',
        body: 'Amber rows changed, green were added, red removed. One amber row = a clean test you can trust.',
      },
      {
        title: 'Check the year-by-year table',
        body: 'If you logged it, look for the year where this run pulled ahead or fell behind.',
      },
      {
        title: 'Queue the next experiment',
        body: 'Type an idea in the box, or press “Next run from this” to start a new attempt using this run as the baseline (do this when the verdict is Keep).',
      },
    ],
    tips: ['Mark as bad data if you typed wrong numbers or used the wrong file — it stops the run from counting as your PB.'],
  },

  attempts: {
    title: 'All attempts — finding patterns',
    intro: 'Your full run history. Filter it to answer questions like “which pricing runs worked?”',
    steps: [
      { title: 'Check the summary strip', body: 'Runs, best, average and median score for the current filter, plus total time.' },
      {
        title: 'Filter',
        body: 'Search words in hypotheses/lessons, then narrow by round, status, verdict, tag, business, operator, decision changed, or a minimum score. “Clean tests only” keeps runs that changed exactly one decision.',
      },
      { title: 'Sort', body: 'Click a column header (desktop) or use the Sort menu to rank by score, profit, net worth, revenue or date.' },
      {
        title: 'Compare two runs',
        body: 'Tick the boxes on two runs and press Compare to see their results and decisions side by side.',
      },
      { title: 'Open any run', body: 'Tap a row for its full detail. The gold bar marks your PB in each round.' },
    ],
  },

  ideas: {
    title: 'Experiment ideas',
    intro: 'A queue of single-change tests so you never waste a run deciding what to try.',
    steps: [
      {
        title: 'Add an idea',
        body: (
          <>
            Fill in the <B>idea</B> (one line), its <B>area</B>, the <B>decision</B> and the exact <B>from → to</B> values,{' '}
            <B>what you expect</B> and <B>why</B> (evidence). Set <B>priority</B> and <B>effort</B>.
          </>
        ),
      },
      {
        title: 'Or let the coach suggest',
        body: 'Tap “💡 Suggest next experiments” in the AI coach, then “+ Add to experiment ideas” on the ones you like. They are tagged AI.',
      },
      {
        title: 'Test it',
        body: 'Press “Test it”. A new attempt opens with the hypothesis filled in and the “to” value already applied to your baseline decisions.',
      },
      {
        title: 'It closes itself',
        body: 'When you save that attempt as Completed, the idea moves to “Tested” with a link to the result. Drop ideas you no longer want.',
      },
    ],
    tips: ['High priority + quick effort first. Explore untested areas every few runs.'],
  },

  round: {
    title: 'Round page — session routine',
    intro: 'Use before, during and after each work session in a round.',
    steps: [
      { title: 'Before: check the schedule', body: 'Main window and mini-challenges in Eastern Time. “Unverified” dates came from another track — confirm them.' },
      {
        title: 'Before: run the checklist',
        body: 'Load the default checklist once, then tick each item before you start. It includes the integrity rules (no extensions/overlays, this app closed on the sim device).',
      },
      {
        title: 'After: save a leaderboard snapshot',
        body: 'Copy your regional rank and the 2nd-place score from the public leaderboard. The 2nd-place score is the qualifying cutoff that powers “Gap to cutoff”.',
      },
      { title: 'After: log extra time', body: 'Attempt minutes count automatically; log research or report-reading time here.' },
      { title: 'Reset the checklist', body: 'Press “Reset for next session” when you are done.' },
    ],
  },

  settings: {
    title: 'Team settings',
    intro: 'Set these up once, then revisit when you learn something about the rules.',
    steps: [
      { title: 'Team', body: 'Name, default business and competition mode (Auto shows the warning banner while windows are open).' },
      { title: 'Members', body: 'Add teammates by name. In team mode, share the join code; advisors join read-only.' },
      {
        title: 'Rounds & scoring',
        body: 'After reading the 2026-27 VBC Guidelines, set each round’s ranking metric (profit / net worth / points) and tick Verified. Fix any dates.',
      },
      {
        title: 'AI coach',
        body: 'Team mode: the key lives on the server. Local mode: paste your own OpenAI key. “Allow during open rounds” is off by default — only turn it on if your advisor confirms it is allowed.',
      },
      { title: 'Data', body: 'Export CSV for spreadsheets; download a JSON backup after each session (essential in local mode).' },
    ],
  },
}

export function guideFor(pathname: string): Guide {
  if (pathname === '/attempts/new' || pathname.endsWith('/edit')) return GUIDES.log
  if (pathname.startsWith('/attempts/compare')) return GUIDES.attempts
  if (pathname.startsWith('/attempts/')) return GUIDES.attempt
  if (pathname.startsWith('/attempts')) return GUIDES.attempts
  if (pathname.startsWith('/backlog')) return GUIDES.ideas
  if (pathname.startsWith('/round')) return GUIDES.round
  if (pathname.startsWith('/settings')) return GUIDES.settings
  return GUIDES.home
}
