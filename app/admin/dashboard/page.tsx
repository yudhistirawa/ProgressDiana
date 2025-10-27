import Link from "next/link";
import AvatarMenuClient from "../components/AvatarMenuClient";

export const metadata = {
  title: "Dashboard Admin - Sistem Dokumentasi Progres",
  description: "Akses cepat fitur administrasi",
};

export default function AdminDashboard() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
      {/* Decorative Background */}
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
          <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
              title="Kembali"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <div className="text-sm sm:text-base font-semibold tracking-wide">Dashboard</div>
          </div>

          <div className="col-span-12 sm:col-span-6">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
                </svg>
              </span>
              <input
                placeholder="Search......."
                className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
          </div>

          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
            <Link href="/admin/notifikasi" className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Notifikasi">
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
        <aside className="col-span-12 sm:col-span-3 lg:col-span-3">
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-neutral-200 text-sm font-semibold">Dashboard</div>
            <nav className="p-3 grid gap-2 text-sm">
              <Link href="/admin/dashboard" className="rounded-lg bg-red-600 text-white px-3 py-2">Home</Link>
              <Link href="/admin/laporan-progres" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Laporan Progres</Link>
              <Link href="/admin/data-harian" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Data Masuk Harian</Link>
              <Link href="/admin/manajemen-pengguna" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Manajemen Pengguna</Link>
              <Link href="/admin/formulir-tahapan" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Kelola Formulir & Tahapan</Link>
              <Link href="/admin/sampah" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Tempat Sampah</Link>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="col-span-12 sm:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/laporan-progres" className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center backdrop-blur hover:-translate-y-0.5">
            <div className="mx-auto mb-4 h-16 w-16 rounded-xl grid place-items-center bg-gradient-to-br from-red-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
              <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none">
                <rect x="6" y="4" width="30" height="40" rx="4" fill="#E5E7EB" />
                <path d="M14 33l4-4 4 2 8-8" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M28 12h6v20H12v-2" stroke="#0F172A" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div className="text-sm font-medium">Laporan Progres</div>
          </Link>

          <Link href="/admin/data-harian" className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center backdrop-blur hover:-translate-y-0.5">
            <div className="mx-auto mb-4 h-16 w-16 rounded-xl grid place-items-center bg-gradient-to-br from-green-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
              <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none">
                <rect x="8" y="6" width="32" height="36" rx="3" fill="#E5E7EB" />
                <path d="M14 14h20M14 22h16M14 30h12" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="34" cy="34" r="6" fill="#10B981" />
                <path d="M32 34l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm font-medium">Data Masuk Harian</div>
          </Link>

          <Link href="/admin/manajemen-pengguna" className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center backdrop-blur hover:-translate-y-0.5">
            <div className="mx-auto mb-4 h-16 w-16 rounded-xl grid place-items-center bg-gradient-to-br from-blue-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
              <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none">
                <rect x="8" y="6" width="32" height="24" rx="3" fill="#E5E7EB" />
                <path d="M14 24h20" stroke="#0F172A" strokeWidth="3" />
                <circle cx="18" cy="16" r="3" fill="#0F172A" />
                <circle cx="30" cy="16" r="3" fill="#0F172A" />
              </svg>
            </div>
            <div className="text-sm font-medium">Manajemen Pengguna</div>
          </Link>

          <Link href="/admin/formulir-tahapan" className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center backdrop-blur hover:-translate-y-0.5 md:col-span-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-xl grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
              <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none">
                <rect x="8" y="6" width="28" height="36" rx="4" fill="#E5E7EB" />
                <path d="M16 18h16M16 24h14M16 30h10" stroke="#0F172A" strokeWidth="3" />
                <path d="M30 6v8h8" fill="#9CA3AF" />
              </svg>
            </div>
            <div className="text-sm font-medium">Kelola Formulir & Tahapan</div>
          </Link>
        </main>
      </div>
    </div>
  );
}
