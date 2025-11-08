"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  async function signInWithEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    window.location.href = "/dashboard";
  }

  async function signUpWithEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    alert("Check your email to confirm your account, then sign in.");
  }

  async function signInWithGoogle() {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        // Add scopes if you need them:
        // scopes: "openid email profile"
      },
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-black/90 text-white grid place-items-center text-lg font-semibold">
          OA
        </div>
        <h1 className="text-center text-xl font-semibold">One &amp; Only Bookkeeping</h1>
        <p className="mt-1 text-center text-sm text-gray-500">Sign in to continue</p>

        <div className="mt-6 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm ${
              tab === "signin" ? "bg-white shadow font-medium" : "text-gray-600"
            }`}
            onClick={() => setTab("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm ${
              tab === "signup" ? "bg-white shadow font-medium" : "text-gray-600"
            }`}
            onClick={() => setTab("signup")}
          >
            Create account
          </button>
        </div>

        {tab === "signin" ? (
          <form className="mt-6 space-y-3" onSubmit={signInWithEmail}>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-md border px-3 py-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-md border px-3 py-2"
                placeholder="Your password"
              />
            </div>
            <button className="mt-2 w-full rounded-md bg-gray-900 py-2 text-white">
              Sign in
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-3" onSubmit={signUpWithEmail}>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-md border px-3 py-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-md border px-3 py-2"
                placeholder="Choose a password"
              />
            </div>
            <button className="mt-2 w-full rounded-md bg-gray-900 py-2 text-white">
              Create account
            </button>
          </form>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
