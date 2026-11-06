import React, { useCallback, useRef, useState } from 'react'
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'
import { WebView, type WebViewNavigation } from 'react-native-webview'
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import * as SplashScreen from 'expo-splash-screen'
import * as Haptics from 'expo-haptics'
import { StatusBar } from 'expo-status-bar'
import Constants from 'expo-constants'

const SITE = ((Constants.expoConfig?.extra?.siteUrl as string | undefined) ?? 'https://saxa1001.vercel.app').replace(/\/$/, '')
const GOLD = '#d2ab5c'

SplashScreen.preventAutoHideAsync().catch(() => {})

// react-native-webviews typer krockar med React 19.3-typerna (props: never). Körningen är opåverkad.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Web = WebView as unknown as React.ComponentType<any>

// Länkar som ska öppnas utanför appen (Safari, telefon, kalender, Instagram …)
function isExternal(url: string) {
  if (url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) return false
  if (!url.startsWith(SITE)) return true
  return url.includes('/api/booking-ics/') || url.includes('/api/ical/')
}

export default function App() {
  const ref = useRef<{ reload: () => void } | null>(null)
  const dark = useColorScheme() !== 'light'
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const lastPath = useRef('')

  const hideSplash = useCallback(() => {
    setReady(true)
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  const onShouldStart = useCallback((req: ShouldStartLoadRequest) => {
    if (!isExternal(req.url)) return true
    Linking.openURL(req.url).catch(() => {})
    return false
  }, [])

  const onNav = useCallback((nav: WebViewNavigation) => {
    const path = nav.url.replace(SITE, '')
    // Liten vibration när en bokning blir klar
    if (path.startsWith('/b/') && !lastPath.current.startsWith('/b/')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    }
    lastPath.current = path
  }, [])

  const bg = dark ? '#09090b' : '#f6f5f2'

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {failed ? (
        <View style={styles.center}>
          <Image source={require('./assets/icon.png')} style={styles.logo} />
          <Text style={[styles.title, { color: dark ? '#f5f5f7' : '#121216' }]}>Ingen anslutning</Text>
          <Text style={styles.sub}>Kolla din internetuppkoppling och försök igen.</Text>
          <Pressable
            onPress={() => {
              setFailed(false)
              ref.current?.reload()
            }}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.btnText}>Försök igen</Text>
          </Pressable>
        </View>
      ) : (
        <Web
          ref={ref}
          source={{ uri: SITE }}
          style={{ backgroundColor: bg }}
          originWhitelist={['*']}
          applicationNameForUserAgent="SaxaApp/1.0"
          onShouldStartLoadWithRequest={onShouldStart}
          onNavigationStateChange={onNav}
          onLoadEnd={hideSplash}
          onError={() => {
            setFailed(true)
            hideSplash()
          }}
          onContentProcessDidTerminate={() => ref.current?.reload()}
          allowsBackForwardNavigationGestures
          pullToRefreshEnabled
          bounces
          sharedCookiesEnabled
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          allowsInlineMediaPlayback
          decelerationRate="normal"
          setSupportMultipleWindows={false}
          startInLoadingState={false}
        />
      )}
      {!ready && !failed && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: bg }]}>
          <ActivityIndicator color={GOLD} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { width: 88, height: 88, borderRadius: 22, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { marginTop: 8, fontSize: 15, color: '#8e8e96', textAlign: 'center' },
  btn: { marginTop: 28, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  btnText: { color: '#141109', fontWeight: '700', fontSize: 16 },
})
