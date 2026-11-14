import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'
import { WebView, type WebViewNavigation } from 'react-native-webview'
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { GOLD, SITE, palette } from '../lib/config'
import { syncReminder } from '../lib/reminders'
import { currentPushToken, ensurePush, onPushToken } from '../lib/push'

// react-native-webviews typer krockar med React 19.3-typerna (props: never). Körningen är opåverkad.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Web = WebView as unknown as React.ComponentType<any>

// Betalning (Stripe) ska stanna i appen
const INTERNAL_HOSTS = ['checkout.stripe.com', 'js.stripe.com', 'hooks.stripe.com', 'pay.stripe.com', 'connect.stripe.com', 'm.stripe.network', 'm.stripe.com']

function isExternal(url: string) {
  if (url.startsWith('about:') || url.startsWith('blob:') || url.startsWith('data:')) return false
  if (url.startsWith(SITE)) return url.includes('/api/booking-ics/') || url.includes('/api/ical/')
  try {
    return !INTERNAL_HOSTS.includes(new URL(url).host)
  } catch {
    return true
  }
}

// Säger till sajten att den visas i appen (döljer webbens egen meny m.m.)
const inject = (push: string | null) =>
  `document.documentElement.classList.add('in-app');window.__SAXA_APP__=true;${push ? `window.__SAXA_PUSH__=${JSON.stringify(push)};` : ''}true;`

/** En flik/sida i appen som visar en del av Saxa-sajten med native-beteenden runt om. */
export default function WebScreen({ path, onReady, tabRoots }: { path: string; onReady?: () => void; tabRoots?: boolean }) {
  const ref = useRef<{ reload: () => void; injectJavaScript: (js: string) => void } | null>(null)
  const [push, setPush] = useState(currentPushToken())

  // När telefonen får sin push-adress: ge den till sidan som visas
  useEffect(
    () =>
      onPushToken((t) => {
        setPush(t)
        ref.current?.injectJavaScript(`window.__SAXA_PUSH__=${JSON.stringify(t)};window.dispatchEvent(new Event('saxa-push'));true;`)
      }),
    []
  )
  const dark = useColorScheme() !== 'light'
  const c = palette(dark)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const lastPath = useRef('')

  const onShouldStart = useCallback(
    (req: ShouldStartLoadRequest) => {
      if (!isExternal(req.url)) {
        // Från en flik: öppna salongssidor i native-stacken
        if (tabRoots && req.isTopFrame !== false && req.url.startsWith(SITE)) {
          const p = req.url.replace(SITE, '').split('?')[0].split('#')[0]
          const slug = p.split('/')[1] ?? ''
          const own = p === path || p.startsWith('/me') || p.startsWith('/b/') || p.startsWith('/login') || p.startsWith('/dashboard') || p.startsWith('/onboarding') || p.startsWith('/api') || p.startsWith('/auth')
          if (!own && slug && !['frisorer', 'integritet', 'support', 'for-salonger'].includes(slug) && p.split('/').length === 2) {
            router.push({ pathname: '/salon/[slug]', params: { slug, q: req.url.split('?')[1] ?? '' } })
            return false
          }
        }
        return true
      }
      Linking.openURL(req.url).catch(() => {})
      return false
    },
    [path, tabRoots]
  )

  const onNav = useCallback((nav: WebViewNavigation) => {
    const p = nav.url.replace(SITE, '')
    const m = p.match(/^\/b\/([0-9a-f-]{36})/i)
    if (m) {
      if (!lastPath.current.startsWith('/b/')) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      syncReminder(SITE, m[1]) // påminnelse dagen innan + 2 h innan
    }
    // Fråga om notiser när det spelar roll: efter en bokning eller i salongens panel
    if (m || p.startsWith('/dashboard')) ensurePush(true)
    lastPath.current = p
  }, [])

  if (failed)
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={[styles.title, { color: c.fg }]}>Ingen anslutning</Text>
        <Text style={[styles.sub, { color: c.mute }]}>Kolla din internetuppkoppling och försök igen.</Text>
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
    )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Web
        ref={ref}
        source={{ uri: SITE + path }}
        style={{ backgroundColor: c.bg }}
        originWhitelist={['*']}
        applicationNameForUserAgent="SaxaApp/1.1"
        injectedJavaScriptBeforeContentLoaded={inject(push)}
        onShouldStartLoadWithRequest={onShouldStart}
        onNavigationStateChange={onNav}
        onLoadEnd={() => {
          setReady(true)
          onReady?.()
        }}
        onError={() => {
          setFailed(true)
          onReady?.()
        }}
        onContentProcessDidTerminate={() => ref.current?.reload()}
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
        sharedCookiesEnabled
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        setSupportMultipleWindows={false}
      />
      {!ready && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: c.bg }]}>
          <ActivityIndicator color={GOLD} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { width: 88, height: 88, borderRadius: 22, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { marginTop: 8, fontSize: 15, textAlign: 'center' },
  btn: { marginTop: 28, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  btnText: { color: '#141109', fontWeight: '700', fontSize: 16 },
})
