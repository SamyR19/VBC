-- Hardening after the Supabase security advisor:
-- 1. Move the RLS helper functions out of the API-exposed public schema.
-- 2. Revoke TRUNCATE (it bypasses RLS) from API roles.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where team_id = t and user_id = auth.uid());
$$;

create or replace function private.is_student(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where team_id = t and user_id = auth.uid() and role = 'student');
$$;

revoke execute on function private.is_member(uuid) from public, anon;
revoke execute on function private.is_student(uuid) from public, anon;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.is_student(uuid) to authenticated;

-- Recreate every policy against the private helpers.
drop policy teams_select on public.teams;
drop policy teams_update on public.teams;
create policy teams_select on public.teams for select to authenticated using (private.is_member(id));
create policy teams_update on public.teams for update to authenticated
  using (private.is_student(id)) with check (private.is_student(id));

drop policy members_select on public.members;
drop policy members_insert on public.members;
drop policy members_update on public.members;
drop policy members_delete on public.members;
create policy members_select on public.members for select to authenticated using (private.is_member(team_id));
create policy members_insert on public.members for insert to authenticated
  with check (private.is_student(team_id) and user_id is null);
create policy members_update on public.members for update to authenticated
  using (private.is_student(team_id)) with check (private.is_student(team_id));
create policy members_delete on public.members for delete to authenticated
  using (private.is_student(team_id) or user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['rounds', 'round_windows', 'backlog', 'attempts', 'time_logs', 'leaderboard_snapshots', 'checklist_items']
  loop
    execute format('drop policy %1$s_select on public.%1$s', t);
    execute format('drop policy %1$s_insert on public.%1$s', t);
    execute format('drop policy %1$s_update on public.%1$s', t);
    execute format('drop policy %1$s_delete on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select to authenticated using (private.is_member(team_id))', t);
    execute format('create policy %1$s_insert on public.%1$s for insert to authenticated with check (private.is_student(team_id))', t);
    execute format('create policy %1$s_update on public.%1$s for update to authenticated using (private.is_student(team_id)) with check (private.is_student(team_id))', t);
    execute format('create policy %1$s_delete on public.%1$s for delete to authenticated using (private.is_student(team_id))', t);
  end loop;
end $$;

create or replace function public.rotate_join_code(p_team uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not private.is_student(p_team) then raise exception 'Only team members can do this'; end if;
  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 10));
  update public.teams set join_code = v_code where id = p_team;
  return v_code;
end $$;

drop function public.is_member(uuid);
drop function public.is_student(uuid);

revoke truncate on all tables in schema public from anon, authenticated;
