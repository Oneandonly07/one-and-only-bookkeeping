// lib/tiller.ts
import crypto from "crypto";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "").replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: SCOPES,
  });
  return google.sheets({ version: "v4", auth });
}

export type RawRow = {
  Date?: string;
  Description?: string;
  Category?: string;
  Account?: string;
  Amount?: string;
};

// Map Tiller column names to keys we expect.
// If your Tiller sheet has slightly different headers, change these.
const COLUMN_MAP = {
  date: ["Date", "date"],
  description: ["Description", "description", "Merchant"],
  category: ["Category", "category"],
  account: ["Account", "account", "Account Name"],
  amount: ["Amount", "amount"],
};

function headerIndex(header: string[], names: string[]): number {
  const lower = header.map((h) => (h || "").toLowerCase().trim());
  for (const name of names) {
    const i = lower.indexOf(name.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

export async function fetchTillerRows(): Promise<RawRow[]> {
  const sheetId = process.env.TILLER_SHEET_ID!;
  const tab = process.env.TILLER_SHEET_TAB || "Transactions";

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A:Z`,
  });

  const values = (res.data.values || []) as string[][];
  if (!values.length) return [];

  const header = values[0] || [];
  const iDate = headerIndex(header, COLUMN_MAP.date);
  const iDesc = headerIndex(header, COLUMN_MAP.description);
  const iCat = headerIndex(header, COLUMN_MAP.category);
  const iAcct = headerIndex(header, COLUMN_MAP.account);
  const iAmt = headerIndex(header, COLUMN_MAP.amount);

  const rows: RawRow[] = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r] || [];
    rows.push({
      Date: iDate >= 0 ? row[iDate] : undefined,
      Description: iDesc >= 0 ? row[iDesc] : undefined,
      Category: iCat >= 0 ? row[iCat] : undefined,
      Account: iAcct >= 0 ? row[iAcct] : undefined,
      Amount: iAmt >= 0 ? row[iAmt] : undefined,
    });
  }
  return rows;
}

export type NormalTxn = {
  external_id: string; // hash for de-dupe
  date: string;        // yyyy-mm-dd
  description: string | null;
  category: string | null;
  account_name: string | null;
  amount: number;      // negative = expense, positive = income
};

function parseAmount(s?: string) {
  if (!s) return 0;
  // strip $ and commas
  const clean = s.replace(/[\$,]/g, "").trim();
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(s?: string) {
  if (!s) return new Date().toISOString().slice(0, 10);
  // let Date() parse; then format as yyyy-mm-dd
  const d = new Date(s);
  if (Number.isNaN(d.valueOf())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function normalizeRows(rows: RawRow[]): NormalTxn[] {
  return rows
    .map((r) => {
      const amount = parseAmount(r.Amount);
      const date = normalizeDate(r.Date);
      const description = (r.Description || "").trim() || null;
      const category = (r.Category || "").trim() || null;
      const account_name = (r.Account || "").trim() || null;

      const external_id = crypto
        .createHash("sha256")
        .update(`${date}|${description || ""}|${amount}|${account_name || ""}`)
        .digest("hex");

      return { external_id, date, description, category, account_name, amount };
    })
    // drop totally empty rows
    .filter((t) => t.description || t.amount !== 0);
}

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service key to bypass RLS for cron
  return createClient(url, key);
}

/**
 * Upserts transactions by external_id. Adjust table/columns if yours are different.
 * - Assumes `transactions` table has `external_id text UNIQUE`
 * - Fills `account_id` as null (we only know account name here)
 */
export async function upsertTransactions(userId: string, txns: NormalTxn[]) {
  if (!txns.length) return { inserted: 0, updated: 0 };

  const supabase = getSupabaseService();

  // Build payload in shape of your DB
  const payload = txns.map((t) => ({
    external_id: t.external_id,
    user_id: userId,
    date: t.date,
    description: t.description,
    category: t.category,
    account_id: null,
    account_name: t.account_name,
    amount: t.amount,
  }));

  const { data, error } = await supabase
    .from("transactions")
    .upsert(payload, { onConflict: "external_id", ignoreDuplicates: false })
    .select("external_id");

  if (error) throw error;
  return { inserted: data?.length ?? 0, updated: 0 };
}
