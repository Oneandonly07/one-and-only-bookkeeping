// app/(app)/transactions/new/page.tsx
import { createClient } from "@supabase/supabase-js";
import NewTxnForm from "../NewTxnForm";

export const metadata = {
  title: "Add Transaction",
};

type Option = { id: string | number; name: string };

// Server-side loader: use service role so RLS won't block reading lists.
// NOTE: Service key is NEVER sent to the browser — this file is a server component.
async function loadLists() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Adjust table/column names if your schema differs
  const [acctRes, memRes, locRes] = await Promise.all([
    supabase.from("accounts").select("id,name").order("name", { ascending: true }),
    supabase.from("members").select("id,name").order("name", { ascending: true }),
    supabase.from("locations").select("id,name").order("name", { ascending: true }),
  ]);

  const accounts: Option[] = acctRes.data ?? [];
  const members: Option[] = memRes.data ?? [];
  const locations: Option[] = locRes.data ?? [];

  return { accounts, members, locations };
}

export default async function NewTransactionPage() {
  const { accounts, members, locations } = await loadLists();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Add Transaction</h1>

      <section className="max-w-5xl">
        <NewTxnForm
          accounts={accounts}
          members={members}
          locations={locations}
        />
      </section>
    </main>
  );
}
