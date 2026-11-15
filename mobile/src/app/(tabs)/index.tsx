import * as SplashScreen from 'expo-splash-screen'
import WebScreen from '../../components/WebScreen'

// Hela Saxa i helskärm, precis som på webben (med webbens egen meny)
export default function Home() {
  return <WebScreen path="/" onReady={() => SplashScreen.hideAsync().catch(() => {})} />
}
