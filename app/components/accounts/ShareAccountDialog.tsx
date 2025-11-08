'use client';

import * as React from 'react';

export type Member = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'owner' | 'member';
};

type Props = {
  accountId: string;
  initialMembers: Member[];
  triggerClassName?: string;
};

type AddPayload = { email: string; role: 'member' | 'owner' };
type RemovePayload = { user_id: string };

export default function ShareAccountDialog({
  accountId,
  initialMembers,
  triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>(
    Array.isArray(initialMembers) ? initialMembers : []
  );

  // add
  const [addEmail, setAddEmail] = React.useState('');
  const [addRole, setAddRole] = React.useState<'member' | 'owner'>('member');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // table controls
  const [q, setQ] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<'all' | 'owner' | 'member'>('all');
  const [sortKey, setSortKey] = React.useState<'name' | 'role'>('role');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const owners = React.useMemo(
    () => members.filter((m) => m.role === 'owner'),
    [members]
  );

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());

  function badge(role: Member['role']) {
    const cls =
      role === 'owner'
        ? 'bg-yellow-100 text-yellow-900'
        : 'bg-blue-100 text-blue-900';
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${cls}`}>
        {role}
      </span>
    );
  }

  // derived: filtered + sorted
  const tableRows = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    let rows = members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (!needle) return true;
      const name = (m.full_name ?? '').toLowerCase();
      const email = (m.email ?? '').toLowerCase();
      return name.includes(needle) || email.includes(needle);
    });

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'role') {
        // owner first
        const ra = a.role === 'owner' ? 0 : 1;
        const rb = b.role === 'owner' ? 0 : 1;
        cmp = ra - rb;
      } else {
        const na = (a.full_name ?? a.email ?? '').toLowerCase();
        const nb = (b.full_name ?? b.email ?? '').toLowerCase();
        cmp = na.localeCompare(nb);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [members, q, roleFilter, sortKey, sortDir]);

  // --- ADD ---
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const email = addEmail.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (members.some((m) => (m.email ?? '').toLowerCase() === email)) {
      setError('That user is already a member.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: addRole } as AddPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Failed to add member');

      const added: Member = {
        id: String(data.user_id ?? ''),
        full_name: data.full_name ?? null,
        email: data.email ?? email,
        role: (data.role as Member['role']) ?? addRole,
      };

      setMembers((prev) => {
        const ix = prev.findIndex((m) => m.id === added.id);
        if (ix >= 0) {
          const copy = [...prev];
          copy[ix] = added;
          return copy;
        }
        return [added, ...prev];
      });

      setAddEmail('');
      setAddRole('member');
      setMessage('Member added.');
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  // --- REMOVE ---
  async function handleRemove(user_id: string, role: Member['role']) {
    setError(null);
    setMessage(null);

    if (role === 'owner' && owners.length <= 1) {
      setError('You cannot remove the only owner.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/share`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id } as RemovePayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Failed to remove member');

      setMembers((prev) => prev.filter((m) => m.id !== user_id));
      setMessage('Member removed.');
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  }

  function toggleSort(key: 'role' | 'name') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <>
      <button
        type="button"
        className={triggerClassName ?? 'rounded-md border px-3 py-1.5 text-sm'}
        onClick={() => setOpen(true)}
      >
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-lg bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-base font-semibold">Share account</h2>
              <button
                className="rounded-md px-2 py-1 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
                disabled={busy}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {(error || message) && (
              <div className="p-4">
                {error && (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-700">
                    {message}
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name or email…"
                  className="w-56 rounded-md border px-3 py-2 text-sm"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  <option value="all">All roles</option>
                  <option value="owner">Owner</option>
                  <option value="member">Member</option>
                </select>
              </div>
              <div className="text-xs text-gray-500">
                {tableRows.length} of {members.length} shown
              </div>
            </div>

            {/* Members table */}
            <div className="px-4 pb-2">
              <div className="rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="cursor-pointer py-2 pl-3" onClick={() => toggleSort('name')}>
                        Name / Email {sortKey === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-2">Email</th>
                      <th
                        className="cursor-pointer py-2"
                        onClick={() => toggleSort('role')}
                        title="Sort by role"
                      >
                        Role {sortKey === 'role' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="py-2 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 pl-3 text-gray-500">
                          No matching members.
                        </td>
                      </tr>
                    ) : (
                      tableRows.map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="py-2 pl-3">{m.full_name ?? '—'}</td>
                          <td className="py-2">{m.email ?? '—'}</td>
                          <td className="py-2">{badge(m.role)}</td>
                          <td className="py-2 pr-3">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemove(m.id, m.role)}
                                disabled={busy || (m.role === 'owner' && owners.length <= 1)}
                                title={
                                  m.role === 'owner' && owners.length <= 1
                                    ? 'Cannot remove the only owner'
                                    : 'Remove member'
                                }
                                className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add member */}
            <div className="border-t p-4">
              <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="email"
                  required
                  placeholder="user@email.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as 'member' | 'owner')}
                >
                  <option value="member">Member</option>
                  <option value="owner">Owner</option>
                </select>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {busy ? 'Adding…' : 'Add member'}
                </button>
              </form>
              <p className="mt-2 text-xs text-gray-500">
                Owners can add or remove members. You can’t remove the only owner.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t p-3">
              <button
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
