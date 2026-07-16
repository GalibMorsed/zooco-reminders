-- Run this in the Supabase SQL editor (or via `supabase db push`)

create extension if not exists "uuid-ossp";

create table if not exists pets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  pet_type text not null default 'Dog',
  avatar_url text,
  created_at timestamptz default now()
);

alter table pets add column if not exists pet_type text not null default 'Dog';

create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid references pets(id) on delete cascade not null,
  category text not null check (category in ('General', 'Lifestyle', 'Health')),
  title text not null,
  notes text,
  start_date date not null,
  end_date date,
  time time not null,
  frequency text not null check (frequency in ('Once', 'Everyday', 'Weekdays', 'Weekly')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  streak_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint reminders_end_date_check check (end_date is null or end_date >= start_date)
);

alter table reminders add column if not exists end_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reminders_end_date_check'
  ) then
    alter table reminders
      add constraint reminders_end_date_check
      check (end_date is null or end_date >= start_date);
  end if;
end;
$$;

create index if not exists reminders_pet_id_idx on reminders (pet_id);
create index if not exists reminders_status_idx on reminders (status);
create index if not exists reminders_category_idx on reminders (category);
create index if not exists reminders_date_range_idx on reminders (start_date, end_date);

create table if not exists reminder_completions (
  reminder_id uuid references reminders(id) on delete cascade not null,
  completed_date date not null,
  created_at timestamptz default now(),
  primary key (reminder_id, completed_date)
);

create index if not exists reminder_completions_completed_date_idx
  on reminder_completions (completed_date);

-- Keep updated_at fresh on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists reminders_set_updated_at on reminders;
create trigger reminders_set_updated_at
before update on reminders
for each row execute function set_updated_at();

-- Seed data so the UI has something to render immediately
insert into pets (id, name, pet_type, avatar_url) values
  ('11111111-1111-1111-1111-111111111111', 'Browny', 'Dog', null),
  ('22222222-2222-2222-2222-222222222222', 'Milo', 'Dog', null)
on conflict do nothing;

insert into reminders (pet_id, category, title, notes, start_date, time, frequency, status)
values
  ('11111111-1111-1111-1111-111111111111', 'General', 'Morning Walk', null, current_date, '08:00', 'Everyday', 'pending'),
  ('11111111-1111-1111-1111-111111111111', 'General', 'Evening Walk', null, current_date, '18:00', 'Everyday', 'pending'),
  ('11111111-1111-1111-1111-111111111111', 'Lifestyle', 'Breakfast', null, current_date, '09:00', 'Everyday', 'pending'),
  ('11111111-1111-1111-1111-111111111111', 'Lifestyle', 'Lunch', null, current_date, '14:00', 'Everyday', 'pending'),
  ('11111111-1111-1111-1111-111111111111', 'Health', 'Vet Visit', 'Annual checkup', current_date, '14:00', 'Once', 'pending'),
  ('22222222-2222-2222-2222-222222222222', 'General', 'Morning Walk', null, current_date, '07:30', 'Everyday', 'completed')
on conflict do nothing;
