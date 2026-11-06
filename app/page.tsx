import Link from 'next/link'
import { CalendarCheck, ChevronRight, MapPin, Scissors, Search, ShieldCheck, Sparkles, Store } from 'lucide-react'
import { loadDiscover } from '@/lib/discover'
import { getMe } from '@/lib/user'
import CustomerNav from '@/components/CustomerNav'
import ThemeToggle from '@/components/ThemeToggle'
import HairFall from '@/components/HairFall'
import Phone3D from '@/components/Phone3D'
import { Cover } from '@/components/Img'
import { Avatar, Logo, Rating } from '@/components/ui'

export const dynamic = 'force-dynamic'

const STEPS = [
  { Icon: Search, t: 'Hitta', d: 'Bläddra bland salonger och frisörer nära dig.' },
  { Icon: CalendarCheck, t: 'Välj tid', d: 'Se lediga tider direkt – boka på 20 sekunder.' },
  { Icon: Sparkles, t: 'Bli fresh', d: 'Påminnelse i kalendern, avboka själv om något händer.' },
]

export default async function Home() {
  const [{ salons, pros }, me] = await Promise.all([loadDiscover(), getMe()])
  const featured = [...salons].sort((a, b) => (b.rating ?? 0) * b.reviews - (a.rating ?? 0) * a.reviews).slice(0, 8)
  const first = me?.full_name?.split(' ')[0]

  return (
    <main className="relative overflow-x-hidden pb-32">
      {/* Hero */}
      <section className="relative">
        <HairFall />
        <div className="relative mx-auto max-w-5xl px-5 pt-[max(env(safe-area-inset-top),20px)]">
          <header className="rise flex items-center gap-3 pt-2">
            <Logo size={42} />
            <span className="text-lg font-bold tracking-tight">Saxa</span>
            <div className="flex-1" />
            <ThemeToggle />
            {me ? (
              <Link href="/me/profil" aria-label="Profil"><Avatar name={me.full_name ?? me.email} src={me.avatar_url} size={44} /></Link>
            ) : (
              <Link href="/login" className="btn-soft !px-5 !py-2.5 text-sm">Logga in</Link>
            )}
          </header>

          <div className="grid items-center gap-6 pb-6 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-16">
            <div>
              <span className="rise rise-1 pill inline-flex items-center gap-2 text-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
                {salons.length} salonger · {pros.length} frisörer
              </span>
              <h1 className="rise rise-2 mt-5 text-[44px] font-bold leading-[1.02] tracking-tight sm:text-[56px]">
                {first ? <>Hej {first}.<br /></> : null}
                Din nästa <span className="gold-text">fresh cut</span>,<br />bokad på sekunder.
              </h1>
              <p className="rise rise-3 mt-4 max-w-md text-lg text-mute">
                Hitta en frisör, välj tid och boka. Inget konto behövs – bara nummer och mejl.
              </p>
              <div className="rise rise-4 mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/frisorer" className="btn-gold !px-8 !py-4 text-base">
                  <Search size={19} /> Hitta frisör
                </Link>
                <Link href={me ? '/me' : '/login'} className="btn-soft !px-8 !py-4 text-base">
                  {me ? 'Mina bokningar' : 'Logga in'}
                </Link>
              </div>
              <div className="rise rise-4 mt-6 flex items-center gap-3 text-sm text-mute">
                <div className="flex -space-x-2">
                  {pros.slice(0, 5).map((p) => (
                    <Avatar key={p.id} name={p.name} src={p.photo_url} size={32} className="ring-2 ring-[rgb(var(--ink))]" />
                  ))}
                </div>
                Frisörer redo att ta emot dig
              </div>
            </div>
            <div className="rise rise-3">
              <Phone3D />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5">
        {/* Populära */}
        {featured.length > 0 && (
          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Populära just nu</h2>
              <Link href="/frisorer" className="flex items-center gap-1 text-sm font-medium text-gold">Se alla <ChevronRight size={16} /></Link>
            </div>
            <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4">
              {featured.map((s) => (
                <Link
                  key={s.id}
                  href={`/${s.slug}`}
                  className="group w-[260px] shrink-0 snap-start transition duration-500 hover:-translate-y-1"
                  style={{ perspective: '800px' }}
                >
                  <div className="relative h-[300px] overflow-hidden rounded-[30px] shadow-[0_24px_50px_-24px_rgb(0_0_0/.6)] transition duration-500 group-hover:[transform:rotateX(4deg)_rotateY(-4deg)]">
                    <Cover src={s.cover_url} className="transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                    {s.from != null && (
                      <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">från {s.from} kr</span>
                    )}
                    <div className="absolute inset-x-4 bottom-4 text-white">
                      <div className="flex -space-x-2">
                        {s.staff.slice(0, 3).map((t) => (
                          <Avatar key={t.id} name={t.name} src={t.photo_url} size={30} className="ring-2 ring-black/40" />
                        ))}
                      </div>
                      <div className="mt-2 text-xl font-bold leading-tight">{s.name}</div>
                      <div className="mt-1 flex items-center justify-between text-[13px] text-white/75">
                        <span className="flex items-center gap-1"><MapPin size={13} />{s.city}</span>
                        <Rating avg={s.rating} n={s.reviews} className="!text-white [&_span]:!text-white/60" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Så funkar det */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">Så funkar det</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {STEPS.map(({ Icon, t, d }, i) => (
              <div key={t} className="card p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-ongold"
                    style={{ background: 'linear-gradient(160deg,#f3dfa9,#c99d4a)', boxShadow: '0 12px 24px -10px rgb(210 171 92 / .8), inset 0 1px 0 rgb(255 255 255 / .6)' }}
                  >
                    <Icon size={22} />
                  </div>
                  <span className="text-sm font-semibold text-mute">0{i + 1}</span>
                </div>
                <div className="mt-4 text-lg font-semibold">{t}</div>
                <div className="mt-1 text-sm text-mute">{d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Trygghet + salonger */}
        <section className="mt-12 grid gap-3 sm:grid-cols-2">
          <div className="card flex items-start gap-4 p-5">
            <ShieldCheck className="mt-0.5 shrink-0 text-gold" />
            <div>
              <div className="font-semibold">Boka utan konto</div>
              <div className="text-sm text-mute">Nummer och mejl räcker. Skapa konto om du vill samla alla bokningar och lämna omdömen.</div>
            </div>
          </div>
          <Link href="/for-salonger" className="card group flex items-center gap-4 p-5">
            <Store className="shrink-0 text-gold" />
            <div className="flex-1">
              <div className="font-semibold">Driver du en salong?</div>
              <div className="text-sm text-mute">Kom igång gratis – ingen provision.</div>
            </div>
            <ChevronRight className="text-mute transition group-hover:translate-x-1" />
          </Link>
        </section>

        <footer className="mt-14 flex items-center justify-center gap-2 text-sm text-mute">
          <Scissors size={14} /> Saxa · by Aetos Systems
        </footer>
      </div>

      <CustomerNav />
    </main>
  )
}
