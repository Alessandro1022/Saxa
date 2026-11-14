/** Betalning vid bokning: Swish direkt till salongens nummer. */
export type PayCfg = { mode: 'none' | 'deposit' | 'full'; deposit: number; method: 'swish' | null; swish?: string }

export const swishDigits = (v: unknown) => String(v ?? '').replace(/\D/g, '')

/** Hur mycket som ska betalas vid bokning för en tjänst. 0 = ingen betalning. */
export function amountFor(cfg: PayCfg, price: number | null | undefined) {
  if (cfg.mode === 'none' || !cfg.method) return 0
  const p = price ?? 0
  const a = cfg.mode === 'full' ? p : Math.min(cfg.deposit, p || cfg.deposit)
  return a >= 5 ? a : 0
}

/** Salongens betalinställningar. Kräver ett ifyllt Swish-nummer. */
export function payCfg(salon: Record<string, unknown>): PayCfg {
  const swish = swishDigits(salon.swish_number)
  const ok = swish.length >= 8
  const mode = ok ? ((salon.pay_mode as PayCfg['mode']) ?? 'none') : 'none'
  return { mode, deposit: Number(salon.deposit_sek ?? 100), method: mode === 'none' ? null : 'swish', swish: ok ? swish : undefined }
}

/** Länk som öppnar Swish-appen med nummer, belopp och meddelande ifyllt. */
export function swishLink(number: string, amount: number, msg: string) {
  const clean = msg.replace(/[^a-zA-Z0-9åäöÅÄÖ :.,-]/g, '').slice(0, 50)
  return `https://app.swish.nu/1/p/sw/?sw=${swishDigits(number)}&amt=${amount}&cur=SEK&msg=${encodeURIComponent(clean)}&src=qr`
}
