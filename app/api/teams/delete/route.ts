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

    const teamId =
      String(body.teamId || "").trim();

    if (!teamId) {
      return NextResponse.json(
        {
          error:
            "لم يتم تحديد الفريق",
        },
        { status: 400 }
      );
    }

    const teamRef =
      adminDb
        .collection("teams")
        .doc(teamId);

    const teamSnap =
      await teamRef.get();

    if (!teamSnap.exists) {
      return NextResponse.json(
        {
          error:
            "الفريق غير موجود",
        },
        { status: 404 }
      );
    }

    const playersSnap =
      await adminDb
        .collection("players")
        .where(
          "teamId",
          "==",
          teamId
        )
        .limit(1)
        .get();

    if (!playersSnap.empty) {
      return NextResponse.json(
        {
          error:
            "لا يمكن حذف الفريق قبل حذف جميع اللاعبين التابعين له",
        },
        { status: 400 }
      );
    }

    await teamRef.delete();

    return NextResponse.json({
      success: true,
      message:
        "تم حذف الفريق بنجاح",
    });
  } catch (error: any) {
    console.error(
      "DELETE TEAM ERROR:",
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
            "حذف الفريق متاح للـSUPER ADMIN فقط",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء حذف الفريق",
      },
      { status: 500 }
    );
  }
}