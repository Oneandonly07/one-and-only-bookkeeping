'use client';

import * as React from 'react';
import { updateTransactionAction } from './actions';

type Txn = {
  id: number;
  date: string | null;
  description: string | null;
  category: string | null;
  amount: number;
  // We will display whichever of these you have in your row data:
  account_id?: string | null;
  account_name?: string | null;
};

type Account = { id: string; name: string };

type Props = {
  txn: Txn;
  categories: string[];
  accounts: Account[];
  onSaved: () => void;
  onCancel: () => void;
};

export default function EditableRow({ txn, categories, accounts, onSaved, onCancel }: Props) {
  const [description, setDescription] = React.useState(txn.description ?? '');
  const [category, setCategory] = React.useState<string>(txn.category ?? '(Uncategorized)');

  // account select logic: either a known account id, or "Other"
  const currentName = (txn as any).account_name ?? null;
  const currentId = (txn as any).account_id ?? null;

  // If we already have a known id, choose it; else if we have text, set mode = Other
  const startModeOther = !!currentName && !currentId;
  const [accountMode, setAccountMode] = React.useState<'select' | 'other'>(startModeOther ? 'other' : 'select');
  const [accountId, setAccountId] = React.useState<string>(currentId ?? (accounts[0]?.id ?? ''));
  const [accountOther, setAccountOther] = React.useState<string>(currentName ?? '');

  // Category "Other" free text
  const [categoryMode, setCategoryMode] = React.useState<'select' | 'other'>(
    categories.includes(category) ? 'select' : (category ? 'other' : 'select')
  );
  const [categoryOther, setCategoryOther] = React.useState<string>(
    categories.includes(category) ? '' : (category ?? '')
  );

  const effectiveCategory = categoryMode === 'other'
    ? (categoryOther.trim() || '(Uncategorized)')
    : category;

  const effectiveAccountId = accountMode === 'select' ? accountId : null;
  const effectiveAccountOther = accountMode === 'other' ? accountOther.trim() : null;

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updateTransactionAction({
      id: txn.id,
      description: description.trim(),
      category: effectiveCategory === '(Uncategorized)' ? null : effectiveCategory,
      accountId: effectiveAccountId,
      accountOther: effectiveAccountOther,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error ?? 'Failed to save.');
      return;
    }
    onSaved();
  }

  return (
    <tr className="align-middle">
      <td className="whitespace-nowrap text-sm text-gray-600">
        {txn.date ?? ''}
      </td>

      {/* Description */}
      <td className="pr-2">
        <input
          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </td>

      {/* Account */}
      <td className="pr-2">
        <div className="flex gap-2">
          {accountMode === 'select' ? (
            <select
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
              <option value="__OTHER__">Other…</option>
            </select>
          ) : (
            <input
              className="w-48 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="Enter account name"
              value={accountOther}
              onChange={(e) => setAccountOther(e.target.value)}
            />
          )}

          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            onClick={() => {
              if (accountMode === 'select') {
                setAccountMode('other');
              } else {
                setAccountMode('select');
              }
            }}
          >
            {accountMode === 'select' ? 'Other' : 'Pick'}
          </button>
        </div>
      </td>

      {/* Category */}
      <td className="pr-2">
        <div className="flex gap-2">
          {categoryMode === 'select' ? (
            <select
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              value={category}
              onChange={(e) => {
                if (e.target.value === '__OTHER__') {
                  setCategoryMode('other');
                  setCategory('(Uncategorized)');
                } else {
                  setCategory(e.target.value);
                }
              }}
            >
              <option value="(Uncategorized)">(Uncategorized)</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__OTHER__">Other…</option>
            </select>
          ) : (
            <input
              className="w-48 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="Enter category"
              value={categoryOther}
              onChange={(e) => setCategoryOther(e.target.value)}
            />
          )}

          <button
            type="button"
            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            onClick={() => {
              setCategoryMode(categoryMode === 'select' ? 'other' : 'select');
            }}
          >
            {categoryMode === 'select' ? 'Other' : 'Pick'}
          </button>
        </div>
      </td>

      {/* Amount (read-only here) */}
      <td className={`text-right font-medium ${txn.amount < 0 ? 'text-red-600' : (txn.amount > 0 ? 'text-green-700' : 'text-gray-800')}`}>
        {txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>

      {/* Actions */}
      <td className="pl-2 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {error && <div className="pt-1 text-xs text-red-600">{error}</div>}
      </td>
    </tr>
  );
}
