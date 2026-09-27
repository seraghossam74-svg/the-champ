import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { isSuperAdmin } from "@/lib/admin-permissions";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

async function deleteCloudinaryFile(
  file: any
) {
  if (!file?.public_id) return;

  try {
    await cloudinary.uploader.destroy(
      file.public_id,
      {
        resource_type:
          file.resource_type || "image",
        type: file.type || "upload",
        invalidate: true,
      }
    );
  } catch (error) {
    console.error(
      "CLOUDINARY DELETE ERROR:",
      file.public_id,
      error
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const idToken =
      authorization.substring(7);

    const decodedToken =
      await adminAuth.verifyIdToken(
        idToken
      );

    if (!isSuperAdmin(decodedToken)) {
      return NextResponse.json(
        {
          error:
            "حذف اللاعبين متاح للـSUPER ADMIN فقط",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const playerId = String(
      body.playerId || ""
    ).trim();

    if (!playerId) {
      return NextResponse.json(
        {
          error:
            "لم يتم تحديد اللاعب",
        },
        { status: 400 }
      );
    }

    const playerRef = adminDb
      .collection("players")
      .doc(playerId);

    const playerSnapshot =
      await playerRef.get();

    if (!playerSnapshot.exists) {
      return NextResponse.json(
        {
          error:
            "اللاعب غير موجود",
        },
        { status: 404 }
      );
    }

    const playerData =
      playerSnapshot.data() || {};

    const files = [
      playerData.photo,
      playerData.photoUrl
        ? {
            public_id:
              playerData.photoPublicId,
            resource_type:
              playerData.photoResourceType,
            type:
              playerData.photoType,
          }
        : null,
      playerData.fatherId,
      playerData.motherId,
      playerData.birthCertificate,
      playerData.schoolCertificate,
      playerData.otherDocument,
    ];

    for (const file of files) {
      await deleteCloudinaryFile(file);
    }

    await playerRef.delete();

    return NextResponse.json({
      success: true,
      message: "تم حذف اللاعب بنجاح",
    });
  } catch (error: any) {
    console.error(
      "DELETE PLAYER ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء حذف اللاعب",
      },
      { status: 500 }
    );
  }
}