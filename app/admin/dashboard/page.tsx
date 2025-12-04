import Link from "next/link";
import AvatarMenuClient from "../components/AvatarMenuClient";

export const metadata = {
  title: "Dashboard Admin - Sistem Dokumentasi Progres",
  description: "Akses cepat fitur administrasi",
};

export default function AdminDashboard() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#f9fbff] via-white to-[#fdf6ff] text-neutral-900">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div aria-hidden className="absolute -left-24 -top-28 w-96 h-96 bg-rose-100/70 blur-3xl rounded-full" />
        <div aria-hidden className="absolute -right-16 top-10 w-80 h-80 bg-sky-100 blur-3xl rounded-full" />
        <div aria-hidden className="absolute right-10 bottom-0 w-96 h-96 bg-emerald-100/60 blur-3xl rounded-full" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-white/60 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
              title="Kembali"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <div className="text-base sm:text-lg font-semibold tracking-wide">Dashboard</div>
          </div>

          <div className="col-span-12 sm:col-span-6">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
                </svg>
              </span>
              <input
                placeholder="Cari fitur atau halaman..."
                className="w-full rounded-2xl border-0 ring-1 ring-neutral-200 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
            <Link href="/admin/notifikasi" className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Notifikasi">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 5 8v1a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1a9 9 0 0 0 5-8 9 9 0 0 0-9-9Zm1 18h-2v-2h2v2Zm0-4h-2a5 5 0 0 1-5-5h2a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3h2a5 5 0 0 1-5 5Z" />
              </svg>
            </Link>
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      {/* Body with sidebar */}
      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 px-4 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 sm:col-span-4 lg:col-span-3">
          <div className="rounded-2xl ring-1 ring-white/80 bg-white/90 backdrop-blur shadow-lg shadow-rose-50/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-200 text-sm font-semibold flex items-center justify-between">
              <span>Menu Utama</span>
              <span className="text-[10px] rounded-full bg-rose-100 text-rose-700 px-2 py-1 font-semibold">Admin</span>
            </div>
            <nav className="p-3 grid gap-2 text-sm">
              <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white px-3 py-2 shadow-md shadow-rose-200/60">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">🏠</span>
                Home
              </Link>
              <Link href="/admin/laporan-progres" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">📈</span>
                Laporan Progres
              </Link>
              <Link href="/admin/data-harian" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">🗒️</span>
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

        {/* Main content */}
        <main className="col-span-12 sm:col-span-8 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link href="/admin/laporan-progres" className="group rounded-2xl ring-1 ring-white/70 bg-white/90 shadow-lg shadow-slate-100/70 hover:shadow-xl transition-all duration-200 p-6 text-left backdrop-blur hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-rose-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
                  <rect x="6" y="4" width="30" height="40" rx="4" fill="#E5E7EB" />
                  <path d="M14 33l4-4 4 2 8-8" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M28 12h6v20H12v-2" stroke="#0F172A" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Laporan Progres</div>
                <p className="text-xs text-neutral-500">Pantau perkembangan pekerjaan terbaru.</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/data-harian" className="group rounded-2xl ring-1 ring-white/70 bg-white/90 shadow-lg shadow-emerald-50/70 hover:shadow-xl transition-all duration-200 p-6 text-left backdrop-blur hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-emerald-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
                  <rect x="8" y="6" width="32" height="36" rx="3" fill="#E5E7EB" />
                  <path d="M14 14h20M14 22h16M14 30h12" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="34" cy="34" r="6" fill="#10B981" />
                  <path d="M32 34l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Data Masuk Harian</div>
                <p className="text-xs text-neutral-500">Ringkasan laporan per hari.</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/manajemen-pengguna" className="group rounded-2xl ring-1 ring-white/70 bg-white/90 shadow-lg shadow-sky-50/70 hover:shadow-xl transition-all duration-200 p-6 text-left backdrop-blur hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-blue-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
                  <rect x="8" y="6" width="32" height="24" rx="3" fill="#E5E7EB" />
                  <path d="M14 24h20" stroke="#0F172A" strokeWidth="3" />
                  <circle cx="18" cy="16" r="3" fill="#0F172A" />
                  <circle cx="30" cy="16" r="3" fill="#0F172A" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Manajemen Pengguna</div>
                <p className="text-xs text-neutral-500">Kelola akses dan peran pengguna.</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/formulir-tahapan" className="group rounded-2xl ring-1 ring-white/70 bg-white/90 shadow-lg shadow-slate-50/70 hover:shadow-xl transition-all duration-200 p-6 text-left backdrop-blur hover:-translate-y-0.5 md:col-span-2">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
                <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
                  <rect x="8" y="6" width="28" height="36" rx="4" fill="#E5E7EB" />
                  <path d="M16 18h16M16 24h14M16 30h10" stroke="#0F172A" strokeWidth="3" />
                  <path d="M30 6v8h8" fill="#9CA3AF" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900">Kelola Formulir & Tahapan</div>
                <p className="text-xs text-neutral-500">Susun formulir dan urutan tahap pekerjaan.</p>
              </div>
            </div>
          </Link>
        </main>
      </div>
    </div>
  );
}
