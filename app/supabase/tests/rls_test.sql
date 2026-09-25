-- RLS behaviour tests. Run with: npm run test:db  (needs a local Postgres)
\set ON_ERROR_STOP on
insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@example.com'),
  ('00000000-0000-0000-0000-00000000000d', 'dana@example.com');

create function pg_temp.as_user(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false), set_config('role', 'authenticated', false);
$$;

create table pg_temp.ctx (k text primary key, v text);
grant all on pg_temp.ctx to authenticated;

-- Alice creates team A; Dana creates team D.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into pg_temp.ctx select 'teamA', public.create_team('Team A', 'Alice', true)::text;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
insert into pg_temp.ctx select 'teamD', public.create_team('Team D', 'Dana', true)::text;

-- Age gate
do $$ begin
  perform public.create_team('Kids', 'Kid', false);
  raise exception 'FAIL: age gate not enforced';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
end $$;

-- Alice adds a name-only teammate "Bob" and a round + attempt.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into public.members (team_id, display_name) select v::uuid, 'Bob' from pg_temp.ctx where k = 'teamA';
insert into public.rounds (id, team_id, season, kind, label)
  select '11111111-1111-1111-1111-111111111111', v::uuid, '2026-27', 'round1', 'Round 1' from pg_temp.ctx where k = 'teamA';
insert into public.attempts (team_id, round_id, hypothesis, final_profit)
  select v::uuid, '11111111-1111-1111-1111-111111111111', 'raise price', 1000 from pg_temp.ctx where k = 'teamA';

-- Alice cannot attach a login to a member row directly.
do $$ begin
  insert into public.members (team_id, user_id, display_name)
    select v::uuid, '00000000-0000-0000-0000-00000000000c', 'Carol' from pg_temp.ctx where k = 'teamA';
  raise exception 'FAIL: inserted member with user_id';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
end $$;

-- Alice cannot change the join code directly.
do $$ begin
  update public.teams set join_code = 'HACKED' ;
  raise exception 'FAIL: join_code updatable';
exception when insufficient_privilege then null;
end $$;

-- Bob signs up and joins with the code: claims the name-only row.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$
declare code text;
begin
  reset role;
  select join_code into code from public.teams where name = 'Team A';
  perform set_config('role', 'authenticated', false);
  perform public.join_team(lower(code), 'bob', 'student', true);
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin
  if (select count(*) from public.members) <> 2 then raise exception 'FAIL: Bob should see 2 members (claimed row), saw %', (select count(*) from public.members); end if;
  if (select count(*) from public.attempts) <> 1 then raise exception 'FAIL: Bob should see team A attempt'; end if;
end $$;

-- Carol joins as advisor: can read, cannot write.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
do $$
declare code text;
begin
  reset role;
  select join_code into code from public.teams where name = 'Team A';
  perform set_config('role', 'authenticated', false);
  perform public.join_team(code, 'Ms. Carol', 'advisor', true);
end $$;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
do $$ begin
  if (select count(*) from public.attempts) <> 1 then raise exception 'FAIL: advisor cannot read attempts'; end if;
end $$;
do $$ begin
  insert into public.attempts (team_id, round_id, hypothesis)
    select team_id, id, 'advisor write' from public.rounds limit 1;
  raise exception 'FAIL: advisor inserted attempt';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
end $$;
do $$
declare n int;
begin
  update public.attempts set hypothesis = 'x';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: advisor updated % attempts', n; end if;
  delete from public.attempts;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: advisor deleted % attempts', n; end if;
end $$;
do $$ begin
  perform public.rotate_join_code(team_id) from public.members limit 1;
  raise exception 'FAIL: advisor rotated code';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
end $$;

-- Dana (other team) sees nothing of team A and cannot write into it.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
do $$ begin
  if exists (select 1 from public.attempts) then raise exception 'FAIL: cross-team attempt visible'; end if;
  if (select count(*) from public.teams) <> 1 then raise exception 'FAIL: Dana sees other teams'; end if;
  if (select count(*) from public.members) <> 1 then raise exception 'FAIL: Dana sees other members'; end if;
end $$;
do $$ begin
  insert into public.attempts (team_id, round_id, hypothesis)
    values ((select v::uuid from pg_temp.ctx where k = 'teamA'), '11111111-1111-1111-1111-111111111111', 'sneaky');
  raise exception 'FAIL: cross-team insert';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
end $$;
do $$
declare n int;
begin
  update public.attempts set hypothesis = 'x' where round_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: cross-team update'; end if;
end $$;

-- Students can move a row only to a team they belong to.
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
do $$ begin
  update public.attempts set team_id = (select v::uuid from pg_temp.ctx where k = 'teamD');
  raise exception 'FAIL: moved attempt to foreign team';
exception when others then
  if sqlerrm like 'FAIL%' then raise; end if;
end $$;

-- Anonymous users see nothing.
select set_config('request.jwt.claim.sub', '', false), set_config('role', 'anon', false);
do $$ begin
  perform 1 from public.attempts;
  raise exception 'FAIL: anon can query attempts';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform public.create_team('x', 'y', true);
  raise exception 'FAIL: anon can call create_team';
exception when insufficient_privilege then null;
end $$;

reset role;
select 'ALL RLS TESTS PASSED' as result;
