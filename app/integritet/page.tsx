import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata = { title: 'Integritetspolicy – Saxa', description: 'Hur Saxa hanterar dina personuppgifter.' }

const UPDATED = '7 november 2026'
const CONTACT = 'wehelie@aetossystems.se'

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-9 text-xl font-bold tracking-tight">{children}</h2>
}

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="flex items-center gap-3 pt-2">
        <Link href="/" className="icon-btn" aria-label="Tillbaka"><ArrowLeft size={18} /></Link>
        <div className="flex-1" />
        <ThemeToggle />
      </header>

      <article className="card mt-6 p-6 text-[15px] leading-relaxed sm:p-8 [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight">Integritetspolicy</h1>
        <p className="text-sm text-mute">Senast uppdaterad {UPDATED}</p>

        <p>
          Saxa är en tjänst för att hitta och boka frisörer. Den här policyn förklarar vilka personuppgifter vi samlar in i
          webbplatsen och appen Saxa, varför vi gör det och vilka rättigheter du har.
        </p>

        <H>Personuppgiftsansvarig</H>
        <p>
          Aetos Systems (enskild firma), Göteborg, Sverige.
          <br />
          Kontakt: <a className="text-gold underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
        <p>
          När du bokar hos en salong blir salongen också ansvarig för de uppgifter den får om dig och din bokning. Saxa
          behandlar dem för salongens räkning.
        </p>

        <H>Vilka uppgifter vi samlar in</H>
        <ul>
          <li><b>När du bokar:</b> namn, telefonnummer, e-post, valfritt meddelande samt vald tjänst, frisör och tid.</li>
          <li><b>Om du skapar konto:</b> e-post, lösenord (lagras krypterat och kan inte läsas av oss), namn, telefonnummer och valfri profilbild.</li>
          <li><b>Omdömen:</b> betyg och kommentar som du själv lämnar efter ett besök. Ditt förnamn och din profilbild visas tillsammans med omdömet.</li>
          <li><b>För salonger:</b> salongens namn, adress, kontaktuppgifter, bilder, personal, tjänster, priser och öppettider.</li>
          <li><b>Tekniskt:</b> en inloggningscookie som håller dig inloggad, samt ditt val av ljust/mörkt läge som sparas lokalt på din enhet.</li>
        </ul>
        <p>Vi samlar inte in din position, dina kontakter eller annan data från din telefon. Kamera och bildbibliotek används bara när du själv väljer att ladda upp en bild.</p>

        <H>Varför vi behandlar uppgifterna</H>
        <ul>
          <li><b>För att genomföra din bokning</b> och låta salongen kontakta dig om den (avtal).</li>
          <li><b>För att du ska kunna se och hantera dina bokningar</b> och ditt konto (avtal).</li>
          <li><b>För att visa omdömen</b> som hjälper andra att välja frisör (berättigat intresse).</li>
          <li><b>För att hålla tjänsten säker och fungerande</b> (berättigat intresse).</li>
        </ul>
        <p>Vi visar ingen reklam, spårar dig inte mellan andra appar eller webbplatser och säljer aldrig dina uppgifter.</p>

        <H>Vem får del av uppgifterna</H>
        <ul>
          <li><b>Salongen du bokar hos</b> ser dina bokningsuppgifter.</li>
          <li><b>Supabase</b> – databas, inloggning och bildlagring.</li>
          <li><b>Vercel</b> – drift av webbplatsen.</li>
        </ul>
        <p>
          Dessa leverantörer behandlar uppgifterna enligt personuppgiftsbiträdesavtal. Vissa leverantörer kan behandla data
          utanför EU/EES; i så fall sker överföringen med stöd av EU-kommissionens standardavtalsklausuler eller motsvarande
          skyddsåtgärder. Om en frisör kopplar sin kalender till Google eller Apple visas bokningarna även där.
        </p>

        <H>Hur länge vi sparar uppgifterna</H>
        <ul>
          <li>Kontouppgifter sparas tills du raderar ditt konto.</li>
          <li>Bokningar sparas i upp till 24 månader efter besöket så att du och salongen kan se historiken, därefter raderas de.</li>
          <li>Omdömen ligger kvar tills du eller salongen tar bort dem, eller tills kontot raderas.</li>
        </ul>

        <H>Radera ditt konto</H>
        <p>
          Du kan när som helst radera ditt konto i appen under <b>Profil → Radera konto</b>. Då raderas din profil, dina
          omdömen och kopplingen till dina bokningar direkt. Du kan också mejla oss så hjälper vi dig.
        </p>

        <H>Dina rättigheter</H>
        <p>
          Enligt dataskyddsförordningen (GDPR) har du rätt att få veta vilka uppgifter vi har om dig, få dem rättade eller
          raderade, begränsa eller invända mot behandlingen och få ut dina uppgifter (dataportabilitet). Kontakta oss på{' '}
          <a className="text-gold underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
        <p>
          Om du är missnöjd med hur vi hanterar dina uppgifter kan du klaga hos Integritetsskyddsmyndigheten (IMY),{' '}
          <a className="text-gold underline" href="https://www.imy.se" target="_blank" rel="noreferrer">imy.se</a>.
        </p>

        <H>Barn</H>
        <p>Saxa riktar sig inte till barn under 13 år. Barnklippning bokas av en vårdnadshavare.</p>

        <H>Ändringar</H>
        <p>Vi kan uppdatera policyn. Vid större ändringar meddelar vi det i appen. Datumet högst upp visar senaste versionen.</p>

        <hr className="my-10 border-0 border-t" style={{ borderColor: 'rgb(var(--line) / var(--line-a))' }} />

        <h2 className="text-xl font-bold tracking-tight">Privacy Policy (English summary)</h2>
        <p>
          Saxa is operated by Aetos Systems, Gothenburg, Sweden ({CONTACT}). We collect the details you give when booking
          (name, phone, email, note) and, if you create an account, your email, name, phone and optional profile photo, plus
          reviews you write. Data is used only to provide bookings, your account and reviews. No ads, no cross-app tracking,
          no data selling. Data is stored with Supabase and hosted on Vercel. You can delete your account at any time in the
          app under Profile → Delete account, or by emailing us. You have the rights granted by the GDPR and may complain to
          the Swedish Authority for Privacy Protection (IMY).
        </p>
      </article>
    </main>
  )
}
