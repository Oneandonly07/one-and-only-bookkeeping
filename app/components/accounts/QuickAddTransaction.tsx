'use client';

import * as React from 'react';
import SubmitButton from '../form/SubmitButton';

/**
 * Minimal client-only quick add.
 * Posts to /api/transactions (adjust if you use a different route).
 * Keeps all interactivity on the client; no server handlers passed down.
 */
export default function QuickAddTransaction() {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-3 font-medium">Quick Add</h2>

      {/* IMPORTANT: only ONE "action" attribute (was the TSX error before). */}
      <form method="post" action="/api/transactions" className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-5">
          <select
            name="type"
            className="rounded-md border border-gray-300 px-3 py-2"
            defaultValue="expense"
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>

          <input
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="Amount"
            className="rounded-md border border-gray-300 px-3 py-2"
          />

          <input
            name="date"
            type="date"
            required
            className="rounded-md border border-gray-300 px-3 py-2"
          />

          <input
            name="category"
            placeholder="Category"
            className="rounded-md border border-gray-300 px-3 py-2"
          />

          <input
            name="description"
            placeholder="Description"
            className="rounded-md border border-gray-300 px-3 py-2 sm:col-span-2"
          />
        </div>

        <SubmitButton className="bg-emerald-600 text-white hover:opacity-90">
          Add
        </SubmitButton>
      </form>
    </div>
  );
}
