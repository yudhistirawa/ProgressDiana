"use client";

import Link from "next/link";
import { useState } from "react";
import AvatarMenuClient from "@/app/admin/components/AvatarMenuClient";
import DataHarianClient from "./DataHarianClient";

export default function DataHarianPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [project, setProject] = useState<"diana" | "bungtomo">("diana");

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#f9fbff] via-white to-[#fdf6ff] text-neutral-900">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div aria-hidden className="absolute -left-24 -top-28 w-96 h-96 bg-rose-100/70 blur-3xl rounded-full" />
        <div aria-hidden className="absolute -right-16 top-10 w-80 h-80 bg-sky-100 blur-3xl rounded-full" />
        <div aria-hidden className="absolute right-10 bottom-0 w-96 h-96 bg-emerald-100/60 blur-3xl rounded-full" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-12 sm:col-span-4 flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
              title="Kembali"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            {/* Tombol Menu Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="sm:hidden inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
              aria-label="Buka menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M3 6a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM4 17a1 1 0 100 2h16a1 1 0 100-2H4z" />
              </svg>
            </button>
            <div className="text-base sm:text-lg font-semibold tracking-wide">Data Masuk Harian</div>
          </div>
          <div className="hidden sm:block sm:col-span-5" />
          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 px-4 py-6">
        {/* Sidebar */}
        {/* Backdrop untuk mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm sm:hidden"
            aria-hidden="true"
          />
        )}
        <aside
          className={`
            fixed sm:relative inset-y-0 left-0 z-40 w-64 sm:w-auto
            col-span-12 sm:col-span-3 lg:col-span-3
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
          `}>
          <div className="h-full rounded-r-2xl sm:rounded-2xl ring-1 ring-white/80 bg-white/90 backdrop-blur shadow-lg shadow-rose-50/60 overflow-hidden sm:sticky sm:top-24">
            <div className="px-5 py-3 border-b border-neutral-200 text-sm font-semibold flex items-center justify-between">
              <span>Menu Utama</span>
              <span className="text-[10px] rounded-full bg-rose-100 text-rose-700 px-2 py-1 font-semibold">Admin</span>
            </div>
            <nav className="p-3 grid gap-2 text-sm">
              <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/40">🏠</span>
                Home
              </Link>
              <Link href="/admin/laporan-progres" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">📈</span>
                Laporan Progres
              </Link>
              <Link href="/admin/data-harian" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white px-3 py-2 shadow-md shadow-rose-200/60">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">🗒️</span>
                Data Masuk Harian
              </Link>
              <Link href="/admin/manajemen-pengguna" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">👥</span>
                Manajemen Pengguna
              </Link>
              <Link href="/admin/formulir-tahapan" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-700">✏️</span>
                Kelola Formulir & Tahapan
              </Link>
              <Link href="/admin/sampah" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">🗑️</span>
                Tempat Sampah
              </Link>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 sm:col-span-9 flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-neutral-900">Pilih Proyek</div>
              <div className="text-xs text-neutral-500">Laporan harian disimpan terpisah per proyek</div>
            </div>
            <div className="inline-flex rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-1">
              {(["diana", "bungtomo"] as const).map((p) => {
                const active = project === p;
                return (
                  <button
                    key={p}
                    onClick={() => setProject(p)}
                    className={[
                      "px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      active ? "bg-red-600 text-white shadow-sm" : "text-neutral-700 hover:bg-white"
                    ].join(" ")}
                  >
                    {p === "diana" ? "Proyek Diana" : "Proyek Bung Tomo"}
                  </button>
                );
              })}
            </div>
          </div>
          <DataHarianClient project={project} />
        </main>
      </div>
    </div>
  );
}
