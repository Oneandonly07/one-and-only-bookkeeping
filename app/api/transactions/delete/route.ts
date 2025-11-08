import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const sb = getServerClient();

    const contentType = req.headers.get('content-type') || '';
    let id = '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      id = String(body.id ?? '');
    } else {
      const form = await req.formData();
      id = String(form.get('id') ?? '');
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    const { error } = await sb.from('transactions').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
