"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
import app from "../../firebase";

type Player = {
  id: string;

  fullName: string;
  dateOfBirth: string;
  nationalId: string;
  motherName: string;
  school: string;
  position: string;
  jerseyNumber: string;
  guardianPhone: string;

  photoUrl: string;

  clubId: string;
  clubName: string;

  teamId: string;
  teamName: string;

  birthYear: string;

  approvalStatus: string;
  rejectionReason: string;

  registrationNumber?: string;
  registrationDate?: string;
};

export default function PlayersPage() {
  const db = getFirestore(app);

  const [players, setPlayers] = useState<Player[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [showDetails, setShowDetails] = useState(false);
  const [detailsPlayer, setDetailsPlayer] =
    useState<Player | null>(null);

  const [showReject, setShowReject] = useState(false);
  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  async function loadPlayers() {
    try {
      setLoading(true);
      setMessage("");

      const snapshot = await getDocs(
        collection(db, "players")
      );

      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Player, "id">),
      }));

      setPlayers(data);
    } catch (error) {
      console.error(error);
      setMessage("تعذر تحميل اللاعبين");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlayers();
  }, []);

  async function approvePlayer(player: Player) {
    setMessage("");
    setSaving(true);

    try {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("يجب تسجيل الدخول كأدمن");
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch(
        "/api/players/approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            playerId: player.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "حدث خطأ أثناء اعتماد اللاعب"
        );
      }

      setMessage(
        `تم اعتماد اللاعب ${player.fullName} ✅ — رقم التسجيل: ${data.registrationNumber}`
      );

      setShowDetails(false);
      setDetailsPlayer(null);

      await loadPlayers();
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.message ||
          "حدث خطأ أثناء اعتماد اللاعب"
      );
    } finally {
      setSaving(false);
    }
  }

  function openReject(player: Player) {
    setSelectedPlayer(player);
    setRejectionReason("");
    setShowReject(true);
  }

  async function rejectPlayer() {
    if (!selectedPlayer) return;

    if (!rejectionReason.trim()) {
      setMessage("اكتب سبب رفض اللاعب");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const playerRef = doc(
        db,
        "players",
        selectedPlayer.id
      );

      await updateDoc(playerRef, {
        approvalStatus: "rejected",
        rejectionReason:
          rejectionReason.trim(),
      });

      setShowReject(false);
      setSelectedPlayer(null);
      setRejectionReason("");

      setMessage(
        `تم رفض اللاعب ${selectedPlayer.fullName}`
      );

      await loadPlayers();
    } catch (error) {
      console.error(error);
      setMessage("حدث خطأ أثناء رفض اللاعب");
    } finally {
      setSaving(false);
    }
  }

  function statusBadge(status: string) {
    if (status === "approved") {
      return (
        <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
          ● معتمد
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
          ● مرفوض
        </span>
      );
    }

    return (
      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400">
        ● قيد المراجعة
      </span>
    );
  }

  const pendingPlayers = players.filter(
    (player) =>
      player.approvalStatus === "pending"
  );

  const approvedPlayers = players.filter(
    (player) =>
      player.approvalStatus === "approved"
  );

  const rejectedPlayers = players.filter(
    (player) =>
      player.approvalStatus === "rejected"
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-6 py-10 text-white lg:px-10"
    >
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <p className="text-sm text-slate-400">
            لوحة الأدمن
          </p>

          <h1 className="mt-2 text-4xl font-extrabold">
            👤 مراجعة اللاعبين
          </h1>

          <p className="mt-3 text-slate-400">
            مراجعة بيانات اللاعبين المرسلة من الأندية
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-center">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">
              إجمالي اللاعبين
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {players.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-5">
            <p className="text-sm text-yellow-400">
              قيد المراجعة
            </p>
            <p className="mt-2 text-3xl font-extrabold text-yellow-400">
              {pendingPlayers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/10 bg-green-500/5 p-5">
            <p className="text-sm text-green-400">
              معتمد
            </p>
            <p className="mt-2 text-3xl font-extrabold text-green-400">
              {approvedPlayers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-5">
            <p className="text-sm text-red-400">
              مرفوض
            </p>
            <p className="mt-2 text-3xl font-extrabold text-red-400">
              {rejectedPlayers.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-slate-400">
            جاري تحميل اللاعبين...
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center">
            <div className="text-5xl">👤</div>

            <h2 className="mt-5 text-2xl font-bold">
              لا يوجد لاعبون حتى الآن
            </h2>

            <p className="mt-3 text-slate-400">
              عندما يضيف أحد الأندية لاعبين
              سيظهرون هنا
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-4 p-5">

                  {player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt={player.fullName}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                      👤
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-bold">
                      {player.fullName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {player.clubName || "-"}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {player.teamName || "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-white/10 p-5">

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-400">
                      مواليد
                    </span>

                    <span>
                      {player.birthYear || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-400">
                      المركز
                    </span>

                    <span>
                      {player.position || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-400">
                      رقم القميص
                    </span>

                    <span>
                      {player.jerseyNumber || "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-400">
                      الحالة
                    </span>

                    {statusBadge(
                      player.approvalStatus
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setDetailsPlayer(player);
                      setShowDetails(true);
                    }}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white transition hover:bg-white/10"
                  >
                    👁️ عرض البيانات كاملة
                  </button>

                  {player.rejectionReason && (
                    <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                      <span className="font-bold">
                        سبب الرفض:
                      </span>{" "}
                      {player.rejectionReason}
                    </div>
                  )}

                  {player.registrationNumber && (
                    <div className="rounded-xl bg-blue-500/10 p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">
                          رقم التسجيل
                        </span>

                        <span className="font-bold text-blue-400">
                          {player.registrationNumber}
                        </span>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <span className="text-slate-400">
                          تاريخ التسجيل
                        </span>

                        <span>
                          {player.registrationDate || "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  {player.approvalStatus ===
                    "pending" && (
                    <div className="flex gap-3 pt-2">

                      <button
                        onClick={() =>
                          approvePlayer(player)
                        }
                        disabled={saving}
                        className="flex-1 rounded-xl bg-green-500 px-4 py-3 font-bold text-white transition hover:bg-green-600 disabled:opacity-50"
                      >
                        {saving
                          ? "جاري..."
                          : "✓ اعتماد"}
                      </button>

                      <button
                        onClick={() =>
                          openReject(player)
                        }
                        disabled={saving}
                        className="flex-1 rounded-xl bg-red-500/10 px-4 py-3 font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        ✕ رفض
                      </button>

                    </div>
                  )}

                  {player.approvalStatus ===
                    "approved" && (
                    <div className="rounded-xl bg-green-500/10 px-4 py-3 text-center text-sm text-green-400">
                      ✓ تم اعتماد اللاعب
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}

        {showDetails && detailsPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">

            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6">

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    بيانات اللاعب
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    مراجعة بيانات اللاعب
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowDetails(false);
                    setDetailsPlayer(null);
                  }}
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-white/5"
                >
                  ✕
                </button>

              </div>

              <div className="mb-8 flex flex-col items-center">

                {detailsPlayer.photoUrl ? (
                  <img
                    src={detailsPlayer.photoUrl}
                    alt={detailsPlayer.fullName}
                    className="h-36 w-36 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-slate-800 text-6xl">
                    👤
                  </div>
                )}

                <h3 className="mt-4 text-2xl font-bold">
                  {detailsPlayer.fullName}
                </h3>

                <div className="mt-2">
                  {statusBadge(
                    detailsPlayer.approvalStatus
                  )}
                </div>

              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <Info
                  label="الاسم بالكامل"
                  value={detailsPlayer.fullName}
                />

                <Info
                  label="النادي"
                  value={detailsPlayer.clubName}
                />

                <Info
                  label="الفريق"
                  value={detailsPlayer.teamName}
                />

                <Info
                  label="سنة الميلاد"
                  value={detailsPlayer.birthYear}
                />

                <Info
                  label="تاريخ الميلاد"
                  value={detailsPlayer.dateOfBirth}
                />

                <Info
                  label="الرقم القومي"
                  value={detailsPlayer.nationalId}
                />

                <Info
                  label="اسم الأم"
                  value={detailsPlayer.motherName}
                />

                <Info
                  label="المدرسة"
                  value={detailsPlayer.school}
                />

                <Info
                  label="المركز"
                  value={detailsPlayer.position}
                />

                <Info
                  label="رقم القميص"
                  value={detailsPlayer.jerseyNumber}
                />

                <Info
                  label="رقم ولي الأمر"
                  value={detailsPlayer.guardianPhone}
                />

                <Info
                  label="رقم التسجيل"
                  value={
                    detailsPlayer.registrationNumber ||
                    "سيتم إنشاؤه عند الاعتماد"
                  }
                />

                <Info
                  label="تاريخ التسجيل"
                  value={
                    detailsPlayer.registrationDate ||
                    "سيتم تحديده عند الاعتماد"
                  }
                />

              </div>

              {detailsPlayer.rejectionReason && (
                <div className="mt-5 rounded-xl bg-red-500/10 p-4 text-red-300">

                  <p className="font-bold">
                    سبب الرفض
                  </p>

                  <p className="mt-1 text-sm">
                    {detailsPlayer.rejectionReason}
                  </p>

                </div>
              )}

              {detailsPlayer.approvalStatus ===
                "pending" && (
                <div className="mt-6 flex gap-3">

                  <button
                    onClick={() =>
                      approvePlayer(detailsPlayer)
                    }
                    disabled={saving}
                    className="flex-1 rounded-xl bg-green-500 py-3 font-bold text-white disabled:opacity-50"
                  >
                    {saving
                      ? "جاري الاعتماد..."
                      : "✓ اعتماد اللاعب"}
                  </button>

                  <button
                    onClick={() =>
                      openReject(detailsPlayer)
                    }
                    disabled={saving}
                    className="flex-1 rounded-xl bg-red-500/10 py-3 font-bold text-red-400 disabled:opacity-50"
                  >
                    ✕ رفض اللاعب
                  </button>

                </div>
              )}

              <button
                onClick={() => {
                  setShowDetails(false);
                  setDetailsPlayer(null);
                }}
                className="mt-4 w-full rounded-xl border border-white/10 py-3 font-bold text-slate-300"
              >
                إغلاق
              </button>

            </div>
          </div>
        )}

        {showReject && selectedPlayer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">

            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">

              <h2 className="text-2xl font-bold">
                رفض اللاعب
              </h2>

              <p className="mt-2 text-slate-400">
                اللاعب:{" "}
                {selectedPlayer.fullName}
              </p>

              <label className="mb-2 mt-6 block text-sm text-slate-300">
                سبب الرفض
              </label>

              <textarea
                value={rejectionReason}
                onChange={(e) =>
                  setRejectionReason(
                    e.target.value
                  )
                }
                placeholder="اكتب سبب رفض اللاعب..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
              />

              <div className="mt-6 flex gap-3">

                <button
                  onClick={() => {
                    setShowReject(false);
                    setSelectedPlayer(null);
                    setRejectionReason("");
                  }}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-white/10 px-5 py-3 font-bold text-slate-300"
                >
                  إلغاء
                </button>

                <button
                  onClick={rejectPlayer}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-red-500 px-5 py-3 font-bold text-white disabled:opacity-50"
                >
                  {saving
                    ? "جاري الحفظ..."
                    : "تأكيد الرفض"}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-950 p-4">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-bold">
        {value || "-"}
      </p>

    </div>
  );
}