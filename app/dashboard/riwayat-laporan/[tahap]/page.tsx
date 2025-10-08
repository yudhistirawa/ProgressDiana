import Link from "next/link";
import RiwayatTahapClient from "../RiwayatTahapClient";

type Props = {
  params: Promise<{ tahap: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tahap } = await params;
  return {
    title: `Riwayat Tahap ${tahap} - Sistem Dokumentasi Progres`,
    description: "Daftar pengiriman laporan sebelumnya",
  };
}

export default async function RiwayatTahap({ params }: Props) {
  const { tahap } = await params;
  const label = `Riwayat Tahap ${tahap}`;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-neutral-900">
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

      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard/riwayat-laporan"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
            title="Kembali"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
            </svg>
          </Link>
          <div className="text-sm sm:text-base font-semibold tracking-wide">{label}</div>
          <div className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-red-600 shadow-sm">
            <svg viewBox="0 0 100 100" className="h-4 w-4" fill="currentColor" aria-hidden>
              <g transform="translate(50,50)">
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" />
                <rect x="-3.5" y="10" width="7" height="18" rx="2" transform="rotate(180)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(45)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(90)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(135)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(225)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(270)" />
                <rect x="-3.5" y="-28" width="7" height="18" rx="2" transform="rotate(315)" />
              </g>
            </svg>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 sm:px-4 pb-20 pt-5 space-y-4">
        <RiwayatTahapClient stage={Number(tahap)} />
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
          <Link href="/dashboard/riwayat-laporan" className="flex flex-col items-center justify-center h-14 text-neutral-900 gap-0.5">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-2-5 2V6a2 2 0 0 1 2-2Z" />
            </svg>
            <span>Riwayat</span>
          </Link>
          <Link href="/dashboard/profil" className="flex flex-col items-center justify-center h-14 text-neutral-700 gap-0.5">
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
