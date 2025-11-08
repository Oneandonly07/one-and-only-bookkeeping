'use client';

import * as React from 'react';

export default function TransactionsFilters() {
  const [type, setType] = React.useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [search, setSearch] = React.useState('');
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');

  // In a full implementation, you'd sync these to the URL (Router) and fetch via useEffect/SWR.
  // We keep this as a controlled, client-only UI so no server handlers are passed.

  return (
    <div className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-5">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as any)}
        className="rounded-md border border-gray-300 px-3 py-2"
      >
        <option value="all">All</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        <option value="transfer">Transfer</option>
      </select>

      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2"
        placeholder="From"
      />
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2"
        placeholder="To"
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
        placeholder="Search description…"
      />
    </div>
  );
}
