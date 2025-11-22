"use client";

import Link from "next/link";
import { useState } from "react";
import AvatarMenuClient from "@/app/admin/components/AvatarMenuClient";
import DataHarianClient from "./DataHarianClient";

export default function DataHarianPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
        <div aria-hidden className="absolute -left-24 -top-24 w-80 h-80 bg-neutral-900 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute left-24 -top-14 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg] opacity-95" />
        <div aria-hidden className="absolute left-56 -top-20 w-80 h-80 bg-neutral-200 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-20 bottom-24 w-80 h-80 bg-neutral-100 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-10 -bottom-10 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute right-40 -bottom-24 w-72 h-72 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 sm:hidden">
        <div aria-hidden className="absolute -left-16 -top-16 w-40 h-40 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-16 -bottom-16 w-40 h-40 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-6 sm:col-span-3 flex items-center gap-2">
            {/* Tombol Menu Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="sm:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg text-neutral-600 hover:bg-neutral-100"
              aria-label="Buka menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M3 6a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM4 17a1 1 0 100 2h16a1 1 0 100-2H4z" />
              </svg>
            </button>
            <div className="text-sm sm:text-base font-semibold tracking-wide">Data Masuk Harian</div>
          </div>
          <div className="hidden sm:block sm:col-span-6" />
          <div className="col-span-6 sm:col-span-3 flex items-center justify-end gap-2">
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
          <div className="h-full rounded-r-2xl sm:rounded-2xl ring-1 ring-neutral-200 bg-white shadow-lg sm:shadow-sm overflow-hidden sm:sticky sm:top-24">
            <div className="px-4 py-2 border-b border-neutral-200 text-sm font-semibold">Menu</div>
            <nav className="p-3 grid gap-2 text-sm">
              <Link href="/admin/dashboard" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Home</Link>
              <Link href="/admin/laporan-progres" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Laporan Progres</Link>
              <Link href="/admin/data-harian" className="rounded-lg bg-red-600 text-white px-3 py-2">Data Masuk Harian</Link>
              <Link href="/admin/manajemen-pengguna" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Manajemen Pengguna</Link>
              <Link href="/admin/formulir-tahapan" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Kelola Formulir & Tahapan</Link>
              <Link href="/admin/sampah" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Tempat Sampah</Link>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 sm:col-span-9 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
          <DataHarianClient />
        </main>
      </div>
    </div>
  );
}
