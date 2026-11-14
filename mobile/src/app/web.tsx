import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import WebScreen from '../components/WebScreen'

// Öppnar valfri sida på Saxa (t.ex. panelen från en notis)
export default function Web() {
  const { path } = useLocalSearchParams<{ path: string }>()
  const { top } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, paddingTop: top + 44 }}>
      <WebScreen path={path?.startsWith('/') ? path : '/'} />
    </View>
  )
}
