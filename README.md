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

## Betalning med Swish (standard)
Kör `supabase/006_swish.sql`. Salongen fyller i sitt Swish-nummer under Salong → Betalning vid bokning. Inget mer behövs.
