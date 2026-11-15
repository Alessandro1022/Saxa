import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import WebScreen from '../../components/WebScreen'

// Hem: samma startsida som på saxa-webben (rutnät, guld, fallande hår), med appens egna flikar under
export default function Home() {
  const { top } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, paddingTop: top }}>
      <WebScreen path="/" tabRoots onReady={() => SplashScreen.hideAsync().catch(() => {})} />
    </View>
  )
}
