-- Saxa 6: betalning med Swish direkt till salongen (ingen Stripe behövs)
-- Kör i Supabase → SQL Editor. Går att köra flera gånger, och fungerar även om 005 inte körts.

alter table public.salons add column if not exists swish_number text;
alter table public.salons add column if not exists pay_mode text not null default 'none';
alter table public.salons add column if not exists deposit_sek int not null default 100;
alter table public.salons drop constraint if exists salons_pay_mode_check;
alter table public.salons add constraint salons_pay_mode_check check (pay_mode in ('none', 'deposit', 'full'));

-- payment_status: null | awaiting (väntar på Swish) | paid | refunded | pending (Stripe)
alter table public.bookings add column if not exists payment_status text;
alter table public.bookings add column if not exists paid_sek int;
alter table public.bookings add column if not exists due_sek int;
