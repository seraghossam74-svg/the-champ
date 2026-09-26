import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../lib/firebase-admin";

const ADMIN_UID = "CP12ohOiNoWpcNkXmZhmalZw8eD3";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.uid !== ADMIN_UID) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "من فضلك اكتب كل البيانات" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور لازم تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
    });

    const clubRef = await adminDb.collection("clubs").add({
      name,
      email,
      userId: userRecord.uid,
      status: "active",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      clubId: clubRef.id,
    });
  } catch (error: any) {
    console.error(error);

    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "هذا الإيميل مستخدم بالفعل" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء إضافة النادي" },
      { status: 500 }
    );
  }
}