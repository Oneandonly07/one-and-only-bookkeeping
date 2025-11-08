// middleware.ts (place at the project root)
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Public pages that NEVER require auth.
 * Add to this list if you create more public pages.
 */
const PUBLIC_PATHS = new Set<string>([
  '/',
  '/auth/login',
  '/auth/callback',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
])

/**
 * Public API prefixes (ALLOWED through middleware without auth).
 * NOTE: /api/rules is intentionally included as requested.
 */
const PUBLIC_API_PREFIXES = ['/api/rules', '/api/health']

/**
 * Assets / framework internals we should never block.
 */
function isFrameworkOrAssetPath(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$/i) !== null
  )
}

export async function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const { pathname } = url

  // Always let public assets & Next internals through
  if (isFrameworkOrAssetPath(pathname)) {
    return NextResponse.next()
  }

  // Allow-list public pages
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  // Allow-list public API prefixes (e.g., /api/rules)
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Create a response we can mutate cookies on
  const res = NextResponse.next()

  // Bind Supabase cookies to the *response* (important to avoid login loops)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options: CookieOptions) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options: CookieOptions) => {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Gate everything else behind auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = new URL('/auth/login', req.url)
    // Preserve the original destination so we can bounce back post-login
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

/**
 * Match everything except well-known static files.
 * NOTE: If you add other top-level folders that should skip middleware,
 * append them to the negative lookahead below.
 */
export const config = {
  matcher: [
    // Skip _next, static files, images, and well-known files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)).*)',
  ],
}
