// app/(app)/reports/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import ReportsClient from "../../components/ReportsClient";

type Txn = {
  date: string | null;
  amount: number | null;
  category: string | null;
  description: string | null;
};

type MonthlyRow = {
  monthKey: string; // "2025-10"
  label: string;    // "Oct 2025"
  income: number;
  expense: number;
  net: number;
};

function monthKeyOf(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}
function monthLabelOf(d: Date) {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function last12Months(): { monthKey: string; label: string; start: Date; end: Date }[] {
  const list: { monthKey: string; label: string; start: Date; end: Date }[] = [];
  const today = new Date();
  const base = startOfMonth(today);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    list.push({
      monthKey: monthKeyOf(d),
      label: monthLabelOf(d),
      start: startOfMonth(d),
      end: endOfMonth(d),
    });
  }
  return list;
}

function parseDateLoose(v: string | null): Date | null {
  if (!v) return null;
  const try1 = new Date(v);
  if (!isNaN(+try1)) return try1;
  // try mm/dd/yyyy or yyyy-mm-dd
  const parts = v.split(/[/-]/);
  if (parts.length >= 3) {
    const nums = parts.map((p) => parseInt(p, 10));
    const [a, b, c] = nums;
    const guess =
      v.includes("/") || (a <= 12 && b <= 31)
        ? new Date(c, a - 1, b)
        : new Date(a, b - 1, c);
    if (!isNaN(+guess)) return guess;
  }
  return null;
}

export default async function ReportsPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from("transactions")
    .select("date, amount, category, description");

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-3">Reports</h1>
        <p className="text-red-600">Failed to load transactions: {error.message}</p>
      </div>
    );
  }

  const months = last12Months();
  const indexByKey = new Map(months.map((m, i) => [m.monthKey, i]));
  const rows: MonthlyRow[] = months.map((m) => ({
    monthKey: m.monthKey,
    label: m.label,
    income: 0,
    expense: 0,
    net: 0,
  }));

  // also collect raw txns to enable detail modal
  const txns: Txn[] = (data as Txn[]).filter((t) => t.date && t.amount != null);

  for (const t of txns) {
    const d = parseDateLoose(t.date);
    if (!d || isNaN(+d)) continue;

    // keep only last 12 months window
    const first = months[0].start;
    const last = months[months.length - 1].end;
    if (d < first || d > last) continue;

    const key = monthKeyOf(d);
    const idx = indexByKey.get(key);
    if (idx == null) continue;

    const amt = Number(t.amount) || 0;
    if (amt >= 0) rows[idx].income += amt;
    else rows[idx].expense += Math.abs(amt);
  }

  rows.forEach((r) => (r.net = r.income - r.expense));

  // Pass monthly rows and raw txns to the client
  return <ReportsClient monthly={rows} txns={txns} />;
}
