import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

type RawRow = Record<string, string | undefined>;

function splitCSVLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i - 1] !== "\\") { inQ = !inQ; continue; }
    if (ch === "," && !inQ) { out.push(cur.replace(/^"|"$/g, "")); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur.replace(/^"|"$/g, ""));
  return out;
}

function parseCSV(csv: string): RawRow[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCSVLine(lines[0]);
  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const obj: RawRow = {};
    header.forEach((h, idx) => (obj[h] = cols[idx]));
    rows.push(obj);
  }
  return rows;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}
function normDate(s?: string) {
  const d = s ? new Date(s) : new Date();
  return Number.isNaN(d.valueOf()) ? new Date().toISOString().slice(0,10) : d.toISOString().slice(0,10);
}
function normAmt(s?: string) {
  if (!s) return 0;
  const n = Number(s.replace(/[\$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const f = form.get("file") as File | null;
    if (!f) return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });

    const csv = await f.text();
    const raw = parseCSV(csv);

    const txns = raw
      .map((r) => {
        const date = normDate(r["Date"] || r["date"]);
        const description = (r["Description"] || r["Merchant"] || r["description"] || "")?.trim() || null;
        const category = (r["Category"] || r["category"] || "")?.trim() || null;
        const account_name = (r["Account"] || r["Account Name"] || "")?.trim() || null;
        const amount = normAmt(r["Amount"] || r["amount"]);
        const external_id = crypto
          .createHash("sha256")
          .update(`${date}|${description || ""}|${amount}|${account_name || ""}`)
          .digest("hex");
        return { external_id, date, description, category, account_name, amount };
      })
      .filter((t) => t.description || t.amount !== 0);

    const userId = process.env.TILLER_OWNER_USER_ID!;
    if (!userId) return NextResponse.json({ ok: false, error: "Missing owner id" }, { status: 400 });

    const supabase = getServiceClient();
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
    return NextResponse.json({ ok: true, inserted: data?.length ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Upload failed" }, { status: 500 });
  }
}
