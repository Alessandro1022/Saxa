import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SITE, palette } from '../lib/config'
import { onReminderTap } from '../lib/reminders'
import { ensurePush } from '../lib/push'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const dark = useColorScheme() !== 'light'
  const c = palette(dark)

  // Tryck på en påminnelse → öppna bokningen
  useEffect(
    () =>
      onReminderTap((url) => {
        const token = url.match(/\/b\/([0-9a-f-]{36})/i)?.[1]
        if (token) router.push({ pathname: '/booking/[token]', params: { token } })
        else if (url.startsWith(SITE)) router.push({ pathname: '/web', params: { path: url.slice(SITE.length) || '/' } })
      }),
    []
  )

  // Har användaren redan tillåtit notiser → hämta push-adressen direkt (frågan ställs först vid bokning/panel)
  useEffect(() => {
    ensurePush(false)
  }, [])

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: c.bg }, headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="salon/[slug]"
          options={{ headerShown: true, headerTransparent: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal', headerTintColor: '#ffffff' }}
        />
        <Stack.Screen
          name="booking/[token]"
          options={{ headerShown: true, headerTransparent: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal', headerTintColor: c.fg }}
        />
        <Stack.Screen
          name="web"
          options={{ headerShown: true, headerTransparent: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal', headerTintColor: c.fg }}
        />
      </Stack>
    </>
  )
}
