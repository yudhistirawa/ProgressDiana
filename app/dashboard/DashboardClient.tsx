"use client";

import Link from "next/link";
import LogoutLink from "@/components/LogoutLink";
import Image from "next/image";
import LogoImg from "@/Logo/Logo_BGD__1_-removebg-preview.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

type ProjectKey = "diana" | "bungtomo";
const PROJECT_STORAGE_KEY = "selected_project";

export default function DashboardClient({ initialProject }: { initialProject?: ProjectKey }) {
  const [project, setProject] = useState<ProjectKey>(initialProject ?? "diana");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(PROJECT_STORAGE_KEY) as ProjectKey | null) : null;
    if (saved === "diana" || saved === "bungtomo") {
      setProject(saved);
    } else if (initialProject) {
      setProject(initialProject);
      localStorage.setItem(PROJECT_STORAGE_KEY, initialProject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProject = (p: ProjectKey) => {
    setProject(p);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROJECT_STORAGE_KEY, p);
    }
  };

  return (
    <div className="relative min-h-screen w-full text-neutral-900 bg-gradient-to-br from-[#fdf7ff] via-[#f8fbff] to-[#f6f8fb]">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-12 w-72 h-72 bg-rose-100/60 rounded-full blur-3xl" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-100/60 rounded-full blur-3xl" />
        <div className="absolute left-1/2 -bottom-10 -translate-x-1/2 w-[520px] h-[520px] bg-white/50 rounded-full blur-3xl" />
      </div>

      {/* App Bar */}
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-6xl px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={LogoImg} alt="BGD" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <div className="leading-tight">
              <div className="font-semibold">BGD</div>
              <div className="text-xs text-neutral-500">Sistem Dokumentasi Progres</div>
            </div>
          </div>
          <div className="hidden sm:block text-sm font-semibold tracking-wide">Dashboard</div>
          <div className="flex items-center gap-2">
            <LogoutLink
              href="/"
              title="Keluar"
              className="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M10 3a1 1 0 1 0 0 2h6v14h-6a1 1 0 1 0 0 2h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-7Z" />
                <path d="M12.7 8.3a1 1 0 1 0-1.4 1.4L13.59 12l-2.3 2.3a1 1 0 1 0 1.42 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
              </svg>
            </LogoutLink>
            <Avatar fallback="BG" size="sm" className="ml-1" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative mx-auto max-w-6xl px-4 pb-24 sm:pb-12 pt-6 md:pt-8 space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-white/85 backdrop-blur ring-1 ring-white/70 shadow-lg shadow-rose-50/60">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-100/70 blur-2xl" />
          <div className="absolute left-6 bottom-6 h-20 w-20 rounded-full bg-indigo-100/60 blur-2xl" />
          <div className="relative px-6 py-7 sm:px-8 sm:py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-1">Selamat datang</p>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Kelola progres dengan cepat dan rapi</h1>
              <p className="text-sm text-neutral-600 mt-2">Pilih proyek dan mulai akses laporan Anda.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/80 ring-1 ring-neutral-200 shadow-sm p-2">
              {(["diana", "bungtomo"] as const).map((p) => {
                const active = project === p;
                return (
                  <button
                    key={p}
                    onClick={() => handleProject(p)}
                    className={[
                      "px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                      active ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow" : "text-neutral-700 hover:bg-white"
                    ].join(" ")}
                  >
                    {p === "diana" ? "Proyek Diana" : "Proyek Bung Tomo"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href={`/dashboard/laporan-progres?project=${project}`}
            className="group relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-neutral-200/60 shadow-lg shadow-blue-50/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <rect x="3" y="4" width="14" height="16" rx="2" fill="#E5E7EB" />
                  <path d="M7 15l2-2 2 1 4-4" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 7h3v10H6v-2" stroke="#0f172a" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">Laporan Progres</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">Buat dan kelola laporan progres per tahap dengan cepat.</p>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  Buka
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="m13 5 7 7-7 7v-4H4v-6h9V5Z" /></svg>
                </div>
              </div>
            </div>
          </Link>

          <Link
            href={`/dashboard/riwayat-laporan?project=${project}`}
            className="group relative overflow-hidden rounded-3xl bg-white p-6 ring-1 ring-neutral-200/60 shadow-lg shadow-rose-50/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <rect x="5" y="3" width="12" height="18" rx="2" fill="#E5E7EB" />
                  <path d="M8 8h6M8 11h6M8 14h4" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                  <path d="M14 3v4h4" fill="#9CA3AF" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900">Riwayat Laporan</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">Telusuri laporan terdahulu per proyek dengan rapi.</p>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 group-hover:translate-x-1 transition-transform">
                  Lihat riwayat
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="m13 5 7 7-7 7v-4H4v-6h9V5Z" /></svg>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Tips */}
        <section className="rounded-3xl bg-white/85 backdrop-blur ring-1 ring-white/70 shadow-lg shadow-neutral-50/70 p-6 sm:p-7">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Tips</p>
              <h3 className="text-lg font-semibold text-neutral-900">Optimalkan dokumentasi Anda</h3>
            </div>
          </div>
          <ul className="list-disc pl-4 text-sm text-neutral-600 space-y-2">
            <li>Unggah bukti foto dengan resolusi cukup.</li>
            <li>Gunakan deskripsi singkat, jelas, dan terstruktur.</li>
            <li>Perbarui progres secara rutin untuk akurasi.</li>
          </ul>
        </section>
      </main>

      {/* Bottom Nav (mobile only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-t border-neutral-200">
        <div className="mx-auto max-w-6xl grid grid-cols-3 text-xs">
          <Link href="/dashboard" className="flex flex-col items-center justify-center h-14 text-neutral-900 gap-0.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M12 3 3 10h3v10h5V14h2v6h5V10h3L12 3Z" />
            </svg>
            <span>Beranda</span>
          </Link>
          <Link href={`/dashboard/riwayat-laporan?project=${project}`} className="flex flex-col items-center justify-center h-14 text-neutral-700 gap-0.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-2-5 2V6a2 2 0 0 1 2-2Z" />
            </svg>
            <span>Riwayat</span>
          </Link>
          <Link href="/dashboard/profil" className="flex flex-col items-center justify-center h-14 text-neutral-700 gap-0.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
            </svg>
            <span>Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
