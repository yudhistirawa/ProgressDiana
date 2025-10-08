import Link from "next/link";
import Image from "next/image";
import LogoImg from "@/Logo/Logo_BGD__1_-removebg-preview.png";
import AvatarMenuClient from "./AvatarMenuClient";

export const metadata = {
  title: "Profil - Sistem Dokumentasi Progres",
  description: "Informasi akun pengguna",
};

export default function ProfilPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
      {/* Background for desktop/tablet */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
        <div aria-hidden className="absolute -left-24 -top-24 w-80 h-80 bg-neutral-900 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute left-24 -top-14 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg] opacity-95" />
        <div aria-hidden className="absolute left-56 -top-20 w-80 h-80 bg-neutral-200 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-20 bottom-24 w-80 h-80 bg-neutral-100 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-10 -bottom-10 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute right-40 -bottom-24 w-72 h-72 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      {/* Background for mobile */}
      <div className="pointer-events-none absolute inset-0 -z-10 sm:hidden">
        <div aria-hidden className="absolute -left-16 -top-16 w-40 h-40 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-16 -bottom-16 w-40 h-40 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      {/* Topbar */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src={LogoImg} alt="BGD" width={28} height={28} className="h-6 w-6 sm:h-7 sm:w-7 object-contain" priority />
            <div className="leading-tight">
              <div className="font-semibold text-sm sm:text-base">BGD</div>
              <div className="hidden sm:block text-xs text-neutral-500">Sistem Dokumentasi Progres</div>
            </div>
          </div>
          <div className="text-sm sm:text-base font-semibold tracking-wide">Profil</div>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
            title="Logout"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M10 3a1 1 0 1 0 0 2h6v14h-6a1 1 0 1 0 0 2h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-7Z" />
              <path d="M12.7 8.3a1 1 0 1 0-1.4 1.4L13.59 12l-2.3 2.3a1 1 0 1 0 1.42 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:pb-10 pt-6 sm:pt-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl ring-1 ring-neutral-200 bg-white/80 shadow-xl backdrop-blur p-6 sm:p-8 text-center">
            <div className="text-sm font-semibold mb-4">Foto Profil</div>
            {/* Avatar with small modal */}
            <div className="grid place-items-center">
              <AvatarMenuClient />
            </div>
            <div className="mt-2 flex items-center justify-center">
              <span className="text-[11px] text-neutral-500">Ketuk avatar untuk membuka menu</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav (mobile only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-neutral-200">
        <div className="mx-auto max-w-6xl grid grid-cols-3 text-xs">
          <Link href="/dashboard" className="flex flex-col items-center justify-center h-14 text-neutral-700 gap-0.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M12 3 3 10h3v10h5V14h2v6h5V10h3L12 3Z" />
            </svg>
            <span>Beranda</span>
          </Link>
          <Link href="/dashboard/riwayat-laporan" className="flex flex-col items-center justify-center h-14 text-neutral-700 gap-0.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-2-5 2V6a2 2 0 0 1 2-2Z" />
            </svg>
            <span>Riwayat</span>
          </Link>
          <Link href="/dashboard/profil" className="flex flex-col items-center justify-center h-14 text-neutral-900 gap-0.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
            </svg>
            <span>Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
