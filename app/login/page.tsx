"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClinicMark from "@/components/ClinicMark";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("كلمة المرور غير صحيحة");
        return;
      }
      const redirect = searchParams.get("redirect") || "/reception";
      router.push(redirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-blush-50 p-6 font-body">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="queue-badge mx-auto mb-4 h-14 w-14 text-xl font-display font-semibold">
            <ClinicMark />
          </div>
          <h1 className="font-display text-2xl font-semibold text-wine-700">دخول الموظفين</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-rose-400/20 bg-white p-6 shadow-soft"
        >
          <label className="mb-1 block text-sm text-plum-900/70">كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border border-rose-400/30 p-2 focus:border-wine-500 focus:outline-none"
            placeholder="••••••••"
            autoFocus
          />

          {error && <p className="mb-4 text-sm text-wine-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-wine-600 px-6 py-3 font-medium text-white transition hover:bg-wine-700 disabled:opacity-50"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </main>
  );
}

// useSearchParams لازم تكون جوه Suspense عشان Next.js يقدر يعمل static export
// للصفحة من غير ما يفشل البيلد (المشكلة اللي ظهرت في لوج Vercel)
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
