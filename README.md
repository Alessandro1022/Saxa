# Saxa – bokning för frisörer

Next.js 15 + Supabase + Tailwind. Mobil-först, mörkt tema med guld.

## Vad som finns
- **Startsida** `/` – alla salonger och frisörer, sök och stadsfilter
- **Kundkonto** – logga in, se alla bokningar (`/me`), profil med bild, lämna omdömen
- **Kundsidan** `/{salong}` – välj tjänst → frisör (eller "första lediga") → dag och tid → namn + telefon → klart
- **Bekräftelsesida** `/b/{token}` – kunden kan lägga till bokningen i sin kalender eller avboka själv
- **Frisörpanelen** `/dashboard`
  - Bokningar 14 dagar framåt, dagens intäkt, filter per frisör, ring kunden, avboka
  - **Lägg in bokning manuellt** (för DM, telefon och drop-in)
  - Tjänster (pris, tid, på/av)
  - Personal (bild, bio, arbetstider per veckodag)
  - **Kalenderkoppling** per frisör: Apple Kalender och Google Kalender (prenumeration)
  - Salongens profil: logga, omslagsbild, adress, Instagram, bokningslänk
- **Konto och onboarding** – salongen skapar konto och är bokningsbar på 1 minut (startvärden ingår)
- **Dubbelbokningsskydd i databasen** – två kunder kan inte få samma tid

## Kom igång (ca 10 min)
1. **Supabase** → nytt projekt → SQL Editor → kör i ordning: `supabase/schema.sql`, `supabase/002_upgrade.sql`, `supabase/003_demo.sql` (10 demosalonger), `supabase/004_system.sql` (ledighet, bokningsregler, utebliven).
   (Valfritt: kör `supabase/seed-demo.sql` för en demosalong på `/demo`.)
2. Supabase → Authentication → URL Configuration:
   - Site URL: `https://din-domän.vercel.app`
   - Redirect URLs: `https://din-domän.vercel.app/auth/callback`
3. **Vercel** → importera repot → Environment Variables (från Supabase → Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (hemlig)
4. Deploy → gå till `/login` → skapa konto → följ onboarding.

## Kalender
Prenumerationslänken uppdateras automatiskt. Apple brukar hämta nytt inom 15–60 min, Google kan ta flera timmar.
Nästa steg: riktig Google-synk (OAuth + Calendar API) så att det kommer in direkt.

## Nästa steg (roadmap)
- SMS-påminnelse 24 h innan (46elks)
- Swish-förskott mot no-shows
- AI-receptionist (Gemini) på bokningssidan
- Recensioner efter besöket
- Expo-app för kunder (samma Supabase)

## Mejl (valfritt)
Lägg till i Vercel för bekräftelsemejl till kund och notis till salong:
- `RESEND_API_KEY` – från resend.com
- `EMAIL_FROM` – t.ex. `Saxa <bokning@aetossystems.se>` (domänen verifieras i Resend)

## Betalning vid bokning (Stripe Connect)
1. Skapa konto på stripe.com → aktivera **Connect** (Express-konton, land Sverige). Aktivera Swish under Settings → Payment methods.
2. Kör `supabase/005_payments.sql`.
3. Vercel env:
   - `STRIPE_SECRET_KEY` – `sk_live_…` (eller `sk_test_…` för test)
   - `STRIPE_WEBHOOK_SECRET` – `whsec_…` från webhooken nedan
   - `PLATFORM_FEE_PERCENT` – valfritt, t.ex. `0` (Saxas andel av varje betalning)
4. Stripe → Developers → Webhooks → Add endpoint: `https://<domän>/api/stripe/webhook`
   - Händelser: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `account.updated` (bocka i *Connected accounts* för den sista)
5. Salongen: Panel → Salong → **Koppla Stripe** → välj Handpenning eller Hela priset.

Avbokning i tid återbetalar automatiskt. Utebliven kund – salongen behåller betalningen.
