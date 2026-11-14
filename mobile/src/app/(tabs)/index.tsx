import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image as RNImage, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as SplashScreen from 'expo-splash-screen'
import { router } from 'expo-router'
import { GOLD, SITE, palette } from '../../lib/config'

type Salon = {
  id: string
  slug: string
  name: string
  city: string | null
  address: string | null
  cover_url: string | null
  logo_url: string | null
  rating: number | null
  reviews: number
  from: number | null
  staff: { id: string; name: string; photo_url: string | null }[]
}
type Pro = { id: string; name: string; title: string | null; photo_url: string | null; salon: { slug: string; name: string; city: string | null }; rating: number | null }

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const tap = () => Haptics.selectionAsync().catch(() => {})

function Avatar({ name, src, size, bg }: { name: string; src?: string | null; size: number; bg: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {src ? (
        <Image source={src} style={{ width: size, height: size }} contentFit="cover" transition={200} />
      ) : (
        <Text style={{ color: GOLD, fontWeight: '700', fontSize: size * 0.4 }}>{name.trim()[0]?.toUpperCase()}</Text>
      )}
    </View>
  )
}

export default function Home() {
  const dark = useColorScheme() !== 'light'
  const c = palette(dark)
  const { top } = useSafeAreaInsets()
  const [salons, setSalons] = useState<Salon[] | null>(null)
  const [pros, setPros] = useState<Pro[]>([])
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${SITE}/api/public/salons`)
      const d = await r.json()
      setSalons(d.salons ?? [])
      setPros(d.pros ?? [])
      setError(false)
    } catch {
      setError(true)
      setSalons((s) => s ?? [])
    } finally {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const cities = useMemo(() => [...new Set((salons ?? []).map((s) => s.city).filter(Boolean) as string[])].sort(), [salons])
  const list = (salons ?? []).filter(
    (s) => (!city || s.city === city) && (!q || norm(`${s.name} ${s.city ?? ''} ${s.address ?? ''}`).includes(norm(q)))
  )
  const topPros = pros.filter((p) => !city || p.salon.city === city).slice(0, 12)

  const openSalon = (slug: string, staff?: string) => {
    tap()
    router.push({ pathname: '/salon/[slug]', params: { slug, q: staff ? `staff=${staff}` : '' } })
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: top + 12, paddingBottom: 40 }}
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          tintColor={GOLD}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true)
            await load()
            setRefreshing(false)
          }}
        />
      }
    >
      {/* Header */}
      <View style={[styles.row, { paddingHorizontal: 20 }]}>
        <RNImage source={require('../../../assets/icon.png')} style={styles.logo} />
        <Text style={[styles.brand, { color: c.fg }]}>Saxa</Text>
      </View>

      {/* Hero */}
      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <Text style={[styles.h1, { color: c.fg }]}>
          Din nästa <Text style={{ color: c.gold }}>fresh cut</Text>,{'\n'}bokad på sekunder.
        </Text>
        <Text style={[styles.lead, { color: c.mute }]}>Välj salong, tid och boka – inget konto behövs.</Text>
      </View>

      {/* Sök */}
      <View style={[styles.search, { backgroundColor: c.card, borderColor: c.line }]}>
        <Ionicons name="search" size={18} color={c.mute} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Sök salong eller stad"
          placeholderTextColor={c.mute}
          style={[styles.input, { color: c.fg }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Städer */}
      {cities.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginTop: 14 }}>
          {['', ...cities].map((x) => {
            const on = city === x
            return (
              <Pressable
                key={x || 'alla'}
                onPress={() => {
                  tap()
                  setCity(x)
                }}
                style={[styles.chip, { backgroundColor: on ? GOLD : c.soft }]}
              >
                <Text style={{ color: on ? '#141109' : c.fg, fontWeight: '600' }}>{x || 'Alla'}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}

      {/* Frisörer */}
      {topPros.length > 0 && !q && (
        <>
          <Text style={[styles.section, { color: c.fg }]}>Frisörer</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {topPros.map((p) => (
              <Pressable key={p.id} onPress={() => openSalon(p.salon.slug, p.id)} style={({ pressed }) => [{ width: 74, alignItems: 'center' }, pressed && { opacity: 0.7 }]}>
                <Avatar name={p.name} src={p.photo_url} size={64} bg={c.soft} />
                <Text numberOfLines={1} style={{ color: c.fg, fontWeight: '600', marginTop: 6 }}>{p.name}</Text>
                <Text numberOfLines={1} style={{ color: c.mute, fontSize: 11 }}>{p.salon.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      {/* Salonger */}
      <Text style={[styles.section, { color: c.fg }]}>{q || city ? `${list.length} salonger` : 'Salonger'}</Text>
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        {salons === null
          ? [0, 1, 2].map((i) => <View key={i} style={[styles.card, { backgroundColor: c.soft }]} />)
          : list.map((s) => (
              <Pressable key={s.id} onPress={() => openSalon(s.slug)} style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                <View style={[styles.card, { backgroundColor: c.card }]}>
                  {s.cover_url ? (
                    <Image source={s.cover_url} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
                  ) : (
                    <LinearGradient colors={[dark ? '#5a4a2a' : '#e8d3a2', c.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  )}
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.25 }} end={{ x: 0, y: 1 }} />
                  {s.from != null && (
                    <View style={styles.price}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>från {s.from} kr</Text>
                    </View>
                  )}
                  <View style={styles.cardBottom}>
                    <Avatar name={s.name} src={s.logo_url} size={44} bg="#2a2a30" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={{ color: '#fff', fontSize: 19, fontWeight: '700' }}>{s.name}</Text>
                      <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>
                        {s.city ?? s.address ?? 'Sverige'}
                        {s.reviews ? `  ·  ★ ${s.rating?.toFixed(1)} (${s.reviews})` : '  ·  Ny'}
                      </Text>
                    </View>
                    <View style={styles.go}>
                      <Ionicons name="arrow-forward" size={18} color="#141109" />
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
        {salons !== null && list.length === 0 && (
          <View style={[styles.empty, { backgroundColor: c.card }]}>
            <Ionicons name={error ? 'cloud-offline-outline' : 'cut-outline'} size={28} color={GOLD} />
            <Text style={{ color: c.fg, fontWeight: '600', marginTop: 10 }}>{error ? 'Ingen anslutning' : 'Inget hittades'}</Text>
            <Text style={{ color: c.mute, marginTop: 4, textAlign: 'center' }}>{error ? 'Dra nedåt för att försöka igen.' : 'Testa en annan sökning eller stad.'}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 40, height: 40, borderRadius: 11, marginRight: 10 },
  brand: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  h1: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1 },
  lead: { fontSize: 16, marginTop: 10 },
  search: { marginHorizontal: 20, marginTop: 22, borderRadius: 999, borderWidth: 1, paddingHorizontal: 18, height: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999 },
  section: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 28, marginBottom: 12, paddingHorizontal: 20 },
  card: { height: 210, borderRadius: 28, overflow: 'hidden' },
  price: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  cardBottom: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center' },
  go: { width: 38, height: 38, borderRadius: 19, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  empty: { borderRadius: 28, padding: 32, alignItems: 'center' },
})
