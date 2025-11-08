// app/(app)/reports/monthly/page.tsx
import Image from 'next/image'
import PrintButton from './PrintButton'
import { getServerClient } from '@/lib/supabaseServer'

type Txn = { occurred_on: string; kind: 'income' | 'expense'; amount: number }

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function isoDay(d: Date) {
  return d.toISOString().slice(0, 10)
}
function usd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function ymLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  })
}

export default async function MonthlyReport({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const supabase = getServerClient()

  // Range selection via query params (?from=YYYY-MM-01&to=YYYY-MM-01)
  // Defaults: last 12 months [now-11, now]
  const today = new Date()
  const defaultFrom = startOfMonth(addMonths(today, -11))
  const defaultTo = addMonths(startOfMonth(today), 1) // exclusive

  const qpFrom = (typeof searchParams?.from === 'string' && searchParams?.from) || isoDay(defaultFrom)
  const qpTo = (typeof searchParams?.to === 'string' && searchParams?.to) || isoDay(defaultTo)

  const { data, error } = await supabase
    .from('transactions')
    .select('occurred_on, kind, amount')

  if (error) {
    return <p className="text-red-600">Error loading data: {error.message}</p>
  }

  const txns: Txn[] = (data ?? [])
    .filter((t: any) => t.occurred_on >= qpFrom && t.occurred_on < qpTo)
    .map((t: any) => ({
      occurred_on: t.occurred_on,
      kind: t.kind,
      amount: Number(t.amount || 0),
    }))

  // Group by YYYY-MM
  const months = new Map<string, { income: number; expense: number }>()
  for (const t of txns) {
    const ym = t.occurred_on.slice(0, 7)
    const bucket = months.get(ym) ?? { income: 0, expense: 0 }
    if (t.kind === 'income') bucket.income += t.amount
    else bucket.expense += t.amount
    months.set(ym, bucket)
  }

  // Ensure every month between from..to-1 exists (for chart continuity)
  const ordered: string[] = []
  {
    let cursor = new Date(qpFrom)
    const end = new Date(qpTo)
    while (cursor < end) {
      const ym = cursor.toISOString().slice(0, 7)
      if (!months.has(ym)) months.set(ym, { income: 0, expense: 0 })
      ordered.push(ym)
      cursor = addMonths(cursor, 1)
    }
  }

  const rows = ordered.map(ym => {
    const b = months.get(ym)!
    return {
      ym,
      income: b.income,
      expense: b.expense,
      net: b.income - b.expense,
    }
  })

  const totalIncome = rows.reduce((s, r) => s + r.income, 0)
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0)
  const totalNet = totalIncome - totalExpense

  const csvHref = (() => {
    const p = new URLSearchParams()
    p.set('from', qpFrom)
    p.set('to', qpTo)
    return `/api/reports/monthly.csv?${p.toString()}`
  })()

  return (
    <section className="space-y-6 print:space-y-4">
      {/* Inline print styles (kept local to this page) */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          header, .toolbar { border: none !important; box-shadow: none !important; }
          .page { padding: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Branded header */}
      <header className="rounded-xl border bg-white p-6 shadow-sm page">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* If you placed your JPEG at /public/clinic-logo.jpg */}
            <Image
              src="/clinic-logo.jpg"
              alt="Clinic logo"
              width={56}
              height={56}
              className="rounded-md object-contain"
              priority
            />
            <div>
              <h1 className="text-xl font-semibold">Monthly Income vs Expenses</h1>
              <div className="text-sm text-gray-500">
                {qpFrom} → {qpTo} (exclusive)
              </div>
            </div>
          </div>

          <div className="no-print flex gap-2">
            <a
              href={csvHref}
              className="inline-flex items-center rounded-md border px-3 h-9 hover:bg-gray-50"
            >
              Export CSV
            </a>
            <PrintButton />
          </div>
        </div>
      </header>

      {/* Toolbar: quick ranges */}
      <div className="toolbar rounded-xl border bg-white p-4 shadow-sm no-print">
        <QuickRanges from={qpFrom} to={qpTo} />
      </div>

      {/* Mini bar chart (net per month) */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="text-sm text-gray-600 mb-3">Net by month</div>
        <Bars rows={rows} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="py-2.5 px-3 text-left">Month</th>
              <th className="py-2.5 px-3 text-right">Income</th>
              <th className="py-2.5 px-3 text-right">Expenses</th>
              <th className="py-2.5 px-3 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.ym} className="border-t">
                <td className="py-2.5 px-3">{ymLabel(r.ym)}</td>
                <td className="py-2.5 px-3 text-right text-green-700 font-medium">{usd(r.income)}</td>
                <td className="py-2.5 px-3 text-right text-red-700 font-medium">{usd(r.expense)}</td>
                <td className={`py-2.5 px-3 text-right font-semibold ${r.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {usd(r.net)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="border-t">
              <td className="py-2.5 px-3 font-medium">Total</td>
              <td className="py-2.5 px-3 text-right text-green-700 font-semibold">{usd(totalIncome)}</td>
              <td className="py-2.5 px-3 text-right text-red-700 font-semibold">{usd(totalExpense)}</td>
              <td className={`py-2.5 px-3 text-right font-bold ${totalNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {usd(totalNet)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

/* ---------- helpers / subcomponents (all server-safe) ---------- */

function rangeLink(label: string, from: Date, to: Date) {
  const p = new URLSearchParams()
  p.set('from', from.toISOString().slice(0, 10))
  p.set('to', to.toISOString().slice(0, 10))
  return (
    <a
      key={label}
      href={`/reports/monthly?${p.toString()}`}
      className="inline-flex items-center rounded-md border px-3 h-9 hover:bg-gray-50"
    >
      {label}
    </a>
  )
}

function QuickRanges({ from, to }: { from: string; to: string }) {
  const now = new Date()
  const last12From = startOfMonth(addMonths(now, -11))
  const last12To = addMonths(startOfMonth(now), 1)

  const ytdFrom = new Date(now.getFullYear(), 0, 1)
  const ytdTo = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), 1)

  const lastYearFrom = new Date(now.getFullYear() - 1, 0, 1)
  const lastYearTo = new Date(now.getFullYear(), 0, 1)

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="text-xs text-gray-500 mr-2">Quick ranges:</div>
      {rangeLink('Last 12 months', last12From, last12To)}
      {rangeLink('YTD', ytdFrom, ytdTo)}
      {rangeLink('Last year', lastYearFrom, lastYearTo)}
      <div className="ml-auto text-xs text-gray-500">
        Current: <span className="font-medium">{from}</span> → <span className="font-medium">{to}</span>
      </div>
    </div>
  )
}

function Bars({ rows }: { rows: { ym: string; net: number }[] }) {
  const values = rows.map(r => r.net)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const span = Math.max(1, max - min)

  return (
    <div className="grid grid-cols-12 gap-2">
      {rows.map((r, i) => {
        const h = Math.round(Math.abs(r.net) / span * 72) + 4 // min visible
        const positive = r.net >= 0
        return (
          <div key={r.ym} className="flex flex-col items-center">
            <div
              className={`w-5 rounded ${positive ? 'bg-green-600' : 'bg-red-600'}`}
              style={{ height: `${h}px` }}
              title={`${ymLabel(r.ym)} • Net ${r.net >= 0 ? '+' : ''}${r.net.toLocaleString()}`}
            />
            <div className="text-[10px] text-gray-500 mt-1">{ymLabel(r.ym)}</div>
          </div>
        )
      })}
    </div>
  )
}
