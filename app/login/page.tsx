"use client";

import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../../firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");

    try {
      const auth = getAuth(app);

      await signInWithEmailAndPassword(auth, email, password);

      window.location.href = "/admin";
    } catch (error) {
      console.error(error);
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-4xl">🏆</div>

          <h1 className="mt-4 text-3xl font-bold">The Champ</h1>

          <p className="mt-2 text-slate-400">تسجيل الدخول</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm text-slate-300">
            البريد الإلكتروني
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
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
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none"
          />

          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleLogin}
            className="mt-6 w-full rounded-xl bg-white py-3 font-bold text-slate-950"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    </main>
  );
}