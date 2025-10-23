import Link from "next/link";
import AvatarMenuClient from "../components/AvatarMenuClient";
import SampahClient from "./SampahClient";

export const metadata = {
  title: "Tempat Sampah - Admin",
};

export default function AdminSampahPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-12 items-center gap-3">
          <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
            <Link href="/admin/dashboard" className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Kembali ke Dashboard">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <div className="text-sm sm:text-base font-semibold tracking-wide">Tempat Sampah</div>
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
            <div className="px-4 py-2 border-b border-neutral-200 text-sm font-semibold">Admin Menu</div>
            <nav className="p-3 grid gap-2 text-sm">
              <Link href="/admin/dashboard" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Home</Link>
              <Link href="/admin/laporan-progres" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Laporan Progres</Link>
              <Link href="/admin/manajemen-pengguna" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Manajemen Pengguna</Link>
              <Link href="/admin/formulir-tahapan" className="rounded-lg ring-1 ring-neutral-300 px-3 py-2 hover:bg-neutral-50">Kelola Formulir & Tahapan</Link>
              <Link href="/admin/sampah" className="rounded-lg bg-red-600 text-white px-3 py-2">Tempat Sampah</Link>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 sm:col-span-9">
          <SampahClient />
        </main>
      </div>
    </div>
  );
}
