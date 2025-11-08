'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyRulesButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<null | { kind: 'ok' | 'err'; msg: string }>(null);

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  async function onClick() {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch('/api/apply-rules', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Failed (${res.status})`);
      }
      setToast({ kind: 'ok', msg: 'Rules applied to uncategorized transactions.' });
      // Revalidate the page data so categories update in the list/table
      router.refresh();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e?.message || 'Could not apply rules.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={onClick}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white
          ${busy ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}
          transition`}
        aria-disabled={busy}
      >
        {busy ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 004 12z" />
            </svg>
            Applying…
          </>
        ) : (
          <>Apply Rules</>
        )}
      </button>

      {/* Tiny toast */}
      {toast && (
        <div
          className={`
            fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm shadow
            ${toast.kind === 'ok' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}
          `}
          role="status"
        >
          {toast.msg}
        </div>
      )}
    </>
  );
}
