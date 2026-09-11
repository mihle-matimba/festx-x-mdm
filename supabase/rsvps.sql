-- Tour RSVPs. Run once in Supabase → SQL Editor.
--
-- Kept separate from `registrations` (the Zoom list): that table is unique on
-- email, so anyone who signed up for the call couldn't RSVP if we reused it.
-- Here uniqueness is per city, so one person can RSVP to several stops.

create table if not exists public.rsvps (
  id          uuid        primary key default gen_random_uuid(),
  city        text        not null,
  full_name   text        not null,
  email       text        not null,
  phone       text,
  created_at  timestamptz not null default now(),
  unique (city, email)
);

create index if not exists rsvps_city_idx on public.rsvps (city);

-- No policies on purpose: only the service role used by /api can read or
-- write, same as `registrations`. The anon key gets nothing.
alter table public.rsvps enable row level security;
