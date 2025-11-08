'use server';

import { redirect } from 'next/navigation';
import { getServerClient } from '../../../lib/supabaseServer';

// ---------- Types (locked to 6 choices) ----------
export type AccountType =
  | 'Checking'
  | 'Savings'
  | 'Amex Credit'
  | 'Visa Credit'
  | 'Master Credit'
  | 'Cash';

export type AccountRecord = {
  id: string;
  name: string;
  type: AccountType;
  institution: string | null;
  account_number: string | null;
  opening_balance: number | null;
  opening_date: string | null;
  notes: string | null;
  team_id: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

async function supabase() {
  return getServerClient();
}

export async function listAccounts(): Promise<AccountRecord[]> {
  const sb = await supabase();
  const { data, error } = await sb
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Load accounts failed: ${error.message}`);
  return (data ?? []) as AccountRecord[];
}

export async function getAccountById(id: string) {
  const sb = await supabase();
  const { data, error } = await sb
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single<AccountRecord>();

  if (error) throw new Error(`Load account failed: ${error.message}`);
  return data;
}

export async function upsertAccount(formData: FormData) {
  // ⚠️ Do NOT wrap redirect() in a catch-all; let NEXT_REDIRECT bubble
  const sb = await supabase();

  const id = (formData.get('id') || '') as string;
  const name = (formData.get('name') || '').toString().trim();

  const typeRaw = (formData.get('type') || 'Checking').toString().trim();
  const allowed: AccountType[] = [
    'Checking',
    'Savings',
    'Amex Credit',
    'Visa Credit',
    'Master Credit',
    'Cash',
  ];
  const type = (allowed.includes(typeRaw as AccountType) ? typeRaw : 'Checking') as AccountType;

  const institution = (formData.get('institution') || '')?.toString().trim() || null;
  const account_number = (formData.get('accountNumber') || '')?.toString().trim() || null;

  const openingBalanceRaw = (formData.get('openingBalance') || '')?.toString();
  const opening_balance =
    openingBalanceRaw && openingBalanceRaw !== '' ? Number(openingBalanceRaw) : null;

  const opening_date = (formData.get('openingDate') || '')?.toString() || null;
  const notes = (formData.get('notes') || '')?.toString().trim() || null;

  if (!name) throw new Error('Name is required');

  if (id) {
    const { error } = await sb
      .from('accounts')
      .update({
        name,
        type,
        institution,
        account_number,
        opening_balance,
        opening_date,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from('accounts').insert({
      name,
      type,
      institution,
      account_number,
      opening_balance,
      opening_date,
      notes,
    });

    if (error) throw new Error(error.message);
  }

  // Let this thrown redirect propagate (do NOT catch it)
  redirect('/accounts');
}

export async function deleteAccount(id: string) {
  const sb = await supabase();
  const { error } = await sb.from('accounts').delete().eq('id', id);
  if (error) throw new Error(`Delete account failed: ${error.message}`);
}

export async function deleteAccountAction(formData: FormData) {
  const id = (formData.get('id') || '').toString();
  if (!id) throw new Error('Missing account id');
  await deleteAccount(id);
  redirect('/accounts');
}
