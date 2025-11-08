// app/(app)/members/page.tsx
import { createServerSupabase } from '@/lib/supabaseServer';

type Row = {
  id: string | number;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  created_at?: string | null;
};

async function fetchRows(supabase: ReturnType<typeof createServerSupabase>) {
  // Try `members` first
  const sel =
    'id, name, email, role, created_at';

  let { data, error } = await supabase
    .from('members')
    .select(sel)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!error) return { rows: (data as Row[]) ?? [], source: 'members', error: null as any };

  // If members doesn’t exist or is blocked by RLS, try `profiles`
  let { data: data2, error: error2 } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!error2) {
    const rows: Row[] =
      (data2 as any[])?.map((r) => ({
        id: r.id,
        name: r.full_name ?? null,
        email: r.email ?? null,
        role: r.role ?? null,
        created_at: r.created_at ?? null,
      })) ?? [];
    return { rows, source: 'profiles', error: null as any };
  }

  // Return the original error details to display a friendly panel
  return { rows: [] as Row[], source: null as any, error };
}

export default async function MembersPage() {
  const supabase = createServerSupabase();
  const { rows, source, error } = await fetchRows(supabase);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Members</h1>
      <p className="text-sm text-gray-500 mb-6">
        View and manage the people who can access your bookkeeping workspace.
      </p>

      {/* Error / empty states handled gracefully */}
      {!error && rows.length === 0 && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-medium mb-1">No members found</h2>
          <p className="text-sm text-gray-600">
            The <code className="bg-gray-100 px-1 rounded">{
              source ?? 'members'
            }</code>{' '}
            table is reachable, but it doesn’t contain any rows yet.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="font-medium mb-2">Can’t load members yet</h2>
          <p className="text-sm text-gray-600 mb-4">
            We couldn’t find an accessible <code className="bg-gray-100 px-1 rounded">members</code>{' '}
            (or <code className="bg-gray-100 px-1 rounded">profiles</code>) table. This might mean the
            table doesn’t exist yet or Row-Level Security rules are blocking reads for your role.
          </p>
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer text-emerald-700 font-medium">
              Show a quick starter SQL (optional)
            </summary>
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs overflow-auto">
{`-- Minimal demo table (Postgres)
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text unique,
  role text,
  created_at timestamp with time zone default now()
);

-- Optional: enable RLS and allow authenticated users to read
alter table public.members enable row level security;

create policy "members_read"
on public.members
for select
to authenticated
using (true);

-- Insert a sample row
insert into public.members (name, email, role)
values ('Owner', 'owner@example.com', 'owner');`}
            </pre>
          </details>
        </div>
      )}

      {/* Table */}
      {!error && rows.length > 0 && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Source: <code className="bg-white px-1 rounded border">{source}</code>
            </div>
            <div className="text-sm text-gray-500">{rows.length} member(s)</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2 font-medium text-gray-600">Name</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Email</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Role</th>
                  <th className="px-4 py-2 font-medium text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id)} className="border-t">
                    <td className="px-4 py-2">{r.name ?? '—'}</td>
                    <td className="px-4 py-2">{r.email ?? '—'}</td>
                    <td className="px-4 py-2">{r.role ?? '—'}</td>
                    <td className="px-4 py-2">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
