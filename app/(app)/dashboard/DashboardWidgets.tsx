"use client";

import {
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type CashflowPoint = { month: string; income: number; expense: number; net: number };
type NetPoint = { month: string; net: number };
type PieSlice = { name: string; value: number };

export default function DashboardWidgets({
  cashflow,
  netTrend,
  expensePie,
}: {
  cashflow: CashflowPoint[];
  netTrend: NetPoint[];
  expensePie: PieSlice[];
}) {
  const pieColors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#94a3b8",
  ];

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">

      {/* Cash Flow Chart */}
      <div className="lg:col-span-7 rounded-xl border bg-white p-4">
        <h3 className="mb-2 text-sm text-gray-500">Cash Flow (last 6 months)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b98133" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef444433" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Net Trend */}
      <div className="lg:col-span-5 rounded-xl border bg-white p-4">
        <h3 className="mb-2 text-sm text-gray-500">Net by Month</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Pie */}
      <div className="lg:col-span-5 rounded-xl border bg-white p-4">
        <h3 className="mb-2 text-sm text-gray-500">Expense Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={expensePie}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
              >
                {expensePie.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tip */}
      <div className="lg:col-span-7 rounded-xl border bg-white p-4 text-sm text-gray-600">
        Bank feed connection coming soon — your dashboard will auto-update daily.
      </div>
    </div>
  );
}
