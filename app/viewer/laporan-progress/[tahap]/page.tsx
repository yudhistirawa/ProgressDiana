"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import PageTransition from "@/components/PageTransition";
import AvatarMenuClient from "@/app/admin/components/AvatarMenuClient";
import StageReportListClient from "@/app/admin/laporan-progres/[tahap]/StageReportListClient";

export default function ViewerStageReportPage() {
  const params = useParams();
  const stage = typeof params.tahap === 'string' ? parseInt(params.tahap) : Array.isArray(params.tahap) ? parseInt(params.tahap[0]) : 1;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-20 bg-white/95 border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 py-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-12 sm:col-span-6 flex items-center gap-2">
            <Link href="/viewer/laporan-progress" className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Kembali">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold text-neutral-900">Tahap {stage}</h1>
          </div>
          <div className="col-span-12 sm:col-span-6 flex items-center justify-end gap-2">
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Pass readOnly prop to show the list in view-only mode */}
          <StageReportListClient stage={stage} readOnly={true} />
        </div>
      </PageTransition>
    </div>
  );
}