-- Saxa uppgradering 2: kundkonton, omdömen, stad
-- Kör i Supabase → SQL Editor EFTER schema.sql. Går att köra flera gånger.

alter table public.salons add column if not exists city text;
alter table public.bookings add column if not exists customer_id uuid references auth.users(id) on delete set null;
create index if not exists bookings_customer on public.bookings (customer_id, starts_at);

-- ============ KUNDPROFILER ============
create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.customers enable row level security;

drop policy if exists "customer read own" on public.customers;
create policy "customer read own" on public.customers for select to authenticated using (id = auth.uid());
drop policy if exists "customer update own" on public.customers;
create policy "customer update own" on public.customers for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "customer insert own" on public.customers;
create policy "customer insert own" on public.customers for insert to authenticated with check (id = auth.uid());

-- Skapa profil automatiskt vid registrering
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.customers (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.customers (id) select id from auth.users on conflict (id) do nothing;

-- Kunden ser sina egna bokningar
drop policy if exists "bookings own" on public.bookings;
create policy "bookings own" on public.bookings for select to authenticated using (customer_id = auth.uid());

-- ============ OMDÖMEN ============
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
drop policy if exists "reviews read" on public.reviews;
create policy "reviews read" on public.reviews for select using (true);

create or replace view public.salon_rating as
  select salon_id, round(avg(rating)::numeric, 1)::float as avg, count(*)::int as n
  from public.reviews group by salon_id;

create or replace view public.staff_rating as
  select staff_id, round(avg(rating)::numeric, 1)::float as avg, count(*)::int as n
  from public.reviews where staff_id is not null group by staff_id;

-- ============ STORAGE: salongsbilder + profilbilder ============
create or replace function public.is_member_text(t text)
returns boolean language plpgsql stable security definer set search_path = public as $$
begin
  if t is null or t !~ '^[0-9a-fA-F-]{36}$' then return false; end if;
  return exists (select 1 from public.salon_members where salon_id = t::uuid and user_id = auth.uid());
end $$;

drop policy if exists "media upload" on storage.objects;
create policy "media upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'media' and (
    public.is_member_text((storage.foldername(name))[1])
    or ((storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);
drop policy if exists "media update" on storage.objects;
create policy "media update" on storage.objects for update to authenticated using (
  bucket_id = 'media' and (
    public.is_member_text((storage.foldername(name))[1])
    or ((storage.foldername(name))[1] = 'u' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);
