"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "../../firebase";

export default function AdminManagementPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const tokenResult = await user.getIdTokenResult();

      const isSuperAdmin =
        user.uid === "CP12ohOiNoWpcNkXmZhmalZw8eD3";

      const hasAdminClaim =
        tokenResult.claims.admin === true ||
        tokenResult.claims.role === "admin" ||
        tokenResult.claims.role === "super_admin";

      setAllowed(isSuperAdmin || hasAdminClaim);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center"
      >
        <p>جاري التحقق من الصلاحيات...</p>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-gray-100 p-6"
      >
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            غير مصرح
          </h1>

          <p className="mt-3 text-gray-600">
            ليس لديك صلاحية للوصول إلى إدارة الأدمن.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-100 p-6"
    >
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">
          إدارة الأدمن
        </h1>

        <p className="mt-2 text-gray-600">
          من هنا سيتم التحكم في حسابات وصلاحيات الأدمن.
        </p>

        <div className="mt-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold">
            👑 SUPER ADMIN
          </h2>

          <p className="mt-3 text-gray-600">
            أنت حاليًا الأدمن الرئيسي للنظام.
          </p>
        </div>
      </div>
    </main>
  );
}