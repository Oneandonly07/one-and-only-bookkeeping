"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

function createUserClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      get: (n: string) => cookieStore.get(n)?.value,
      set() {},
      remove() {},
    },
  });
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServerClient(url, serviceKey, {
    cookies: { get() { return undefined; }, set() {}, remove() {} },
  });
}

/** Helper: get current user's default organization (based on any account they can see). */
async function getCurrentOrgId() {
  const user = createUserClient();
  const admin = createAdminClient();

  const { data: auth, error: authErr } = await user.auth.getUser();
  if (authErr || !auth.user) throw new Error("Not authenticated");

  // Pick the first org from an account the user can see (simple bootstrap)
  const { data: acct, error } = await admin
    .from("accounts")
    .select("organization_id")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!acct?.organization_id) throw new Error("No organization found for user.");
  return acct.organization_id as string;
}

export async function createRuleAction(formData: FormData) {
  const admin = createAdminClient();
  const organization_id = await getCurrentOrgId();

  const name = String(formData.get("name") || "").trim();
  const keywordsRaw = String(formData.get("keywords") || "").trim();
  const regex = String(formData.get("regex") || "").trim() || null;
  const min_amount = formData.get("min_amount") ? Number(formData.get("min_amount")) : null;
  const max_amount = formData.get("max_amount") ? Number(formData.get("max_amount")) : null;
  const direction_hint = (String(formData.get("direction_hint") || "") || null) as any;
  const category_id = (String(formData.get("category_id") || "") || null) as string | null;
  const merchant_set = (String(formData.get("merchant_set") || "") || null) as string | null;
  const account_id = (String(formData.get("account_id") || "") || null) as string | null;
  const priority = formData.get("priority") ? Number(formData.get("priority")) : 100;
  const is_active = String(formData.get("is_active") || "on") === "on";

  if (!name) throw new Error("Name is required.");

  const keywords = keywordsRaw
    ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  const { error } = await admin.from("categorization_rules").insert({
    organization_id,
    name,
    keywords,
    regex,
    min_amount,
    max_amount,
    direction_hint,
    category_id,
    merchant_set,
    account_id,
    priority,
    is_active,
    created_by: (await admin.auth.getUser()).data.user?.id,
  });

  if (error) throw new Error(error.message);
  redirect("/rules");
}

export async function updateRuleAction(formData: FormData) {
  const admin = createAdminClient();

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing rule id.");

  const name = String(formData.get("name") || "").trim();
  const keywordsRaw = String(formData.get("keywords") || "").trim();
  const regex = String(formData.get("regex") || "").trim() || null;
  const min_amount = formData.get("min_amount") ? Number(formData.get("min_amount")) : null;
  const max_amount = formData.get("max_amount") ? Number(formData.get("max_amount")) : null;
  const direction_hint = (String(formData.get("direction_hint") || "") || null) as any;
  const category_id = (String(formData.get("category_id") || "") || null) as string | null;
  const merchant_set = (String(formData.get("merchant_set") || "") || null) as string | null;
  const account_id = (String(formData.get("account_id") || "") || null) as string | null;
  const priority = formData.get("priority") ? Number(formData.get("priority")) : 100;
  const is_active = String(formData.get("is_active") || "on") === "on";

  if (!name) throw new Error("Name is required.");

  const keywords = keywordsRaw
    ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  const { error } = await admin
    .from("categorization_rules")
    .update({
      name,
      keywords,
      regex,
      min_amount,
      max_amount,
      direction_hint,
      category_id,
      merchant_set,
      account_id,
      priority,
      is_active,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  redirect("/rules");
}

export async function deleteRuleAction(formData: FormData) {
  const admin = createAdminClient();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing rule id.");

  const { error } = await admin.from("categorization_rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/rules");
}
