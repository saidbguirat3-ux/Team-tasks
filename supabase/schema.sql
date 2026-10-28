-- Run once in Supabase: SQL Editor > New query > Run

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table workers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  status text not null default 'Working On' check (status in ('Working On', 'Suspended', 'Finished')),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index on workers (team_id);
create index on tasks (worker_id);

-- Server-side clock stamps the moment a task becomes "Finished" (and clears it otherwise)
create or replace function set_finished_at() returns trigger language plpgsql as $$
begin
  if new.status = 'Finished' then
    if tg_op = 'INSERT' or old.status is distinct from 'Finished' then
      new.finished_at := now();
    end if;
  else
    new.finished_at := null;
  end if;
  return new;
end $$;

create trigger tasks_finished_at before insert or update on tasks
  for each row execute function set_finished_at();

-- Removes tasks that have been finished for more than 24 hours
create or replace function cleanup_finished_tasks() returns void
language sql security definer set search_path = public as $$
  delete from tasks where status = 'Finished' and finished_at < now() - interval '24 hours';
$$;
grant execute on function cleanup_finished_tasks() to anon, authenticated;

-- Optional: also sweep on a schedule even when nobody has the app open
-- create extension if not exists pg_cron;
-- select cron.schedule('cleanup-finished-tasks', '*/10 * * * *', 'select public.cleanup_finished_tasks()');

-- Open access (no login): anyone with the anon key can read and write
alter table teams enable row level security;
alter table workers enable row level security;
alter table tasks enable row level security;
create policy "open access" on teams for all to anon, authenticated using (true) with check (true);
create policy "open access" on workers for all to anon, authenticated using (true) with check (true);
create policy "open access" on tasks for all to anon, authenticated using (true) with check (true);

-- Real-time sync across devices
alter publication supabase_realtime add table teams, workers, tasks;

-- Default data
insert into teams (name) values ('Data Protection'), ('SOC'), ('Network'), ('System');
insert into workers (team_id, name)
  select id, n from teams, unnest(array['Houssem', 'Said', 'Ghada']) as n
  where teams.name = 'Data Protection';
