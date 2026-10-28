import MaterialNavLink from "@/components/MaterialNavLink";
import Link from "next/link";
import AvatarMenuClient from "../../components/AvatarMenuClient";
import UsersClient from "../UsersClient";

export const metadata = { title: "Petugas MR Sampoerna Medan - Manajemen Pengguna" };

export default function UserSampoernaPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-12 items-center gap-3 px-4 py-3">
          <div className="col-span-12 flex items-center gap-2 sm:col-span-6">
            <Link href="/admin/manajemen-pengguna" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-100" title="Kembali">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" /></svg>
            </Link>
            <div className="text-sm font-semibold tracking-wide sm:text-base">Petugas MR Sampoerna Medan</div>
          </div>
          <div className="col-span-12 flex items-center justify-end sm:col-span-6"><AvatarMenuClient /></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl grid-cols-12 gap-4 px-4 py-6">
        <aside className="col-span-12 sm:col-span-3">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
            <div className="border-b border-neutral-200 px-4 py-2 text-sm font-semibold">Menu Admin</div>
            <nav className="grid gap-2 p-3 text-sm">
              <Link href="/admin/dashboard" className="rounded-lg px-3 py-2 ring-1 ring-neutral-300 hover:bg-neutral-50">Home</Link>
              <Link href="/admin/laporan-progres" className="rounded-lg px-3 py-2 ring-1 ring-neutral-300 hover:bg-neutral-50">Laporan Progres</Link>
              <Link href="/admin/planning" className="rounded-lg px-3 py-2 ring-1 ring-neutral-300 hover:bg-neutral-50">Planning</Link>
              <Link href="/admin/manajemen-pengguna" className="rounded-lg bg-red-600 px-3 py-2 text-white">Manajemen Pengguna</Link>
              <MaterialNavLink />
            </nav>
          </div>
        </aside>
        <main className="col-span-12 sm:col-span-9"><UsersClient type="sampoerna" /></main>
      </div>
    </div>
  );
}
