'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabaseBrowser';

type Rule = {
  id: number;
  user_id: string;
  name: string;
  contains: string;
  category: string;
  priority: number;
  is_active: boolean;
  created_at: string;
};

const CATEGORY_OPTIONS = [
  'Income',
  'Transfers',
  'Payroll',
  'Rent',
  'Utilities',
  'Supplies',
  'Marketing',
  'Insurance',
  'Taxes',
  'Other',
];

export default function RulesPage() {
  const supabase = createBrowserSupabase();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New / edit form state
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [contains, setContains] = useState('');
  const [category, setCategory] = useState('Income');
  const [priority, setPriority] = useState<number>(50);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user rules
  async function loadRules() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .order('priority', { ascending: false })
      .order('id', { ascending: true });

    if (error) setError(error.message);
    setRules((data as Rule[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditId(null);
    setName('');
    setContains('');
    setCategory('Income');
    setPriority(50);
    setIsActive(true);
  }

  function startEdit(r: Rule) {
    setEditId(r.id);
    setName(r.name ?? '');
    setContains(r.contains ?? '');
    setCategory(r.category ?? 'Other');
    setPriority(r.priority ?? 0);
    setIsActive(!!r.is_active);
  }

  // Create or update
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError('Please enter a rule name.');
      setSaving(false);
      return;
    }
    if (!contains.trim()) {
      setError('Please add at least one keyword in "Contains".');
      setSaving(false);
      return;
    }

    // Normalize: collapse spaces, lower-case for consistent matching
    const normalizedContains = contains
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .join(',')
      .toLowerCase();

    if (editId === null) {
      // INSERT
      const { error } = await supabase.from('rules').insert({
        name: name.trim(),
        contains: normalizedContains,
        category: category.trim(),
        priority: Number(priority) || 0,
        is_active: isActive,
      });
      if (error) setError(error.message);
    } else {
      // UPDATE
      const { error } = await supabase
        .from('rules')
        .update({
          name: name.trim(),
          contains: normalizedContains,
          category: category.trim(),
          priority: Number(priority) || 0,
          is_active: isActive,
        })
        .eq('id', editId);
      if (error) setError(error.message);
    }

    setSaving(false);
    resetForm();
    await loadRules();
  }

  // Delete
  async function onDelete(id: number) {
    if (!confirm('Delete this rule?')) return;
    setError(null);
    const { error } = await supabase.from('rules').delete().eq('id', id);
    if (error) setError(error.message);
    await loadRules();
  }

  // Toggle
  async function onToggleActive(r: Rule) {
    setError(null);
    const { error } = await supabase
      .from('rules')
      .update({ is_active: !r.is_active })
      .eq('id', r.id);
    if (error) setError(error.message);
    await loadRules();
  }

  const activeCount = useMemo(
    () => rules.filter(r => r.is_active).length,
    [rules]
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Transaction Rules</h1>
      <p className="text-sm text-gray-600 mb-6">
        Rules auto-categorize transactions by matching keywords in the description.
        Use higher <span className="font-medium">Priority</span> to win ties.
      </p>

      {/* Form */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {editId === null ? 'Add Rule' : 'Edit Rule'}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="e.g., Payroll Deposits"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Contains (comma separated)
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2"
              placeholder="e.g., payroll, adp, paycheck"
              value={contains}
              onChange={e => setContains(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Case-insensitive. We match if the description contains ANY of these.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <input
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              value={priority}
              onChange={e => setPriority(Number(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">Higher wins (e.g., 100).</p>
          </div>

          <div className="md:col-span-6 flex items-center gap-3 mt-1">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              <span className="text-sm">Active</span>
            </label>

            <div className="ml-auto flex gap-2">
              {editId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-black text-white px-4 py-2 text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : editId === null ? 'Add Rule' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
        <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1">
          Active: {activeCount}
        </span>
        <span className="rounded-full bg-gray-50 border px-3 py-1">
          Total: {rules.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 w-16">ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Contains</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3 w-24">Priority</th>
              <th className="text-left px-4 py-3 w-24">Active</th>
              <th className="text-right px-4 py-3 w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading rules…
                </td>
              </tr>
            )}
            {!loading && rules.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No rules yet. Add your first rule above.
                </td>
              </tr>
            )}
            {rules.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 text-gray-500">{r.id}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 text-gray-700">
                  <code className="text-xs bg-gray-50 border rounded px-2 py-1">
                    {r.contains}
                  </code>
                </td>
                <td className="px-4 py-3">{r.category}</td>
                <td className="px-4 py-3">{r.priority}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onToggleActive(r)}
                    className={`rounded-full px-3 py-1 text-xs border ${
                      r.is_active
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-gray-50'
                    }`}
                  >
                    {r.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="rounded-lg border px-3 py-1.5"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="rounded-lg border px-3 py-1.5 text-red-600 border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* (Optional) A small note about how matching works */}
      <p className="text-xs text-gray-500 mt-4">
        Matching uses <span className="font-medium">ILIKE</span> against the transaction
        description for any of the comma-separated keywords. Example: a rule with
        <code className="mx-1">payroll, adp</code> matches “ADP PAYROLL 11/01”.
      </p>
    </div>
  );
}
