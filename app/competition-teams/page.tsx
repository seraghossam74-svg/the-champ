"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import app from "../../firebase";

type Team = {
  id: string;
  name?: string;
  birthYear?: string;
  teamLetter?: string;
  clubId?: string;
  clubName?: string;
};

export default function CompetitionTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [competitionName, setCompetitionName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const competitionId =
          params.get("competitionId");

        const year =
          params.get("birthYear");

        if (!competitionId || !year) {
          setMessage(
            "بيانات البطولة أو سنة الميلاد غير موجودة"
          );
          setLoading(false);
          return;
        }

        setBirthYear(year);

        const db = getFirestore(app);

        // تحميل البطولة
        const competitionSnapshot =
          await getDocs(
            query(
              collection(db, "competitions"),
              where("__name__", "==", competitionId)
            )
          );

        if (!competitionSnapshot.empty) {
          const competitionData =
            competitionSnapshot.docs[0].data();

          setCompetitionName(
            competitionData.name || "البطولة"
          );
        }

        // تحميل فرق سنة الميلاد
        const teamsQuery = query(
          collection(db, "teams"),
          where("birthYear", "==", year)
        );

        const teamsSnapshot =
          await getDocs(teamsQuery);

        const teamsData = teamsSnapshot.docs.map(
          (teamDoc) => ({
            id: teamDoc.id,
            ...(teamDoc.data() as Omit<Team, "id">),
          })
        );

        setTeams(teamsData);

        // تحميل الفرق المختارة مسبقًا
        const participationQuery = query(
          collection(db, "competitionTeams"),
          where("competitionId", "==", competitionId),
          where("birthYear", "==", year)
        );

        const participationSnapshot =
          await getDocs(participationQuery);

        const selectedIds =
          participationSnapshot.docs.map(
            (item) => item.data().teamId
          );

        setSelectedTeams(selectedIds);
      } catch (error) {
        console.error(
          "LOAD COMPETITION TEAMS ERROR:",
          error
        );

        setMessage(
          "حدث خطأ أثناء تحميل الفرق"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function toggleTeam(teamId: string) {
    setSelectedTeams((current) => {
      if (current.includes(teamId)) {
        return current.filter(
          (id) => id !== teamId
        );
      }

      return [...current, teamId];
    });
  }

  async function saveTeams() {
    try {
      const params = new URLSearchParams(
        window.location.search
      );

      const competitionId =
        params.get("competitionId");

      if (!competitionId || !birthYear) {
        setMessage(
          "بيانات البطولة أو سنة الميلاد غير موجودة"
        );
        return;
      }

      setSaving(true);
      setMessage("");

      const db = getFirestore(app);

      // حذف الاختيارات القديمة
      const oldQuery = query(
        collection(db, "competitionTeams"),
        where(
          "competitionId",
          "==",
          competitionId
        ),
        where(
          "birthYear",
          "==",
          birthYear
        )
      );

      const oldSnapshot =
        await getDocs(oldQuery);

      for (const oldDoc of oldSnapshot.docs) {
        await deleteDoc(
          doc(
            db,
            "competitionTeams",
            oldDoc.id
          )
        );
      }

      // حفظ الاختيارات الجديدة
      for (const teamId of selectedTeams) {
        const team = teams.find(
          (item) => item.id === teamId
        );

        if (!team) continue;

        const participationRef = doc(
          collection(db, "competitionTeams")
        );

        await setDoc(participationRef, {
          competitionId,
          birthYear,
          teamId: team.id,
          teamName: team.name || "",
          teamLetter: team.teamLetter || "",
          clubId: team.clubId || "",
          clubName: team.clubName || "",
          createdAt: serverTimestamp(),
        });
      }

      setMessage(
        `تم حفظ ${selectedTeams.length} فريق بنجاح ✅`
      );
    } catch (error) {
      console.error(
        "SAVE COMPETITION TEAMS ERROR:",
        error
      );

      setMessage(
        "حدث خطأ أثناء حفظ الفرق"
      );
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    const params = new URLSearchParams(
      window.location.search
    );

    const competitionId =
      params.get("competitionId");

    window.location.href =
      `/competition?id=${competitionId}`;
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
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={goBack}
          style={{
            padding: "12px 22px",
            border: "none",
            borderRadius: "10px",
            background: "#1e293b",
            color: "#fff",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold",
            marginBottom: "25px",
          }}
        >
          ← العودة للبطولة
        </button>

        <div
          style={{
            background:
              "linear-gradient(145deg, #17243a, #101a2b)",
            border: "1px solid #2b3c57",
            borderRadius: "22px",
            padding: "30px",
            marginBottom: "25px",
          }}
        >
          <div style={{ fontSize: "42px" }}>
            ⚽
          </div>

          <h1
            style={{
              margin: "12px 0 8px",
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            الفرق المشاركة
          </h1>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
              fontSize: "17px",
            }}
          >
            {competitionName}
          </p>

          <div
            style={{
              display: "inline-block",
              marginTop: "15px",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "#1d4ed8",
              fontWeight: "800",
            }}
          >
            مواليد {birthYear}
          </div>
        </div>

        {loading ? (
          <div
            style={{
              background: "#111c2e",
              padding: "30px",
              borderRadius: "18px",
              border: "1px solid #263750",
            }}
          >
            جاري تحميل الفرق...
          </div>
        ) : (
          <div
            style={{
              background:
                "linear-gradient(145deg, #17243a, #101a2b)",
              border: "1px solid #2b3c57",
              borderRadius: "22px",
              padding: "30px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "23px",
                fontWeight: "800",
              }}
            >
              اختر الفرق المشاركة
            </h2>

            <p
              style={{
                color: "#94a3b8",
                marginTop: "8px",
              }}
            >
              الفرق الموجودة هنا هي الفرق المسجلة
              بالفعل في النظام.
            </p>

            {teams.length === 0 ? (
              <div
                style={{
                  marginTop: "25px",
                  padding: "25px",
                  borderRadius: "15px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                لا توجد فرق مسجلة لهذا العام حتى الآن.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "15px",
                  marginTop: "25px",
                }}
              >
                {teams.map((team) => {
                  const selected =
                    selectedTeams.includes(team.id);

                  return (
                    <button
                      key={team.id}
                      onClick={() =>
                        toggleTeam(team.id)
                      }
                      style={{
                        textAlign: "right",
                        padding: "20px",
                        borderRadius: "16px",
                        border: selected
                          ? "2px solid #2563eb"
                          : "1px solid #334155",
                        background: selected
                          ? "#172f69"
                          : "#0f172a",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "800",
                        }}
                      >
                        {selected ? "✓ " : ""}
                        {team.name}
                      </div>

                      <div
                        style={{
                          marginTop: "8px",
                          color: "#94a3b8",
                          fontSize: "14px",
                        }}
                      >
                        النادي:{" "}
                        {team.clubName || "—"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div
              style={{
                marginTop: "25px",
                padding: "18px",
                borderRadius: "13px",
                background: "#0f172a",
                border: "1px solid #263750",
              }}
            >
              <strong>
                عدد الفرق المختارة:{" "}
                {selectedTeams.length}
              </strong>
            </div>

            {message && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "13px",
                  borderRadius: "10px",
                  background:
                    message.includes("✅")
                      ? "#123524"
                      : "#3f1d1d",
                  border:
                    message.includes("✅")
                      ? "1px solid #166534"
                      : "1px solid #7f1d1d",
                  color:
                    message.includes("✅")
                      ? "#bbf7d0"
                      : "#fecaca",
                  fontWeight: "bold",
                }}
              >
                {message}
              </div>
            )}

            <button
              onClick={saveTeams}
              disabled={saving}
              style={{
                width: "100%",
                marginTop: "25px",
                padding: "15px",
                border: "none",
                borderRadius: "12px",
                background: saving
                  ? "#475569"
                  : "#2563eb",
                color: "#fff",
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
                fontSize: "17px",
                fontWeight: "800",
              }}
            >
              {saving
                ? "جاري الحفظ..."
                : "💾 حفظ الفرق المشاركة"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}