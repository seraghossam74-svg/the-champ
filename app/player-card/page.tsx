"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  getFirestore,
} from "firebase/firestore";
import {
  getAuth,
} from "firebase/auth";
import app from "../../firebase";

type Player = {
  fullName?: string;
  dateOfBirth?: string;
  position?: string;
  jerseyNumber?: string;

  clubName?: string;
  teamName?: string;

  approvalStatus?: string;
  registrationNumber?: string;
  registrationDate?: string;

  photo?: string;
  photoUrl?: string;
};

const SUPER_ADMIN_UID =
  "CP12ohOiNoWpcNkXmZhmalZw8eD3";

export default function PlayerCardPage() {
  const [player, setPlayer] =
    useState<Player | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadPlayer() {
      try {
        const auth =
          getAuth(app);

        await auth.authStateReady();

        const user =
          auth.currentUser;

        if (!user) {
          throw new Error(
            "يجب تسجيل الدخول أولًا"
          );
        }

        const tokenResult =
          await user.getIdTokenResult();

        const isAdmin =
          user.uid ===
            SUPER_ADMIN_UID ||
          tokenResult.claims.admin ===
            true ||
          tokenResult.claims.role ===
            "admin" ||
          tokenResult.claims.role ===
            "super_admin";

        if (!isAdmin) {
          throw new Error(
            "غير مصرح لك بطباعة الكارنيه"
          );
        }

        const params =
          new URLSearchParams(
            window.location.search
          );

        const playerId =
          params.get("id");

        if (!playerId) {
          throw new Error(
            "لم يتم تحديد اللاعب"
          );
        }

        const db =
          getFirestore(app);

        const snapshot =
          await getDoc(
            doc(
              db,
              "players",
              playerId
            )
          );

        if (!snapshot.exists()) {
          throw new Error(
            "اللاعب غير موجود"
          );
        }

        const data =
          snapshot.data() as Player;

        if (
          data.approvalStatus !==
          "approved"
        ) {
          throw new Error(
            "لا يمكن طباعة كارنيه لاعب غير معتمد"
          );
        }

        setPlayer(data);
      } catch (error: any) {
        console.error(error);

        setError(
          error?.message ||
            "حدث خطأ أثناء تحميل بيانات الكارنيه"
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlayer();
  }, []);

  function printCard() {
    window.print();
  }

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
        dir="rtl"
      >
        جاري تحميل الكارنيه...
      </main>
    );
  }

  if (error || !player) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"
        dir="rtl"
      >
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-bold text-red-300">
            تعذر فتح الكارنيه
          </h1>

          <p className="mt-3 text-slate-300">
            {error}
          </p>
        </div>
      </main>
    );
  }

  const photo =
    player.photoUrl ||
    player.photo;

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-5 py-10 print:min-h-0 print:bg-white print:p-0"
      >
        <div className="mx-auto flex max-w-xl flex-col items-center">

          <div className="mb-6 flex gap-3 print:hidden">
            <button
              onClick={printCard}
              className="rounded-xl bg-white px-6 py-3 font-black text-slate-950"
            >
              🖨 طباعة الكارنيه
            </button>

            <button
              onClick={() =>
                window.history.back()
              }
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white"
            >
              ← رجوع
            </button>
          </div>

          <div
            id="player-card"
            className="relative h-[54mm] w-[85.6mm] overflow-hidden rounded-[14px] border border-slate-300 bg-white text-slate-900 shadow-2xl print:rounded-0 print:border print:shadow-none"
          >
            <div className="h-full">

              <div className="flex h-[13mm] items-center justify-between bg-slate-950 px-3 text-white">
                <div>
                  <p className="text-[6px] font-medium text-slate-400">
                    THE CHAMP
                  </p>

                  <h1 className="text-[10px] font-black">
                    بطاقة لاعب
                  </h1>
                </div>

                <div className="text-[16px]">
                  🏆
                </div>
              </div>

              <div className="flex h-[41mm] gap-3 p-3">

                <div className="flex w-[23mm] shrink-0 flex-col">
                  <div className="h-[29mm] w-[23mm] overflow-hidden rounded-[8px] border border-slate-300 bg-slate-100">
                    {photo ? (
                      <img
                        src={photo}
                        alt={
                          player.fullName ||
                          "صورة اللاعب"
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[22px]">
                        👤
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-center">
                    <p className="text-[5px] font-bold text-slate-500">
                      رقم القيد
                    </p>

                    <p className="text-[8px] font-black">
                      {player.registrationNumber ||
                        "غير مسجل"}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">

                  <h2 className="truncate text-[12px] font-black">
                    {player.fullName ||
                      "غير مسجل"}
                  </h2>

                  <div className="mt-1 h-px bg-slate-200" />

                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">

                    <CardInfo
                      label="تاريخ الميلاد"
                      value={
                        player.dateOfBirth ||
                        "غير مسجل"
                      }
                    />

                    <CardInfo
                      label="المركز"
                      value={
                        player.position ||
                        "غير مسجل"
                      }
                    />

                    <CardInfo
                      label="النادي"
                      value={
                        player.clubName ||
                        "غير مسجل"
                      }
                    />

                    <CardInfo
                      label="الفريق"
                      value={
                        player.teamName ||
                        "غير مسجل"
                      }
                    />

                    <CardInfo
                      label="رقم القميص"
                      value={
                        player.jerseyNumber ||
                        "غير مسجل"
                      }
                    />

                    <CardInfo
                      label="تاريخ القيد"
                      value={
                        player.registrationDate ||
                        "غير مسجل"
                      }
                    />

                  </div>

                  <div className="mt-3 rounded-[6px] border border-emerald-200 bg-emerald-50 px-2 py-1 text-center">
                    <p className="text-[6px] font-bold text-emerald-700">
                      الحالة
                    </p>

                    <p className="text-[7px] font-black text-emerald-900">
                      لاعب معتمد
                    </p>
                  </div>

                  <div className="mt-2 text-[5px] text-slate-400">
                    The Champ • Player Registration Card
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          #player-card {
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

function CardInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[5px] font-bold text-slate-400">
        {label}
      </p>

      <p className="truncate text-[7px] font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}