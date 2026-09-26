"use client";

import { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../firebase";

type Club = {
  id: string;
  name: string;
  email: string;
  userId: string;
  status: string;
};

export default function ClubsPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const db = getFirestore(app);

  async function loadClubs() {
    try {
      const snapshot = await getDocs(collection(db, "clubs"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Club, "id">),
      }));

      setClubs(data);
    } catch (error) {
      console.error(error);
      setMessage("تعذر تحميل الأندية");
    }
  }

  useEffect(() => {
    loadClubs();
  }, []);

  async function addClub() {
    setMessage("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage("من فضلك اكتب كل البيانات");
      return;
    }

    if (password.length < 6) {
      setMessage("كلمة المرور لازم تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setMessage("يجب تسجيل الدخول كأدمن أولاً");
        return;
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "حدث خطأ أثناء إضافة النادي");
        return;
      }

      setName("");
      setEmail("");
      setPassword("");
      setMessage("تم إضافة النادي بنجاح ✅");

      await loadClubs();

      setTimeout(() => {
        setShowForm(false);
        setMessage("");
      }, 1200);
    } catch (error: any) {
      console.error(error);
      setMessage(error.message || "حدث خطأ أثناء إضافة النادي");
    } finally {
      setLoading(false);
    }
  }

  function openClub(clubId: string) {
    window.location.href = "/admin-club?id=" + clubId;
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-6 py-10 text-white lg:px-10"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-400">
              لوحة الأدمن
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              🏢 الأندية
            </h1>

            <p className="mt-3 text-slate-400">
              إدارة الأندية وحساباتها
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
          >
            + إضافة نادي
          </button>
        </div>

        {clubs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">

            <div className="flex flex-col items-center justify-center py-20 text-center">

              <div className="text-5xl">
                🏢
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                لا توجد أندية حتى الآن
              </h2>

              <p className="mt-3 text-slate-400">
                ابدأ بإضافة أول نادي للبطولة
              </p>

              <button
                onClick={() => setShowForm(true)}
                className="mt-6 rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
              >
                + إضافة أول نادي
              </button>

            </div>

          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {clubs.map((club) => (
              <button
                key={club.id}
                onClick={() => openClub(club.id)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-right transition hover:border-white/30 hover:bg-white/10"
              >

                <div className="text-4xl">
                  🏢
                </div>

                <h2 className="mt-4 text-2xl font-bold">
                  {club.name}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {club.email}
                </p>

                <div className="mt-5 inline-flex rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                  ● نشط
                </div>

                <div className="mt-5 rounded-xl bg-white/5 px-4 py-3 text-center text-sm font-bold text-slate-300">
                  عرض فرق النادي ←
                </div>

              </button>
            ))}

          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    إضافة نادي جديد
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    حساب واحد للنادي بالكامل
                  </p>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-2 text-slate-400"
                >
                  ✕
                </button>

              </div>

              <div className="space-y-5">

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    اسم النادي
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: Alpha United"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    إيميل النادي
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="club@example.com"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    كلمة المرور
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                  />
                </div>

                {message && (
                  <p className="rounded-xl bg-white/5 px-4 py-3 text-center text-sm">
                    {message}
                  </p>
                )}

              </div>

              <div className="mt-7 flex gap-3">

                <button
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-white/10 px-5 py-3 font-bold text-slate-300"
                >
                  إلغاء
                </button>

                <button
                  onClick={addClub}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-white px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
                >
                  {loading ? "جاري الإضافة..." : "إضافة النادي"}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}