// app/(app)/transactions/NewTxnForm.tsx
"use client";

import * as React from "react";

type Option = { id: string | number; name: string };

type Props = {
  accounts: Option[];
  members: Option[];
  locations: Option[];
};

export default function NewTxnForm({ accounts, members, locations }: Props) {
  // You can wire this to your existing server action if you already have one.
  // For now this just POSTs the form (action attribute) or you hook to an onSubmit handler.
  return (
    <form className="space-y-6" method="post">
      {/* Row 1: Date / Description / Amount / Type / Category */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="Rent, Spectrum, Exam Income…"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="amount">
            Amount
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            required
            className="w-full rounded-md border px-3 py-2"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="type">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="w-full rounded-md border px-3 py-2"
            defaultValue="expense"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" htmlFor="category">
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            placeholder="Utilities, Rent, Food…"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      {/* Row 2: Account / Member / Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="account_id">
            Account
          </label>
          <select
            id="account_id"
            name="account_id"
            className="w-full rounded-md border px-3 py-2"
            defaultValue=""
            required
          >
            <option value="" disabled>
              {accounts.length ? "Select account" : "No accounts found"}
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="member_id">
            Member
          </label>
          <select
            id="member_id"
            name="member_id"
            className="w-full rounded-md border px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              {members.length ? "Select member" : "No members found"}
            </option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="location_id">
            Location
          </label>
          <select
            id="location_id"
            name="location_id"
            className="w-full rounded-md border px-3 py-2"
            defaultValue=""
          >
            <option value="" disabled>
              {locations.length ? "Select location" : "No locations found"}
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="rounded-md bg-black text-white px-4 py-2 hover:opacity-90"
        >
          Save
        </button>
      </div>
    </form>
  );
}
