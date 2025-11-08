// app/api/sync/tiller/route.ts

// Force Node.js runtime (dynamic import & many libs aren't Edge-safe)
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

type Payload = {
  teamId?: string;
  spreadsheetId?: string;
  range?: string;
};

export async function POST(req: Request) {
  // Read JSON body safely
  let body: Payload = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Allow blanks; fall back to env defaults
  const effective = {
    teamId: body.teamId ?? process.env.TILLER_TEAM_ID ?? '',
    spreadsheetId: body.spreadsheetId ?? process.env.TILLER_SHEET_ID ?? '',
    range: body.range ?? process.env.TILLER_RANGE ?? 'Transactions!A:Z',
  };

  try {
    let message = 'Sync complete (no-op).';

    // Try to call your real sync implementation if it exists.
    // Works for: default export OR named `sync` OR named `run`.
    try {
      const mod: any = await import('@/lib/tiller/sync').catch(() => null);
      const fn = mod?.default ?? mod?.sync ?? mod?.run;
      if (typeof fn === 'function') {
        const out = await fn(effective);
        if (out?.message) message = out.message;
      } else {
        message =
          'Sync route reached. No real sync function found at "@/lib/tiller/sync".';
      }
    } catch (innerErr: any) {
      // If your module throws, surface a clear message but still 200
      message = `Sync attempted but failed to load or run "@/lib/tiller/sync": ${
        innerErr?.message ?? String(innerErr)
      }`;
    }

    return NextResponse.json({ ok: true, message, used: effective });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err?.message ??
          'Unexpected error while handling /api/sync/tiller POST.',
      },
      { status: 500 }
    );
  }
}
