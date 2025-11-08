// app/components/DashboardClient.tsx
'use client';

import DashboardCharts from './DashboardCharts';

type MonthlyRow = { label: string; income: number; expense: number; net: number };

export default function DashboardClient({ monthly }: { monthly: MonthlyRow[] }) {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <DashboardCharts monthly={monthly} variant="ie" />
      <DashboardCharts monthly={monthly} variant="net" />
    </section>
  );
}
