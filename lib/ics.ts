type Ev = { uid: string; start: Date; end: Date; summary: string; description?: string; location?: string }

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

export function buildICS(calName: string, events: Ev[]) {
  const now = stamp(new Date())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Saxa//Bokning//SV',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(calName)}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT15M',
    'X-PUBLISHED-TTL:PT15M',
  ]
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@saxa`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(e.start)}`,
      `DTEND:${stamp(e.end)}`,
      `SUMMARY:${esc(e.summary)}`
    )
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`)
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
