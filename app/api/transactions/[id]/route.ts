import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function supa() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => cookieStore.get(n)?.value,
        set() {},
        remove() {},
      },
    }
  );
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const client = supa();

  // Ensure user is authenticated (RLS relies on this)
  const { error: authErr } = await client.auth.getUser();
  if (authErr) {
    return new NextResponse(authErr.message, { status: 401 });
  }

  const { error } = await client.from("transactions").delete().eq("id", params.id);

  if (error) {
    return new NextResponse(error.message, { status: 400 });
  }

  return new NextResponse(null, { status: 204 });
}
