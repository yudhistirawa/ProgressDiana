"use client";

import Link from "next/link";
import AvatarMenuClient from "@/app/admin/components/AvatarMenuClient";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

export default function ViewerDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
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

  return (
    <div className="relative min-h-screen w-full bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-6 flex items-center gap-2">
            <h1 className="text-lg font-semibold text-neutral-900">Dashboard Viewer</h1>
          </div>
          <div className="col-span-6 flex items-center justify-end gap-2">
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-800">
            Selamat Datang, {loading ? "..." : user?.displayName || user?.email || "Viewer"}!
          </h2>
          <p className="text-neutral-600">Pilih menu di bawah untuk melihat data laporan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Data Harian */}
          <Link href="/viewer/data-harian" className="group block rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 hover:ring-red-400 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Data Masuk Harian</h3>
                <p className="text-sm text-neutral-500 mt-1">Lihat rekapitulasi data laporan yang masuk setiap hari.</p>
              </div>
            </div>
          </Link>

          {/* Card: Laporan Progres */}
          <Link href="/viewer/laporan-progress" className="group block rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 hover:ring-blue-400 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Laporan Progres</h3>
                <p className="text-sm text-neutral-500 mt-1">Telusuri semua data laporan progres secara mendetail.</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}