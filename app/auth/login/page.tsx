'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const year = useMemo(() => new Date().getFullYear(), []);

  async function onEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    if (tab === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setErr(error.message);
      router.replace('/dashboard');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setBusy(false);
      if (error) return setErr(error.message);
      router.replace('/dashboard');
    }
  }

  async function onGoogle() {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setBusy(false);
      setErr(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white shadow-sm rounded-2xl border overflow-hidden">
          {/* Header with logo */}
          <div className="px-8 pt-8 pb-4 flex flex-col items-center text-center">
            <Image
              src="/clinic-logo.jpg"
              alt="One & Only Chiropractic"
              width={160}
              height={160}
              className="h-16 w-auto object-contain mb-2"
              priority
            />
            <h1 className="text-xl font-semibold">One &amp; Only Bookkeeping</h1>
            <p className="text-sm text-gray-500">Sign in to continue</p>
          </div>

          {/* Tabs */}
          <div className="px-8">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 text-sm mb-6">
              <button
                onClick={() => setTab('signin')}
                className={`py-2 rounded-lg transition ${
                  tab === 'signin' ? 'bg-white shadow font-medium' : 'text-gray-600'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`py-2 rounded-lg transition ${
                  tab === 'signup' ? 'bg-white shadow font-medium' : 'text-gray-600'
                }`}
              >
                Create account
              </button>
            </div>

            {/* Email form */}
            <form onSubmit={onEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring focus:ring-emerald-200"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring focus:ring-emerald-200"
                  placeholder="Your password"
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              {err && (
                <p className="text-sm text-red-600">{err}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {busy ? (tab === 'signin' ? 'Signing in…' : 'Creating account…') : (tab === 'signin' ? 'Sign in' : 'Create account')}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-500">or</span>
              </div>
            </div>

            {/* Google-branded button (blue) */}
            <button
              onClick={onGoogle}
              disabled={busy}
              className="w-full rounded-lg py-2.5 font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-95"
              style={{ backgroundColor: '#1a73e8', color: '#fff' }}
            >
              {/* Google G logo (colored) */}
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.65,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.957,3.043l5.657-5.657C33.54,6.053,28.977,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.352,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.168,18.936,14,24,14c3.059,0,5.842,1.154,7.957,3.043l5.657-5.657 C33.54,6.053,28.977,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c4.917,0,9.4-1.879,12.787-4.955l-5.901-4.992C28.842,35.846,26.059,37,24,37 c-5.204,0-9.626-3.317-11.286-7.954l-6.54,5.036C9.497,39.576,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.234-2.231,4.156-4.116,5.553 c0.001-0.001,0.002-0.001,0.003-0.002l5.901,4.992C35.02,39.627,44,34,44,24C44,22.659,43.862,21.352,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>

            <div className="h-6" />
          </div>
        </div>

        {/* Footer (rights reserved) */}
        <p className="text-xs text-gray-500 text-center mt-3">
          © {year} One &amp; Only Chiropractic. All rights reserved.
        </p>
      </div>
    </main>
  );
}
