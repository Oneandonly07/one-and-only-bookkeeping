// app/components/TransactionsTable.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Filters } from './TransactionsFilters'

type Row = {
  id: string | number
  occurred_on: string
  description: string | null
  kind: 'income' | 'expense'
  amount_num: number
  account_name: string
}

export default function TransactionsTable({ filters }: { filters: Filters }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.kind) params.set('kind', filters.kind)
    if (filters.accountId) params.set('accountId', filters.accountId)
    if (filters.q) params.set('q', filters.q)

    setLoading(true)
    fetch(`/api/transactions?${params.toString()}`)
      .then(r => r.json())
      .then(d => setRows(d.rows ?? []))
      .finally(() => setLoading(false))
  }, [filters])

  const { totalIncome, totalExpense } = useMemo(() => {
    let ti = 0, te = 0
    rows.forEach(r => {
      if (r.kind === 'income') ti += r.amount_num
      else te += r.amount_num
    })
    return { totalIncome: ti, totalExpense: te }
  }, [rows])

  let running = 0

  return (
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b text-sm text-gray-600 flex justify-between">
        <div>{loading ? 'Loading…' : `${rows.length} transactions`}</div>
        <div className="flex gap-4">
          <div>Income: <span className="font-medium text-green-600">{usd(totalIncome)}</span></div>
          <div>Expenses: <span className="font-medium text-red-600">{usd(totalExpense)}</span></div>
          <div>Net: <span className={`font-semibold ${totalIncome-totalExpense>=0?'text-green-700':'text-red-700'}`}>
            {usd(totalIncome - totalExpense)}
          </span></div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="py-2.5 px-3 text-left">Date</th>
            <th className="py-2.5 px-3 text-left">Description</th>
            <th className="py-2.5 px-3 text-left">Account</th>
            <th className="py-2.5 px-3 text-right">Amount</th>
            <th className="py-2.5 px-3 text-right">Running</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((r, idx) => {
            running += (r.kind === 'income' ? r.amount_num : -r.amount_num)
            return (
              <tr key={String(r.id)} className="border-t">
                <td className="py-2.5 px-3">{fmtDate(r.occurred_on)}</td>
                <td className="py-2.5 px-3">{r.description ?? '—'}</td>
                <td className="py-2.5 px-3">{r.account_name}</td>
                <td className={`py-2.5 px-3 text-right font-medium ${r.kind==='income'?'text-green-700':'text-red-700'}`}>
                  {r.kind === 'income' ? `+${usd(r.amount_num)}` : `-${usd(r.amount_num)}`}
                </td>
                <td className="py-2.5 px-3 text-right">{usd(running)}</td>
              </tr>
            )
          }) : (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-500">No transactions</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function usd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
function fmtDate(yyyymmdd: string) {
  const [y, m, d] = yyyymmdd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString()
}
