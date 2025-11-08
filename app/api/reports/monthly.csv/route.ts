// app/api/reports/monthly.csv/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";

/**
 * Example CSV export for the last 30 days of transactions.
 * Adjust column list and date logic to match your schema.
 */
export async function GET() {
  try {
    const supabase = createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from("transactions")
      .select("id, date, amount, account_id")
      .gte("date", since.toISOString())
      .order("date", { ascending: false });

    if (error) {
      console.error("monthly.csv query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const header = "id,date,amount,account_id";
    const body = rows
      .map((r) => {
        const id = r.id ?? "";
        const d = (r as any).date ?? "";
        const a = typeof r.amount === "number" ? r.amount : "";
        const acct = (r as any).account_id ?? "";
        return `${id},${d},${a},${acct}`;
      })
      .join("\n");

    const csv = `${header}\n${body}\n`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="monthly.csv"`,
      },
    });
  } catch (e: any) {
    console.error("Unhandled monthly.csv error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
