import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isAdmin } from "@/lib/admin-permissions";

export const runtime = "nodejs";

const ALLOWED_FIELDS = [
  "fatherId",
  "motherId",
  "birthCertificate",
  "schoolCertificate",
  "otherDocument",
] as const;

type DocumentField = (typeof ALLOWED_FIELDS)[number];

function isAllowedField(
  field: string
): field is DocumentField {
  return ALLOWED_FIELDS.includes(
    field as DocumentField
  );
}

export async function GET(request: Request) {
  try {
    // 1) التأكد من تسجيل الدخول
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error:
            "غير مصرح. يجب تسجيل الدخول أولًا.",
        },
        { status: 401 }
      );
    }

    const idToken =
      authorization.substring(7);

    const decodedToken =
      await adminAuth.verifyIdToken(idToken);

    // 2) قراءة البيانات من الرابط
    const url = new URL(request.url);

    const playerId =
      url.searchParams.get("playerId");

    const field =
      url.searchParams.get("field");

    if (!playerId) {
      return NextResponse.json(
        {
          error: "لم يتم تحديد اللاعب",
        },
        { status: 400 }
      );
    }

    if (
      !field ||
      !isAllowedField(field)
    ) {
      return NextResponse.json(
        {
          error: "نوع المستند غير مسموح",
        },
        { status: 400 }
      );
    }

    // 3) جلب اللاعب
    const playerRef =
      adminDb
        .collection("players")
        .doc(playerId);

    const playerSnapshot =
      await playerRef.get();

    if (!playerSnapshot.exists) {
      return NextResponse.json(
        {
          error: "اللاعب غير موجود",
        },
        { status: 404 }
      );
    }

    const playerData =
      playerSnapshot.data();

    // 4) التحقق من صلاحية الأدمن أولًا
    // SUPER ADMIN محسوب تلقائيًا من خلال isAdmin
    const userIsAdmin =
      isAdmin(decodedToken);

    // 5) لو مش أدمن، نتحقق من صاحب النادي
    if (!userIsAdmin) {
      const clubId =
        playerData?.clubId;

      if (
        typeof clubId !== "string" ||
        !clubId
      ) {
        return NextResponse.json(
          {
            error:
              "لا يوجد نادي مرتبط بهذا اللاعب",
          },
          { status: 400 }
        );
      }

      const clubSnapshot =
        await adminDb
          .collection("clubs")
          .doc(clubId)
          .get();

      if (!clubSnapshot.exists) {
        return NextResponse.json(
          {
            error: "النادي غير موجود",
          },
          { status: 404 }
        );
      }

      const clubData =
        clubSnapshot.data();

      const isClubOwner =
        clubData?.userId ===
        decodedToken.uid;

      if (!isClubOwner) {
        return NextResponse.json(
          {
            error:
              "ليس لديك صلاحية لعرض هذا المستند",
          },
          { status: 403 }
        );
      }
    }

    // 6) جلب بيانات المستند
    const documentData =
      playerData?.[field];

    if (
      !documentData ||
      typeof documentData !== "object" ||
      !documentData.public_id
    ) {
      return NextResponse.json(
        {
          error:
            "هذا المستند غير موجود",
        },
        { status: 404 }
      );
    }

    const publicId =
      documentData.public_id;

    const resourceType =
      documentData.resource_type ||
      "image";

    const format =
      documentData.format;

    if (!format) {
      return NextResponse.json(
        {
          error:
            "صيغة المستند غير محفوظة",
        },
        { status: 400 }
      );
    }

    // 7) إنشاء رابط مؤقت
    const expiresAt =
      Math.floor(Date.now() / 1000) +
      5 * 60;

    const signedUrl =
      cloudinary.utils.private_download_url(
        publicId,
        format,
        {
          resource_type:
            resourceType,
          type: "authenticated",
          expires_at: expiresAt,
        }
      );

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error(
      "PLAYER DOCUMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء فتح المستند",
      },
      { status: 500 }
    );
  }
}