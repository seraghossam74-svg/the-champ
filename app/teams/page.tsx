"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import app from "../../firebase";

type Club = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  birthYear: string;
  clubId: string;
  clubName: string;
};

export default function TeamsPage() {
  const db = getFirestore(app);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [clubId, setClubId] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const clubsSnapshot = await getDocs(collection(db, "clubs"));

      const clubsData = clubsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: String(doc.data().name || ""),
      }));

      setClubs(clubsData);

      const teamsSnapshot = await getDocs(collection(db, "teams"));

      const teamsData = teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Team, "id">),
      }));

      setTeams(teamsData);
    } catch (error) {
      console.error(error);
      setMessage("تعذر تحميل البيانات");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addTeam() {
    setMessage("");

    if (!clubId || !birthYear) {
      setMessage("اختار النادي وسنة الميلاد");
      return;
    }

    const selectedClub = clubs.find((club) => club.id === clubId);

    if (!selectedClub) {
      setMessage("النادي غير موجود");
      return;
    }

    const alreadyExists = teams.some(
      (team) =>
        team.clubId === clubId &&
        team.birthYear === birthYear
    );

    if (alreadyExists) {
      setMessage("الفريق ده موجود بالفعل للنادي");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "teams"), {
        clubId,
        clubName: selectedClub.name,
        birthYear,
        name: `${selectedClub.name} ${birthYear}`,
        createdAt: serverTimestamp(),
      });

      setBirthYear("");
      setClubId("");
      setMessage("تم إضافة الفريق بنجاح ✅");

      await loadData();

      setTimeout(() => {
        setShowForm(false);
        setMessage("");
      }, 1200);
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء إضافة الفريق");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-6 py-10 text-white lg:px-10"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-400">لوحة الأدمن</p>

            <h1 className="mt-2 text-4xl font-extrabold">
              ⚽ الفرق
            </h1>

            <p className="mt-3 text-slate-400">
              إدارة فرق الأندية حسب سنة الميلاد
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
          >
            + إضافة فريق
          </button>
        </div>

        {teams.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col items-center justify-center py-20 text-center">

              <div className="text-5xl">⚽</div>

              <h2 className="mt-5 text-2xl font-bold">
                لا توجد فرق حتى الآن
              </h2>

              <p className="mt-3 text-slate-400">
                ابدأ بإضافة أول فريق
              </p>

              <button
                onClick={() => setShowForm(true)}
                className="mt-6 rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
              >
                + إضافة أول فريق
              </button>

            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {teams.map((team) => (
              <div
                key={team.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="text-4xl">⚽</div>

                <h2 className="mt-4 text-2xl font-bold">
                  {team.clubName}
                </h2>

                <p className="mt-2 text-lg text-slate-300">
                  مواليد {team.birthYear}
                </p>

                <div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">
                  فريق
                </div>
              </div>
            ))}

          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    إضافة فريق
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    اختر النادي وسنة الميلاد
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
                    النادي
                  </label>

                  <select
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                  >
                    <option value="">
                      اختر النادي
                    </option>

                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    سنة الميلاد
                  </label>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                  >
                    <option value="">
                      اختر سنة الميلاد
                    </option>

                    {Array.from({ length: 15 }, (_, i) => 2009 + i).map(
                      (year) => (
                        <option key={year} value={String(year)}>
                          مواليد {year}
                        </option>
                      )
                    )}
                  </select>
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
                  onClick={addTeam}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-white px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
                >
                  {loading ? "جاري الإضافة..." : "إضافة الفريق"}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}