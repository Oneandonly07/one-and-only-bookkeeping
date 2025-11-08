// app/components/QuickAddTransaction.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type Account = { id: string | number; name: string }

export default function QuickAddTransaction({ accounts }: { accounts: Account[] }) {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<'income'|'expense'>('expense')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [accountId, setAccountId] = useState<string>('')
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function save() {
    setStatus('')
    // basic validation
    const amt = Number(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      setStatus('Enter a valid positive amount.')
      return
    }
    if (!date) {
      setStatus('Choose a date.')
      return
    }
    if (!description.trim()) {
      setStatus('Description is required.')
      return
    }

    // insert
    const { error } = await supabase.from('transactions').insert({
      kind,
      amount: amt,
      description: description.trim(),
      occurred_on: date,
      account_id: accountId ? Number(accountId) : null,
    })
    if (error) {
      setStatus(error.message)
      return
    }

    // reset and refresh dashboard
    setOpen(false)
    setAmount('')
    setDescription('')
    setAccountId('')
    setKind('expense')
    setDate(new Date().toISOString().slice(0,10))
    router.refresh()
  }

  return (
    <>
      {/* Floating Add Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-40 rounded-full h-12 w-12 shadow-lg bg-black text-white text-2xl leading-none flex items-center justify-center hover:bg-black/90"
        title="Quick add transaction"
        aria-label="Quick add transaction"
      >
        +
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* dialog */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border overflow-hidden">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add Transaction</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Kind */}
                <div>
                  <span className="block text-xs text-gray-500 mb-1">Type</span>
                  <div className="inline-flex rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setKind('expense')}
                      className={`px-3 py-1.5 text-sm rounded-md ${kind==='expense' ? 'bg-white shadow font-medium' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setKind('income')}
                      className={`ml-1 px-3 py-1.5 text-sm rounded-md ${kind==='income' ? 'bg-white shadow font-medium' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      Income
                    </button>
                  </div>
                </div>

                {/* Amount + Date */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="block text-xs text-gray-500 mb-1">Amount (positive)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="0.00"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-xs text-gray-500 mb-1">Date</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </label>
                </div>

                {/* Account */}
                <label className="block">
                  <span className="block text-xs text-gray-500 mb-1">Account</span>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">— None / Unassigned —</option>
                    {accounts.map(a => (
                      <option key={String(a.id)} value={String(a.id)}>{a.name}</option>
                    ))}
                  </select>
                </label>

                {/* Description */}
                <label className="block">
                  <span className="block text-xs text-gray-500 mb-1">Description</span>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., Office rent, Cash sale, etc."
                  />
                </label>

                {status && (
                  <div className="text-sm text-red-600">{status}</div>
                )}
              </div>

              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <button
                  className="px-3 py-2 rounded-md border hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded-md bg-black text-white hover:bg-black/90"
                  onClick={save}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
