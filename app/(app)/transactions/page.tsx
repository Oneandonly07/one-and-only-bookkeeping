import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import TransactionsTableClient from "@/app/components/TransactionsTableClient";

export const dynamic = "force-dynamic";

type Txn = {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  category: string | null;
  account_id: string | null;
  account_name: string | null;
};

type Account = { id: string; name: string };

function supabaseCookieShim() {
  const store = cookies();
  return {
    get: (n: string) => store.get(n)?.value,
    set: () => {},
    remove: () => {},
  };
}

export default async function TransactionsPage() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: supabaseCookieShim() }
  );

  // These can return `null` from Supabase typings
  const { data: txnsRaw } = await supabase
    .from("transactions")
    .select("id,date,description,amount,category,account_id,account_name")
    .order("date", { ascending: false });

  const { data: accountsRaw } = await supabase
    .from("accounts")
    .select("id,name")
    .order("name", { ascending: true });

  // Normalize to arrays for the client
  const txns: Txn[] = (txnsRaw ?? []) as Txn[];
  const accounts: Account[] = (accountsRaw ?? []) as Account[];
  const categories = ["Dining", "Income", "Rent", "Transfers", "Utilities"];

  async function onUpdate(formData: FormData) {
    "use server";
    const s = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: supabaseCookieShim() }
    );
    const id = String(formData.get("id") ?? "");
    const description = (formData.get("description") as string) ?? "";
    const account_id = (formData.get("account_id") as string) || null;
    const account_name = (formData.get("account_name") as string) || null;
    const category = (formData.get("category") as string) || null;

    const { error } = await s
      .from("transactions")
      .update({ description, account_id, account_name, category })
      .eq("id", id);

    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  }

  async function onDelete(formData: FormData) {
    "use server";
    const s = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: supabaseCookieShim() }
    );
    const id = String(formData.get("id") ?? "");
    const { error } = await s.from("transactions").delete().eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Link
          href="/transactions/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700"
        >
          Add Transaction
        </Link>
      </div>

      <TransactionsTableClient
        txns={txns}
        accounts={accounts}
        categories={categories}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </main>
  );
}
