import Link from "next/link";
import AvatarMenuClient from "../components/AvatarMenuClient";
import FormulirTahapanClient from "./FormulirTahapanClient";

export const metadata = {
  title: "Kelola Formulir & Tahapan - Admin",
};

export default function FormulirTahapan() {
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
            <Link href="/admin/dashboard" className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Kembali">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <div className="text-base sm:text-lg font-semibold tracking-wide">Kelola Formulir & Tahapan</div>
          </div>
          <div className="hidden sm:block sm:col-span-5" />
          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
            <AvatarMenuClient />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 px-4 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 sm:col-span-4 lg:col-span-3">
          <div className="rounded-2xl ring-1 ring-white/80 bg-white/90 backdrop-blur shadow-lg shadow-rose-50/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-200 text-sm font-semibold flex items-center justify-between">
              <span>Menu Utama</span>
              <span className="text-[10px] rounded-full bg-rose-100 text-rose-700 px-2 py-1 font-semibold">Admin</span>
            </div>
            <nav className="p-3 grid gap-2 text-sm">
              <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600" aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 3 3 10v11h6v-6h6v6h6V10L12 3Z" /></svg></span>
                Home
              </Link>
              <Link href="/admin/planning" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700" aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 2a1 1 0 0 0-1 1v1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1Zm12 8H5v10h14V10Z" /></svg></span>
                Planning
              </Link>
              <Link href="/admin/laporan-progres" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600" aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M5 3a2 2 0 0 0-2 2v14l3-3h11a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm2 4h10v2H7V7Zm0 4h7v2H7v-2Z" /></svg></span>
                Laporan Progres
              </Link>
              <Link href="/admin/data-harian" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600" aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6 2a2 2 0 0 0-2 2v16h16V4a2 2 0 0 0-2-2H6Zm1 5h10v2H7V7Zm0 4h6v2H7v-2Z" /></svg></span>
                Data Masuk Harian
              </Link>
              <Link href="/admin/manajemen-pengguna" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-700" aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" /></svg></span>
                Manajemen Pengguna
              </Link>
              <Link href="/admin/formulir-tahapan" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white px-3 py-2 shadow-md shadow-rose-200/60">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600" aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M14.06 3.94a1.5 1.5 0 0 1 2.12 0l3.88 3.88a1.5 1.5 0 0 1 0 2.12l-9.9 9.9L6 21l1.16-4.16 9.9-9.9ZM6 19l3.2-.8L6.8 15.8 6 19Z" /></svg></span>
                Kelola Formulir & Tahapan
              </Link>
              <Link href="/admin/sampah" className="flex items-center gap-2 rounded-xl ring-1 ring-neutral-200 px-3 py-2 hover:bg-white">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600" aria-hidden><svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M9 3a1 1 0 0 0-1 1v1H4v2h16V5h-4V4a1 1 0 0 0-1-1H9Zm-4 6v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9H5Zm3 2h2v8H8v-8Zm6 0h2v8h-2v-8Z" /></svg></span>
                Tempat Sampah
              </Link>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 sm:col-span-9">
          <FormulirTahapanClient />
        </main>
      </div>
    </div>
  );
}

