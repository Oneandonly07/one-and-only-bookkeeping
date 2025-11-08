// app/auth/callback/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? (process.env.NEXT_PUBLIC_POST_LOGIN_PATH ?? '/dashboard');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  // Prepare the redirect response where we'll SET cookies
  const res = NextResponse.redirect(`${origin}${next}`);

  // Bind Supabase cookies to the *response* (critical for avoiding login loop)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options: CookieOptions) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options: CookieOptions) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  await supabase.auth.exchangeCodeForSession(code);
  return res;
}
