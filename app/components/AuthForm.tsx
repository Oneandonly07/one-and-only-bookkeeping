'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type Mode = 'signin' | 'signup';

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const getNext = () => {
    const params = new URLSearchParams(window.location.search);
    const fallback = process.env.NEXT_PUBLIC_POST_LOGIN_PATH ?? '/dashboard';
    return params.get('next') ?? fallback;
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(mode === 'signin' ? 'Signing in...' : 'Creating account...');

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = getNext();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user?.email_confirmed_at) {
          window.location.href = getNext();
        } else {
          setStatus('Account created. Please check your email to confirm.');
        }
      }
    } catch (err: any) {
      setStatus(err?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    setStatus('Opening Google...');
    try {
      const origin = window.location.origin;
      const next = getNext();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="inline-flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => { setMode('signin'); setStatus(''); }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition ${
            mode === 'signin' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setStatus(''); }}
          className={`ml-1 px-4 py-2 text-sm font-medium rounded-md transition ${
            mode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Create account
        </button>
      </div>

      {/* Email form */}
      <form onSubmit={onEmailSubmit} className="space-y-4">
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1">Password</span>
            <input
              type="password"
              placeholder="Your password"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black/10 focus:border-black/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-black text-white px-4 py-2 font-medium hover:bg-black/90 disabled:opacity-60"
        >
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        {status && (
          <div className="text-sm text-gray-600">{status}</div>
        )}
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6 text-gray-400">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google button */}
      <button
        onClick={onGoogle}
        disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-60"
        aria-label="Continue with Google"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.582 32.91 29.137 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.943 6.053 29.706 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19.34-7.693 19.34-20 0-1.341-.138-2.651-.387-3.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.542 16.104 18.884 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.943 6.053 29.706 4 24 4 16.318 4 9.687 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c5.058 0 9.67-1.94 13.178-5.104l-6.082-5.143C29.014 35.447 26.646 36 24 36c-5.113 0-9.552-3.082-11.292-7.447l-6.543 5.04C9.51 39.59 16.235 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.323 3.089-4.768 6-11.303 6-5.113 0-9.552-3.082-11.292-7.447l-6.543 5.04C9.51 39.59 16.235 44 24 44c10.493 0 19.34-7.693 19.34-20 0-1.341-.138-2.651-.387-3.917z"/>
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
