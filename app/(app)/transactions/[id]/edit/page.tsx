// Server Component — Edit Transaction
// Uses read-only cookies in server component and posts to updateTransactionAction.
// NOTE: We cast the action to `any` so it satisfies Next's form action typing.

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notFound } from "next/navigation";
import { updateTransactionAction } from "../../actions";

type Txn = {
  id: string;
  account_id: string;
  type: "income" | "expense";
  amount: number;
  category: string | null;
  description: string | null;
  date: string;        // YYYY-MM-DD or ISO
  created_at: string;
};

type Account = { id: string; name: string | null };

function getUserClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON KEY.");

  // READ-ONLY cookie bridge for server components
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

async function getTxnAndAccounts(id: string): Promise<{ txn: Txn; accounts: Account[] }> {
  const supabase = getUserClient();

  // Ensure user session (RLS scope)
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(`Not authenticated: ${authErr.message}`);
  if (!authData.user) throw new Error("No active session. Please sign in.");

  // Load the transaction (RLS allows only your rows)
  const { data: txn, error: txnErr } = await supabase
    .from("transactions")
    .select("id, account_id, type, amount, category, description, date, created_at")
    .eq("id", id)
    .single();

  if (txnErr) throw new Error(`Load transaction failed: ${txnErr.message}`);
  if (!txn) notFound();

  // Load user's accounts for display
  const { data: accts, error: acctErr } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name", { ascending: true });

  if (acctErr) throw new Error(`Load accounts failed: ${acctErr.message}`);

  return { txn: txn as Txn, accounts: (accts ?? []) as Account[] };
}

function ymd(dateStr: string) {
  // Accepts "YYYY-MM-DD" or ISO → returns "YYYY-MM-DD"
  if (!dateStr) return "";
  if (dateStr.length <= 10) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function EditTransactionPage({
  params,
}: {
  params: { id: string };
}) {
  const { txn, accounts } = await getTxnAndAccounts(params.id);
  const account = accounts.find((a) => a.id === txn.account_id);

  return (
    <main className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Transaction</h1>
            <p className="text-sm text-gray-500">ID: {txn.id}</p>
          </div>
          <a
            href="/transactions"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            Back to Transactions
          </a>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {/* Cast to any so Next's <form action> typing (void | Promise<void>) accepts our action */}
          <form action={updateTransactionAction.bind(null, txn.id) as any} className="space-y-5">
            {/* Account (read-only for now) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Account</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 p-2"
                value={account?.name ?? txn.account_id}
                readOnly
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                required
                defaultValue={txn.type}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                defaultValue={String(txn.amount ?? 0)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="category"
                defaultValue={txn.category ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                defaultValue={txn.description ?? ""}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                required
                defaultValue={ymd(txn.date)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
              >
                Save Changes
              </button>
              <a href="/transactions" className="text-sm text-gray-600 hover:underline">
                Cancel
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
