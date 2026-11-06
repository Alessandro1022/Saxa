-- Saxa – bokningssystem för frisörer
-- Kör hela filen i Supabase → SQL Editor (en gång).

create extension if not exists btree_gist;

-- ============ TABELLER ============

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  description text,
  address text,
  phone text,
  instagram text,
  logo_url text,
  cover_url text,
  timezone text not null default 'Europe/Stockholm',
  owner_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.salon_members (
  salon_id uuid not null references public.salons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  primary key (salon_id, user_id)
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  title text,
  bio text,
  photo_url text,
  active boolean not null default true,
  sort int not null default 0,
  ical_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  description text,
  duration_min int not null check (duration_min between 5 and 480),
  price_sek int,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- Öppettider per frisör. weekday: 0=sön, 1=mån ... 6=lör
create table if not exists public.staff_hours (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  price_sek int,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  note text,
  source text not null default 'online', -- online | manual
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  cancel_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Databasen själv stoppar dubbelbokningar på samma frisör
  constraint no_double_booking exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);

create index if not exists bookings_salon_time on public.bookings (salon_id, starts_at);
create index if not exists bookings_staff_time on public.bookings (staff_id, starts_at);

-- ============ HJÄLPFUNKTIONER ============

create or replace function public.is_member(s uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.salon_members where salon_id = s and user_id = auth.uid());
$$;

-- Ägaren blir automatiskt medlem när en salong skapas
create or replace function public.add_owner_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null then
    insert into public.salon_members (salon_id, user_id, role)
    values (new.id, new.owner_id, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists salons_add_owner on public.salons;
create trigger salons_add_owner after insert on public.salons
for each row execute function public.add_owner_member();

-- ============ RLS ============
-- Publika sidor läser via servern (service role). RLS gäller inloggade frisörer.

alter table public.salons enable row level security;
alter table public.salon_members enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.staff_hours enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "salons read" on public.salons;
create policy "salons read" on public.salons for select using (true);
drop policy if exists "salons create" on public.salons;
create policy "salons create" on public.salons for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "salons update" on public.salons;
create policy "salons update" on public.salons for update to authenticated using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists "members read own" on public.salon_members;
create policy "members read own" on public.salon_members for select to authenticated using (user_id = auth.uid());

drop policy if exists "staff members" on public.staff;
create policy "staff members" on public.staff for all to authenticated using (public.is_member(salon_id)) with check (public.is_member(salon_id));

drop policy if exists "services members" on public.services;
create policy "services members" on public.services for all to authenticated using (public.is_member(salon_id)) with check (public.is_member(salon_id));

drop policy if exists "hours members" on public.staff_hours;
create policy "hours members" on public.staff_hours for all to authenticated using (public.is_member(salon_id)) with check (public.is_member(salon_id));

drop policy if exists "bookings members" on public.bookings;
create policy "bookings members" on public.bookings for all to authenticated using (public.is_member(salon_id)) with check (public.is_member(salon_id));

-- ============ STORAGE (bilder) ============

insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media upload" on storage.objects;
create policy "media upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists "media update" on storage.objects;
create policy "media update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_member(((storage.foldername(name))[1])::uuid));
