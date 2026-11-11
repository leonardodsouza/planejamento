-- Rode este arquivo no SQL Editor do Supabase (uma vez).

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  project_id uuid references public.projects on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  due_date date,
  priority smallint not null default 2 check (priority between 1 and 3), -- 1 baixa, 2 média, 3 alta
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  position double precision not null default extract(epoch from now()),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tasks_user_due_idx on public.tasks (user_id, due_date);
create index if not exists tasks_project_idx on public.tasks (project_id, status, position);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "dono gerencia projetos" on public.projects;
create policy "dono gerencia projetos" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "dono gerencia tarefas" on public.tasks;
create policy "dono gerencia tarefas" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
