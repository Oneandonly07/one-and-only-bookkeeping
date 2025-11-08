// app/api/member/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = createServerSupabase();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("id, email, created_at")
      .eq("id", user.id)
      .single();

    if (profErr && profErr.code !== "PGRST116") {
      console.error("profiles error:", profErr);
    }

    return NextResponse.json(
      {
        id: user.id,
        email: profile?.email ?? user.email,
        created_at: profile?.created_at ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
