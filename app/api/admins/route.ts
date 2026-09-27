import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
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

  const token =
    authorization.slice("Bearer ".length);

  const decodedToken =
    await adminAuth.verifyIdToken(token);

  if (!isSuperAdmin(decodedToken)) {
    throw new Error("FORBIDDEN");
  }

  return decodedToken;
}

export async function GET(
  request: NextRequest
) {
  try {
    const superAdmin =
      await requireSuperAdmin(request);

    const result =
      await adminAuth.listUsers(1000);

    const users = result.users
      .filter(
        (user) =>
          user.uid === superAdmin.uid ||
          user.customClaims?.admin === true ||
          user.customClaims?.role === "admin" ||
          user.customClaims?.role === "super_admin"
      )
      .map((user) => ({
        uid: user.uid,
        email: user.email || "",
        displayName:
          user.displayName || "",
        disabled: user.disabled,
        createdAt:
          user.metadata.creationTime ||
          null,
        lastSignInAt:
          user.metadata.lastSignInTime ||
          null,
        role:
          user.uid === superAdmin.uid
            ? "super_admin"
            : user.customClaims?.role ||
              "admin",
      }));

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error(
      "GET /api/admins:",
      error
    );

    if (
      error?.message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول",
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
            "هذه العملية متاحة للـSUPER ADMIN فقط",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          "حدث خطأ أثناء تحميل حسابات الأدمن",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    await requireSuperAdmin(request);

    const body =
      await request.json();

    const displayName =
      String(
        body.displayName || ""
      ).trim();

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body.password || ""
      );

    if (!displayName) {
      return NextResponse.json(
        {
          error: "اسم الأدمن مطلوب",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "البريد الإلكتروني مطلوب",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        },
        { status: 400 }
      );
    }

    const user =
      await adminAuth.createUser({
        email,
        password,
        displayName,
      });

    await adminAuth.setCustomUserClaims(
      user.uid,
      {
        admin: true,
        role: "admin",
      }
    );

    await adminDb
      .collection("admins")
      .doc(user.uid)
      .set({
        uid: user.uid,
        email,
        displayName,
        role: "admin",
        status: "active",
        createdAt:
          new Date().toISOString(),
      });

    return NextResponse.json(
      {
        success: true,
        uid: user.uid,
        email,
        displayName,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "POST /api/admins:",
      error
    );

    if (
      error?.message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول",
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
            "إضافة الأدمن متاحة للـSUPER ADMIN فقط",
        },
        { status: 403 }
      );
    }

    if (
      error?.code ===
      "auth/email-already-exists"
    ) {
      return NextResponse.json(
        {
          error:
            "هذا البريد الإلكتروني مستخدم بالفعل",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء إنشاء حساب الأدمن",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const superAdmin =
      await requireSuperAdmin(request);

    const body =
      await request.json();

    const uid =
      String(
        body.uid || ""
      ).trim();

    if (!uid) {
      return NextResponse.json(
        {
          error:
            "لم يتم تحديد حساب الأدمن",
        },
        { status: 400 }
      );
    }

    if (uid === superAdmin.uid) {
      return NextResponse.json(
        {
          error:
            "لا يمكن حذف SUPER ADMIN الرئيسي",
        },
        { status: 400 }
      );
    }

    await adminAuth.deleteUser(uid);

    await adminDb
      .collection("admins")
      .doc(uid)
      .delete();

    return NextResponse.json({
      success: true,
      message:
        "تم حذف حساب الأدمن بنجاح",
    });
  } catch (error: any) {
    console.error(
      "DELETE /api/admins:",
      error
    );

    if (
      error?.message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "يجب تسجيل الدخول",
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
            "حذف الأدمن متاح للـSUPER ADMIN فقط",
        },
        { status: 403 }
      );
    }

    if (
      error?.code ===
      "auth/user-not-found"
    ) {
      return NextResponse.json(
        {
          error:
            "حساب الأدمن غير موجود",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء حذف الأدمن",
      },
      { status: 500 }
    );
  }
}