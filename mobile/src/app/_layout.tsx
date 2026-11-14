import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { palette } from '../lib/config'
import { onReminderTap } from '../lib/reminders'

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
      }),
    []
  )

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
      </Stack>
    </>
  )
}
