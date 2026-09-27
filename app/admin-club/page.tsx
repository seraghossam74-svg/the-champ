"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../firebase";

type Club = {
  id: string;
  name: string;
  email: string;
};

type Team = {
  id: string;
  name: string;
  birthYear: string;
  clubId: string;
};

const SUPER_ADMIN_UID =
  "CP12ohOiNoWpcNkXmZhmalZw8eD3";

export default function AdminClubPage() {
  const [club, setClub] =
    useState<Club | null>(null);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingTeamId, setDeletingTeamId] =
    useState<string | null>(null);

  const [isSuperAdmin, setIsSuperAdmin] =
    useState(false);

  useEffect(() => {
    async function checkSuperAdmin() {
      try {
        const auth = getAuth(app);

        await auth.authStateReady();

        const user = auth.currentUser;

        setIsSuperAdmin(
          user?.uid === SUPER_ADMIN_UID
        );
      } catch (error) {
        console.error(
          "AUTH CHECK ERROR:",
          error
        );
        setIsSuperAdmin(false);
      }
    }

    checkSuperAdmin();
  }, []);

  useEffect(() => {
    async function loadClub() {
      try {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const clubId =
          params.get("id");

        if (!clubId) {
          setError(
            "لم يتم تحديد النادي"
          );
          setLoading(false);
          return;
        }

        const db =
          getFirestore(app);

        const clubQuery =
          query(
            collection(db, "clubs"),
            where(
              "__name__",
              "==",
              clubId
            )
          );

        const clubSnapshot =
          await getDocs(
            clubQuery
          );

        if (clubSnapshot.empty) {
          setError(
            "النادي غير موجود"
          );
          setLoading(false);
          return;
        }

        const clubDoc =
          clubSnapshot.docs[0];

        setClub({
          id: clubDoc.id,
          ...(clubDoc.data() as Omit<
            Club,
            "id"
          >),
        });

        const teamsQuery =
          query(
            collection(db, "teams"),
            where(
              "clubId",
              "==",
              clubId
            )
          );

        const teamsSnapshot =
          await getDocs(
            teamsQuery
          );

        const teamsData =
          teamsSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<
                Team,
                "id"
              >),
            })
          );

        teamsData.sort(
          (a, b) =>
            String(
              a.birthYear
            ).localeCompare(
              String(b.birthYear)
            )
        );

        setTeams(teamsData);
      } catch (error: any) {
        console.error(
          "ADMIN CLUB ERROR:",
          error
        );

        setError(
          error?.message ||
            "حدث خطأ أثناء تحميل بيانات النادي"
        );
      } finally {
        setLoading(false);
      }
    }

    loadClub();
  }, []);

  function openTeam(
    teamId: string
  ) {
    window.location.href =
      "/admin-team?id=" + teamId;
  }

  function addTeam() {
    if (!club) return;

    window.location.href =
      "/admin-add-team?clubId=" +
      club.id;
  }

  function goBack() {
    window.location.href =
      "/clubs";
  }

  function goHome() {
    window.location.href =
      "/admin";
  }

  async function deleteTeam(
    team: Team
  ) {
    if (!isSuperAdmin) {
      alert(
        "حذف الفريق متاح للـSUPER ADMIN فقط"
      );
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف الفريق؟\n\n${team.name}\n\nلا يمكن حذف الفريق إذا كان يحتوي على لاعبين.`
      );

    if (!confirmed) return;

    try {
      setDeletingTeamId(
        team.id
      );

      const auth =
        getAuth(app);

      await auth.authStateReady();

      const currentUser =
        auth.currentUser;

      if (
        !currentUser ||
        currentUser.uid !==
          SUPER_ADMIN_UID
      ) {
        throw new Error(
          "حذف الفريق متاح للـSUPER ADMIN فقط"
        );
      }

      const idToken =
        await currentUser.getIdToken();

      const response =
        await fetch(
          "/api/teams/delete",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              teamId: team.id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر حذف الفريق"
        );
      }

      setTeams(
        (currentTeams) =>
          currentTeams.filter(
            (item) =>
              item.id !== team.id
          )
      );
    } catch (error: any) {
      console.error(
        "DELETE TEAM ERROR:",
        error
      );

      alert(
        error?.message ||
          "حدث خطأ أثناء حذف الفريق"
      );
    } finally {
      setDeletingTeamId(null);
    }
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
        <h2>
          جاري تحميل بيانات النادي...
        </h2>
      </main>
    );
  }

  if (error) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          padding: "30px",
          background: "#0b1220",
          color: "#fff",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "25px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={goHome}
            style={{
              padding:
                "12px 22px",
              border: "none",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            🏠 القائمة الرئيسية
          </button>

          <button
            onClick={goBack}
            style={{
              padding:
                "12px 22px",
              border:
                "1px solid #334155",
              borderRadius: "10px",
              background: "#172033",
              color: "#fff",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "bold",
            }}
          >
            ← رجوع للأندية
          </button>
        </div>

        <h2>{error}</h2>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        padding: "30px",
        background:
          "linear-gradient(135deg, #08111f 0%, #101b2d 50%, #0b1627 100%)",
        color: "#fff",
        fontFamily: "Arial",
      }}
    >
      {/* Navigation */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={goHome}
          style={{
            padding: "13px 24px",
            border: "none",
            borderRadius: "10px",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold",
            boxShadow:
              "0 5px 15px rgba(37,99,235,0.25)",
          }}
        >
          🏠 القائمة الرئيسية
        </button>

        <button
          onClick={goBack}
          style={{
            padding: "13px 24px",
            border:
              "1px solid #334155",
            borderRadius: "10px",
            background: "#172033",
            color: "#fff",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          ← رجوع للأندية
        </button>
      </div>

      {club && (
        <>
          {/* Club Information */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #16243a, #111c2e)",
              padding: "28px",
              borderRadius: "20px",
              marginBottom: "30px",
              border:
                "1px solid #263750",
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "15px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "#2563eb",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "25px",
                  fontWeight: "bold",
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
                  {club.name}
                </h1>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#94a3b8",
                  }}
                >
                  إدارة فرق النادي
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
              }}
            >
              <div
                style={{
                  background: "#0d1728",
                  padding: "15px",
                  borderRadius: "12px",
                  border:
                    "1px solid #263750",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginBottom:
                      "6px",
                  }}
                >
                  البريد الإلكتروني
                </div>

                <strong>
                  {club.email}
                </strong>
              </div>

              <div
                style={{
                  background: "#0d1728",
                  padding: "15px",
                  borderRadius: "12px",
                  border:
                    "1px solid #263750",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "13px",
                    marginBottom:
                      "6px",
                  }}
                >
                  عدد الفرق
                </div>

                <strong
                  style={{
                    fontSize: "20px",
                  }}
                >
                  {teams.length}
                </strong>
              </div>
            </div>
          </div>

          {/* Teams Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              marginBottom: "18px",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
              }}
            >
              فرق النادي
            </h2>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "10px",
              }}
            >
              <button
                onClick={addTeam}
                style={{
                  padding:
                    "10px 16px",
                  border: "none",
                  borderRadius: "10px",
                  background:
                    "#2563eb",
                  color: "#fff",
                  cursor:
                    "pointer",
                  fontSize: "14px",
                  fontWeight:
                    "bold",
                }}
              >
                ➕ إضافة فريق
              </button>

              <span
                style={{
                  background:
                    "#1e3a8a",
                  color: "#bfdbfe",
                  padding:
                    "7px 13px",
                  borderRadius:
                    "20px",
                  fontSize: "13px",
                  fontWeight:
                    "bold",
                }}
              >
                {teams.length} فرق
              </span>
            </div>
          </div>

          {/* Teams */}
          {teams.length === 0 ? (
            <div
              style={{
                background:
                  "#111c2e",
                padding: "30px",
                borderRadius:
                  "18px",
                border:
                  "1px solid #263750",
                color:
                  "#cbd5e1",
              }}
            >
              لا توجد فرق لهذا النادي
              حتى الآن.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(270px, 1fr))",
                gap: "18px",
              }}
            >
              {teams.map(
                (team) => (
                  <div
                    key={team.id}
                    style={{
                      textAlign:
                        "right",
                      background:
                        "linear-gradient(145deg, #17243a, #101a2b)",
                      border:
                        "1px solid #2b3c57",
                      borderRadius:
                        "18px",
                      padding:
                        "22px",
                      color: "#fff",
                      boxShadow:
                        "0 10px 25px rgba(0,0,0,0.2)",
                    }}
                  >
                    {/* Team info / Open button */}
                    <button
                      type="button"
                      onClick={() =>
                        openTeam(
                          team.id
                        )
                      }
                      style={{
                        width:
                          "100%",
                        textAlign:
                          "right",
                        background:
                          "transparent",
                        border: "none",
                        padding: 0,
                        cursor:
                          "pointer",
                        color:
                          "#fff",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "18px",
                        }}
                      >
                        <div
                          style={{
                            width:
                              "45px",
                            height:
                              "45px",
                            borderRadius:
                              "12px",
                            background:
                              "#1d4ed8",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            fontSize:
                              "21px",
                          }}
                        >
                          ⚽
                        </div>

                        <span
                          style={{
                            background:
                              "#0f2b52",
                            color:
                              "#93c5fd",
                            padding:
                              "6px 10px",
                            borderRadius:
                              "8px",
                            fontSize:
                              "12px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          مواليد{" "}
                          {team.birthYear}
                        </span>
                      </div>

                      <h3
                        style={{
                          margin:
                            "0 0 10px",
                          fontSize:
                            "20px",
                          fontWeight:
                            "800",
                        }}
                      >
                        {team.name}
                      </h3>

                      <div
                        style={{
                          color:
                            "#94a3b8",
                          fontSize:
                            "14px",
                          marginBottom:
                            "18px",
                        }}
                      >
                        فريق نادي{" "}
                        {club.name}
                      </div>

                      <div
                        style={{
                          padding:
                            "11px 14px",
                          borderRadius:
                            "10px",
                          background:
                            "#2563eb",
                          color: "#fff",
                          textAlign:
                            "center",
                          fontWeight:
                            "bold",
                          fontSize:
                            "14px",
                        }}
                      >
                        عرض اللاعبين ←
                      </div>
                    </button>

                    {/* Delete */}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          deleteTeam(
                            team
                          )
                        }
                        disabled={
                          deletingTeamId ===
                          team.id
                        }
                        style={{
                          width:
                            "100%",
                          marginTop:
                            "12px",
                          padding:
                            "11px 14px",
                          borderRadius:
                            "10px",
                          border:
                            "1px solid #991b1b",
                          background:
                            deletingTeamId ===
                            team.id
                              ? "#475569"
                              : "#450a0a",
                          color:
                            "#fca5a5",
                          cursor:
                            deletingTeamId ===
                            team.id
                              ? "not-allowed"
                              : "pointer",
                          fontSize:
                            "14px",
                          fontWeight:
                            "bold",
                        }}
                      >
                        {deletingTeamId ===
                        team.id
                          ? "جاري الحذف..."
                          : "🗑 حذف الفريق"}
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}