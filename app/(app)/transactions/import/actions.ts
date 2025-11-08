"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

type RuleRow = {
  id: string;
  organization_id: string;
  name: string;
  keywords: string[] | null;
  regex: string | null;
  min_amount: string | number | null;
  max_amount: string | number | null;
  direction_hint: "income" | "expense" | "transfer" | "refund" | "unknown" | null;
  category_id: string | null;
  merchant_set: string | null;
  account_id: string | null;
  priority: number;
  is_active: boolean;
};

function createUserClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
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

function sha(idParts: string[]) {
  const h = crypto.createHash("sha256");
  h.update(idParts.join("|"));
  return h.digest("hex").slice(0, 24);
}

/** Basic CSV parser for simple, comma-separated Tiller exports (no quotes inside fields). */
function parseCsv(csv: string): string[][] {
  return csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim()));
}

/** Normalize description */
function normalizeDesc(s: string | null | undefined) {
  const val = (s ?? "").toString().trim();
  return val.replace(/\s+/g, " ").toLowerCase();
}

/** Heuristics for transfer/refund words */
const TRANSFER_WORDS = ["transfer", "xfer", "payment", "pmt", "internal", "to checking", "from savings", "zelle to self", "balance transfer"];
const REFUND_WORDS = ["refund", "reversal", "returned", "chargeback", "credit back", "adj credit"];

/** Direction inference from signed amount (Tiller convention: expenses are negative) */
function inferDirectionFromSignedAmount(rawAmount: number) {
  if (rawAmount > 0) return "income";
  if (rawAmount < 0) return "expense";
  return "unknown";
}

/** Direction refinement via keywords */
function refineDirectionByKeywords(descNorm: string, proposed: string) {
  if (TRANSFER_WORDS.some((w) => descNorm.includes(w))) return "transfer";
  if (REFUND_WORDS.some((w) => descNorm.includes(w))) return "refund";
  return proposed as any;
}

/** Apply org rules in priority order; return possibly-updated fields + rule id if matched. */
function applyRulesOne(
  row: {
    amount: number; // positive
    direction: "income" | "expense" | "transfer" | "refund" | "unknown";
    normalized_description: string;
    merchant: string | null;
    account_id: string;
  },
  rules: RuleRow[]
): { direction: string; category_id: string | null; merchant: string | null; rule_id_applied: string | null } {
  for (const r of rules) {
    if (!r.is_active) continue;
    if (r.account_id && r.account_id !== row.account_id) continue;

    // match keywords (all lowercase, contains-any)
    const kw = (r.keywords ?? []).map((k) => k.toLowerCase());
    const hasKeyword = kw.length === 0 ? true : kw.some((k) => row.normalized_description.includes(k));

    // match regex (optional)
    let regexOk = true;
    if (r.regex) {
      try {
        const re = new RegExp(r.regex, "i");
        regexOk = re.test(row.normalized_description);
      } catch {
        regexOk = false;
      }
    }

    // match amount range if present
    const minOk = r.min_amount == null ? true : row.amount >= Number(r.min_amount);
    const maxOk = r.max_amount == null ? true : row.amount <= Number(r.max_amount);

    if (hasKeyword && regexOk && minOk && maxOk) {
      const newDir = (r.direction_hint ?? row.direction) as any;
      const newCat = r.category_id ?? null;
      const newMerchant = r.merchant_set ?? row.merchant;
      return { direction: newDir, category_id: newCat, merchant: newMerchant, rule_id_applied: r.id };
    }
  }
  return { direction: row.direction, category_id: null, merchant: row.merchant, rule_id_applied: null };
}

/**
 * Server Action: Import Tiller CSV into a given account with normalization + rule classification.
 * Expected CSV headers (any order): Date, Description, Category, Amount
 * - Amount may be signed (Tiller). We'll store positive and set `direction`.
 */
export async function importTillerCsvAction(formData: FormData) {
  const account_id = String(formData.get("account_id") || "");
  const csvRaw = String(formData.get("csv") || "");

  if (!account_id) throw new Error("Missing account_id.");
  if (!csvRaw.trim()) throw new Error("CSV is empty.");

  const user = createUserClient();
  const admin = createAdminClient();

  // Auth
  const { data: auth, error: authErr } = await user.auth.getUser();
  if (authErr || !auth.user) throw new Error("Not authenticated.");

  // Validate account ownership + get organization
  const { data: acct, error: acctErr } = await admin
    .from("accounts")
    .select("id, organization_id, name")
    .eq("id", account_id)
    .single();

  if (acctErr || !acct) throw new Error(`Account not found: ${acctErr?.message ?? ""}`);
  if (!acct.organization_id) throw new Error("Account missing organization_id. Backfill required.");

  // Load org rules ordered by priority
  const { data: rules, error: rulesErr } = await admin
    .from("categorization_rules")
    .select("*")
    .eq("organization_id", acct.organization_id)
    .order("priority", { ascending: true });

  if (rulesErr) throw new Error(`Load rules failed: ${rulesErr.message}`);

  // Parse CSV
  const rows = parseCsv(csvRaw);
  if (!rows.length) throw new Error("No rows parsed.");
  const headers = rows[0].map((h) => h.toLowerCase());
  const body = rows.slice(1);

  const idxDate = headers.findIndex((h) => h.includes("date"));
  const idxDesc = headers.findIndex((h) => h.includes("description"));
  const idxCat = headers.findIndex((h) => h.includes("category"));
  const idxAmt = headers.findIndex((h) => h.includes("amount"));

  if (idxDate < 0 || idxDesc < 0 || idxAmt < 0) {
    throw new Error("CSV must include Date, Description, Amount headers.");
  }

  let imported = 0;
  let skipped = 0;
  const toInsert: any[] = [];

  for (const cols of body) {
    if (!cols || !cols.length) continue;
    const date = (cols[idxDate] || "").trim();
    const desc = (cols[idxDesc] || "").trim();
    const categoryFromCsv = idxCat >= 0 ? (cols[idxCat] || "").trim() : "";
    const amtRaw = Number((cols[idxAmt] || "0").replace(/[$,]/g, ""));

    if (!date || !desc || !Number.isFinite(amtRaw) || amtRaw === 0) {
      skipped++;
      continue;
    }

    const direction0 = inferDirectionFromSignedAmount(amtRaw) as any;
    const amountPos = Math.abs(amtRaw);
    const descNorm = normalizeDesc(desc);
    const direction1 = refineDirectionByKeywords(descNorm, direction0) as any;

    // initial normalized row
    let working = {
      amount: amountPos,
      direction: direction1,
      normalized_description: descNorm,
      merchant: null as string | null,
      account_id,
    };

    // apply rules
    const withRules = applyRulesOne(working, (rules ?? []) as RuleRow[]);

    // external_id for dedupe: deterministic hash
    const external_id = sha([date, String(amountPos), descNorm, "tiller"]);

    // upsert payload
    toInsert.push({
      account_id,
      source: "tiller",
      external_id,
      date,
      amount: amountPos,
      direction: withRules.direction,
      category_id: withRules.category_id, // may be null
      merchant: withRules.merchant,
      normalized_description: descNorm,
      description: desc, // keep your user-facing description column if you have one
      imported_at: new Date().toISOString(),
      rule_id_applied: withRules.rule_id_applied,
      raw: {
        source: "tiller",
        csv_category: categoryFromCsv,
        csv_row: cols,
      },
    });
  }

  // Upsert with dedupe
  if (toInsert.length) {
    const { error } = await admin
      .from("transactions")
      .upsert(toInsert, { onConflict: "account_id,external_id,source" });

    if (error) throw new Error(`Upsert failed: ${error.message}`);
    imported = toInsert.length;
  }

  return { ok: true, imported, skipped };
}
