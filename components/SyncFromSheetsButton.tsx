// components/SyncFromSheetsButton.tsx
'use client';

import { useState } from 'react';

type Props = {
  defaultTeamId?: string;
  defaultSpreadsheetId?: string;
  defaultRange?: string;
};

export default function SyncFromSheetsButton({
  defaultTeamId = '',
  defaultSpreadsheetId = '',
  defaultRange = 'Transactions!A:Z',
}: Props) {
  const [teamId, setTeamId] = useState(defaultTeamId);
  const [sheetId, setSheetId] = useState(defaultSpreadsheetId);
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSync() {
    setLoading(true);
    setNote(null);
    setError(null);

    try {
      const res = await fetch('/api/sync/tiller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: teamId?.trim() || undefined,
          spreadsheetId: sheetId?.trim() || undefined,
          range: range?.trim() || undefined,
        }),
      });

      const text = await res.text();
      // Try to parse JSON, but keep raw text if not JSON
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: false, error: text || 'Non-JSON response' };
      }

      if (res.ok && data?.ok) {
        setNote(data?.message ?? 'Sync finished.');
      } else {
        setError(
          data?.error ??
            data?.message ??
            `Sync failed with status ${res.status}.`
        );
      }
    } catch (err: any) {
      setError(err?.message ?? 'Network error running sync.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Team ID</label>
          <input
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            placeholder="(optional) leave blank to use server defaults"
            className="h-11 rounded-md border px-3"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Spreadsheet ID (optional)</label>
          <input
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
            placeholder="1AbC... from the Google Sheets URL"
            className="h-11 rounded-md border px-3"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-500 mb-1">Range (optional)</label>
          <input
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="Transactions!A:Z"
            className="h-11 rounded-md border px-3"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={runSync}
          disabled={loading}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-60"
        >
          {loading ? 'Running…' : 'Run Sync'}
        </button>

        {note && <span className="text-green-600">{note}</span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  );
}
