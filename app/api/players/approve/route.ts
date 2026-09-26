import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

const ADMIN_UID = "CP12ohOiNoWpcNkXmZhmalZw8eD3";

export async function POST(request: NextRequest) {
  try {
    // التأكد إن الطلب جاي من الأدمن
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    const decodedToken =
      await adminAuth.verifyIdToken(idToken);

    if (decodedToken.uid !== ADMIN_UID) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية" },
        { status: 403 }
      );
    }

    // قراءة بيانات الطلب
    const body = await request.json();

    const playerId = String(body.playerId || "").trim();

    if (!playerId) {
      return NextResponse.json(
        { error: "رقم اللاعب غير موجود" },
        { status: 400 }
      );
    }

    // جلب اللاعب
    const playerRef = adminDb
      .collection("players")
      .doc(playerId);

    const playerSnapshot = await playerRef.get();

    if (!playerSnapshot.exists) {
      return NextResponse.json(
        { error: "اللاعب غير موجود" },
        { status: 404 }
      );
    }

    const playerData = playerSnapshot.data();

    // منع إعادة اعتماد لاعب معتمد بالفعل
    if (playerData?.approvalStatus === "approved") {
      return NextResponse.json(
        {
          error: "هذا اللاعب معتمد بالفعل",
          registrationNumber:
            playerData.registrationNumber || null,
          registrationDate:
            playerData.registrationDate || null,
        },
        { status: 400 }
      );
    }

    // إنشاء رقم تسجيل فريد
    const counterRef = adminDb
      .collection("system")
      .doc("registrationCounter");

    const registrationNumber =
      await adminDb.runTransaction(async (transaction) => {
        const counterSnapshot =
          await transaction.get(counterRef);

        let nextNumber = 1;

        if (counterSnapshot.exists) {
          const currentNumber =
            Number(counterSnapshot.data()?.lastNumber || 0);

          nextNumber = currentNumber + 1;
        }

        transaction.set(
          counterRef,
          {
            lastNumber: nextNumber,
          },
          { merge: true }
        );

        return `CH-${String(nextNumber).padStart(6, "0")}`;
      });

    // تاريخ التسجيل
    const registrationDate = new Date()
      .toISOString()
      .split("T")[0];

    // اعتماد اللاعب
    await playerRef.update({
      approvalStatus: "approved",
      rejectionReason: "",
      registrationNumber,
      registrationDate,
      approvedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      registrationNumber,
      registrationDate,
    });

  } catch (error: any) {
    console.error("APPROVE PLAYER ERROR:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء اعتماد اللاعب",
      },
      { status: 500 }
    );
  }
}