// app/api/rules/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

function getSupabase(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
}

export async function GET(req: NextRequest) {
  // Optional: list rules for the current user
  const res = NextResponse.json({ ok: true });
  const supabase = getSupabase(req, res);

  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .eq('user_id', user.id)
    .order('priority', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  // Create a rule for the current user
  const res = new NextResponse();
  const supabase = getSupabase(req, res);

  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    name,
    contains,
    category,
    priority = 50,
    is_active = true,
  } = body ?? {};

  // Basic validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 });
  }
  if (!contains || typeof contains !== 'string' || !contains.trim()) {
    return NextResponse.json({ ok: false, error: 'Contains is required' }, { status: 400 });
  }
  if (!category || typeof category !== 'string' || !category.trim()) {
    return NextResponse.json({ ok: false, error: 'Category is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('rules')
    .insert([{
      user_id: user.id,
      name: name.trim(),
      contains: contains.trim(),      // single string col used by your ILIKE logic
      category: category.trim(),
      priority: Number(priority) || 0,
      is_active: !!is_active,
    }])
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data }, { status: 201 });
}
