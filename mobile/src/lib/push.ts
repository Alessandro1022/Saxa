import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'

let token: string | null = null
const listeners = new Set<(t: string) => void>()

export const currentPushToken = () => token

/** Lyssna på när telefonen fått sin push-adress. */
export function onPushToken(cb: (t: string) => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/**
 * Hämtar telefonens push-adress. `ask` = visa iOS-frågan om notiser om den inte ställts än.
 * Returnerar null om användaren sagt nej eller om något saknas – appen fungerar ändå.
 */
export async function ensurePush(ask: boolean) {
  if (token) return token
  try {
    let perm = await Notifications.getPermissionsAsync()
    if (!perm.granted) {
      if (!ask || !perm.canAskAgain) return null
      perm = await Notifications.requestPermissionsAsync()
      if (!perm.granted) return null
    }
    const projectId = (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ?? Constants.easConfig?.projectId
    if (!projectId) return null
    const res = await Notifications.getExpoPushTokenAsync({ projectId })
    token = res.data
    listeners.forEach((l) => l(res.data))
    return token
  } catch {
    return null
  }
}
