// app/(app)/transactions/import/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { importTillerCsvAction } from "./actions";

type Account = { id: string; name: string | null };

function createUserClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

async function getAccounts(): Promise<Account[]> {
  const supabase = createUserClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(authErr.message);
  if (!auth.user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Account[];
}

// Server action wrapper that returns void and redirects with counts
async function onImport(fd: FormData) {
  "use server";
  const res = await importTillerCsvAction(fd);
  const msg = encodeURIComponent(`Imported ${res.imported}, skipped ${res.skipped}`);
  redirect(`/transactions?import=${msg}`);
}

export default async function ImportTransactionsPage() {
  const accounts = await getAccounts();

  return (
    <main className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Import Transactions (Tiller CSV)</h1>
          <a
            href="/transactions"
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
          >
            Back to Transactions
          </a>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <form action={onImport} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account</label>
              <select
                name="account_id"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                defaultValue=""
              >
                <option value="" disabled>
                  Select an account…
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CSV (paste from Tiller “Transactions” sheet)
              </label>
              <textarea
                name="csv"
                rows={12}
                required
                placeholder={`Date,Description,Category,Amount
2025-11-01,STARBUCKS #123,Food & Drink,-7.85
2025-11-01,CLIENT PAYMENT,Income,250.00
…`}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must include headers: <b>Date</b>, <b>Description</b>, <b>Amount</b> (Category optional).
                Expenses should be negative; income positive.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
              >
                Import
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
