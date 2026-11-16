-- Saxa 8: rapportera omdömen
-- Kör i Supabase → SQL Editor. Går att köra flera gånger.

alter table public.reviews add column if not exists hidden boolean not null default false;

create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.review_reports enable row level security; -- bara servern
