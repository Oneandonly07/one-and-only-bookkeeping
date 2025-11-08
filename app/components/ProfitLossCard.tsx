'use client';

type Props = {
  monthLabel: string; // e.g., "Month: 2025-10"
  income: number;
  expenses: number;
};

export default function ProfitLossCard({ monthLabel, income, expenses }: Props) {
  const max = Math.max(income, expenses, 1);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">PROFIT AND LOSS</h3>
        <span className="text-xs text-gray-500">{monthLabel}</span>
      </div>

      {/* Income (blue) */}
      <div className="mb-2 text-sm text-gray-700">Income</div>
      <div className="h-3 w-full rounded-full bg-gray-100">
        <div
          className="h-3 rounded-full bg-blue-600"
          style={{ width: `${Math.min(100, (income / max) * 100)}%` }}
          title={`Income: ${income.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {`${Math.round((income / max) * 100)}% of max (${income.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })})`}
      </div>

      {/* Expenses (red) */}
      <div className="mt-4 mb-2 text-sm text-gray-700">Expenses</div>
      <div className="h-3 w-full rounded-full bg-gray-100">
        <div
          className="h-3 rounded-full bg-red-600"
          style={{ width: `${Math.min(100, (expenses / max) * 100)}%` }}
          title={`Expenses: ${expenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {`${Math.round((expenses / max) * 100)}% of max (${expenses.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })})`}
      </div>
    </div>
  );
}
