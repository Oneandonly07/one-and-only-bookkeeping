"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

type Props = {
  txns: Txn[] | null;
  accounts: Account[] | null;
  categories: string[] | null;
  onUpdate: (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
};

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function TransactionsTableClient({
  txns,
  accounts,
  categories,
  onUpdate,
  onDelete,
}: Props) {
  const safeTxns: Txn[] = txns ?? [];
  const safeAccounts: Account[] = accounts ?? [];
  const safeCategories: string[] = categories ?? [];

  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const accountOptions = useMemo(
    () => [{ id: "", name: "— Select account —" }, ...safeAccounts],
    [safeAccounts]
  );
  const categoryOptions = useMemo(
    () => ["— Select category —", ...safeCategories],
    [safeCategories]
  );

  const tdBase =
    "px-5 py-4 align-middle text-[0.95rem] text-gray-800";

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(async () => {
      const res = await onDelete(fd);
      if (!res.ok) {
        alert(res.error ?? "Failed to delete");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full border-separate border-spacing-y-2">
        <colgroup>
          <col style={{ width: "140px" }} />
          <col style={{ width: "38%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "190px" }} />
        </colgroup>

        <thead className="bg-gray-50">
          <tr className="text-left text-sm font-semibold text-gray-700">
            <th className="px-5 py-3 rounded-l-lg">Date</th>
            <th className="px-5 py-3">Description</th>
            <th className="px-5 py-3">Category / Account</th>
            <th className="px-5 py-3 text-right">Amount</th>
            <th className="px-5 py-3 text-right rounded-r-lg">Actions</th>
          </tr>
        </thead>

        <tbody>
          {safeTxns.map((row) => {
            const isEditing = editingId === row.id;

            if (!isEditing) {
              return (
                <tr key={row.id} className="bg-white shadow-sm ring-1 ring-gray-100 rounded-lg">
                  <td className={`${tdBase} rounded-l-lg`}>
                    {new Date(row.date).toLocaleDateString()}
                  </td>
                  <td className={tdBase}>
                    <div className="line-clamp-2 break-words">
                      {row.description ?? "—"}
                    </div>
                  </td>
                  <td className={tdBase}>
                    <div className="flex flex-col gap-1">
                      <div className="text-gray-800">{row.category ?? "—"}</div>
                      <div className="text-xs text-gray-500">
                        {row.account_name ?? "—"}
                      </div>
                    </div>
                  </td>
                  <td className={`${tdBase} text-right tabular-nums font-medium`}>
                    <span
                      className={
                        row.amount === 0
                          ? "text-gray-700"
                          : row.amount < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {money(row.amount)}
                    </span>
                  </td>
                  <td className={`${tdBase} text-right rounded-r-lg`}>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                        onClick={() => setEditingId(row.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(row.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <EditRow
                key={row.id}
                row={row}
                tdBase={tdBase}
                categoryOptions={categoryOptions}
                accountOptions={accountOptions}
                categories={safeCategories}
                accounts={safeAccounts}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
                onUpdate={onUpdate}
                isPending={isPending}
              />
            );
          })}

          {safeTxns.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                No transactions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** ---------- Edit Row (enables manual inputs only when “other” is selected) ---------- */
function EditRow({
  row,
  tdBase,
  categoryOptions,
  accountOptions,
  categories,
  accounts,
  onCancel,
  onSaved,
  onUpdate,
  isPending,
}: {
  row: Txn;
  tdBase: string;
  categoryOptions: string[];
  accountOptions: Account[];
  categories: string[];
  accounts: Account[];
  onCancel: () => void;
  onSaved: () => void;
  onUpdate: (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  isPending: boolean;
}) {
  const formId = `row-form-${row.id}`;

  // Initial selections based on existing values
  const initialCatSel =
    row.category ? (categories.includes(row.category) ? row.category : "other") : "";
  const initialAccSel = row.account_id ? row.account_id : row.account_name ? "other" : "";

  const [catSel, setCatSel] = useState<string>(initialCatSel);
  const [accSel, setAccSel] = useState<string>(initialAccSel);

  const categoryManualDisabled = catSel !== "other";
  const accountManualDisabled = accSel !== "other";

  const manualDisabledClass =
    "bg-gray-100 text-gray-500 cursor-not-allowed placeholder:text-gray-400";

  async function handleSave() {
    const formEl = document.getElementById(formId)! as HTMLFormElement;
    const fd = new FormData(formEl);
    fd.set("id", row.id);

    // Map category (use state to be exact)
    const cat = catSel === "other" ? ((fd.get("category_manual") as string) || "").trim() : catSel;
    fd.set("category", cat ?? "");
    fd.delete("category_select");
    fd.delete("category_manual");

    // Map account (use state to be exact)
    if (!accSel || accSel === "other") {
      fd.set("account_id", "");
      fd.set("account_name", ((fd.get("account_manual") as string) || "").trim());
    } else {
      fd.set("account_id", accSel);
      const name = accounts.find((a) => a.id === accSel)?.name ?? "";
      fd.set("account_name", name);
    }
    fd.delete("account_select");
    fd.delete("account_manual");

    const res = await onUpdate(fd);
    if (!res.ok) {
      alert(res.error ?? "Failed to update");
      return;
    }
    onSaved();
  }

  return (
    <tr className="bg-amber-50/40 shadow-sm ring-1 ring-amber-100 rounded-lg">
      <td className={`${tdBase} rounded-l-lg`}>
        {new Date(row.date).toLocaleDateString()}
      </td>

      <td className={tdBase}>
        <form id={formId} className="contents">
          <input
            name="description"
            defaultValue={row.description ?? ""}
            placeholder="What is this?"
            className="w-full max-w-[520px] rounded-md border px-3 py-2"
          />
        </form>
      </td>

      <td className={tdBase}>
        <div className="flex flex-col gap-3">
          {/* Category */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="category_select"
              form={formId}
              value={catSel}
              onChange={(e) => setCatSel(e.target.value)}
              className="w-[240px] min-w-[220px] max-w-[280px] rounded-md border px-2 py-2"
            >
              {categoryOptions.map((c) => (
                <option key={`c-${c}`} value={c.startsWith("—") ? "" : c}>
                  {c}
                </option>
              ))}
              <option value="other">Other (type manually)</option>
            </select>
            <input
              name="category_manual"
              form={formId}
              defaultValue={
                row.category && !categories.includes(row.category) ? row.category : ""
              }
              placeholder="Type category"
              disabled={categoryManualDisabled}
              className={`w-[240px] min-w-[220px] max-w-[280px] rounded-md border px-3 py-2 ${
                categoryManualDisabled ? manualDisabledClass : ""
              }`}
            />
          </div>

          {/* Account */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="account_select"
              form={formId}
              value={accSel}
              onChange={(e) => setAccSel(e.target.value)}
              className="w-[240px] min-w-[220px] max-w-[280px] rounded-md border px-2 py-2"
            >
              {accountOptions.map((a) => (
                <option key={`a-${a.id || "blank"}`} value={a.id}>
                  {a.name}
                </option>
              ))}
              <option value="other">Other (type manually)</option>
            </select>
            <input
              name="account_manual"
              form={formId}
              defaultValue={row.account_id ? "" : row.account_name ?? ""}
              placeholder="Type account"
              disabled={accountManualDisabled}
              className={`w-[240px] min-w-[220px] max-w-[280px] rounded-md border px-3 py-2 ${
                accountManualDisabled ? manualDisabledClass : ""
              }`}
            />
          </div>
        </div>
      </td>

      <td className={`${tdBase} text-right tabular-nums font-medium`}>
        <span
          className={
            row.amount === 0
              ? "text-gray-700"
              : row.amount < 0
              ? "text-red-600"
              : "text-green-600"
          }
        >
          {money(row.amount)}
        </span>
      </td>

      <td className={`${tdBase} rounded-r-lg`}>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white shadow hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}
