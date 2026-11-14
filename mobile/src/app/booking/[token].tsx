import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import WebScreen from '../../components/WebScreen'

export default function Booking() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const { top } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, paddingTop: top + 44 }}>
      <WebScreen path={`/b/${token}`} />
    </View>
  )
}
