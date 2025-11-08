'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

// Lazy-load the editor row (already a client component)
const EditableRow = dynamic(() => import('./EditableRow'), { ssr: false });

export type Txn = {
  id: number;
  date: string | null;
  description: string | null;
  category: string | null;
  amount: number;
  account_id?: string | null;
  account_name?: string | null;
};

export type Account = { id: string; name: string };

function ViewRow({
  txn,
  onEdit,
}: {
  txn: Txn;
  onEdit: () => void;
}) {
  const accountDisplay = txn.account_name ?? '';

  return (
    <tr className="align-middle">
      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-600">
        {txn.date ?? ''}
      </td>
      <td className="px-2 py-2">{txn.description ?? ''}</td>
      <td className="px-2 py-2">{accountDisplay}</td>
      <td className="px-2 py-2">{txn.category ?? '(Uncategorized)'}</td>
      <td
        className={`px-4 py-2 text-right font-medium ${
          txn.amount < 0
            ? 'text-red-600'
            : txn.amount > 0
            ? 'text-green-700'
            : 'text-gray-800'
        }`}
      >
        {txn.amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </td>
      <td className="px-4 py-2 text-right">
        <button
          type="button"
          onClick={onEdit}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Edit
        </button>
      </td>
    </tr>
  );
}

export default function ClientRow({
  txn,
  accounts,
  categories,
}: {
  txn: Txn;
  accounts: Account[];
  categories: string[];
}) {
  const [mode, setMode] = React.useState<'view' | 'edit'>('view');
  const [version, setVersion] = React.useState(0);

  if (mode === 'edit') {
    return (
      <EditableRow
        key={`${txn.id}-edit-${version}`}
        txn={txn}
        accounts={accounts}
        categories={categories}
        onSaved={() => {
          setMode('view');
          setVersion((v) => v + 1);
        }}
        onCancel={() => setMode('view')}
      />
    );
  }

  return (
    <ViewRow
      key={`${txn.id}-view-${version}`}
      txn={txn}
      onEdit={() => setMode('edit')}
    />
  );
}
