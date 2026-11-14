-- Saxa 4: ledighet/blockerad tid, salongsinställningar, utebliven-status
-- Kör i Supabase → SQL Editor. Går att köra flera gånger.

-- Ledighet / blockerad tid (staff_id null = hela salongen)
create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists time_off_salon on public.time_off (salon_id, starts_at);
alter table public.time_off enable row level security;
drop policy if exists "time_off members" on public.time_off;
create policy "time_off members" on public.time_off for all to authenticated
  using (public.is_member(salon_id)) with check (public.is_member(salon_id));

-- Salongsinställningar
alter table public.salons add column if not exists cancel_hours int not null default 2;     -- avbokning senast X h innan
alter table public.salons add column if not exists lead_minutes int not null default 30;    -- tidigaste bokning från nu
alter table public.salons add column if not exists notify_email text;                       -- mejl för nya bokningar

-- Utebliven kund
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (status in ('confirmed', 'cancelled', 'no_show'));
