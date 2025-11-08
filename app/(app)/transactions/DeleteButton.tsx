"use client";

import * as React from "react";

type Props = {
  /** Transaction id (string) */
  id: string;
};

export default function DeleteButton({ id }: Props) {
  async function onDelete() {
    // Confirm in the browser first
    const ok = window.confirm("Delete this transaction?");
    if (!ok) return;

    try {
      // Call our server action via fetch to the route handler
      const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Delete failed (${res.status})`);
      }

      // Refresh the current page data
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || "Delete failed");
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
      aria-label="Delete transaction"
    >
      Delete
    </button>
  );
}
