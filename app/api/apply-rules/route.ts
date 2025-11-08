// app/api/apply-rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true }, { status: 200 });

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

  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData?.user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const uid = userData.user.id;

  // Call the DB function to apply active rules; pass null to target all uncategorized
  const { error: rpcErr } = await supabase.rpc('apply_rules', {
    p_user: uid,
    p_since: null, // or provide a date string like '2025-01-01' to limit scope
  });

  if (rpcErr) {
    return NextResponse.json({ ok: false, error: rpcErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
