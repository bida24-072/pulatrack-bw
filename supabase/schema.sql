create extension if not exists "uuid-ossp";

-- =========================================================================
-- Tables Definition
-- =========================================================================

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null,
  category text not null,
  note text default '',
  date date not null
);

create table if not exists public.savings_goals (
  id uuid primary key default uuid_generate_v4(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2) not null,
  saved_amount numeric(12, 2) not null default 0,
  target_date date,
  color text not null default '#0d9488'
);

create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric(12, 2) not null
);

create table if not exists public.terms_acceptances (
  id uuid primary key default uuid_generate_v4(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id uuid references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  agreed_at timestamptz not null default now()
);

-- =========================================================================
-- Triggers for Automated Metadata Injection
-- =========================================================================

-- System Timestamp Synchronization
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_date = now();
  return new;
end;
$$ language plpgsql;

-- Fallback Context Trigger for Owner Binding (Guarantees data won't reject during inserts)
create or replace function public.handle_owner_binding()
returns trigger as $$
begin
  if new.created_by_id is null then
    new.created_by_id = auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

-- Attaching Triggers to Tables
do $$
declare
  t_name text;
begin
  for t_name in select unnest(array['transactions', 'savings_goals', 'budgets', 'terms_acceptances']) loop
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.handle_updated_at();', t_name, t_name);
    execute format('create trigger trg_%s_owner_bind before insert on public.%I for each row execute function public.handle_owner_binding();', t_name, t_name);
  end loop;
end $$;

-- =========================================================================
-- Performance Optimization Indices
-- =========================================================================
create index if not exists idx_transactions_user_date on public.transactions(created_by_id, date desc);
create index if not exists idx_goals_user on public.savings_goals(created_by_id);
create index if not exists idx_budgets_user on public.budgets(created_by_id);

-- =========================================================================
-- Row Level Security (RLS) Isolation Rules
-- =========================================================================
alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.budgets enable row level security;
alter table public.terms_acceptances enable row level security;

-- Transactions Policies
create policy "Users manage own transactions" on public.transactions
  for all using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());

-- Savings Goals Policies
create policy "Users manage own goals" on public.savings_goals
  for all using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());

-- Budgets Policies
create policy "Users manage own budgets" on public.budgets
  for all using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());

-- Terms Acceptances Policies
create policy "Users manage own acceptances" on public.terms_acceptances
  for all using (created_by_id = auth.uid()) with check (created_by_id = auth.uid());
