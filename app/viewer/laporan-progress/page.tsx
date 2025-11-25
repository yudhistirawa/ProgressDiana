"use client";

import Link from "next/link";
import ViewerLaporanProgressClient from "./ViewerLaporanProgressClient";
import AvatarMenuClient from "@/app/admin/components/AvatarMenuClient";
import { useEffect, useState } from "react";

type ProjectKey = "diana" | "bungtomo";
const PROJECT_STORAGE_KEY = "viewer_selected_project";

export default function ViewerLaporanProgressPage() {
  const [project, setProject] = useState<ProjectKey>("diana");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(PROJECT_STORAGE_KEY) as ProjectKey | null) : null;
    if (saved === "bungtomo" || saved === "diana") setProject(saved);
  }, []);

  const handleProject = (p: ProjectKey) => {
    setProject(p);
    if (typeof window !== "undefined") {
      localStorage.setItem(PROJECT_STORAGE_KEY, p);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-6 flex items-center gap-2">
            <Link href="/viewer" className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Kembali">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <h1 className="text-lg font-semibold text-neutral-900">Laporan Progres</h1>
          </div>
          <div className="col-span-6 flex items-center justify-end gap-2">
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-900">Pilih Proyek</div>
            <div className="text-xs text-neutral-500">Data progres viewer dipisah per proyek</div>
          </div>
          <div className="inline-flex rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-1">
            {(["diana", "bungtomo"] as const).map((p) => {
              const active = project === p;
              return (
                <button
                  key={p}
                  onClick={() => handleProject(p)}
                  className={[
                    "px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                    active ? "bg-red-600 text-white shadow-sm" : "text-neutral-700 hover:bg-white"
                  ].join(" ")}
                >
                  {p === "diana" ? "Proyek Diana" : "Proyek Bung Tomo"}
                </button>
              );
            })}
          </div>
        </div>

        <ViewerLaporanProgressClient project={project} />
      </main>
    </div>
  );
}
