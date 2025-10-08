import Link from "next/link";
import AvatarMenuClient from "../components/AvatarMenuClient";

export const metadata = {
  title: "Manajemen Pengguna - Admin",
};

export default function ManajemenPengguna() {
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
          <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
            <Link href="/admin/dashboard" className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Kembali">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <div className="text-sm sm:text-base font-semibold tracking-wide">Manajemen Pengguna</div>
          </div>
          <div className="col-span-12 sm:col-span-6" />
          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 px-4 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 sm:col-span-3 lg:col-span-3">
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-neutral-200 text-sm font-semibold">Manajemen Pengguna</div>
            <nav className="p-3 grid gap-2 text-sm">
              <Link href="/admin/dashboard" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Home</Link>
              <Link href="/admin/laporan-progres" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Laporan Progres</Link>
              <Link href="/admin/manajemen-pengguna" className="rounded-lg bg-red-600 text-white px-3 py-2">Manajemen Pengguna</Link>
              <Link href="/admin/formulir-tahapan" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Kelola Formulir & Tahapan</Link>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 sm:col-span-9">
          <h2 className="text-center text-sm sm:text-base font-semibold mb-6">Manajemen Pengguna</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link href="/admin/manajemen-pengguna/admin" className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center backdrop-blur hover:-translate-y-0.5">
              <div className="mx-auto mb-4 h-16 w-16 rounded-xl grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                  <circle cx="24" cy="16" r="6" stroke="#0F172A" strokeWidth="3" />
                  <path d="M12 40c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="#0F172A" strokeWidth="3" />
                  <path d="M26 22l3 3" stroke="#0F172A" strokeWidth="3" />
                </svg>
              </div>
              <div className="text-sm font-medium">User Admin</div>
            </Link>

            <Link href="/admin/manajemen-pengguna/pelaksana" className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center backdrop-blur hover:-translate-y-0.5">
              <div className="mx-auto mb-4 h-16 w-16 rounded-xl grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none">
                  <circle cx="16" cy="20" r="5" stroke="#0F172A" strokeWidth="3" />
                  <circle cx="32" cy="20" r="5" stroke="#0F172A" strokeWidth="3" />
                  <path d="M6 40c0-5.5 4.5-10 10-10M26 30c5.5 0 10 4.5 10 10" stroke="#0F172A" strokeWidth="3" />
                </svg>
              </div>
              <div className="text-sm font-medium">User Pelaksana</div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
