"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Competition = {
  name?: string;
  baseName?: string;
  version?: string;
  status?: string;
  birthYears?: string[];
};

type BirthYearFormat = {
  system: string;
};

const BIRTH_YEARS = [
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

const TOURNAMENT_SYSTEMS = [
  {
    id: "league",
    title: "🏆 دوري — مجموعة واحدة",
    description: "كل الفرق في مجموعة واحدة وتلعب بنظام الدوري.",
  },
  {
    id: "groups",
    title: "🏆 دوري — مجموعات",
    description: "تقسيم الفرق إلى مجموعات ثم تحديد المتأهلين.",
  },
  {
    id: "cup",
    title: "🏆 كأس",
    description: "نظام خروج المغلوب حتى المباراة النهائية.",
  },
];

function CompetitionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const competitionId = searchParams.get("id");

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [formats, setFormats] = useState<Record<string, BirthYearFormat>>(
    {}
  );

  const [loading, setLoading] = useState(true);
  const [savingYears, setSavingYears] = useState(false);
  const [savingFormat, setSavingFormat] = useState<string | null>(null);

  useEffect(() => {
    if (!competitionId) {
      setLoading(false);
      return;
    }

    const loadCompetition = async () => {
      try {
        const competitionRef = doc(db, "competitions", competitionId);
        const competitionSnap = await getDoc(competitionRef);

        if (competitionSnap.exists()) {
          const data = competitionSnap.data();

          setCompetition({
            name: data.name,
            baseName: data.baseName,
            version: data.version,
            status: data.status,
            birthYears: data.birthYears || [],
          });

          setSelectedYears(data.birthYears || []);
        }

        const formatsQuery = query(
          collection(db, "competitionFormats"),
          where("competitionId", "==", competitionId)
        );

        const formatsSnap = await getDocs(formatsQuery);

        const loadedFormats: Record<string, BirthYearFormat> = {};

        formatsSnap.forEach((item) => {
          const data = item.data();

          if (data.birthYear && data.system) {
            loadedFormats[data.birthYear] = {
              system: data.system,
            };
          }
        });

        setFormats(loadedFormats);
      } catch (error) {
        console.error("Error loading competition:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCompetition();
  }, [competitionId]);

  const toggleBirthYear = (year: string) => {
    setSelectedYears((current) => {
      if (current.includes(year)) {
        return current.filter((item) => item !== year);
      }

      return [...current, year].sort();
    });
  };

  const saveBirthYears = async () => {
    if (!competitionId) return;

    try {
      setSavingYears(true);

      await setDoc(
        doc(db, "competitions", competitionId),
        {
          birthYears: selectedYears,
        },
        { merge: true }
      );

      alert("تم حفظ سنوات المواليد بنجاح ✅");
    } catch (error) {
      console.error(error);
      alert("حصل خطأ أثناء الحفظ");
    } finally {
      setSavingYears(false);
    }
  };

  const saveFormat = async (birthYear: string, system: string) => {
    if (!competitionId) return;

    try {
      setSavingFormat(birthYear);

      const formatId = `${competitionId}_${birthYear}`;

      await setDoc(doc(db, "competitionFormats", formatId), {
        competitionId,
        birthYear,
        system,
        updatedAt: serverTimestamp(),
      });

      setFormats((current) => ({
        ...current,
        [birthYear]: {
          system,
        },
      }));

      alert(`تم حفظ نظام مواليد ${birthYear} ✅`);
    } catch (error) {
      console.error(error);
      alert("حصل خطأ أثناء حفظ النظام");
    } finally {
      setSavingFormat(null);
    }
  };

  const openTeams = (birthYear: string) => {
    if (!competitionId) return;

    router.push(
      `/competition-teams?competitionId=${competitionId}&birthYear=${birthYear}`
    );
  };

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#07111f",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        جاري تحميل البطولة...
      </main>
    );
  }

  if (!competitionId || !competition) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#07111f",
          color: "white",
          padding: 30,
        }}
      >
        <h1>البطولة غير موجودة</h1>

        <button
          onClick={() => router.push("/competitions")}
          style={{
            marginTop: 20,
            padding: "12px 20px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          العودة للبطولات
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "white",
        padding: "30px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => router.push("/competitions")}
          style={{
            background: "#172338",
            color: "white",
            border: "1px solid #26364f",
            padding: "10px 16px",
            borderRadius: 10,
            cursor: "pointer",
            marginBottom: 25,
          }}
        >
          ← العودة للبطولات
        </button>

        <div
          style={{
            background: "#0d1b2e",
            border: "1px solid #20324c",
            borderRadius: 18,
            padding: 25,
            marginBottom: 25,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 30,
            }}
          >
            🏆 {competition.name}
          </h1>

          <p
            style={{
              color: "#9fb0c7",
              marginTop: 10,
            }}
          >
            إعداد البطولة واختيار نظام كل مواليد
          </p>
        </div>

        <div
          style={{
            background: "#0d1b2e",
            border: "1px solid #20324c",
            borderRadius: 18,
            padding: 25,
            marginBottom: 25,
          }}
        >
          <h2 style={{ marginTop: 0 }}>👶 اختيار سنوات المواليد</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 12,
              marginTop: 20,
            }}
          >
            {BIRTH_YEARS.map((year) => {
              const selected = selectedYears.includes(year);

              return (
                <button
                  key={year}
                  onClick={() => toggleBirthYear(year)}
                  style={{
                    padding: "15px 10px",
                    borderRadius: 12,
                    border: selected
                      ? "2px solid #22c55e"
                      : "1px solid #2b405d",
                    background: selected ? "#123c2a" : "#101e31",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  {selected ? "✓ " : ""}
                  مواليد {year}
                </button>
              );
            })}
          </div>

          <button
            onClick={saveBirthYears}
            disabled={savingYears}
            style={{
              marginTop: 25,
              width: "100%",
              padding: 15,
              borderRadius: 12,
              border: "none",
              background: "#2563eb",
              color: "white",
              cursor: savingYears ? "not-allowed" : "pointer",
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            {savingYears ? "جاري الحفظ..." : "💾 حفظ سنوات المواليد"}
          </button>
        </div>

        {selectedYears.length > 0 && (
          <div
            style={{
              background: "#0d1b2e",
              border: "1px solid #20324c",
              borderRadius: 18,
              padding: 25,
            }}
          >
            <h2 style={{ marginTop: 0 }}>⚙️ إعداد كل مواليد</h2>

            <p
              style={{
                color: "#9fb0c7",
                marginBottom: 25,
              }}
            >
              كل سنة مواليد لها نظام مستقل عن باقي البطولة.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {selectedYears.map((year) => {
                const currentSystem = formats[year]?.system || "";

                return (
                  <div
                    key={year}
                    style={{
                      background: "#101e31",
                      border: "1px solid #263b58",
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 15,
                        flexWrap: "wrap",
                        marginBottom: 18,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 23,
                        }}
                      >
                        ⚽ مواليد {year}
                      </h3>

                      <button
                        onClick={() => openTeams(year)}
                        style={{
                          background: "#172f50",
                          color: "white",
                          border: "1px solid #31527d",
                          padding: "10px 16px",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                      >
                        👥 اختيار الفرق
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {TOURNAMENT_SYSTEMS.map((system) => {
                        const selected = currentSystem === system.id;

                        return (
                          <button
                            key={system.id}
                            onClick={() => saveFormat(year, system.id)}
                            disabled={savingFormat === year}
                            style={{
                              textAlign: "right",
                              padding: 16,
                              borderRadius: 12,
                              border: selected
                                ? "2px solid #22c55e"
                                : "1px solid #2b405d",
                              background: selected
                                ? "#123c2a"
                                : "#0d1929",
                              color: "white",
                              cursor:
                                savingFormat === year
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 17,
                                fontWeight: 800,
                                marginBottom: 8,
                              }}
                            >
                              {selected ? "✓ " : ""}
                              {system.title}
                            </div>

                            <div
                              style={{
                                color: "#9fb0c7",
                                fontSize: 14,
                                lineHeight: 1.5,
                              }}
                            >
                              {system.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {currentSystem && (
                      <div
                        style={{
                          marginTop: 15,
                          padding: 12,
                          borderRadius: 10,
                          background: "#0b1524",
                          color: "#86efac",
                          fontWeight: 700,
                        }}
                      >
                        النظام المختار:{" "}
                        {
                          TOURNAMENT_SYSTEMS.find(
                            (item) => item.id === currentSystem
                          )?.title
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CompetitionPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            background: "#07111f",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
          }}
        >
          جاري تحميل البطولة...
        </main>
      }
    >
      <CompetitionContent />
    </Suspense>
  );
}