import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { isSuperAdmin } from "../../../../lib/admin-permissions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "غير مصرح",
          step: "authorization",
        },
        { status: 401 }
      );
    }

    const idToken =
      authHeader.substring(7);

    let decodedToken;

    try {
      decodedToken =
        await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error(
        "VERIFY ID TOKEN ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "فشل التحقق من تسجيل الدخول",
          step: "verifyIdToken",
        },
        { status: 500 }
      );
    }

    console.log(
      "APPROVE AUTH DEBUG:",
      {
        uid: decodedToken.uid,
        signInProvider:
          decodedToken.firebase?.sign_in_provider,
        isSuperAdmin:
          isSuperAdmin(decodedToken),
      }
    );

    if (!isSuperAdmin(decodedToken)) {
      return NextResponse.json(
        {
          error:
            "ليس لديك صلاحية اعتماد اللاعبين",
          step: "permission",
          uid: decodedToken.uid,
        },
        { status: 403 }
      );
    }

    let body;

    try {
      body = await request.json();
    } catch (error: any) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            "بيانات الطلب غير صحيحة",
          step: "request-body",
        },
        { status: 400 }
      );
    }

    const playerId =
      String(body.playerId || "").trim();

    if (!playerId) {
      return NextResponse.json(
        {
          error: "رقم اللاعب غير موجود",
          step: "playerId",
        },
        { status: 400 }
      );
    }

    let playerSnapshot;

    try {
      const playerRef =
        adminDb
          .collection("players")
          .doc(playerId);

      playerSnapshot =
        await playerRef.get();

      if (!playerSnapshot.exists) {
        return NextResponse.json(
          {
            error: "اللاعب غير موجود",
            step: "player-get",
          },
          { status: 404 }
        );
      }

      const playerData =
        playerSnapshot.data();

      if (
        playerData?.approvalStatus ===
        "approved"
      ) {
        return NextResponse.json(
          {
            error:
              "هذا اللاعب معتمد بالفعل",
            registrationNumber:
              playerData.registrationNumber ||
              null,
            registrationDate:
              playerData.registrationDate ||
              null,
          },
          { status: 400 }
        );
      }
    } catch (error: any) {
      console.error(
        "PLAYER GET ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "فشل قراءة بيانات اللاعب",
          step: "player-get",
        },
        { status: 500 }
      );
    }

    const counterRef =
      adminDb
        .collection("system")
        .doc("registrationCounter");

    let registrationNumber;

    try {
      registrationNumber =
        await adminDb.runTransaction(
          async (transaction) => {
            const counterSnapshot =
              await transaction.get(
                counterRef
              );

            let nextNumber = 1;

            if (counterSnapshot.exists) {
              const currentNumber =
                Number(
                  counterSnapshot.data()
                    ?.lastNumber || 0
                );

              nextNumber =
                currentNumber + 1;
            }

            transaction.set(
              counterRef,
              {
                lastNumber: nextNumber,
              },
              { merge: true }
            );

            return `CH-${String(
              nextNumber
            ).padStart(6, "0")}`;
          }
        );
    } catch (error: any) {
      console.error(
        "REGISTRATION TRANSACTION ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "فشل إنشاء رقم التسجيل",
          step: "registration-counter",
        },
        { status: 500 }
      );
    }

    const registrationDate =
      new Date()
        .toISOString()
        .split("T")[0];

    try {
      const playerRef =
        adminDb
          .collection("players")
          .doc(playerId);

      await playerRef.update({
        approvalStatus: "approved",
        rejectionReason: "",
        registrationNumber,
        registrationDate,
        approvedAt: new Date(),
      });
    } catch (error: any) {
      console.error(
        "PLAYER UPDATE ERROR:",
        error
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "فشل تحديث بيانات اللاعب",
          step: "player-update",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registrationNumber,
      registrationDate,
    });
  } catch (error: any) {
    console.error(
      "APPROVE PLAYER UNKNOWN ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء اعتماد اللاعب",
        step: "unknown",
      },
      { status: 500 }
    );
  }
}