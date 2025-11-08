'use client';

import * as React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Slice = { name: string; value: number };

type Props = {
  data: Slice[]; // expenses breakdown for the active month
};

const REDS = [
  '#ef4444', // red-500
  '#f87171', // red-400
  '#dc2626', // red-600
  '#fb7185', // rose-400
  '#b91c1c', // red-700
  '#fca5a5', // red-300
];

export default function ExpensesDonut({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <span className="text-xs text-gray-500">
          {total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="col-span-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                strokeWidth={1}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={REDS[i % REDS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any) =>
                  (Number(val) || 0).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-2 space-y-2">
          {data.length === 0 ? (
            <div className="text-sm text-gray-500">No expenses for this month.</div>
          ) : (
            data.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: REDS[i % REDS.length] }}
                  />
                  <span className="text-gray-700">{s.name}</span>
                </div>
                <span className="font-medium">
                  {s.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
