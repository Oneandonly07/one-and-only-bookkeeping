// app/components/DashboardCharts.tsx
'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

type MonthlyRow = { label: string; income: number; expense: number; net: number };

export default function DashboardCharts({
  monthly,
  variant = 'ie',
}: {
  monthly: MonthlyRow[];
  variant?: 'ie' | 'net';
}) {
  const rows = (monthly ?? []).map((m) => ({
    label: m.label,
    income: Number(m.income || 0),
    expense: Number(m.expense || 0),
    net: Number(m.net || 0),
  }));

  const title = variant === 'net' ? 'Net by Month' : 'Cash Flow (last 6 months)';

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="font-semibold text-gray-700 mb-2">{title}</div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            {variant === 'ie' ? (
              <>
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#2563eb" // blue-600
                  dot={{ r: 3 }}
                  name="income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#dc2626" // red-600
                  dot={{ r: 3 }}
                  name="expense"
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="net"
                stroke="#16a34a" // green-600
                dot={{ r: 3 }}
                name="net"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {variant === 'ie' ? (
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-red-600" /> expense
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-600" /> income
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-green-600" /> net
          </span>
        )}
      </div>
    </div>
  );
}
