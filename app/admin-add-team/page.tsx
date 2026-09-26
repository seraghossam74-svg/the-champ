"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
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
  teamLetter?: string;
};

const birthYears = [
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
];

const teamLetters = ["أ", "ب", "ج"];

export default function AdminAddTeamPage() {
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClub() {
      try {
        const params = new URLSearchParams(window.location.search);
        const clubId = params.get("clubId");

        if (!clubId) {
          setError("لم يتم تحديد النادي");
          setLoading(false);
          return;
        }

        const db = getFirestore(app);

        const clubRef = doc(db, "clubs", clubId);
        const clubSnapshot = await getDoc(clubRef);

        if (!clubSnapshot.exists()) {
          setError("النادي غير موجود");
          setLoading(false);
          return;
        }

        setClub({
          id: clubSnapshot.id,
          ...(clubSnapshot.data() as Omit<Club, "id">),
        });

        const teamsQuery = query(
          collection(db, "teams"),
          where("clubId", "==", clubId)
        );

        const teamsSnapshot = await getDocs(teamsQuery);

        const teamsData = teamsSnapshot.docs.map((teamDoc) => ({
          id: teamDoc.id,
          ...(teamDoc.data() as Omit<Team, "id">),
        }));

        setTeams(teamsData);
      } catch (error: any) {
        console.error("LOAD ADD TEAM ERROR:", error);
        setError(
          error?.message || "حدث خطأ أثناء تحميل بيانات النادي"
        );
      } finally {
        setLoading(false);
      }
    }

    loadClub();
  }, []);

  function selectYear(year: string) {
    setSelectedYear(year);
    setSelectedLetter("");
    setError("");
  }

  function isLetterUsed(letter: string) {
    return teams.some(
      (team) =>
        String(team.birthYear) === selectedYear &&
        team.teamLetter === letter
    );
  }

  async function saveTeam() {
    if (!club) return;

    if (!selectedYear) {
      setError("اختار سنة الميلاد أولًا");
      return;
    }

    if (!selectedLetter) {
      setError("اختار ترتيب الفريق");
      return;
    }

    if (isLetterUsed(selectedLetter)) {
      setError(
        `الفريق ${selectedLetter} موجود بالفعل لهذه السنة`
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const db = getFirestore(app);

      const teamName =
        `${club.name} — مواليد ${selectedYear} — ${selectedLetter}`;

      await addDoc(collection(db, "teams"), {
        name: teamName,
        birthYear: selectedYear,
        teamLetter: selectedLetter,
        clubId: club.id,
        clubName: club.name,
        createdAt: new Date(),
      });

      window.location.href =
        "/admin-club?id=" + club.id;
    } catch (error: any) {
      console.error("SAVE TEAM ERROR:", error);

      setError(
        error?.message || "حدث خطأ أثناء إضافة الفريق"
      );

      setSaving(false);
    }
  }

  function goBack() {
    if (club) {
      window.location.href =
        "/admin-club?id=" + club.id;
    } else {
      window.location.href = "/clubs";
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
        <h2>جاري تحميل بيانات النادي...</h2>
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
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
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

        <div
          style={{
            background:
              "linear-gradient(135deg, #16243a, #111c2e)",
            padding: "30px",
            borderRadius: "20px",
            border: "1px solid #263750",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          }}
        >
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "28px",
            }}
          >
            ➕ إضافة فريق
          </h1>

          <p
            style={{
              margin: "0 0 30px",
              color: "#94a3b8",
            }}
          >
            نادي {club?.name}
          </p>

          {error && (
            <div
              style={{
                background: "#451a1a",
                border: "1px solid #7f1d1d",
                color: "#fecaca",
                padding: "13px",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <h3
            style={{
              margin: "0 0 15px",
              fontSize: "18px",
            }}
          >
            1️⃣ اختار سنة الميلاد
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
              marginBottom: "30px",
            }}
          >
            {birthYears.map((year) => {
              const selected = selectedYear === year;

              return (
                <button
                  key={year}
                  onClick={() => selectYear(year)}
                  style={{
                    padding: "15px 10px",
                    borderRadius: "12px",
                    border: selected
                      ? "2px solid #60a5fa"
                      : "1px solid #334155",
                    background: selected
                      ? "#1d4ed8"
                      : "#0d1728",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: "bold",
                  }}
                >
                  مواليد {year}
                </button>
              );
            })}
          </div>

          {selectedYear && (
            <>
              <h3
                style={{
                  margin: "0 0 15px",
                  fontSize: "18px",
                }}
              >
                2️⃣ اختار ترتيب الفريق
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: "12px",
                  marginBottom: "25px",
                }}
              >
                {teamLetters.map((letter) => {
                  const used = isLetterUsed(letter);
                  const selected =
                    selectedLetter === letter;

                  return (
                    <button
                      key={letter}
                      disabled={used}
                      onClick={() =>
                        setSelectedLetter(letter)
                      }
                      style={{
                        padding: "20px 10px",
                        borderRadius: "14px",
                        border: selected
                          ? "2px solid #60a5fa"
                          : "1px solid #334155",
                        background: used
                          ? "#1e293b"
                          : selected
                          ? "#1d4ed8"
                          : "#0d1728",
                        color: used
                          ? "#64748b"
                          : "#fff",
                        cursor: used
                          ? "not-allowed"
                          : "pointer",
                        fontSize: "18px",
                        fontWeight: "bold",
                      }}
                    >
                      {letter}
                      {used && (
                        <div
                          style={{
                            fontSize: "11px",
                            marginTop: "5px",
                          }}
                        >
                          موجود
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedLetter && (
                <div
                  style={{
                    padding: "16px",
                    background: "#0d1728",
                    borderRadius: "12px",
                    border: "1px solid #263750",
                    marginBottom: "20px",
                    color: "#cbd5e1",
                    textAlign: "center",
                  }}
                >
                  سيتم إنشاء:
                  <div
                    style={{
                      color: "#60a5fa",
                      fontSize: "18px",
                      fontWeight: "bold",
                      marginTop: "8px",
                    }}
                  >
                    {club?.name} — مواليد {selectedYear} —{" "}
                    {selectedLetter}
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={saveTeam}
            disabled={
              saving ||
              !selectedYear ||
              !selectedLetter
            }
            style={{
              width: "100%",
              padding: "15px",
              border: "none",
              borderRadius: "12px",
              background:
                saving ||
                !selectedYear ||
                !selectedLetter
                  ? "#475569"
                  : "#2563eb",
              color: "#fff",
              cursor:
                saving ||
                !selectedYear ||
                !selectedLetter
                  ? "not-allowed"
                  : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {saving
              ? "جاري الحفظ..."
              : "💾 إضافة الفريق"}
          </button>
        </div>
      </div>
    </main>
  );
}