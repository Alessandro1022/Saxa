import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import WebScreen from '../../components/WebScreen'

export default function Profile() {
  const { top } = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, paddingTop: top }}>
      <WebScreen path="/me/profil" tabRoots />
    </View>
  )
}
