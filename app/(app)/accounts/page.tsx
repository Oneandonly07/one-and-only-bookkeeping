import Link from 'next/link';
import { listAccounts, deleteAccountAction } from './actions';
import SubmitButton from '../../components/form/SubmitButton';

export default async function AccountsPage() {
  const accounts = await listAccounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Link
          href="/accounts/new"
          className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New Account
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Institution</th>
              <th className="px-4 py-3 font-medium">Opening Balance</th>
              <th className="px-4 py-3 font-medium">Opening Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                  No accounts yet.
                </td>
              </tr>
            ) : (
              accounts.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3 capitalize">{a.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{a.institution ?? '—'}</td>
                  <td className="px-4 py-3">
                    {typeof a.opening_balance === 'number' ? a.opening_balance.toFixed(2) : '—'}
                  </td>
                  <td className="px-4 py-3">{a.opening_date ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/accounts/${a.id}`}
                        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs"
                      >
                        Edit
                      </Link>

                      {/* Delete via form + Client SubmitButton (no onClick in Server) */}
                      <form action={deleteAccountAction}>
                        <input type="hidden" name="id" value={a.id} />
                        <SubmitButton className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:opacity-90">
                          Delete
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
