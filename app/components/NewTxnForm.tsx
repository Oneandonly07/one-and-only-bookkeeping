import { createTransaction } from '@/app/(app)/transactions/actions';

type Account = { id: string; name: string };

export default function NewTxnForm({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: string[];
}) {
  return (
    <form
      action={createTransaction}
      className="max-w-xl space-y-6 rounded-md border border-gray-200 bg-white p-6"
    >
      {/* Date */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          name="date"
          required
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          step="0.01"
          name="amount"
          defaultValue="0.00"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          name="description"
          placeholder="What is this?"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Account (select + Other) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Account</label>
        <select
          name="account_choice"
          className="w-full rounded border border-gray-300 px-3 py-2"
          defaultValue=""
        >
          <option value="">— Select account —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          <option value="__OTHER__">Other (type manually)</option>
        </select>
        <input
          type="text"
          name="account_other"
          placeholder="If Other, type account name"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
        <p className="text-xs text-gray-500">
          If you choose “Other”, the typed value is preserved in the description tag so
          your FK stays valid.
        </p>
      </div>

      {/* Category (select + Other) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          name="category_choice"
          className="w-full rounded border border-gray-300 px-3 py-2"
          defaultValue=""
        >
          <option value="">— Select category —</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="__OTHER__">Other (type manually)</option>
        </select>
        <input
          type="text"
          name="category_other"
          placeholder="If Other, type category"
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          Save
        </button>
        <a
          href="/transactions"
          className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
