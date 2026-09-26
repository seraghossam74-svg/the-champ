import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const ALLOWED_FIELDS = [
  "photo",
  "fatherId",
  "motherId",
  "birthCertificate",
  "schoolCertificate",
  "other",
] as const;

type UploadField = (typeof ALLOWED_FIELDS)[number];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

function isAllowedField(field: string): field is UploadField {
  return ALLOWED_FIELDS.includes(field as UploadField);
}

function isImageField(field: UploadField) {
  return (
    field === "photo" ||
    field === "fatherId" ||
    field === "motherId"
  );
}

function isAllowedFile(
  file: File,
  field: UploadField
) {
  if (isImageField(field)) {
    return file.type.startsWith("image/");
  }

  return (
    file.type === "application/pdf" ||
    file.type.startsWith("image/")
  );
}

function getMaxSize(field: UploadField) {
  return isImageField(field)
    ? MAX_IMAGE_SIZE
    : MAX_DOCUMENT_SIZE;
}

export async function POST(request: Request) {
  try {
    // =========================
    // 1. Check login
    // =========================

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "غير مصرح. يجب تسجيل الدخول أولًا.",
        },
        { status: 401 }
      );
    }

    const idToken = authorization.substring(7);

    const decodedToken =
      await adminAuth.verifyIdToken(idToken);

    // =========================
    // 2. Read form data
    // =========================

    const formData = await request.formData();

    const file = formData.get("file");
    const field = formData.get("field");
    const clubId = formData.get("clubId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "لم يتم إرسال ملف",
        },
        { status: 400 }
      );
    }

    if (
      typeof field !== "string" ||
      !isAllowedField(field)
    ) {
      return NextResponse.json(
        {
          error: "نوع الملف غير مسموح",
        },
        { status: 400 }
      );
    }

    if (
      typeof clubId !== "string" ||
      !clubId.trim()
    ) {
      return NextResponse.json(
        {
          error: "لم يتم تحديد النادي",
        },
        { status: 400 }
      );
    }

    // =========================
    // 3. Verify club ownership
    // =========================

    const clubRef = adminDb
      .collection("clubs")
      .doc(clubId);

    const clubSnapshot = await clubRef.get();

    if (!clubSnapshot.exists) {
      return NextResponse.json(
        {
          error: "النادي غير موجود",
        },
        { status: 404 }
      );
    }

    const clubData = clubSnapshot.data();

    if (clubData?.userId !== decodedToken.uid) {
      return NextResponse.json(
        {
          error:
            "ليس لديك صلاحية رفع ملفات لهذا النادي",
        },
        { status: 403 }
      );
    }

    // =========================
    // 4. Validate file
    // =========================

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "الملف فارغ",
        },
        { status: 400 }
      );
    }

    const maxSize = getMaxSize(field);

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isImageField(field)
            ? "حجم الصورة يجب ألا يتجاوز 5 ميجابايت"
            : "حجم المستند يجب ألا يتجاوز 10 ميجابايت",
        },
        { status: 400 }
      );
    }

    if (!isAllowedFile(file, field)) {
      return NextResponse.json(
        {
          error: isImageField(field)
            ? "يسمح بالصور فقط"
            : "يسمح بالصور وملفات PDF فقط",
        },
        { status: 400 }
      );
    }

    // =========================
    // 5. Convert file to buffer
    // =========================

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // =========================
    // 6. Sensitive documents
    // =========================

    const isSensitiveDocument =
      field !== "photo";

    const uploadType = isSensitiveDocument
      ? "authenticated"
      : "upload";

    // =========================
    // 7. Upload to Cloudinary
    // =========================

    const uploadResult = await new Promise<{
      public_id: string;
      secure_url: string;
      resource_type: string;
      format?: string;
      bytes: number;
      type?: string;
    }>((resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            folder: `the-champ/clubs/${clubId}/players/${field}`,

            resource_type: "auto",

            type: uploadType,

            use_filename: false,

            unique_filename: true,

            overwrite: false,
          },

          (error, result) => {
            if (error || !result) {
              reject(
                error ||
                  new Error(
                    "فشل رفع الملف إلى Cloudinary"
                  )
              );

              return;
            }

            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              resource_type:
                result.resource_type,
              format: result.format,
              bytes: result.bytes,
              type: result.type,
            });
          }
        );

      uploadStream.end(buffer);
    });

    // =========================
    // 8. Return safe information
    // =========================

    return NextResponse.json({
      success: true,

      field,

      public_id:
        uploadResult.public_id,

      resource_type:
        uploadResult.resource_type,

      format:
        uploadResult.format || null,

      bytes:
        uploadResult.bytes,

      type:
        uploadResult.type || uploadType,

      // الصورة يمكن استخدامها مباشرة.
      // المستندات الحساسة سنولد لها
      // رابطًا مؤقتًا ومؤمنًا لاحقًا.
      secure_url:
        field === "photo"
          ? uploadResult.secure_url
          : null,
    });
  } catch (error: any) {
    console.error(
      "SECURE UPLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء رفع الملف",
      },
      { status: 500 }
    );
  }
}