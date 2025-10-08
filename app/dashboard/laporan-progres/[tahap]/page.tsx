import Link from "next/link";

type Props = {
  params: Promise<{ tahap: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tahap } = await params;
  const n = Number(tahap);
  return {
    title: `Tahap ${Number.isFinite(n) ? n : tahap} - Laporan Progres`,
    description: "Detail progres, unggah bukti, dan ringkasan aktivitas",
  };
}

export default async function TahapDetail({ params }: Props) {
  const { tahap } = await params;
  const tahapLabel = `Tahap ${tahap}`;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
      {/* Decorative background - desktop/tablet */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
        <div aria-hidden className="absolute -left-24 -top-24 w-80 h-80 bg-neutral-900 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute left-24 -top-14 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg] opacity-95" />
        <div aria-hidden className="absolute left-56 -top-20 w-80 h-80 bg-neutral-200 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-20 bottom-24 w-80 h-80 bg-neutral-100 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-10 -bottom-10 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute right-40 -bottom-24 w-72 h-72 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      {/* Decorative background - mobile */}
      <div className="pointer-events-none absolute inset-0 -z-10 sm:hidden">
        <div aria-hidden className="absolute -left-16 -top-16 w-40 h-40 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-16 -bottom-16 w-40 h-40 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard/laporan-progres"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
            title="Kembali"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
            </svg>
          </Link>
          <div className="text-sm sm:text-base font-semibold tracking-wide">{tahapLabel}</div>
          <div className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm text-xs">
            Draft
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-3 sm:px-4 pb-10 pt-5 space-y-5">
        {/* Summary */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Progress</div>
            <div className="mt-1 text-xl font-semibold">45%</div>
            <div className="mt-2 h-2 rounded-full bg-neutral-200">
              <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-red-500 to-red-600" />
            </div>
          </div>
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Tugas</div>
            <div className="mt-1 text-xl font-semibold">12</div>
            <div className="text-xs text-neutral-500">4 selesai</div>
          </div>
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Terakhir Update</div>
            <div className="mt-1 text-xl font-semibold">Hari ini</div>
          </div>
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 shadow-sm">
            <div className="text-xs text-neutral-500">Status</div>
            <div className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-amber-700">
              <span className="size-2 rounded-full bg-amber-400" />
              Berjalan
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap items-center gap-3">
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 text-white px-4 py-2.5 text-sm font-semibold shadow-md hover:from-red-600 hover:to-red-700"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 0 1 0-2h7V4a1 1 0 0 1 1-1Z" />
            </svg>
            Buat Laporan Baru
          </Link>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white text-neutral-700 px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M7 4a2 2 0 0 0-2 2v12l7-3 7 3V6a2 2 0 0 0-2-2H7Z" />
            </svg>
            Unggah Bukti
          </Link>
        </section>

        {/* Placeholder table/list */}
        <section className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
            <div className="text-sm font-medium">Aktivitas Terbaru</div>
            <span className="text-xs text-neutral-500">3 item</span>
          </div>
          <ul className="divide-y divide-neutral-200">
            <li className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Pengukuran lapangan</div>
                <div className="text-xs text-neutral-500">Diperbarui 2 jam lalu</div>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-emerald-700"><span className="size-2 rounded-full bg-emerald-400" />Selesai</span>
            </li>
            <li className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Dokumentasi foto</div>
                <div className="text-xs text-neutral-500">Menunggu verifikasi</div>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-amber-700"><span className="size-2 rounded-full bg-amber-400" />Proses</span>
            </li>
            <li className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Pemetaan awal</div>
                <div className="text-xs text-neutral-500">Dibuat kemarin</div>
              </div>
              <span className="inline-flex items-center gap-2 text-xs text-neutral-600"><span className="size-2 rounded-full bg-neutral-300" />Draft</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
