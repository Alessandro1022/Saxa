import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )
  // getClaims verifierar JWT lokalt (snabbt) och förnyar sessionen vid behov
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims?.sub

  const path = request.nextUrl.pathname
  const isProtected = path.startsWith('/dashboard') || path.startsWith('/onboarding') || path.startsWith('/me/profil')
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(path)}${path.startsWith('/me') ? '' : '&as=salon'}`
    return NextResponse.redirect(url)
  }
  return response
}

// Kör på allt utom statiska filer så att sessionen alltid hålls färsk
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/ical|.*\\.(?:png|jpg|svg|ico)$).*)'] }
