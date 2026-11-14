import { Star } from 'lucide-react'
import SubmitButton from '@/components/SubmitButton'
import { requireSalon, origin } from '@/lib/salon'
import { admin } from '@/lib/supabase/admin'
import { connectStripe, savePayments, saveSalon, stripeDashboard } from '../actions'
import { stripe, stripeEnabled } from '@/lib/stripe'
import { CreditCard, ExternalLink, ShieldCheck } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import CopyButton from '@/components/CopyButton'
import { Avatar, Flash } from '@/components/ui'

export default async function Settings({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string; stripe?: string }> }) {
  const sp = await searchParams
  const { salon, supabase } = await requireSalon()

  // Stäm av Stripe-kontot när salongen kommer tillbaka från Stripes onboarding
  let ready = !!salon.payments_ready
  if (salon.stripe_account_id && !ready && stripeEnabled()) {
    try {
      const a = await stripe().accounts.retrieve(salon.stripe_account_id)
      ready = !!a.charges_enabled
      if (ready) await supabase.from('salons').update({ payments_ready: true }).eq('id', salon.id)
    } catch {}
  }
  const mode = salon.pay_mode ?? 'none'
  const link = `${await origin()}/${salon.slug}`
  const db = admin()
  const { data: reviews } = await db
    .from('reviews')
    .select('id, rating, comment, customer_id, created_at, author_name')
    .eq('salon_id', salon.id)
    .order('created_at', { ascending: false })
    .limit(20)
  const ids = [...new Set((reviews ?? []).map((r) => r.customer_id as string | null).filter((x): x is string => !!x))]
  const { data: people } = ids.length ? await db.from('customers').select('id, full_name, avatar_url').in('id', ids) : { data: [] }
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null

  return (
    <div>
      <h1 className="rise mb-5 text-[26px] font-bold tracking-tight">Salong</h1>
      <Flash e={sp.e} ok={sp.stripe === 'klar' && ready ? 'Stripe är kopplat ✓' : sp.ok ? 'Sparat ✓' : undefined} />

      <div className="card rise mb-4 p-5">
        <div className="label">Din bokningslänk</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-full px-4 py-2.5 text-sm" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 5%, rgb(var(--ink)))' }}>{link}</code>
          <CopyButton text={link} />
        </div>
        <p className="mt-2 text-xs text-mute">Lägg den i Instagram-bion, på Google-profilen och skicka den i DM.</p>
      </div>

      <form action={saveSalon} className="card rise rise-1 grid gap-4 p-5">
        <div>
          <label className="label">Omslagsbild</label>
          <ImageUpload name="cover_url" folder={salon.id} initial={salon.cover_url} shape="wide" />
        </div>
        <div className="flex items-end gap-4">
          <div>
            <label className="label">Logga</label>
            <ImageUpload name="logo_url" folder={salon.id} initial={salon.logo_url} size={72} />
          </div>
          <div className="flex-1">
            <label className="label">Namn</label>
            <input className="input" name="name" defaultValue={salon.name} required />
          </div>
        </div>
        <div>
          <label className="label">Länk</label>
          <input className="input" name="slug" defaultValue={salon.slug} required pattern="[a-z0-9\-]{3,40}" />
        </div>
        <div>
          <label className="label">Beskrivning</label>
          <textarea className="input min-h-[84px] resize-none" name="description" defaultValue={salon.description ?? ''} placeholder="Fades, skägg och klassiska klipp." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Adress</label>
            <input className="input" name="address" defaultValue={salon.address ?? ''} />
          </div>
          <div>
            <label className="label">Stad</label>
            <input className="input" name="city" defaultValue={salon.city ?? ''} placeholder="Göteborg" />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" name="phone" defaultValue={salon.phone ?? ''} />
          </div>
          <div className="col-span-2">
            <label className="label">Instagram</label>
            <input className="input" name="instagram" defaultValue={salon.instagram ?? ''} placeholder="dittkonto" />
          </div>
        </div>
        <div className="mt-2 rounded-[22px] p-4" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4%, rgb(var(--ink)))' }}>
          <div className="font-semibold">Bokningsregler</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="label">Avbokning senast (h innan)</label>
              <input className="input" name="cancel_hours" type="number" min={0} max={72} defaultValue={salon.cancel_hours ?? 2} />
            </div>
            <div>
              <label className="label">Tidigast bokning (min från nu)</label>
              <input className="input" name="lead_minutes" type="number" min={0} max={1440} step={15} defaultValue={salon.lead_minutes ?? 30} />
            </div>
            <div className="col-span-2">
              <label className="label">Mejl för nya bokningar</label>
              <input className="input" name="notify_email" type="email" defaultValue={salon.notify_email ?? ''} placeholder="Lämna tomt = ditt inloggningsmejl" />
            </div>
          </div>
        </div>
        <SubmitButton pending="Sparar…">Spara</SubmitButton>
      </form>

      <section id="betalning" className="card rise mt-4 scroll-mt-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft text-gold"><CreditCard size={20} /></div>
          <div className="flex-1">
            <div className="font-semibold">Betalning vid bokning</div>
            <div className="text-sm text-mute">Färre no-shows: kunden betalar handpenning eller hela priset direkt.</div>
          </div>
        </div>

        <form action={savePayments} className="mt-4 grid gap-3">
          <div>
            <label className="label">Ditt Swish-nummer</label>
            <input className="input" name="swish_number" inputMode="numeric" defaultValue={salon.swish_number ?? ''} placeholder="070 123 45 67 eller 123 456 78 90" />
            <p className="mt-1.5 text-xs text-mute">Pengarna går direkt till dig. Kunden får Swish öppnat med belopp och meddelande ifyllt.</p>
          </div>
          <div className="grid gap-2">
            {([
              ['none', 'Ingen betalning', 'Kunden betalar i salongen'],
              ['deposit', 'Handpenning', 'Ett fast belopp betalas vid bokning'],
              ['full', 'Hela priset', 'Kunden betalar allt vid bokning'],
            ] as const).map(([v, t, d]) => (
              <label key={v} className="tile flex cursor-pointer items-center gap-3 has-[:checked]:!border-[rgb(var(--gold))]">
                <input type="radio" name="pay_mode" value={v} defaultChecked={mode === v} className="h-5 w-5 accent-[#d2ab5c]" />
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-sm text-mute">{d}</span>
                </span>
              </label>
            ))}
          </div>
          <div>
            <label className="label">Handpenning (kr)</label>
            <input className="input" name="deposit_sek" type="number" min={5} max={5000} defaultValue={salon.deposit_sek ?? 100} />
          </div>
          <p className="text-xs text-mute">
            Bokningen märks ”Väntar på Swish” tills du trycker på märket och bekräftar att pengarna kommit in. Avbokar kunden i tid swishar du tillbaka själv.
          </p>
          <SubmitButton pending="Sparar…">Spara betalning</SubmitButton>
        </form>

        {stripeEnabled() && (
          <div className="mt-5 border-t pt-4 hair">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck size={16} className="text-gold" /> Kort & Apple Pay {ready ? '· kopplat' : '(valfritt)'}
            </div>
            <p className="mt-1 text-xs text-mute">Används när inget Swish-nummer är ifyllt. Betalning och återbetalning sker automatiskt via Stripe.</p>
            {!ready && (
              <form action={connectStripe} className="mt-3">
                <SubmitButton className="btn-soft w-full" pending="Öppnar Stripe…">{salon.stripe_account_id ? 'Fortsätt koppla Stripe' : 'Koppla Stripe'}</SubmitButton>
              </form>
            )}
            {salon.stripe_account_id && (
              <form action={stripeDashboard} className="mt-3">
                <button className="flex w-full items-center justify-center gap-1.5 text-sm text-mute hover:text-fg">Utbetalningar & kvitton i Stripe <ExternalLink size={13} /></button>
              </form>
            )}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-mute">
          <Star size={14} className="fill-gold text-gold" />
          {avg ? `${avg.toFixed(1)} · ${reviews!.length} omdömen` : 'Inga omdömen än'}
        </h2>
        {!!reviews?.length && (
          <div className="card divide-hair overflow-hidden">
            {reviews.map((r) => {
              const p = (people ?? []).find((x) => x.id === r.customer_id)
              const who = r.author_name ?? p?.full_name?.split(' ')[0] ?? 'Kund'
              return (
                <div key={r.id} className="flex gap-3 px-4 py-3.5">
                  <Avatar name={who} src={p?.avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {who}
                      <span className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < r.rating ? 'fill-gold text-gold' : 'text-mute/40'} />
                        ))}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-mute">{r.comment}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
