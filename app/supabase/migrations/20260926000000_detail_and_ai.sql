-- Richer attempt results, detailed experiment ideas, and AI coach support.

alter table public.attempts
  add column final_revenue numeric,
  add column final_expenses numeric,
  add column ending_cash numeric,
  add column total_debt numeric,
  add column interest_paid numeric,
  add column customer_satisfaction numeric,
  add column employees int,
  add column locations int,
  add column checkpoints jsonb not null default '[]'::jsonb,  -- [{period, profit, net_worth, cash, revenue, note}]
  add column run_notes text;

alter table public.backlog
  add column category text,
  add column from_value text,
  add column to_value text,
  add column expected_effect text,
  add column rationale text,
  add column effort text check (effort in ('quick', 'medium', 'big')),
  add column source text check (source in ('me', 'teammate', 'advisor', 'ai'));

-- AI during open competition windows is off unless the team opts in.
alter table public.teams add column ai_in_rounds boolean not null default false;
grant update (ai_in_rounds) on public.teams to authenticated;

-- Per-team daily request counter for the AI coach (written only by the edge function).
create table public.ai_usage (
  team_id uuid not null references public.teams on delete cascade,
  day date not null default current_date,
  requests int not null default 0,
  primary key (team_id, day)
);
alter table public.ai_usage enable row level security;
create policy ai_usage_select on public.ai_usage for select to authenticated using (private.is_member(team_id));
revoke insert, update, delete, truncate on public.ai_usage from anon, authenticated;
revoke all on public.ai_usage from anon;
