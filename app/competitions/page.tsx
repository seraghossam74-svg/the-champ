"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from "firebase/firestore";
import app from "../../firebase";

type Competition = {
  id: string;
  name: string;
  status?: string;
  createdAt?: any;
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompetitions() {
      try {
        const db = getFirestore(app);

        const competitionsQuery = query(
          collection(db, "competitions"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(competitionsQuery);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Competition, "id">),
        }));

        setCompetitions(data);
      } catch (error) {
        console.error("COMPETITIONS ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCompetitions();
  }, []);

  function goHome() {
    window.location.href = "/admin";
  }

  function createCompetition() {
    window.location.href = "/admin-create-competition";
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
          display: "flex",
          gap: "10px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={goHome}
          style={{
            padding: "12px 22px",
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
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "15px",
          marginBottom: "30px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "800",
            }}
          >
            🏆 البطولات
          </h1>

          <p
            style={{
              margin: "8px 0 0",
              color: "#94a3b8",
            }}
          >
            إدارة نسخ بطولة The Champ
          </p>
        </div>

        <button
          onClick={createCompetition}
          style={{
            padding: "13px 22px",
            border: "none",
            borderRadius: "11px",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          ➕ إنشاء بطولة
        </button>
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
          جاري تحميل البطولات...
        </div>
      ) : competitions.length === 0 ? (
        <div
          style={{
            background:
              "linear-gradient(145deg, #17243a, #101a2b)",
            padding: "45px 30px",
            borderRadius: "20px",
            border: "1px solid #2b3c57",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "15px",
            }}
          >
            🏆
          </div>

          <h2
            style={{
              margin: "0 0 10px",
              fontSize: "22px",
            }}
          >
            لا توجد بطولات حتى الآن
          </h2>

          <p
            style={{
              margin: 0,
              color: "#94a3b8",
            }}
          >
            ابدأ بإنشاء أول نسخة من بطولة The Champ
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "18px",
          }}
        >
          {competitions.map((competition) => (
            <button
              key={competition.id}
              style={{
                textAlign: "right",
                background:
                  "linear-gradient(145deg, #17243a, #101a2b)",
                border: "1px solid #2b3c57",
                borderRadius: "18px",
                padding: "24px",
                cursor: "pointer",
                color: "#fff",
                boxShadow:
                  "0 10px 25px rgba(0,0,0,0.2)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "13px",
                  background: "#1d4ed8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  marginBottom: "18px",
                }}
              >
                🏆
              </div>

              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "21px",
                  fontWeight: "800",
                }}
              >
                {competition.name}
              </h2>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "14px",
                }}
              >
                إدارة النسخة والمواليد والمباريات
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}