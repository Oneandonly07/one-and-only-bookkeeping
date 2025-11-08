// app/api/transactions.csv/route.ts
import { NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabaseServer'

function esc(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

export async function GET(req: Request) {
  const supabase = getServerClient()
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const q = (url.searchParams.get('q') || '').trim().toLowerCase()
  const kind = url.searchParams.get('kind')
  const accountId = url.searchParams.get('accountId')

  let { data: txns, error: e1 } = await supabase
    .from('transactions')
    .select('occurred_on, description, kind, amount, account_id')
    .order('occurred_on', { ascending: true })

  if (e1) return new NextResponse('Error', { status: 500 })

  let { data: accounts } = await supabase
    .from('accounts')
    .select('id, name')

  const nameById = new Map<string, string>()
  accounts?.forEach(a => nameById.set(String(a.id), a.name))

  let list = (txns ?? []).filter(t => {
    if (from && t.occurred_on < from) return false
    if (to && t.occurred_on >= to) return false
    if (kind && t.kind !== kind) return false
    if (accountId && String(t.account_id ?? '') !== accountId) return false
    if (q) {
      const hay = `${t.description ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const header = ['Date', 'Description', 'Kind', 'Amount', 'Account']
  const rows = list.map(t => [
    t.occurred_on,
    t.description ?? '',
    t.kind,
    String(t.amount ?? '0'),
    t.account_id ? (nameById.get(String(t.account_id)) ?? '—') : '—'
  ])

  const lines = [header, ...rows].map(r => r.map(x => esc(x)).join(',')).join('\n')
  return new NextResponse(lines, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="transactions.csv"',
    }
  })
}
