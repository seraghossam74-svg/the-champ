"use client";

import { useState } from "react";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";
import app from "../../firebase";

export default function AdminCreateCompetitionPage() {
  const [name, setName] = useState("The Champ");
  const [version, setVersion] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreate() {
    if (!version.trim()) {
      setMessage("من فضلك اكتب رقم النسخة");
      return;
    }

    if (saving) return;

    try {
      setSaving(true);
      setMessage("");

      const db = getFirestore(app);

      const versionNumber = version.trim();

      const competitionName =
        `${name.trim() || "The Champ"} — النسخة ${versionNumber}`;

      const docRef = await addDoc(
        collection(db, "competitions"),
        {
          name: competitionName,
          baseName: name.trim() || "The Champ",
          version: versionNumber,
          status: "draft",
          createdAt: serverTimestamp(),
        }
      );

      window.location.href =
        `/competition?id=${docRef.id}`;

    } catch (error) {
      console.error("CREATE COMPETITION ERROR:", error);
      setMessage("حدث خطأ أثناء إنشاء البطولة");
      setSaving(false);
    }
  }

  function goBack() {
    window.location.href = "/competitions";
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
          maxWidth: "750px",
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
            marginBottom: "30px",
          }}
        >
          ← العودة للبطولات
        </button>

        <div
          style={{
            background:
              "linear-gradient(145deg, #17243a, #101a2b)",
            border: "1px solid #2b3c57",
            borderRadius: "22px",
            padding: "30px",
            boxShadow:
              "0 15px 40px rgba(0,0,0,0.25)",
          }}
        >

          <div
            style={{
              fontSize: "45px",
              marginBottom: "15px",
            }}
          >
            🏆
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            إنشاء نسخة بطولة
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#94a3b8",
              lineHeight: 1.8,
            }}
          >
            أنشئ نسخة جديدة من بطولة The Champ، ثم سنحدد
            المواليد والفرق ونظام المباريات.
          </p>

          <div style={{ marginTop: "30px" }}>

            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontWeight: "bold",
              }}
            >
              اسم البطولة
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: The Champ"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                borderRadius: "11px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#fff",
                outline: "none",
                fontSize: "16px",
              }}
            />

          </div>

          <div style={{ marginTop: "22px" }}>

            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontWeight: "bold",
              }}
            >
              رقم النسخة
            </label>

            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="مثال: 12"
              inputMode="numeric"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                borderRadius: "11px",
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#fff",
                outline: "none",
                fontSize: "16px",
              }}
            />

          </div>

          <div
            style={{
              marginTop: "22px",
              padding: "18px",
              borderRadius: "13px",
              background: "#0f172a",
              border: "1px solid #263750",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#94a3b8",
                fontSize: "14px",
              }}
            >
              اسم النسخة:
            </p>

            <p
              style={{
                margin: "8px 0 0",
                fontSize: "20px",
                fontWeight: "800",
              }}
            >
              {name.trim() || "The Champ"} — النسخة{" "}
              {version.trim() || "—"}
            </p>
          </div>

          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "13px",
                borderRadius: "10px",
                background: "#3f1d1d",
                border: "1px solid #7f1d1d",
                color: "#fecaca",
                fontWeight: "bold",
              }}
            >
              {message}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={saving}
            style={{
              width: "100%",
              marginTop: "25px",
              padding: "15px",
              border: "none",
              borderRadius: "12px",
              background: saving ? "#475569" : "#2563eb",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "17px",
              fontWeight: "800",
            }}
          >
            {saving
              ? "جاري إنشاء النسخة..."
              : "➕ إنشاء النسخة"}
          </button>

        </div>
      </div>
    </main>
  );
}
