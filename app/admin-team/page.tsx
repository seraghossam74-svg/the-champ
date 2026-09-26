"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import app from "../../firebase";

type Team = {
  id: string;
  name: string;
  birthYear: string;
  clubId: string;
  clubName: string;
};

type Player = {
  id: string;
  fullName: string;
  position?: string;
  jerseyNumber?: string;
  approvalStatus?: string;
  playerStatus?: string;
};

export default function AdminTeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeam() {
      try {
        const params = new URLSearchParams(window.location.search);
        const teamId = params.get("id");

        if (!teamId) {
          setError("لم يتم تحديد الفريق");
          setLoading(false);
          return;
        }

        const db = getFirestore(app);

        const teamRef = doc(db, "teams", teamId);
        const teamSnapshot = await getDoc(teamRef);

        if (!teamSnapshot.exists()) {
          setError("الفريق غير موجود");
          setLoading(false);
          return;
        }

        const teamData = teamSnapshot.data();

        const teamInfo: Team = {
          id: teamSnapshot.id,
          name: teamData.name || "",
          birthYear: teamData.birthYear || "",
          clubId: teamData.clubId || "",
          clubName: teamData.clubName || "",
        };

        setTeam(teamInfo);

        const playersQuery = query(
          collection(db, "players"),
          where("teamId", "==", teamId)
        );

        const playersSnapshot = await getDocs(playersQuery);

        const playersData = playersSnapshot.docs.map((playerDoc) => ({
          id: playerDoc.id,
          ...(playerDoc.data() as Omit<Player, "id">),
        }));

        setPlayers(playersData);
      } catch (error: any) {
        console.error("ADMIN TEAM ERROR:", error);
        setError(
          error?.message || "حدث خطأ أثناء تحميل بيانات الفريق"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, []);

  function goBack() {
    if (team?.clubId) {
      window.location.href =
        "/admin-club?id=" + team.clubId;
    } else {
      window.location.href = "/clubs";
    }
  }

  function openPlayer(playerId: string) {
    window.location.href = "/admin-player?id=" + playerId;
  }

  function getApprovalText(status?: string) {
    if (status === "approved") return "معتمد";
    if (status === "rejected") return "مرفوض";
    if (status === "pending") return "قيد المراجعة";
    return "غير محدد";
  }

  function getApprovalStyle(status?: string) {
    if (status === "approved") {
      return {
        background: "#064e3b",
        color: "#6ee7b7",
      };
    }

    if (status === "rejected") {
      return {
        background: "#7f1d1d",
        color: "#fca5a5",
      };
    }

    return {
      background: "#713f12",
      color: "#fde68a",
    };
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#0b1220",
          color: "#fff",
          fontFamily: "Arial",
        }}
      >
        <h2>جاري تحميل بيانات الفريق...</h2>
      </main>
    );
  }

  if (error) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#0b1220",
          color: "#fff",
          fontFamily: "Arial",
        }}
      >
        <button
          onClick={goBack}
          style={{
            padding: "11px 20px",
            border: "1px solid #334155",
            borderRadius: "10px",
            background: "#172033",
            color: "#fff",
            cursor: "pointer",
            marginBottom: "25px",
          }}
        >
          ← رجوع
        </button>

        <h2>{error}</h2>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "35px",
        background:
          "linear-gradient(135deg, #08111f 0%, #101b2d 50%, #0b1627 100%)",
        color: "#fff",
        fontFamily: "Arial",
      }}
    >
      <button
        onClick={goBack}
        style={{
          padding: "11px 20px",
          border: "1px solid #334155",
          borderRadius: "10px",
          background: "#172033",
          color: "#fff",
          cursor: "pointer",
          marginBottom: "25px",
          fontSize: "15px",
          fontWeight: "bold",
        }}
      >
        ← رجوع للنادي
      </button>

      {team && (
        <>
          <div
            style={{
              background:
                "linear-gradient(135deg, #16243a, #111c2e)",
              padding: "28px",
              borderRadius: "20px",
              marginBottom: "30px",
              border: "1px solid #263750",
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "14px",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                }}
              >
                ⚽
              </div>

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: "28px",
                    fontWeight: "800",
                  }}
                >
                  {team.name}
                </h1>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#94a3b8",
                  }}
                >
                  قائمة لاعبي الفريق
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
              }}
            >
              <div
                style={{
                  background: "#0d1728",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #263750",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  النادي
                </div>

                <strong>{team.clubName}</strong>
              </div>

              <div
                style={{
                  background: "#0d1728",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #263750",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  الفئة
                </div>

                <strong>مواليد {team.birthYear}</strong>
              </div>

              <div
                style={{
                  background: "#0d1728",
                  padding: "15px",
                  borderRadius: "12px",
                  border: "1px solid #263750",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginBottom: "6px",
                  }}
                >
                  عدد اللاعبين
                </div>

                <strong style={{ fontSize: "20px" }}>
                  {players.length}
                </strong>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              لاعبو الفريق
            </h2>

            <span
              style={{
                background: "#1e3a8a",
                color: "#bfdbfe",
                padding: "7px 13px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              {players.length} لاعب
            </span>
          </div>

          {players.length === 0 ? (
            <div
              style={{
                background: "#111c2e",
                padding: "30px",
                borderRadius: "18px",
                border: "1px solid #263750",
                color: "#cbd5e1",
              }}
            >
              لا يوجد لاعبين مسجلين لهذا الفريق حتى الآن.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "18px",
              }}
            >
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => openPlayer(player.id)}
                  style={{
                    textAlign: "right",
                    width: "100%",
                    background:
                      "linear-gradient(145deg, #17243a, #101a2b)",
                    borderRadius: "18px",
                    padding: "22px",
                    border: "1px solid #2b3c57",
                    boxShadow:
                      "0 10px 25px rgba(0,0,0,0.2)",
                    cursor: "pointer",
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        width: "45px",
                        height: "45px",
                        borderRadius: "12px",
                        background: "#1d4ed8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "21px",
                      }}
                    >
                      👤
                    </div>

                    <span
                      style={{
                        ...getApprovalStyle(
                          player.approvalStatus
                        ),
                        padding: "7px 11px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {getApprovalText(
                        player.approvalStatus
                      )}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 18px",
                      fontSize: "20px",
                      fontWeight: "800",
                      color: "#fff",
                    }}
                  >
                    {player.fullName}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        background: "#0d1728",
                        padding: "11px 13px",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8" }}>
                        المركز:{" "}
                      </span>
                      <strong>
                        {player.position || "غير محدد"}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#0d1728",
                        padding: "11px 13px",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8" }}>
                        رقم القميص:{" "}
                      </span>
                      <strong>
                        {player.jerseyNumber || "غير محدد"}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#0d1728",
                        padding: "11px 13px",
                        borderRadius: "10px",
                      }}
                    >
                      <span style={{ color: "#94a3b8" }}>
                        حالة اللاعب:{" "}
                      </span>
                      <strong>
                        {player.playerStatus === "released"
                          ? "مُخلى طرفه"
                          : "نشط"}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "18px",
                      padding: "10px",
                      background: "#1d4ed8",
                      borderRadius: "10px",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    عرض بيانات اللاعب ←
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}