// app/api/team/[teamId]/members/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

export async function GET(_req: Request, ctx: { params: { teamId: string } }) {
  try {
    const teamId = ctx.params?.teamId;
    if (!teamId) return NextResponse.json({ error: "Missing teamId" }, { status: 400 });

    const supabase = createServerSupabase();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("team_members")
      .select(`
        id,
        role,
        joined_at:joined_at,
        profiles:profiles!team_members_user_id_fkey(id, email)
      `)
      .eq("team_id", teamId)
      .order("joined_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      role: r.role,
      joinedAt: r.joined_at ?? null,
      name: r.profiles?.email?.split("@")[0] ?? "—",
      email: r.profiles?.email ?? null,
    }));

    return NextResponse.json(rows, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
