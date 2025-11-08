"use client";

import { useState } from "react";

export default function ImportFromTillerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    setBusy(true);
    const res = await fetch("/api/import-tiller", { method: "POST", body: form });
    setBusy(false);

    const json = await res.json();
    if (!res.ok) setMsg(json?.error || "Import failed");
    else setMsg(`Imported ${json?.inserted ?? 0} transactions.`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Import from Tiller</h1>
      <p className="mt-2 text-gray-600">
        Upload your Tiller transactions CSV. We’ll normalize descriptions, auto-tag likely categories, and link accounts.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={!file || busy}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? "Importing…" : "Import Transactions"}
        </button>
      </form>

      {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
