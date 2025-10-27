import Link from "next/link";
import AvatarMenuClient from "../components/AvatarMenuClient";
import DataHarianClient from "./DataHarianClient";

export const metadata = {
  title: "Data Masuk Harian - Admin",
  description: "Lihat statistik data yang masuk per hari",
};

export default function DataHarianPage() {
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
            <div className="text-sm sm:text-base font-semibold tracking-wide">Data Masuk Harian</div>
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
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden sm:sticky sm:top-24">
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
