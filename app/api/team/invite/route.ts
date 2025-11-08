import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import crypto from "crypto";

type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export async function POST(req: Request) {
  try {
    const { teamId, email, role } = (await req.json()) as {
      teamId?: string;
      email?: string;
      role?: Role;
    };

    if (!teamId || !email) {
      return NextResponse.json(
        { message: "teamId and email are required" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data: authUser } = await supabase.auth.getUser();
    const userId = authUser.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const token = crypto.randomBytes(24).toString("hex");

    const { error } = await supabase.from("team_invites").insert({
      team_id: teamId,
      email,
      role: (role ?? "MEMBER") as any,
      invited_by: userId,
      token,
      status: "PENDING",
    });

    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { message: e?.message ?? "Invite failed" },
      { status: 500 }
    );
  }
}
