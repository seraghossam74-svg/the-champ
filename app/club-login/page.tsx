"use client";

import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../../firebase";

export default function ClubLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");

    if (!email.trim() || !password) {
      setError("من فضلك اكتب الإيميل وكلمة المرور");
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth(app);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      window.location.href = "/club";
    } catch (error: any) {
      console.error("CLUB LOGIN ERROR:", error);

      setError(
        error?.message || "حدث خطأ أثناء تسجيل الدخول"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"
    >
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <div className="text-5xl">🏢</div>

          <h1 className="mt-4 text-3xl font-extrabold">
            دخول النادي
          </h1>

          <p className="mt-2 text-slate-400">
            The Champ
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

          <label className="mb-2 block text-sm text-slate-300">
            إيميل النادي
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="إيميل النادي"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          />

          <label className="mb-2 mt-5 block text-sm text-slate-300">
            كلمة المرور
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          />

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-white py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {loading ? "جاري تسجيل الدخول..." : "دخول النادي"}
          </button>

        </div>

      </div>
    </main>
  );
}