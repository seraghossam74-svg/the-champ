"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import app from "../../firebase";

type AdminUser = {
  uid: string;
  email: string;
  displayName: string;
  disabled: boolean;
  createdAt?: string | null;
  lastSignInAt?: string | null;
  role: string;
};

const SUPER_ADMIN_UID =
  "CP12ohOiNoWpcNkXmZhmalZw8eD3";

export default function AdminManagementPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] =
    useState(false);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error" | "info">("info");

  const [showPassword, setShowPassword] =
    useState(false);

  async function getCurrentUserToken() {
    const auth = getAuth(app);

    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
      throw new Error(
        "يجب تسجيل الدخول أولًا"
      );
    }

    return user.getIdToken();
  }

  async function loadAdmins() {
    try {
      setLoadingAdmins(true);

      const token =
        await getCurrentUserToken();

      const response = await fetch(
        "/api/admins",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر تحميل حسابات الأدمن"
        );
      }

      setAdmins(data.users || []);
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.message ||
          "حدث خطأ أثناء تحميل الأدمن"
      );

      setMessageType("error");
    } finally {
      setLoadingAdmins(false);
    }
  }

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            if (!user) {
              setAllowed(false);
              setLoading(false);
              return;
            }

            await auth.authStateReady();

            const isSuperAdmin =
              user.uid === SUPER_ADMIN_UID;

            setAllowed(isSuperAdmin);
            setLoading(false);

            if (isSuperAdmin) {
              await loadAdmins();
            }
          } catch (error) {
            console.error(error);
            setAllowed(false);
            setLoading(false);
          }
        }
      );

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const active = admins.filter(
      (admin) => !admin.disabled
    ).length;

    const disabled = admins.filter(
      (admin) => admin.disabled
    ).length;

    return {
      total: admins.length,
      active,
      disabled,
    };
  }, [admins]);

  async function createAdmin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setMessage("");
    setSaving(true);

    try {
      const cleanName =
        displayName.trim();

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanName) {
        throw new Error(
          "اكتب اسم الأدمن"
        );
      }

      if (!cleanEmail) {
        throw new Error(
          "اكتب البريد الإلكتروني"
        );
      }

      if (password.length < 6) {
        throw new Error(
          "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
        );
      }

      const token =
        await getCurrentUserToken();

      const response = await fetch(
        "/api/admins",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: cleanName,
            email: cleanEmail,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر إنشاء حساب الأدمن"
        );
      }

      setDisplayName("");
      setEmail("");
      setPassword("");

      setMessage(
        `تم إنشاء حساب الأدمن ${cleanName} بنجاح`
      );
      setMessageType("success");

      await loadAdmins();
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.message ||
          "حدث خطأ أثناء إنشاء الأدمن"
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAdmin(
    uid: string,
    displayName: string,
    adminEmail: string
  ) {
    if (uid === SUPER_ADMIN_UID) {
      setMessage(
        "لا يمكن حذف حساب SUPER ADMIN الرئيسي"
      );
      setMessageType("error");
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف حساب الأدمن؟\n\nالاسم: ${
          displayName || "بدون اسم"
        }\nالبريد: ${adminEmail}\n\nسيتم حذف الحساب نهائيًا.`
      );

    if (!confirmed) return;

    try {
      setDeletingUid(uid);
      setMessage("");

      const token =
        await getCurrentUserToken();

      const response = await fetch(
        "/api/admins",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            uid,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر حذف الأدمن"
        );
      }

      setMessage(
        "تم حذف حساب الأدمن بنجاح"
      );
      setMessageType("success");

      await loadAdmins();
    } catch (error: any) {
      console.error(error);

      setMessage(
        error?.message ||
          "حدث خطأ أثناء حذف الأدمن"
      );
      setMessageType("error");
    } finally {
      setDeletingUid(null);
    }
  }

  function formatDate(
    value?: string | null
  ) {
    if (!value) return "غير متاح";

    try {
      return new Date(
        value
      ).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "غير متاح";
    }
  }

  function formatLastLogin(
    value?: string | null
  ) {
    if (!value) return "لم يسجل دخول بعد";

    try {
      return new Date(
        value
      ).toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "غير متاح";
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#050816] text-white flex items-center justify-center"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
          <p className="text-slate-400">
            جاري تحميل لوحة SUPER ADMIN...
          </p>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-6"
      >
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-3xl">
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-extrabold">
            غير مصرح
          </h1>

          <p className="mt-3 text-slate-400">
            هذه الصفحة متاحة للـSUPER ADMIN فقط.
          </p>

          <a
            href="/admin"
            className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 font-bold text-slate-950"
          >
            العودة للوحة التحكم
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050816] text-white"
    >
      <div className="mx-auto max-w-7xl p-5 md:p-8 lg:p-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-300">
              👑 SUPER ADMIN
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              إدارة النظام
            </h1>

            <p className="mt-3 max-w-2xl text-slate-400">
              التحكم الكامل في حسابات الأدمن
              وإدارة صلاحيات الوصول للنظام.
            </p>
          </div>

          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            ← العودة للوحة الأدمن
          </a>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  إجمالي الأدمن
                </p>

                <p className="mt-2 text-4xl font-black">
                  {stats.total}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                👥
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/10 bg-emerald-400/[0.05] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  حسابات نشطة
                </p>

                <p className="mt-2 text-4xl font-black text-emerald-300">
                  {stats.active}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl">
                ✓
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-red-400/10 bg-red-400/[0.05] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  حسابات معطلة
                </p>

                <p className="mt-2 text-4xl font-black text-red-300">
                  {stats.disabled}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-2xl">
                ⛔
              </div>
            </div>
          </div>

        </div>

        {/* Message */}
        {message && (
          <div
            className={[
              "mb-8 rounded-2xl border px-5 py-4 font-semibold",
              messageType === "success"
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : messageType === "error"
                ? "border-red-400/20 bg-red-400/10 text-red-300"
                : "border-white/10 bg-white/5 text-slate-300",
            ].join(" ")}
          >
            {message}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[420px_1fr]">

          {/* Create Admin */}
          <section className="h-fit rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <div className="mb-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl">
                ➕
              </div>

              <h2 className="text-2xl font-black">
                إضافة أدمن جديد
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                أنشئ حسابًا إداريًا جديدًا ليتمكن
                من الدخول إلى النظام.
              </p>
            </div>

            <form
              onSubmit={createAdmin}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  اسم الأدمن
                </label>

                <input
                  type="text"
                  value={displayName}
                  onChange={(e) =>
                    setDisplayName(e.target.value)
                  }
                  placeholder="مثال: أحمد محمد"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  البريد الإلكتروني
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="admin@example.com"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  كلمة المرور
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder="6 أحرف على الأقل"
                    minLength={6}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3.5 pl-20 text-white outline-none transition placeholder:text-slate-600 focus:border-amber-400/40"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white"
                  >
                    {showPassword
                      ? "إخفاء"
                      : "إظهار"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-amber-400 px-5 py-4 font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "جاري إنشاء الحساب..."
                  : "إنشاء حساب الأدمن"}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs leading-6 text-slate-500">
                الحساب الجديد سيتم إنشاؤه عبر
                Firebase Admin Server، ولن تحتاج
                لإدخاله يدويًا في Firebase
                Authentication.
              </p>
            </div>
          </section>

          {/* Admin List */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  حسابات الأدمن
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  جميع الحسابات الإدارية الحالية.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAdmins}
                disabled={loadingAdmins}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
              >
                {loadingAdmins
                  ? "جاري التحديث..."
                  : "↻ تحديث"}
              </button>
            </div>

            {loadingAdmins ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
                  <p className="text-sm text-slate-400">
                    جاري تحميل الحسابات...
                  </p>
                </div>
              </div>
            ) : admins.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/10 p-10 text-center">
                <div className="text-4xl">
                  👤
                </div>

                <h3 className="mt-4 text-xl font-black">
                  لا يوجد أدمن إضافيون
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  استخدم النموذج لإضافة أول حساب إداري.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin) => {
                  const isMainSuperAdmin =
                    admin.uid ===
                    SUPER_ADMIN_UID;

                  return (
                    <div
                      key={admin.uid}
                      className="rounded-2xl border border-white/10 bg-[#020617]/70 p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-black">
                              {admin.displayName ||
                                "بدون اسم"}
                            </h3>

                            {isMainSuperAdmin ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                                👑 SUPER ADMIN
                              </span>
                            ) : (
                              <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300">
                                ADMIN
                              </span>
                            )}

                            {admin.disabled ? (
                              <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                                معطل
                              </span>
                            ) : (
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                                نشط
                              </span>
                            )}
                          </div>

                          <p className="mt-2 break-all text-sm text-slate-400">
                            {admin.email}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                            <span>
                              تاريخ الإنشاء:{" "}
                              {formatDate(
                                admin.createdAt
                              )}
                            </span>

                            <span>
                              آخر دخول:{" "}
                              {formatLastLogin(
                                admin.lastSignInAt
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isMainSuperAdmin ? (
                            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-center text-sm font-bold text-amber-300">
                              الحساب الرئيسي محمي
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                deleteAdmin(
                                  admin.uid,
                                  admin.displayName,
                                  admin.email
                                )
                              }
                              disabled={
                                deletingUid ===
                                admin.uid
                              }
                              className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingUid ===
                              admin.uid
                                ? "جاري الحذف..."
                                : "🗑 حذف الأدمن"}
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}