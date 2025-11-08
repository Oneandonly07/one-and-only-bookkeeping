import { NextResponse } from 'next/server';
import { getServerClient } from '../../../lib/supabaseServer';

type TxnType = 'income' | 'expense' | 'transfer';

export async function POST(req: Request) {
  try {
    const sb = getServerClient();

    const contentType = req.headers.get('content-type') || '';
    let body: any = {};

    // Support both form POSTs (application/x-www-form-urlencoded or multipart)
    // and JSON (application/json). Our QuickAdd form uses urlencoded by default.
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    }

    const account_id = (body.accountId || body.account_id || '').toString().trim();
    const type = ((body.type || 'expense').toString() as TxnType);
    const amountRaw = (body.amount || '').toString();
    const amount = Number(amountRaw || 0);
    const date = (body.date || '').toString();
    const description =
      (body.description !== undefined ? String(body.description).trim() : '') || null;
    const category = (body.category !== undefined ? String(body.category).trim() : '') || null;

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    if (!Number.isFinite(amount)) {
      return NextResponse.json({ error: 'Amount must be a number' }, { status: 400 });
    }

    // Optional: allow empty account_id if your schema supports global transactions
    // Otherwise, enforce it
    // if (!account_id) {
    //   return NextResponse.json({ error: 'Account is required' }, { status: 400 });
    // }

    const { error } = await sb.from('transactions').insert({
      account_id: account_id || null, // if your column is nullable
      type,
      amount,
      date, // yyyy-mm-dd
      description,
      category,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Success
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}
