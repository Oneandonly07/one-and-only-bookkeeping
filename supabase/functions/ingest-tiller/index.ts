// @ts-nocheck
// Edge Function: ingest-tiller — health check + simple auth

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  try {
    // GET: open health check
    if (req.method === "GET") {
      return json(200, { ok: true, message: "pong" });
    }

    // POST: requires bearer token
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    const secret = Deno.env.get("TILLER_INGEST_TOKEN") ?? "";
    if (!secret || token !== secret) {
      return json(401, { ok: false, error: "unauthorized" });
    }

    // Echo back body for now (CSV parsing will come later)
    const body = await req.json().catch(() => ({}));
    return json(200, { ok: true, message: "pong", received: body ?? null });
  } catch (err) {
    console.error("ingest-tiller crash:", err);
    return json(500, { ok: false, error: "internal_error" });
  }
});
