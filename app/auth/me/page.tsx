// app/auth/me/page.tsx
import { getServerClient } from '@/lib/supabaseServer';

export default async function MePage() {
  const supabase = getServerClient();
  const { data, error } = await supabase.auth.getUser();

  return (
    <pre style={{ padding: 16 }}>
{JSON.stringify({ user: data?.user ?? null, error: error?.message ?? null }, null, 2)}
    </pre>
  );
}
