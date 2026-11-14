import { useLocalSearchParams } from 'expo-router'
import WebScreen from '../../components/WebScreen'

export default function Salon() {
  const { slug, q } = useLocalSearchParams<{ slug: string; q?: string }>()
  return <WebScreen path={`/${slug}${q ? `?${q}` : ''}`} />
}
