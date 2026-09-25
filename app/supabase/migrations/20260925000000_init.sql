-- VBC Run Logbook — initial schema.
-- Every row carries team_id; row-level security limits access to members of that team.
-- Students can read and write; advisors can only read.
-- Deliberately minimal personal data: a display name per member, nothing else.

-- ---------------------------------------------------------------- teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  track text not null default 'entrepreneurship',
  business_type text,
  competition_mode text not null default 'auto' check (competition_mode in ('auto', 'on', 'off')),
  decision_keys jsonb not null default '[]'::jsonb,
  join_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 10)),
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  user_id uuid references auth.users on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role text not null default 'student' check (role in ('student', 'advisor')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);
create index members_user_idx on public.members (user_id);

-- ---------------------------------------------------------------- season calendar
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  season text not null,
  kind text not null check (kind in ('practice', 'round1', 'round2', 'icdc')),
  label text not null,
  opens_at timestamptz,
  closes_at timestamptz,
  ranking_metric text not null default 'profit' check (ranking_metric in ('profit', 'net_worth', 'points')),
  metric_verified boolean not null default false,
  est_qualifying_cutoff numeric,
  notes text,
  created_at timestamptz not null default now()
);
create index rounds_team_idx on public.rounds (team_id);

create table public.round_windows (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  round_id uuid not null references public.rounds on delete cascade,
  label text not null,
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index round_windows_team_idx on public.round_windows (team_id);

-- ---------------------------------------------------------------- core loop
create table public.backlog (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  idea text not null,
  variable text,
  priority int not null default 0,
  status text not null default 'queued' check (status in ('queued', 'tested', 'dropped')),
  tested_attempt_id uuid, -- FK added after attempts exists
  created_at timestamptz not null default now()
);
create index backlog_team_idx on public.backlog (team_id);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  round_id uuid not null references public.rounds on delete restrict,
  window_id uuid references public.round_windows on delete set null,
  operator_id uuid references public.members on delete set null,
  parent_attempt_id uuid references public.attempts on delete set null,
  backlog_id uuid references public.backlog on delete set null,
  business_type text,
  hypothesis text not null check (char_length(trim(hypothesis)) > 0),
  variables_changed text[] not null default '{}',
  decisions jsonb not null default '[]'::jsonb,  -- [{key, value}] keeps order
  status text not null default 'completed' check (status in ('in_progress', 'completed', 'aborted', 'bad_data')),
  final_profit numeric,
  final_net_worth numeric,
  final_points numeric,
  cash_low_point numeric,
  loan_taken boolean,
  sim_periods_completed int,
  minutes_spent int check (minutes_spent is null or minutes_spent >= 0),
  verdict text check (verdict in ('keep', 'discard', 'inconclusive')),
  lesson text,
  tags text[] not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index attempts_team_round_idx on public.attempts (team_id, round_id);

alter table public.backlog
  add constraint backlog_tested_attempt_fk foreign key (tested_attempt_id) references public.attempts on delete set null;

create table public.time_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  member_id uuid references public.members on delete set null,
  round_id uuid references public.rounds on delete set null,
  minutes int not null check (minutes > 0),
  logged_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index time_logs_team_idx on public.time_logs (team_id);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  round_id uuid not null references public.rounds on delete cascade,
  captured_at timestamptz not null default now(),
  our_rank_region int,
  our_best numeric,
  cutoff_rank2_score numeric,
  note text,
  created_at timestamptz not null default now()
);
create index leaderboard_snapshots_team_idx on public.leaderboard_snapshots (team_id);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  round_id uuid not null references public.rounds on delete cascade,
  text text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index checklist_items_team_idx on public.checklist_items (team_id);

-- ---------------------------------------------------------------- membership helpers
create or replace function public.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where team_id = t and user_id = auth.uid());
$$;

create or replace function public.is_student(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where team_id = t and user_id = auth.uid() and role = 'student');
$$;

-- ---------------------------------------------------------------- RLS
alter table public.teams enable row level security;
alter table public.members enable row level security;
alter table public.rounds enable row level security;
alter table public.round_windows enable row level security;
alter table public.backlog enable row level security;
alter table public.attempts enable row level security;
alter table public.time_logs enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.checklist_items enable row level security;

-- Teams are created/joined only through the RPCs below.
create policy teams_select on public.teams for select to authenticated using (public.is_member(id));
create policy teams_update on public.teams for update to authenticated
  using (public.is_student(id)) with check (public.is_student(id));

create policy members_select on public.members for select to authenticated using (public.is_member(team_id));
-- Students may add name-only teammates (no login attached).
create policy members_insert on public.members for insert to authenticated
  with check (public.is_student(team_id) and user_id is null);
create policy members_update on public.members for update to authenticated
  using (public.is_student(team_id)) with check (public.is_student(team_id));
-- Students can remove anyone; anyone can remove themselves (leave the team).
create policy members_delete on public.members for delete to authenticated
  using (public.is_student(team_id) or user_id = auth.uid());

-- Only these member/team columns are writable from the client.
revoke update on public.members from anon, authenticated;
grant update (display_name, role) on public.members to authenticated;
revoke update on public.teams from anon, authenticated;
grant update (name, business_type, competition_mode, decision_keys) on public.teams to authenticated;
revoke insert, delete on public.teams from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['rounds', 'round_windows', 'backlog', 'attempts', 'time_logs', 'leaderboard_snapshots', 'checklist_items']
  loop
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (public.is_member(team_id))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (public.is_student(team_id))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (public.is_student(team_id)) with check (public.is_student(team_id))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (public.is_student(team_id))', t);
  end loop;
end $$;

-- Nothing is readable without signing in.
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------- RPCs
create or replace function public.create_team(p_name text, p_display_name text, p_age_ok boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_team uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not coalesce(p_age_ok, false) then raise exception 'You must be 13 or older to use this app'; end if;
  insert into public.teams (name) values (trim(p_name)) returning id into v_team;
  insert into public.members (team_id, user_id, display_name, role)
    values (v_team, auth.uid(), trim(p_display_name), 'student');
  return v_team;
end $$;

create or replace function public.join_team(p_code text, p_display_name text, p_role text, p_age_ok boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_team uuid;
  v_claim uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not coalesce(p_age_ok, false) then raise exception 'You must be 13 or older to use this app'; end if;
  if p_role not in ('student', 'advisor') then raise exception 'Invalid role'; end if;
  select id into v_team from public.teams where join_code = upper(trim(p_code));
  if v_team is null then raise exception 'No team with that code'; end if;
  if exists (select 1 from public.members where team_id = v_team and user_id = auth.uid()) then
    return v_team;
  end if;
  -- Claim a name-only member row with the same name, so past attempts stay attributed.
  select id into v_claim from public.members
    where team_id = v_team and user_id is null and lower(display_name) = lower(trim(p_display_name))
    limit 1;
  if v_claim is not null then
    update public.members set user_id = auth.uid(), role = p_role where id = v_claim;
  else
    insert into public.members (team_id, user_id, display_name, role)
      values (v_team, auth.uid(), trim(p_display_name), p_role);
  end if;
  return v_team;
end $$;

create or replace function public.rotate_join_code(p_team uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_student(p_team) then raise exception 'Only team members can do this'; end if;
  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 10));
  update public.teams set join_code = v_code where id = p_team;
  return v_code;
end $$;

revoke execute on function public.create_team(text, text, boolean) from public, anon;
revoke execute on function public.join_team(text, text, text, boolean) from public, anon;
revoke execute on function public.rotate_join_code(uuid) from public, anon;
grant execute on function public.create_team(text, text, boolean) to authenticated;
grant execute on function public.join_team(text, text, text, boolean) to authenticated;
grant execute on function public.rotate_join_code(uuid) to authenticated;
