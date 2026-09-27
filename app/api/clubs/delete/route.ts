import { NextRequest, NextResponse } from "next/server";
import {
  adminAuth,
  adminDb,
} from "@/lib/firebase-admin";
import { isSuperAdmin } from "@/lib/admin-permissions";

export const runtime = "nodejs";

async function requireSuperAdmin(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authorization.slice(7);

  const decoded =
    await adminAuth.verifyIdToken(token);

  if (!isSuperAdmin(decoded)) {
    throw new Error("FORBIDDEN");
  }

  return decoded;
}

export async function DELETE(
  request: NextRequest
) {
  try {
    await requireSuperAdmin(request);

    const body =
      await request.json();

    const clubId =
      String(body.clubId || "").trim();

    if (!clubId) {
      return NextResponse.json(
        {
          error:
            "لم يتم تحديد النادي",
        },
        { status: 400 }
      );
    }

    const clubRef =
      adminDb
        .collection("clubs")
        .doc(clubId);

    const clubSnap =
      await clubRef.get();

    if (!clubSnap.exists) {
      return NextResponse.json(
        {
          error:
            "النادي غير موجود",
        },
        { status: 404 }
      );
    }

    const teamsSnap =
      await adminDb
        .collection("teams")
        .where(
          "clubId",
          "==",
          clubId
        )
        .limit(1)
        .get();

    if (!teamsSnap.empty) {
      return NextResponse.json(
        {
          error:
            "لا يمكن حذف النادي قبل حذف جميع الفرق التابعة له",
        },
        { status: 400 }
      );
    }

    const clubData =
      clubSnap.data() || {};

    const userId =
      typeof clubData.userId === "string"
        ? clubData.userId.trim()
        : "";

    await clubRef.delete();

    if (userId) {
      try {
        await adminAuth.deleteUser(
          userId
        );
      } catch (error: any) {
        if (
          error?.code !==
          "auth/user-not-found"
        ) {
          console.error(
            "CLUB AUTH DELETE ERROR:",
            error
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "تم حذف النادي بنجاح",
    });
  } catch (error: any) {
    console.error(
      "DELETE CLUB ERROR:",
      error
    );

    if (
      error?.message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول",
        },
        { status: 401 }
      );
    }

    if (
      error?.message ===
      "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "حذف النادي متاح للـSUPER ADMIN فقط",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء حذف النادي",
      },
      { status: 500 }
    );
  }
}