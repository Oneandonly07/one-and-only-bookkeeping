// app/sync/tiller/page.tsx
import SyncFromSheetsButton from '@/components/SyncFromSheetsButton';

export default function TillerSyncPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Tiller Sync (Google Sheets)
      </h1>

      <SyncFromSheetsButton
        defaultTeamId=""                // leave blank to use server defaults
        defaultSpreadsheetId=""         // optional
        defaultRange="Transactions!A:Z" // optional
      />
    </main>
  );
}
