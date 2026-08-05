import Link from "next/link";
import PlanningListClient from "@/app/components/planning/PlanningListClient";
import type { ProjectKey } from "@/lib/firestore/planning";

export const metadata = {
  title: "Planning - Sistem Dokumentasi Progres",
  description: "Lihat planning pekerjaan dan progres real harian",
};

type Props = { searchParams?: { project?: string } };

export default function DashboardPlanningPage({ searchParams }: Props) {
  const projectParam: ProjectKey = searchParams?.project === "bungtomo" ? "bungtomo" : searchParams?.project === "bisma" ? "bisma" : "diana";
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
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

      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
            title="Kembali ke Dashboard"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
            </svg>
          </Link>
          <div className="text-sm sm:text-base font-semibold tracking-wide">Planning</div>
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-red-600 shadow-sm">
            <svg viewBox="0 0 100 100" className="h-4 w-4" fill="currentColor" aria-hidden>
              <g transform="translate(50,50)">
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" />
                <rect x="-3.5" y="10" width="7" height="18" rx="2" transform="rotate(180)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(45)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(90)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(135)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(225)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(270)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(315)" />
              </g>
            </svg>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 sm:px-4 pb-8 pt-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-neutral-600">
            Proyek aktif:{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide">
              {projectParam === "diana" ? "Diana" : projectParam === "bisma" ? "Bisma" : "Bung Tomo"}
            </span>
          </p>
          <div className="inline-flex rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-1">
            <Link
              href="/dashboard/planning?project=diana"
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                projectParam === "diana" ? "bg-red-600 text-white shadow-sm" : "text-neutral-700 hover:bg-white",
              ].join(" ")}
            >
              Diana
            </Link>
            <Link
              href="/dashboard/planning?project=bungtomo"
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                projectParam === "bungtomo" ? "bg-red-600 text-white shadow-sm" : "text-neutral-700 hover:bg-white",
              ].join(" ")}
            >
              Bung Tomo
            </Link>
            <Link
              href="/dashboard/planning?project=bisma"
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                projectParam === "bisma" ? "bg-red-600 text-white shadow-sm" : "text-neutral-700 hover:bg-white",
              ].join(" ")}
            >
              Bisma
            </Link>
          </div>
        </div>

        <PlanningListClient
          projectKey={projectParam}
          mode="readonly"
          basePath="/dashboard/planning"
          detailQuery={`?project=${projectParam}`}
        />
      </main>
    </div>
  );
}
