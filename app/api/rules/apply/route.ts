// app/api/rules/apply/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const { searchParams, origin } = new URL(req.url);
    // Optional date filter (?since=2025-01-01); omit to apply to all uncategorized
    const sinceParam = searchParams.get('since'); // YYYY-MM-DD or null

    // Bind cookies to response (so session persists)
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

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
    }
    const uid = userData.user.id;

    // Call the DB function
    const { error: rpcErr } = await supabase.rpc('apply_rules', {
      p_user: uid,
      p_since: sinceParam ? sinceParam : null,
    });

    if (rpcErr) {
      return NextResponse.json({ ok: false, error: rpcErr.message }, { status: 400 });
    }

    return res; // { ok: true }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Failed' }, { status: 500 });
  }
}
