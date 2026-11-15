import { useColorScheme } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { palette } from '../../lib/config'

export default function TabsLayout() {
  const dark = useColorScheme() !== 'light'
  const c = palette(dark)
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.gold,
        tabBarInactiveTintColor: c.mute,
        tabBarStyle: { display: 'none' }, // webbens egna meny används
        tabBarLabelStyle: { fontWeight: '600' },
      }}
      screenListeners={{ tabPress: () => Haptics.selectionAsync().catch(() => {}) }}
    >
      <Tabs.Screen name="index" options={{ title: 'Hem', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color as string} size={size} /> }} />
    </Tabs>
  )
}
