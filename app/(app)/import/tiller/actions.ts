'use server';

type ImportResult = {
  ok: boolean;
  message?: string;
  error?: string;
  data?: unknown;
};

export async function importTillerAction(formData: FormData): Promise<ImportResult> {
  try {
    // 1) Read the uploaded CSV (optional while we’re still ping-testing)
    const file = formData.get('file') as File | null;

    // If you want to actually send CSV later, we’ll swap body below.
    let csvText = '';
    if (file && typeof file.text === 'function') {
      csvText = await file.text();
    }

    // 2) Env (server-only)
    const url = process.env.SUPABASE_FUNCTION_INGEST_TILLER;
    const token = process.env.TILLER_INGEST_TOKEN;

    if (!url || !token) {
      return { ok: false, error: 'Missing SUPABASE_FUNCTION_INGEST_TILLER or TILLER_INGEST_TOKEN.' };
    }

    // 3) For now, keep the ping; switch to { csv: csvText } when ready
    const body = { ping: true /* later: remove this line and use: csv: csvText */ };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // IMPORTANT for Edge Functions across origins
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || `Ingest function failed (${res.status})`,
      };
    }

    return {
      ok: true,
      message: data?.message ?? 'Import request sent successfully.',
      data,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unexpected error.' };
  }
}
