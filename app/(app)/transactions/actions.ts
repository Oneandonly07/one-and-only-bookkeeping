"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";

function getSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );
}

/** Accepts either FormData (preferred) or a raw id string. */
export async function deleteTransaction(input: FormData | string) {
  const supabase = getSupabase();

  const id =
    typeof input === "string"
      ? input.trim()
      : ((input.get("id") as string) || "").trim();

  if (!id) {
    return { ok: false, error: "Missing transaction id" };
  }

  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  // Ensure the list updates immediately
  revalidatePath("/transactions");
  return { ok: true };
}

/** Kept for your inline editing; safe no-op fields allowed. */
export async function updateTransaction(formData: FormData) {
  const supabase = getSupabase();

  const id = (formData.get("id") as string)?.trim();
  if (!id) return { ok: false, error: "Missing transaction id" };

  const description = ((formData.get("description") as string) ?? "").trim();
  const category = ((formData.get("category") as string) ?? "").trim() || null;

  // account can be by id or manual name (when “Other”)
  const account_id = ((formData.get("account_id") as string) ?? "").trim() || null;
  const account_name =
    ((formData.get("account_name") as string) ?? "").trim() || null;

  const payload: Record<string, any> = {
    description: description || null,
    category,
    account_id,
    account_name,
  };

  const { error } = await supabase.from("transactions").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/transactions");
  return { ok: true };
}
