// app/api/accounts/[id]/share/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';

type RouteCtx = { params: { id: string } };

function json(status: number, data: unknown) {
  return NextResponse.json(data, { status });
}

// --- Ownership guard (must be OWNER of the account) ---
async function requireOwner(accountId: string): Promise<{ error?: string; userId?: string }> {
  const supabase = createClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('account_users')
    .select('role')
    .eq('account_id', accountId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data || data.role !== 'owner') return { error: 'Only owners can manage members' };

  return { userId: user.id };
}

// POST /api/accounts/:id/share
// Body: { email: string, role?: 'member' | 'owner' }
export async function POST(req: Request, { params }: RouteCtx) {
  const accountId = params.id;

  const ownerCheck = await requireOwner(accountId);
  if (ownerCheck.error) return json(403, { error: ownerCheck.error });

  let body: { email?: string; role?: 'member' | 'owner' } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const email = (body.email || '').toLowerCase().trim();
  const role: 'member' | 'owner' = body.role ?? 'member';

  if (!email || !email.includes('@')) {
    return json(400, { error: 'A valid email is required.' });
  }

  const supabase = createClient();

  // Find user profile by email (profiles.id == auth.users.id)
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('email', email)
    .maybeSingle();

  if (profileErr) return json(500, { error: profileErr.message });
  if (!profile) return json(404, { error: 'No user with that email.' });

  // Upsert membership
  const { error: upsertErr } = await supabase
    .from('account_users')
    .upsert(
      { account_id: accountId, user_id: profile.id, role },
      { onConflict: 'account_id,user_id', ignoreDuplicates: false }
    );

  if (upsertErr) return json(500, { error: upsertErr.message });

  // Return a FLAT payload (what the dialog expects)
  return json(200, {
    user_id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role,
  });
}

// DELETE /api/accounts/:id/share
// Body: { user_id: string }
export async function DELETE(req: Request, { params }: RouteCtx) {
  const accountId = params.id;

  const ownerCheck = await requireOwner(accountId);
  if (ownerCheck.error) return json(403, { error: ownerCheck.error });

  let body: { user_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const user_id = (body.user_id || '').trim();
  if (!user_id) return json(400, { error: 'user_id is required.' });

  const supabase = createClient();

  // --- NEW: prevent removing the ONLY owner ---
  // Count current owners for this account
  const { data: owners, error: ownersErr } = await supabase
    .from('account_users')
    .select('user_id')
    .eq('account_id', accountId)
    .eq('role', 'owner');

  if (ownersErr) return json(500, { error: ownersErr.message });

  const ownerCount = owners?.length ?? 0;
  const isTargetOwner = owners?.some((o) => o.user_id === user_id) ?? false;

  if (isTargetOwner && ownerCount <= 1) {
    return json(400, { error: 'Cannot remove the only owner.' });
  }
  // --- end guard ---

  const { error: delErr } = await supabase
    .from('account_users')
    .delete()
    .eq('account_id', accountId)
    .eq('user_id', user_id);

  if (delErr) return json(500, { error: delErr.message });

  // Flat payload again
  return json(200, { removed: user_id });
}
