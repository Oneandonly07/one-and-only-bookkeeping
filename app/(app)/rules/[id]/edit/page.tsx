// app/(app)/rules/[id]/edit/page.tsx
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notFound } from "next/navigation";
import { updateRuleAction } from "../../actions";

type Rule = {
  id: string;
  name: string;
  keywords: string[] | null;
  regex: string | null;
  min_amount: number | null;
  max_amount: number | null;
  direction_hint: string | null;
  category_id: string | null;
  merchant_set: string | null;
  account_id: string | null;
  priority: number;
  is_active: boolean;
};

function createUserClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      get: (n: string) => cookieStore.get(n)?.value,
      set() {},
      remove() {},
    },
  });
}

async function loadData(id: string) {
  const supabase = createUserClient();
  const { data: rule, error } = await supabase
    .from("categorization_rules")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !rule) return notFound();

  const { data: cats } = await supabase.from("categories").select("id, name").order("name");
  const { data: accts } = await supabase.from("accounts").select("id, name").order("name");

  return { rule: rule as Rule, cats: cats ?? [], accts: accts ?? [] };
}

export default async function EditRulePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { rule, cats, accts } = await loadData(id);

  return (
    <main className="min-h-screen w-full bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Rule</h1>
          <a href="/rules" className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">Back</a>
        </header>

        <form action={updateRuleAction} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
          <input type="hidden" name="id" value={rule.id} />
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input name="name" required defaultValue={rule.name} className="mt-1 w-full rounded-lg border p-2" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Keywords (comma-separated)</label>
              <input
                name="keywords"
                defaultValue={(rule.keywords ?? []).join(", ")}
                className="mt-1 w-full rounded-lg border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Regex (optional)</label>
              <input name="regex" defaultValue={rule.regex ?? ""} className="mt-1 w-full rounded-lg border p-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Min Amount</label>
              <input name="min_amount" type="number" step="0.01" defaultValue={rule.min_amount ?? ""} className="mt-1 w-full rounded-lg border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Max Amount</label>
              <input name="max_amount" type="number" step="0.01" defaultValue={rule.max_amount ?? ""} className="mt-1 w-full rounded-lg border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Priority</label>
              <input name="priority" type="number" defaultValue={rule.priority} className="mt-1 w-full rounded-lg border p-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">Direction</label>
              <select name="direction_hint" className="mt-1 w-full rounded-lg border p-2" defaultValue={rule.direction_hint ?? ""}>
                <option value="">(no change)</option>
                <option value="income">income</option>
                <option value="expense">expense</option>
                <option value="transfer">transfer</option>
                <option value="refund">refund</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Category</label>
              <select name="category_id" className="mt-1 w-full rounded-lg border p-2" defaultValue={rule.category_id ?? ""}>
                <option value="">(none)</option>
                {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Limit to Account</label>
              <select name="account_id" className="mt-1 w-full rounded-lg border p-2" defaultValue={rule.account_id ?? ""}>
                <option value="">(any)</option>
                {accts.map((a: any) => <option key={a.id} value={a.id}>{a.name ?? a.id}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Set Merchant (overwrite)</label>
            <input name="merchant_set" defaultValue={rule.merchant_set ?? ""} className="mt-1 w-full rounded-lg border p-2" />
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input name="is_active" type="checkbox" defaultChecked={!!rule.is_active} />
              Active
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90">Save</button>
            <a href="/rules" className="text-sm text-gray-600 hover:underline">Cancel</a>
          </div>
        </form>
      </div>
    </main>
  );
}
