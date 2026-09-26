"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

import app from "../../firebase";

const db = getFirestore(app);

type Team = {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  birthYear: string;
};

type Player = {
  id: string;
  fullName: string;
  position?: string;
  jerseyNumber?: string;
  approvalStatus?: string;
};

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMessage("يجب تسجيل الدخول أولًا");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams(window.location.search);
        const teamId = params.get("id");

        if (!teamId) {
          setMessage("الفريق غير محدد");
          setLoading(false);
          return;
        }

        const clubsQuery = query(
          collection(db, "clubs"),
          where("userId", "==", user.uid)
        );

        const clubsSnapshot = await getDocs(clubsQuery);

        if (clubsSnapshot.empty) {
          setMessage("لم يتم العثور على النادي");
          setLoading(false);
          return;
        }

        const clubDoc = clubsSnapshot.docs[0];
        const clubId = clubDoc.id;
        const clubName = clubDoc.data().name || "";

        const teamRef = doc(db, "teams", teamId);
        const teamSnapshot = await getDoc(teamRef);

        if (!teamSnapshot.exists()) {
          setMessage("الفريق غير موجود");
          setLoading(false);
          return;
        }

        const teamData = teamSnapshot.data();

        if (teamData.clubId !== clubId) {
          setMessage("هذا الفريق لا يتبع ناديك");
          setLoading(false);
          return;
        }

        const currentTeam: Team = {
          id: teamSnapshot.id,
          name: teamData.name || "",
          clubId: teamData.clubId || "",
          clubName: teamData.clubName || clubName,
          birthYear: String(teamData.birthYear || ""),
        };

        setTeam(currentTeam);

        const playersQuery = query(
          collection(db, "players"),
          where("teamId", "==", teamId),
          where("clubId", "==", clubId)
        );

        const playersSnapshot = await getDocs(playersQuery);

        const playersList: Player[] = playersSnapshot.docs.map(
          (playerDoc) => {
            const data = playerDoc.data();

            return {
              id: playerDoc.id,
              fullName: data.fullName || "",
              position: data.position || "",
              jerseyNumber: data.jerseyNumber || "",
              approvalStatus: data.approvalStatus || "pending",
            };
          }
        );

        setPlayers(playersList);
      } catch (error) {
        console.error(error);
        setMessage("حدث خطأ أثناء تحميل بيانات الفريق");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-6 py-10 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-400">
            جاري تحميل الفريق...
          </p>
        </div>
      </main>
    );
  }

  if (message) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-6 py-10 text-white"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {message}
          </div>
        </div>
      </main>
    );
  }

  if (!team) {
    return null;
  }

  const addPlayerLink = "/club-players?teamId=" + team.id;

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-6 py-10 text-white"
    >
      <div className="mx-auto max-w-7xl">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">
              تفاصيل الفريق
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              ⚽ {team.clubName}
            </h1>

            <p className="mt-2 text-xl text-slate-400">
              مواليد {team.birthYear}
            </p>
          </div>

          <a
            href={addPlayerLink}
            className="rounded-xl bg-white px-6 py-3 text-center font-bold text-slate-950 transition hover:bg-slate-200"
          >
            ➕ إضافة لاعب
          </a>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-400">
              👥 لاعبي الفريق
            </p>

            <p className="mt-3 text-3xl font-bold">
              {players.length}
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

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-slate-400">
              🥅 الأهداف
            </p>

            <p className="mt-3 text-3xl font-bold">
              0
            </p>
          </div>

        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                لاعبو الفريق
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                لاعبو {team.clubName} — مواليد {team.birthYear}
              </p>
            </div>

            <span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm">
              {players.length} لاعب
            </span>

          </div>

          {players.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-white/10 p-10 text-center">

              <p className="text-lg text-slate-400">
                لا يوجد لاعبين في الفريق حتى الآن
              </p>

              <a
                href={addPlayerLink}
                className="mt-5 inline-block rounded-xl bg-white px-6 py-3 font-bold text-slate-950"
              >
                ➕ إضافة أول لاعب
              </a>

            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {players.map((player) => (
                <div
                  key={player.id}
                  className="rounded-xl border border-white/10 bg-slate-900 p-5"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <h3 className="text-lg font-bold">
                        {player.fullName}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        {player.position || "لم يتم تحديد المركز"}
                      </p>
                    </div>

                    {player.jerseyNumber && (
                      <div className="rounded-lg bg-white/10 px-3 py-2 font-bold">
                        #{player.jerseyNumber}
                      </div>
                    )}

                  </div>

                  <div className="mt-4">

                    {player.approvalStatus === "approved" ? (
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                        ● معتمد
                      </span>
                    ) : player.approvalStatus === "rejected" ? (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
                        ● مرفوض
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400">
                        ● قيد المراجعة
                      </span>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}
