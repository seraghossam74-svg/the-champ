"use client";

import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import app from "../../firebase";

const SUPER_ADMIN_UID =
  "CP12ohOiNoWpcNkXmZhmalZw8eD3";

export default function AdminPage() {
  const [isSuperAdmin, setIsSuperAdmin] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe =
      onAuthStateChanged(auth, (user) => {
        setIsSuperAdmin(
          user?.uid === SUPER_ADMIN_UID
        );

        setAuthLoading(false);
      });

    return () => unsubscribe();
  }, []);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white"
    >
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-72 border-l border-white/10 bg-slate-900/80 p-6 lg:block">

          <div className="mb-10">
            <div className="text-3xl">🏆</div>

            <h1 className="mt-3 text-2xl font-extrabold">
              The Champ
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              لوحة تحكم البطولة
            </p>
          </div>

          <nav className="space-y-2">

            <button className="w-full rounded-xl bg-white px-4 py-3 text-right font-bold text-slate-950">
              🏠 نظرة عامة
            </button>

            <a
              href="/competitions"
              className="block w-full rounded-xl px-4 py-3 text-right text-slate-300 hover:bg-white/10"
            >
              🏆 البطولات
            </a>

            <a
              href="/clubs"
              className="block w-full rounded-xl bg-white/10 px-4 py-3 text-right font-bold text-white hover:bg-white/15"
            >
              🏢 الأندية
            </a>

            <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
              <p className="text-sm font-bold text-slate-400">
                ⚽ إدارة الفرق واللاعبين
              </p>

              <p className="mt-1 text-xs leading-6 text-slate-500">
                يتم الوصول إلى الفرق واللاعبين من داخل النادي
              </p>
            </div>

            <button className="w-full rounded-xl px-4 py-3 text-right text-slate-300 hover:bg-white/10">
              📅 المباريات
            </button>

            <button className="w-full rounded-xl px-4 py-3 text-right text-slate-300 hover:bg-white/10">
              📊 الترتيب
            </button>

            <button className="w-full rounded-xl px-4 py-3 text-right text-slate-300 hover:bg-white/10">
              🥅 الهدافين
            </button>

            {/* SUPER ADMIN */}
            {!authLoading && isSuperAdmin && (
              <a
                href="/admin-management"
                className="mt-4 block w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-right font-bold text-amber-300 hover:bg-amber-400/20"
              >
                👑 SUPER ADMIN
              </a>
            )}

          </nav>
        </aside>

        {/* Main */}
        <section className="flex-1 p-6 lg:p-10">

          <div className="mb-10">
            <p className="text-sm text-slate-400">
              مرحبًا بك في لوحة التحكم
            </p>

            <h2 className="mt-2 text-4xl font-extrabold">
              The Champ 🏆
            </h2>

            <p className="mt-3 text-slate-400">
              إدارة البطولة من خلال الأندية والفرق واللاعبين
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <a
              href="/competitions"
              className="block rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <p className="text-slate-400">
                البطولات
              </p>

              <p className="mt-3 text-3xl font-bold">
                →
              </p>

              <p className="mt-2 text-sm text-slate-500">
                إنشاء وتعديل البطولات والنسخ
              </p>
            </a>

            <a
              href="/clubs"
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
            >
              <p className="text-slate-400">
                الأندية
              </p>

              <p className="mt-3 text-3xl font-bold">
                →
              </p>

              <p className="mt-2 text-sm text-slate-500">
                دخول لإدارة الأندية والفرق واللاعبين
              </p>
            </a>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-400">
                المباريات
              </p>

              <p className="mt-3 text-3xl font-bold">
                —
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-400">
                الترتيب والهدافين
              </p>

              <p className="mt-3 text-3xl font-bold">
                —
              </p>
            </div>

            {/* SUPER ADMIN CARD */}
            {!authLoading && isSuperAdmin && (
              <a
                href="/admin-management"
                className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 transition hover:bg-amber-400/20 sm:col-span-2 xl:col-span-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-amber-300">
                      👑 SUPER ADMIN
                    </p>

                    <h3 className="mt-2 text-2xl font-extrabold text-white">
                      إدارة النظام والأدمن
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      إضافة وحذف حسابات الأدمن والتحكم في صلاحيات الإدارة
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-400 px-5 py-3 text-center font-bold text-slate-950">
                    فتح إدارة SUPER ADMIN →
                  </div>
                </div>
              </a>
            )}

          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">

            <h3 className="text-xl font-bold">
              🏢 طريقة إدارة الأندية
            </h3>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <div className="rounded-xl bg-white/5 p-5">
                <div className="text-2xl">
                  🏢
                </div>

                <h4 className="mt-3 font-bold">
                  1. النادي
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  اختيار النادي المطلوب إدارته
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-5">
                <div className="text-2xl">
                  ⚽
                </div>

                <h4 className="mt-3 font-bold">
                  2. الفرق
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  مشاهدة الفرق التابعة للنادي
                </p>
              </div>

              <div className="rounded-xl bg-white/5 p-5">
                <div className="text-2xl">
                  👤
                </div>

                <h4 className="mt-3 font-bold">
                  3. اللاعبين
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  إدارة لاعبي الفريق واعتمادهم
                </p>
              </div>

            </div>
          </div>

        </section>
      </div>
    </main>
  );
}