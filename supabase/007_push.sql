-- Saxa 7: pushnotiser (iOS-appen)
-- Kör i Supabase → SQL Editor. Går att köra flera gånger.

-- En rad per telefon. user_id sätts när någon är inloggad på telefonen.
create table if not exists public.push_devices (
  expo_token text primary key,
  user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists push_devices_user on public.push_devices (user_id);

-- Bokningar gjorda på en telefon (även utan konto) → den telefonen får notiser om bokningen
create table if not exists public.push_bookings (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  expo_token text not null,
  created_at timestamptz not null default now(),
  primary key (booking_id, expo_token)
);

-- Bara servern läser/skriver (inga policies = stängt för alla andra)
alter table public.push_devices enable row level security;
alter table public.push_bookings enable row level security;
