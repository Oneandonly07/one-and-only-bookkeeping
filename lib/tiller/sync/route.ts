// app/api/tiller/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchTillerRows, normalizeRows, upsertTransactions } from "@/lib/tiller";

function authorized(req: NextRequest) {
  const keyQuery = req.nextUrl.searchParams.get("key");
  const keyEnv = process.env.CRON_SECRET;
  return keyEnv && keyQuery && keyQuery === keyEnv;
}

/**
 * For now we sync for ONE owner (your account).
 * If you have multi-tenant users:
 *  - Iterate over each owner with a tiler_sheet_id, etc., and call upsert per user.
 */
const OWNER_USER_ID = process.env.TILLER_OWNER_USER_ID || ""; // set this if multi-tenant not needed

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1) Pull rows from Google Sheets
    const rows = await fetchTillerRows();

    // 2) Normalize to our DB shape
    const txns = normalizeRows(rows);

    if (!OWNER_USER_ID) {
      return NextResponse.json({
        ok: false,
        error: "Set TILLER_OWNER_USER_ID in env to your user_id",
      }, { status: 400 });
    }

    // 3) Upsert into DB
    const res = await upsertTransactions(OWNER_USER_ID, txns);

    return NextResponse.json({ ok: true, ...res, totalRead: rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Sync failed" }, { status: 500 });
  }
}
