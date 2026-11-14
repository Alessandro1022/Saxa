import * as Notifications from 'expo-notifications'

// Visa påminnelser även när appen är öppen
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

type Info = { starts_at: string; status: string; service: string; salon: string; address: string | null }

/**
 * Läser bokningen och schemalägger lokala påminnelser på telefonen:
 * dagen innan och 2 timmar innan. Avbokad/flyttad bokning ersätter gamla påminnelser.
 */
export async function syncReminder(site: string, token: string) {
  try {
    const r = await fetch(`${site}/api/booking-info/${token}`)
    if (!r.ok) return
    const b = (await r.json()) as Info

    const scheduled = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      scheduled.filter((n) => n.content.data?.token === token).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    )
    if (b.status !== 'confirmed') return

    const start = Date.parse(b.starts_at)
    if (start < Date.now()) return

    let perm = await Notifications.getPermissionsAsync()
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync()
    if (!perm.granted) return

    const time = new Date(start).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    const where = `${b.salon}${b.address ? `, ${b.address}` : ''}`
    const plan: [number, string, string][] = [
      [start - 24 * 3600_000, `Imorgon kl ${time} ✂️`, `${b.service} hos ${where}`],
      [start - 2 * 3600_000, `Om 2 timmar: ${b.service}`, `Kl ${time} hos ${where}`],
    ]
    for (const [at, title, body] of plan) {
      if (at < Date.now() + 60_000) continue
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { token, url: `${site}/b/${token}` } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
      })
    }
  } catch {
    // Påminnelser är en bonus – bokningen påverkas aldrig
  }
}

/** Lyssna på tryck på en påminnelse och öppna bokningen. */
export function onReminderTap(open: (url: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((res) => {
    const url = res.notification.request.content.data?.url
    if (typeof url === 'string') open(url)
  })
  // Om appen startades via en påminnelse
  Notifications.getLastNotificationResponseAsync().then((res) => {
    const url = res?.notification.request.content.data?.url
    if (typeof url === 'string') open(url)
  })
  return () => sub.remove()
}
