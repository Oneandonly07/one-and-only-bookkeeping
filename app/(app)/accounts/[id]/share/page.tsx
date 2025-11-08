import Link from 'next/link';
import { redirect } from 'next/navigation';
import SubmitButton from '../../../../components/form/SubmitButton';

async function inviteAction(formData: FormData) {
  'use server';

  const accountId = formData.get('accountId')?.toString();
  const email = formData.get('email')?.toString()?.trim();
  const role = formData.get('role')?.toString() || 'viewer';

  if (!accountId) throw new Error('Missing account id');
  if (!email) throw new Error('Email is required');

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const res = await fetch(`${base}/api/accounts/${accountId}/share`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, role }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await res.text().catch(() => 'Failed to invite');
    throw new Error(message || 'Failed to invite');
  }

  // ✅ IMPORTANT: Server Actions used by <form action> must return void.
  // Use redirect to show a success banner and keep type-safe.
  redirect(`/accounts/${accountId}/share?sent=1`);
}

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function ShareAccountPage({ params, searchParams }: PageProps) {
  const accountId = params.id;
  const sent = searchParams?.sent === '1';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Share Account</h1>
        <Link
          href={`/accounts/${accountId}`}
          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          Back
        </Link>
      </div>

      {sent ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Invite sent successfully.
        </div>
      ) : null}

      <form action={inviteAction} className="space-y-4">
        <input type="hidden" name="accountId" value={accountId} />

        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium">
            Invitee Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="name@example.com"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="viewer"
            className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
        </div>

        <SubmitButton className="bg-emerald-600 text-white hover:opacity-90">
          Send Invite
        </SubmitButton>
      </form>

      <p className="text-xs text-gray-500">
        Invites are sent through <code>/api/accounts/[id]/share</code>. This page uses a Server
        Action with a client-only submit button—no onClick in Server Components.
      </p>
    </div>
  );
}
