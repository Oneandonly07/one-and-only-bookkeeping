// app/(app)/dashboard/LineChartIE.tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export type Txn = {
  id: string;
  type: "income" | "expense";
  amount: number;      // expenses are NEGATIVE
  date: string;        // yyyy-mm-dd
  category: string | null;
  description: string | null;
};

function buildSeries(transactions: Txn[]) {
  const byMonth = new Map<string, number>();
  for (const t of transactions) {
    const ym = t.date.slice(0, 7); // yyyy-mm
    byMonth.set(ym, (byMonth.get(ym) ?? 0) + t.amount);
  }
  const months = Array.from(byMonth.keys()).sort();
  let running = 0;
  return months.map((ym) => {
    running += byMonth.get(ym) ?? 0;
    return { month: `${ym.slice(5, 7)}/${ym.slice(2, 4)}`, net: Number(running.toFixed(2)) };
  });
}

export default function LineChartIE({ transactions }: { transactions: Txn[] }) {
  const data = buildSeries(transactions);
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="net" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
