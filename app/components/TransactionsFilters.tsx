// app/components/TransactionsFilters.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Filters } from "./TransactionsTableClient";

type Account = { id: string | number; name: string };

type Props = {
  accounts?: Account[];
  initial?: Filters;
  onChange?: (f: Filters) => void;
};

export default function TransactionsFilters({ accounts = [], initial, onChange }: Props) {
  const [q, setQ] = useState(initial?.q ?? "");
  const [kind, setKind] = useState<Filters["kind"]>(initial?.kind ?? "all");
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initial?.dateTo ?? "");
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");

  const snapshot: Filters = useMemo(
    () => ({ q, kind, dateFrom, dateTo, accountId }),
    [q, kind, dateFrom, dateTo, accountId]
  );

  useEffect(() => {
    onChange?.(snapshot);
  }, [snapshot, onChange]);

  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-sm">
        <span className="text-gray-600">Search</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Description…"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-gray-600">Type</span>
        <select
          value={kind ?? "all"}
          onChange={(e) => setKind(e.target.value as Filters["kind"])}
          className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-gray-600">Account</span>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-lg border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All accounts</option>
          {(accounts ?? []).map((a) => (
            <option key={String(a.id)} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-gray-600">From</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span className="text-gray-600">To</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </label>
    </form>
  );
}
