'use server';

import { createClient } from '@/lib/supabase/server';

export type TxnRow = {
  id: string;                // uuid -> string for React keys
  date: string | null;       // DATE or TIMESTAMP
  type: 'income' | 'expense' | 'transfer';
  category: string | null;   // TEXT (no longer category_id)
  description: string | null;
  amount: number;
};

export async function listTransactions() {
  const supabase = createClient();

  // Pull the columns that exist today
  const { data, error } = await supabase
    .from('transactions')
    .select('id, date, type, category, description, amount')
    .order('date', { ascending: false })
    .limit(200);

  if (error) {
    return { ok: false as const, error: error.message, rows: [] as TxnRow[] };
  }

  const rows: TxnRow[] = (data ?? []).map((t: any) => ({
    id: String(t.id),
    date: t.date ?? null,
    type: t.type,
    category: t.category ?? null,
    description: t.description ?? null,
    amount: Number(t.amount ?? 0),
  }));

  return { ok: true as const, rows };
}
