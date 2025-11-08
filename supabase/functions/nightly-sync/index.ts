// supabase/functions/nightly-sync/index.ts
// Edge Function that pings your local sync endpoint (exposed via ngrok)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (_req: Request) => {
  try {
    // Read the ngrok URL from a secret (with a safe fallback)
    const SYNC_URL =
      Deno.env.get("SYNC_URL") ??
      "https://example.ngrok-free.app/api/sync/tiller"; // replace if you want a hardcoded fallback

    console.log("🕙 Nightly sync starting...");
    console.log("→ SYNC_URL:", SYNC_URL);

    const res = await fetch(SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "nightly-sync" }),
    });

    const text = await res.text();
    console.log("← upstream status:", res.status);

    return new Response(
      `Nightly Sync Triggered!\nUpstream status: ${res.status}\n\n${text}`,
      { status: 200 },
    );
  } catch (err) {
    console.error("❌ Error in nightly-sync:", err);
    return new Response(`nightly-sync failed:\n${String(err)}`, { status: 500 });
  }
});
