"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../../firebase";

type UploadedFile = {
  public_id?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  type?: string;
};

type Player = {
  id: string;
  fullName?: string;
  dateOfBirth?: string;
  nationalId?: string;
  motherName?: string;
  school?: string;
  position?: string;
  jerseyNumber?: string;
  guardianPhone?: string;

  teamId?: string;
  teamName?: string;
  clubId?: string;
  clubName?: string;

  approvalStatus?: string;
  rejectionReason?: string;
  registrationNumber?: string;
  registrationDate?: string;
  playerStatus?: string;
  releaseDate?: string;

  photo?: string;
  photoUrl?: string;

  fatherId?: UploadedFile;
  motherId?: UploadedFile;
  birthCertificate?: UploadedFile;
  schoolCertificate?: UploadedFile;
  otherDocument?: UploadedFile;

  createdAt?: any;
};

type DocumentField =
  | "fatherId"
  | "motherId"
  | "birthCertificate"
  | "schoolCertificate"
  | "otherDocument";

export default function AdminPlayerPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [openingDocument, setOpeningDocument] =
    useState<DocumentField | null>(null);

  useEffect(() => {
    async function loadPlayer() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const playerId = params.get("id");

        if (!playerId) {
          setError("لم يتم تحديد اللاعب");
          setLoading(false);
          return;
        }

        const db = getFirestore(app);
        const playerRef = doc(
          db,
          "players",
          playerId
        );

        const playerSnap = await getDoc(playerRef);

        if (!playerSnap.exists()) {
          setError("اللاعب غير موجود");
          setLoading(false);
          return;
        }

        setPlayer({
          id: playerSnap.id,
          ...playerSnap.data(),
        } as Player);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(
          "حدث خطأ أثناء تحميل بيانات اللاعب"
        );
        setLoading(false);
      }
    }

    loadPlayer();
  }, []);

  function goBack() {
    if (player?.teamId) {
      window.location.href =
        "/admin-team?id=" + player.teamId;
    } else {
      window.location.href = "/clubs";
    }
  }

  async function approvePlayer() {
    if (!player || saving) return;

    try {
      setSaving(true);

      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "يجب تسجيل الدخول كأدمن"
        );
      }

      const idToken =
        await currentUser.getIdToken();

      const response = await fetch(
        "/api/players/approve",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${idToken}`,
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

      alert(
        `تم اعتماد اللاعب بنجاح\nرقم التسجيل: ${data.registrationNumber}`
      );

      window.location.reload();
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "حدث خطأ أثناء اعتماد اللاعب"
      );

      setSaving(false);
    }
  }

  function openReject() {
    setRejectionReason("");
    setShowReject(true);
  }

  async function rejectPlayer() {
    if (!player || saving) return;

    if (!rejectionReason.trim()) {
      alert("اكتب سبب رفض اللاعب");
      return;
    }

    try {
      setSaving(true);

      const db = getFirestore(app);

      const playerRef = doc(
        db,
        "players",
        player.id
      );

      await updateDoc(playerRef, {
        approvalStatus: "rejected",
        rejectionReason:
          rejectionReason.trim(),
      });

      alert("تم رفض اللاعب");

      setShowReject(false);
      setRejectionReason("");

      window.location.reload();
    } catch (error) {
      console.error(error);

      alert("حدث خطأ أثناء رفض اللاعب");

      setSaving(false);
    }
  }

  async function openDocument(
    field: DocumentField
  ) {
    if (!player || openingDocument) return;

    try {
      setOpeningDocument(field);

      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "يجب تسجيل الدخول أولًا"
        );
      }

      const idToken =
        await currentUser.getIdToken();

      const response = await fetch(
        `/api/player-document?playerId=${encodeURIComponent(
          player.id
        )}&field=${encodeURIComponent(field)}`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${idToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر فتح المستند"
        );
      }

      if (!data.url) {
        throw new Error(
          "لم يتم إنشاء رابط المستند"
        );
      }

      window.open(
        data.url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "حدث خطأ أثناء فتح المستند"
      );
    } finally {
      setOpeningDocument(null);
    }
  }

  function getApprovalText(status?: string) {
    if (status === "approved")
      return "معتمد";

    if (status === "rejected")
      return "مرفوض";

    if (status === "pending")
      return "قيد المراجعة";

    return "غير محدد";
  }

  function getApprovalStyle(status?: string) {
    if (status === "approved") {
      return {
        background: "#064e3b",
        color: "#6ee7b7",
        border:
          "1px solid #047857",
      };
    }

    if (status === "rejected") {
      return {
        background: "#450a0a",
        color: "#fca5a5",
        border:
          "1px solid #991b1b",
      };
    }

    return {
      background: "#713f12",
      color: "#fde68a",
      border:
        "1px solid #a16207",
    };
  }

  function formatDate(value: any) {
    if (!value) return "غير مسجل";

    try {
      if (value?.toDate) {
        return value
          .toDate()
          .toLocaleDateString(
            "ar-EG"
          );
      }

      return String(value);
    } catch {
      return "غير مسجل";
    }
  }

  function value(value?: string) {
    return value || "غير مسجل";
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 50%, #111827 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        جاري تحميل بيانات اللاعب...
      </main>
    );
  }

  if (error || !player) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 50%, #111827 100%)",
          color: "white",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: "18px",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              marginBottom: "20px",
            }}
          >
            {error ||
              "اللاعب غير موجود"}
          </h2>

          <button
            onClick={goBack}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "12px 25px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ← رجوع
          </button>
        </div>
      </main>
    );
  }

  const approvalStyle =
    getApprovalStyle(
      player.approvalStatus
    );

  const playerPhoto =
    player.photoUrl ||
    player.photo;

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #020617 0%, #0f172a 50%, #111827 100%)",
        color: "white",
        padding: "30px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "950px",
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            marginBottom: "25px",
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
              بيانات اللاعب
            </h1>

            <p
              style={{
                color: "#94a3b8",
                marginTop: "8px",
              }}
            >
              مراجعة بيانات اللاعب قبل الاعتماد
            </p>
          </div>

          <button
            onClick={goBack}
            style={{
              background: "#1e293b",
              color: "white",
              border:
                "1px solid #475569",
              padding: "11px 20px",
              borderRadius: "10px",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            ← رجوع للفريق
          </button>
        </div>

        {/* Player Header */}

        <div
          style={{
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              {playerPhoto ? (
                <img
                  src={playerPhoto}
                  alt={
                    player.fullName ||
                    "صورة اللاعب"
                  }
                  style={{
                    width: "90px",
                    height: "110px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border:
                      "1px solid #475569",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "90px",
                    height: "110px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    background: "#0f172a",
                    border:
                      "1px solid #475569",
                    borderRadius: "12px",
                    fontSize: "35px",
                  }}
                >
                  👤
                </div>
              )}

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "28px",
                  }}
                >
                  {value(
                    player.fullName
                  )}
                </h2>

                <p
                  style={{
                    color: "#94a3b8",
                    margin: "8px 0 0",
                  }}
                >
                  رقم القميص:{" "}
                  {value(
                    player.jerseyNumber
                  )}
                </p>
              </div>
            </div>

            <span
              style={{
                ...approvalStyle,
                padding: "9px 16px",
                borderRadius: "10px",
                fontWeight: "700",
              }}
            >
              {getApprovalText(
                player.approvalStatus
              )}
            </span>
          </div>
        </div>

        {/* Basic Information */}

        <section
          style={{
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "21px",
            }}
          >
            البيانات الأساسية
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            <Info
              label="الاسم بالكامل"
              value={value(
                player.fullName
              )}
            />

            <Info
              label="تاريخ الميلاد"
              value={value(
                player.dateOfBirth
              )}
            />

            <Info
              label="الرقم القومي"
              value={value(
                player.nationalId
              )}
            />

            <Info
              label="اسم الأم"
              value={value(
                player.motherName
              )}
            />

            <Info
              label="المدرسة"
              value={value(
                player.school
              )}
            />

            <Info
              label="المركز"
              value={value(
                player.position
              )}
            />

            <Info
              label="رقم القميص"
              value={value(
                player.jerseyNumber
              )}
            />

            <Info
              label="رقم ولي الأمر"
              value={value(
                player.guardianPhone
              )}
            />
          </div>
        </section>

        {/* Club / Team */}

        <section
          style={{
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "21px",
            }}
          >
            بيانات الفريق والنادي
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            <Info
              label="النادي"
              value={value(
                player.clubName
              )}
            />

            <Info
              label="الفريق"
              value={value(
                player.teamName
              )}
            />

            <Info
              label="حالة اللاعب"
              value={value(
                player.playerStatus
              )}
            />
          </div>
        </section>

        {/* Registration */}

        <section
          style={{
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "21px",
            }}
          >
            بيانات التسجيل والاعتماد
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
            }}
          >
            <Info
              label="حالة الاعتماد"
              value={getApprovalText(
                player.approvalStatus
              )}
            />

            <Info
              label="رقم التسجيل"
              value={value(
                player.registrationNumber
              )}
            />

            <Info
              label="تاريخ التسجيل"
              value={value(
                player.registrationDate
              )}
            />

            <Info
              label="تاريخ الإضافة"
              value={formatDate(
                player.createdAt
              )}
            />
          </div>

          {player.approvalStatus ===
            "rejected" && (
            <div
              style={{
                marginTop: "20px",
                background: "#450a0a",
                border:
                  "1px solid #991b1b",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <strong>
                سبب الرفض:
              </strong>

              <div
                style={{
                  marginTop: "8px",
                  color: "#fecaca",
                }}
              >
                {value(
                  player.rejectionReason
                )}
              </div>
            </div>
          )}
        </section>

        {/* Documents */}

        <section
          style={{
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
            marginBottom: "20px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "21px",
            }}
          >
            📁 مستندات اللاعب
          </h3>

          <p
            style={{
              color: "#94a3b8",
              marginTop: 0,
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            المستندات محمية ويتم فتحها من خلال
            رابط آمن مؤقت.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <DocumentCard
              label="صورة بطاقة الأب"
              document={player.fatherId}
              field="fatherId"
              openingDocument={
                openingDocument
              }
              onOpen={openDocument}
            />

            <DocumentCard
              label="صورة بطاقة الأم"
              document={player.motherId}
              field="motherId"
              openingDocument={
                openingDocument
              }
              onOpen={openDocument}
            />

            <DocumentCard
              label="شهادة الميلاد"
              document={
                player.birthCertificate
              }
              field="birthCertificate"
              openingDocument={
                openingDocument
              }
              onOpen={openDocument}
            />

            <DocumentCard
              label="إفادة المدرسة"
              document={
                player.schoolCertificate
              }
              field="schoolCertificate"
              openingDocument={
                openingDocument
              }
              onOpen={openDocument}
            />

            <DocumentCard
              label="مستند آخر"
              document={
                player.otherDocument
              }
              field="otherDocument"
              openingDocument={
                openingDocument
              }
              onOpen={openDocument}
            />
          </div>
        </section>

        {/* Actions */}

        {player.approvalStatus ===
          "pending" && (
          <section
            style={{
              background: "#111827",
              border:
                "1px solid #334155",
              borderRadius: "18px",
              padding: "25px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "15px",
                fontSize: "21px",
              }}
            >
              إجراءات الاعتماد
            </h3>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={approvePlayer}
                disabled={saving}
                style={{
                  flex: 1,
                  minWidth: "220px",
                  background: saving
                    ? "#475569"
                    : "#059669",
                  color: "white",
                  border: "none",
                  padding: "15px 25px",
                  borderRadius: "10px",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                {saving
                  ? "جاري التنفيذ..."
                  : "✓ اعتماد اللاعب"}
              </button>

              <button
                onClick={openReject}
                disabled={saving}
                style={{
                  flex: 1,
                  minWidth: "220px",
                  background: "#450a0a",
                  color: "#fca5a5",
                  border:
                    "1px solid #991b1b",
                  padding: "15px 25px",
                  borderRadius: "10px",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                ✕ رفض اللاعب
              </button>
            </div>
          </section>
        )}

        {/* Player Photo */}

        <section
          style={{
            background: "#111827",
            border:
              "1px solid #334155",
            borderRadius: "18px",
            padding: "25px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "15px",
              fontSize: "21px",
            }}
          >
            صورة اللاعب
          </h3>

          {playerPhoto ? (
            <img
              src={playerPhoto}
              alt={
                player.fullName ||
                "صورة اللاعب"
              }
              style={{
                width: "180px",
                height: "220px",
                objectFit: "cover",
                borderRadius: "12px",
                border:
                  "1px solid #475569",
              }}
            />
          ) : (
            <div
              style={{
                background: "#0f172a",
                border:
                  "1px dashed #475569",
                borderRadius: "12px",
                padding: "25px",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              الصورة غير محفوظة حاليًا
            </div>
          )}
        </section>
      </div>

      {/* Reject Modal */}

      {showReject && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background:
              "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#111827",
              border:
                "1px solid #334155",
              borderRadius: "18px",
              padding: "25px",
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "25px",
                fontWeight: "800",
              }}
            >
              رفض اللاعب
            </h2>

            <p
              style={{
                color: "#94a3b8",
                marginTop: "10px",
              }}
            >
              اللاعب:{" "}
              <span
                style={{
                  color: "white",
                }}
              >
                {player.fullName}
              </span>
            </p>

            <label
              style={{
                display: "block",
                marginTop: "25px",
                marginBottom: "8px",
                color: "#cbd5e1",
                fontSize: "14px",
              }}
            >
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
              rows={5}
              disabled={saving}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                background: "#020617",
                color: "white",
                border:
                  "1px solid #475569",
                borderRadius: "12px",
                padding: "14px",
                outline: "none",
                fontSize: "15px",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => {
                  setShowReject(false);
                  setRejectionReason("");
                }}
                disabled={saving}
                style={{
                  flex: 1,
                  background: "#1e293b",
                  color: "#cbd5e1",
                  border:
                    "1px solid #475569",
                  padding: "13px",
                  borderRadius: "10px",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "15px",
                  fontWeight: "700",
                }}
              >
                إلغاء
              </button>

              <button
                onClick={rejectPlayer}
                disabled={saving}
                style={{
                  flex: 1,
                  background: saving
                    ? "#475569"
                    : "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "13px",
                  borderRadius: "10px",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                  fontSize: "15px",
                  fontWeight: "700",
                }}
              >
                {saving
                  ? "جاري الحفظ..."
                  : "تأكيد الرفض"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DocumentCard({
  label,
  document,
  field,
  openingDocument,
  onOpen,
}: {
  label: string;
  document?: UploadedFile;
  field: DocumentField;
  openingDocument: DocumentField | null;
  onOpen: (
    field: DocumentField
  ) => void;
}) {
  const exists =
    !!document?.public_id;

  const isOpening =
    openingDocument === field;

  return (
    <div
      style={{
        background: "#0f172a",
        border:
          "1px solid #263449",
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: "700",
          marginBottom: "12px",
        }}
      >
        {label}
      </div>

      {exists ? (
        <>
          <div
            style={{
              color: "#6ee7b7",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            ✓ المستند مرفوع
          </div>

          <button
            onClick={() =>
              onOpen(field)
            }
            disabled={!!openingDocument}
            style={{
              width: "100%",
              background: isOpening
                ? "#475569"
                : "#2563eb",
              color: "white",
              border: "none",
              padding: "11px",
              borderRadius: "9px",
              cursor:
                openingDocument
                  ? "not-allowed"
                  : "pointer",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            {isOpening
              ? "جاري الفتح..."
              : "👁 فتح المستند"}
          </button>
        </>
      ) : (
        <div
          style={{
            color: "#94a3b8",
            fontSize: "13px",
          }}
        >
          المستند غير موجود
        </div>
      )}
    </div>
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
    <div
      style={{
        background: "#0f172a",
        border:
          "1px solid #263449",
        borderRadius: "12px",
        padding: "15px",
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: "13px",
          marginBottom: "7px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "16px",
          fontWeight: "600",
          wordBreak: "break-word",
        }}
      >
        {value || "غير مسجل"}
      </div>
    </div>
  );
}