import Constants from 'expo-constants'

export const SITE = ((Constants.expoConfig?.extra?.siteUrl as string | undefined) ?? 'https://saxa1001.vercel.app').replace(/\/$/, '')

export const GOLD = '#d2ab5c'

export const palette = (dark: boolean) => ({
  bg: dark ? '#09090b' : '#f6f5f2',
  card: dark ? '#16161a' : '#ffffff',
  soft: dark ? '#1c1c21' : '#ecebe7',
  fg: dark ? '#f5f5f7' : '#121216',
  mute: dark ? '#92929c' : '#6c6c76',
  line: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
  gold: dark ? '#debe78' : '#b08838',
})
