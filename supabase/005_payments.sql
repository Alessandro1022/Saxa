-- Saxa 5: betalning vid bokning (Stripe Connect)
-- Kör i Supabase → SQL Editor. Går att köra flera gånger.

alter table public.salons add column if not exists stripe_account_id text;
alter table public.salons add column if not exists payments_ready boolean not null default false;
alter table public.salons add column if not exists pay_mode text not null default 'none';
alter table public.salons drop constraint if exists salons_pay_mode_check;
alter table public.salons add constraint salons_pay_mode_check check (pay_mode in ('none', 'deposit', 'full'));
alter table public.salons add column if not exists deposit_sek int not null default 100;

alter table public.bookings add column if not exists payment_status text;          -- null | pending | paid | refunded
alter table public.bookings add column if not exists paid_sek int;
alter table public.bookings add column if not exists stripe_session_id text;
alter table public.bookings add column if not exists stripe_payment_intent text;

-- Ny status 'pending' = tiden hålls medan kunden betalar
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (status in ('confirmed', 'cancelled', 'no_show', 'pending'));

-- Dubbelbokningsskyddet gäller även tider som hålls för betalning
alter table public.bookings drop constraint if exists no_double_booking;
alter table public.bookings add constraint no_double_booking exclude using gist (
  staff_id with =,
  tstzrange(starts_at, ends_at) with &&
) where (status in ('confirmed', 'pending'));
