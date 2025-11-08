// app/(app)/dashboard/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import DashboardClient from '@/app/components/DashboardClient';
import ExpensesDonut from '@/app/components/ExpensesDonut';
import ProfitLossCard from '@/app/components/ProfitLossCard';

type Tx = { date: string; amount: number; category: string | null };
type MonthlyRow = { label: string; ym: string; income: number; expense: number; net: number };
type Slice = { name: string; value: number };

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(d: Date) {
  return d.toLocaleString('en-US', { month: 'short' });
}
function prettyYm(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );

  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);

  const { data: tx } = await supabase
    .from('transactions')
    .select('date, amount, category')
    .gte('date', start.toISOString().slice(0, 10))
    .lte('date', end.toISOString().slice(0, 10));

  const rows: Tx[] = (tx ?? []).map((t) => ({
    date: String(t.date),
    amount: Number(t.amount ?? 0),
    category: (t.category ?? '') as string,
  }));

  const monthBuckets = new Map<string, { label: string; income: number; expense: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    monthBuckets.set(ymKey(d), { label: monthLabel(d), income: 0, expense: 0 });
  }

  rows.forEach((r) => {
    const d = new Date(r.date);
    const k = ymKey(d);
    const b = monthBuckets.get(k);
    if (!b) return;
    if (r.amount >= 0) b.income += r.amount;
    else b.expense += Math.abs(r.amount);
  });

  const monthly: MonthlyRow[] = Array.from(monthBuckets.entries()).map(([ym, b]) => ({
    ym,
    label: b.label,
    income: Math.round(b.income),
    expense: Math.round(b.expense),
    net: Math.round(b.income - b.expense),
  }));

  const totalIncome = monthly.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const net = totalIncome - totalExpense;

  const nonEmpty = monthly.filter((m) => m.income > 0 || m.expense > 0);
  const activeMonth = nonEmpty.length ? nonEmpty[nonEmpty.length - 1] : monthly[monthly.length - 1];
  const activeYm = activeMonth?.ym;

  const catMap = new Map<string, number>();
  rows.forEach((r) => {
    if (!activeYm) return;
    const d = new Date(r.date);
    if (ymKey(d) !== activeYm) return;
    if (r.amount < 0) {
      const key = (r.category && r.category.trim()) || 'Uncategorized';
      catMap.set(key, (catMap.get(key) ?? 0) + Math.abs(r.amount));
    }
  });

  const sorted = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const otherTotal = rest.reduce((s, [, v]) => s + v, 0);
  const donutData: Slice[] = [
    ...top.map(([name, value]) => ({ name, value: Math.round(value) })),
    ...(otherTotal > 0 ? [{ name: 'Other', value: Math.round(otherTotal) }] : []),
  ];

  const plIncome = activeMonth?.income ?? 0;
  const plExpenses = activeMonth?.expense ?? 0;
  const plLabel = `Month: ${activeYm ? prettyYm(activeYm) : ''}`;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* KPI cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border p-5 bg-white">
          <div className="text-sm text-gray-500 font-medium">Income</div>
          <div className="mt-1 text-3xl font-semibold text-blue-600">
            {totalIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>

        <div className="rounded-2xl border p-5 bg-white">
          <div className="text-sm text-gray-500 font-medium">Expenses</div>
          <div className="mt-1 text-3xl font-semibold text-red-600">
            {totalExpense.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>

        <div className="rounded-2xl border p-5 bg-white">
          <div className="text-sm text-gray-500 font-medium">Net</div>
          <div className="mt-1 text-3xl font-semibold text-green-600">
            {net.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </div>
      </section>

      <DashboardClient monthly={monthly} />

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <ExpensesDonut data={donutData} />
        <ProfitLossCard monthLabel={plLabel} income={plIncome} expenses={plExpenses} />
      </section>
    </main>
  );
}
