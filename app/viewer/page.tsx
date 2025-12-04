"use client";

import Link from "next/link";
import AvatarMenuClient from "@/app/admin/components/AvatarMenuClient";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

const FEATURE_CARDS = [
  {
    href: "/viewer/data-harian",
    title: "Data Masuk Harian",
    desc: "Lihat rekapitulasi laporan yang masuk setiap hari.",
    iconBg: "bg-rose-100 text-rose-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    accent: "from-rose-50/70 to-white border-rose-100 hover:border-rose-200 shadow-rose-100/60",
  },
  {
    href: "/viewer/laporan-progress",
    title: "Laporan Progres",
    desc: "Telusuri semua data progres secara mendetail.",
    iconBg: "bg-indigo-100 text-indigo-600",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accent: "from-indigo-50/70 to-white border-indigo-100 hover:border-indigo-200 shadow-indigo-100/60",
  },
];

export default function ViewerDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    const listenToAuthChanges = async () => {
      try {
        const { getAuth } = await import("firebase/auth");
        const auth = getAuth();
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        setLoading(false);
      }
    };
    listenToAuthChanges();
    return () => unsubscribe();
  }, []);

  const displayName = loading ? "..." : user?.displayName || user?.email || "Viewer";

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#fdf7ff] via-[#f8fbff] to-[#f6f8fb] text-neutral-900">
      {/* Floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-12 w-72 h-72 bg-rose-100/60 rounded-full blur-3xl" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-100/60 rounded-full blur-3xl" />
        <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 w-[520px] h-[520px] bg-white/50 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-500 text-white grid place-items-center shadow-md">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 3 3 10v11h6v-6h6v6h6V10L12 3Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-xs uppercase tracking-wide text-neutral-500">Sistem Viewer</div>
              <h1 className="text-sm font-semibold text-neutral-900">Dashboard Viewer</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur ring-1 ring-white/70 shadow-lg shadow-rose-100/50">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br from-rose-100 to-indigo-100 blur-2xl" />
          <div className="absolute left-6 bottom-4 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-50 to-white blur-lg" />
          <div className="relative px-6 py-7 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-1">Selamat datang</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Halo, {displayName}!</h2>
              <p className="text-sm text-neutral-600 mt-2">Pilih menu di bawah untuk melihat data laporan.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100/80 px-4 py-2 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px] shadow-emerald-100" aria-hidden />
              Status: aktif
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURE_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${card.accent} p-6 sm:p-7 transition-all duration-300 ease-out shadow-xl`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/70 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconBg} shadow-inner`}>
                  {card.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">{card.title}</h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">{card.desc}</p>
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 group-hover:translate-x-1 transition-transform">
                    Buka
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="m13 5 7 7-7 7v-4H4v-6h9V5Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
