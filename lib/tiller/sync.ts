// lib/tiller/sync.ts
/**
 * Tiller Google Sheets sync.
 *
 * - Reads rows from a Google Sheet range (e.g., "Transactions!A:Z")
 * - Maps columns into a normalized shape
 * - If Supabase Service Role creds exist, upserts into "transactions" table
 * - Otherwise, runs in "preview" mode and returns counts only
 *
 * Required env for Google API (Service Account):
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_SERVICE_ACCOUNT_KEY   (PEM, with literal \n newlines or actual newlines)
 *
 * Optional env for defaults:
 *   TILLER_TEAM_ID          (unused in this basic example, but accepted)
 *   TILLER_SHEET_ID         (default spreadsheetId)
 *   TILLER_RANGE            (default range, e.g., "Transactions!A:Z")
 *
 * Optional env for Supabase (to enable DB writes):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import type { sheets_v4 } from 'googleapis';
import { google } from 'googleapis';

type Input = {
  teamId?: string;
  spreadsheetId?: string;
  range?: string;
};

type NormalizedTxn = {
  date: string | null;
  description: string | null;
  amount: number | null;
  type: 'Income' | 'Expense' | null;
  category: string | null;
  account?: string | null;
  member?: string | null;
  location?: string | null;
};

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';

  // Support escaped \n in env var
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY.'
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function getValues({
  spreadsheetId,
  range,
}: {
  spreadsheetId: string;
  range: string;
}) {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data;
}

function headerIndex(headerRow: string[], name: string) {
  // Case-insensitive, flexible matching
  const idx = headerRow.findIndex(
    (h) => h?.toLowerCase().trim() === name.toLowerCase().trim()
  );
  return idx >= 0 ? idx : -1;
}

function normalizeRows(values?: sheets_v4.Schema$ValueRange['values']) {
  if (!values || values.length === 0) return { header: [] as string[], rows: [] as NormalizedTxn[] };

  const header = values[0]!.map((h) => String(h ?? '').trim());
  const getIdx = (name: string) => headerIndex(header, name);

  const iDate = getIdx('Date');
  const iDesc = getIdx('Description');
  const iAmount = getIdx('Amount');
  const iType = getIdx('Type'); // "Income" | "Expense" typically in Tiller
  const iCategory = getIdx('Category');
  const iAccount = getIdx('Account');
  const iMember = getIdx('Member');
  const iLocation = getIdx('Location');

  const rows: NormalizedTxn[] = values.slice(1).map((r) => {
    const get = (i: number) => (i >= 0 ? String(r[i] ?? '').trim() : '');
    const amountRaw = iAmount >= 0 ? Number(String(r[iAmount] ?? '').replace(/,/g, '')) : NaN;
    const typeStr = get(iType);
    const type =
      typeStr.toLowerCase() === 'income'
        ? 'Income'
        : typeStr.toLowerCase() === 'expense'
        ? 'Expense'
        : (null as any);

    return {
      date: iDate >= 0 ? get(iDate) : null,
      description: iDesc >= 0 ? get(iDesc) : null,
      amount: Number.isFinite(amountRaw) ? amountRaw : null,
      type,
      category: iCategory >= 0 ? get(iCategory) : null,
      account: iAccount >= 0 ? get(iAccount) : null,
      member: iMember >= 0 ? get(iMember) : null,
      location: iLocation >= 0 ? get(iLocation) : null,
    };
  });

  return { header, rows };
}

async function upsertIntoSupabase(rows: NormalizedTxn[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey) {
    return {
      wrote: 0,
      previewOnly: true,
      message:
        'Supabase env not set; ran in preview mode (no DB writes). Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable writes.',
    };
  }

  // Lazy import to avoid requiring supabase-js if you don’t use it
  const { createClient } = await import('@supabase/supabase-js');

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  // Adjust the table/columns below to match your schema.
  // Minimal set many projects use: date, description, amount, type, category
  const { error, count } = await supabase
    .from('transactions')
    .insert(
      rows.map((r) => ({
        date: r.date,
        description: r.description,
        amount: r.amount,
        type: r.type, // 'Income' | 'Expense'
        category: r.category,
        // Optional extras — uncomment & map to your schema if needed:
        // account_name: r.account,
        // member_name: r.member,
        // location_name: r.location,
      })),
      { count: 'exact' }
    );

  if (error) {
    throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return { wrote: count ?? rows.length, previewOnly: false, message: 'Upsert complete.' };
}

export default async function sync(input: Input) {
  const spreadsheetId =
    input.spreadsheetId || process.env.TILLER_SHEET_ID || '';
  const range = input.range || process.env.TILLER_RANGE || 'Transactions!A:Z';

  if (!spreadsheetId) {
    return {
      ok: false,
      message:
        'No spreadsheetId provided. Supply it in the form, or set TILLER_SHEET_ID in env.',
    };
  }

  const vr = await getValues({ spreadsheetId, range });
  const { rows } = normalizeRows(vr.values);

  if (rows.length === 0) {
    return { ok: true, message: 'No rows found in the given range.', read: 0, wrote: 0 };
  }

  // Try writing to Supabase (or preview if not configured)
  const result = await upsertIntoSupabase(rows);

  return {
    ok: true,
    message: result.message,
    read: rows.length,
    wrote: result.wrote,
    previewOnly: result.previewOnly,
  };
}
