import { NextResponse } from 'next/server'
import { loadDiscover } from '@/lib/discover'

// Publik lista för iOS-appens native hemskärm
export async function GET() {
  const data = await loadDiscover()
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}
