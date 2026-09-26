"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";

import app from "../../firebase";

type Club = {
  id: string;
  name: string;
  email: string;
  userId: string;
};

type Team = {
  id: string;
  name: string;
  birthYear: string;
};

export default function ClubPage() {
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/club-login";
        return;
      }

      try {
        const clubQuery = query(
          collection(db, "clubs"),
          where("userId", "==", user.uid)
        );

        const clubSnapshot = await getDocs(clubQuery);

        if (clubSnapshot.empty) {
          setError("لم يتم العثور على بيانات النادي");
          setLoading(false);
          return;
        }

        const clubDoc = clubSnapshot.docs[0];

        const clubData = {
          id: clubDoc.id,
          ...(clubDoc.data() as Omit<Club, "id">),
        };

        setClub(clubData);

        const teamsQuery = query(
          collection(db, "teams"),
          where("clubId", "==", clubDoc.id)
        );

        const teamsSnapshot = await getDocs(teamsQuery);

        const teamsData = teamsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Team, "id">),
        }));

        setTeams(teamsData);
      } catch (error: any) {
        console.error("CLUB PAGE ERROR:", error);

        setError(
          error?.message ||
            "حدث خطأ أثناء تحميل بيانات النادي"
        );
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    const auth = getAuth(app);

    await signOut(auth);

    window.location.href = "/club-login";
  }

  function openTeam(teamId: string) {
    window.location.href = "/team?id=" + teamId;
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        <p className="text-slate-400">
          جاري تحميل بيانات النادي...
        </p>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-6 py-10 text-white lg:px-10"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-400">
              لوحة تحكم النادي
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              {club?.name || "النادي"} 🏢
            </h1>

            <p className="mt-3 text-slate-400">
              The Champ
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-white/10 px-5 py-3 font-bold text-slate-300 transition hover:bg-white/5"
          >
            تسجيل الخروج
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-400">
              ⚽ فرق النادي
            </p>

            <p className="mt-3 text-3xl font-bold">
              {teams.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-400">
              👤 اللاعبين
            </p>

            <p className="mt-3 text-3xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-400">
              📅 المباريات
            </p>

            <p className="mt-3 text-3xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-400">
              🏆 النقاط
            </p>

            <p className="mt-3 text-3xl font-bold">
              0
            </p>
          </div>

        </div>

        <div className="mt-10">

          <h2 className="text-2xl font-bold">
            فرق النادي
          </h2>

          <p className="mt-2 text-slate-400">
            اختار الفريق لإدارة اللاعبين والبيانات
          </p>

          {teams.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

              <div className="text-5xl">
                ⚽
              </div>

              <h3 className="mt-5 text-xl font-bold">
                لا توجد فرق حتى الآن
              </h3>

            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
                >

                  <div className="text-4xl">
                    ⚽
                  </div>

                  <h3 className="mt-4 text-2xl font-bold">
                    مواليد {team.birthYear}
                  </h3>

                  <p className="mt-2 text-slate-400">
                    {team.name}
                  </p>

                  <button
                    onClick={() => openTeam(team.id)}
                    className="mt-6 w-full rounded-xl bg-white py-3 font-bold text-slate-950 transition hover:bg-slate-200"
                  >
                    إدارة الفريق
                  </button>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}
