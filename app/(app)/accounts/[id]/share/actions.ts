// app/(app)/accounts/[id]/share/actions.ts
"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";

const inviteSchema = z.object({
  account_id: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

function sclient() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => store.get(n)?.value } }
  );
}

/**
 * Adds a user by email to account_users if not already a member.
 * Returns Promise<void> to satisfy <form action={...}> typing.
 */
export async function inviteMemberAction(formData: FormData): Promise<void> {
  const supabase = sclient();

  const parsed = inviteSchema.safeParse({
    account_id: formData.get("account_id"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    console.error("[inviteMemberAction] invalid input:", parsed.error.flatten());
    return;
  }

  const { account_id, email, role } = parsed.data;

  // Find user profile by email
  const { data: prof, error: pErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (pErr || !prof?.id) {
    console.error("[inviteMemberAction] profile not found", pErr);
    return;
  }

  // Check existing membership
  const { data: existing, error: exErr } = await supabase
    .from("account_users")
    .select("id")
    .eq("account_id", account_id)
    .eq("user_id", prof.id)
    .maybeSingle();

  if (exErr) {
    console.error("[inviteMemberAction] check existing failed:", exErr);
    return;
  }

  if (!existing) {
    const { error: insErr } = await supabase
      .from("account_users")
      .insert([{ account_id, user_id: prof.id, role }]);

    if (insErr) {
      console.error("[inviteMemberAction] insert failed:", insErr);
      return;
    }
  }

  revalidatePath(`/accounts/${account_id}/share`);
}
