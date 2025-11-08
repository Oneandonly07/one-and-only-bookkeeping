import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  try {
    const { teamId, email } = (await req.json()) as {
      teamId?: string;
      email?: string;
    };

    if (!teamId || !email) {
      return NextResponse.json(
        { message: "teamId and email are required" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from("team_invites")
      .select("id, status, token")
      .eq("team_id", teamId)
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { message: "No invite found to resend" },
        { status: 404 }
      );
    }

    // trigger your mailer here if desired
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { message: e?.message ?? "Failed to resend invite" },
      { status: 500 }
    );
  }
}
