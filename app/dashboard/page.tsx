import Link from "next/link";
import Image from "next/image";
import LogoImg from "@/Logo/Logo_BGD__1_-removebg-preview.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

export const metadata = {
  title: "Dashboard - Sistem Dokumentasi Progres",
  description: "Akses fitur sistem: Laporan Progres dan Riwayat Laporan",
};

export default function Dashboard() {
  return (
    <div className="relative min-h-screen w-full bg-transparent text-neutral-900">
      {/* App Bar */}
      <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto max-w-6xl px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={LogoImg} alt="BGD" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <div className="leading-tight">
              <div className="font-semibold">BGD</div>
              <div className="text-xs text-neutral-500">Sistem Dokumentasi Progres</div>
            </div>
          </div>
          <div className="hidden sm:block text-sm font-semibold tracking-wide">Dashboard</div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              title="Keluar"
              className="inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M10 3a1 1 0 1 0 0 2h6v14h-6a1 1 0 1 0 0 2h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-7Z" />
                <path d="M12.7 8.3a1 1 0 1 0-1.4 1.4L13.59 12l-2.3 2.3a1 1 0 1 0 1.42 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
              </svg>
            </Link>
            <Avatar fallback="BG" size="sm" className="ml-1" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:pb-10 pt-6 md:pt-8">
        {/* Greeting */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Selamat datang 👋</h1>
          <p className="text-sm text-neutral-500">Kelola dokumentasi progres dengan cepat dan rapi.</p>
        </div>


        {/* Quick Actions */}
        <section className="mb-4 md:mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base md:text-lg">Akses Cepat</CardTitle>
                <CardDescription>Pilih menu untuk mulai bekerja</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Link href="/dashboard/laporan-progres" className="group">
                  <Card className="h-full transition hover:shadow-md">
                    <CardHeader className="flex items-center text-center">
                      <div
                        className="mx-auto mb-2 h-12 w-12 rounded-xl grid place-items-center bg-gradient-to-br from-blue-50 to-slate-100 text-neutral-800 ring-1 ring-neutral-200 group-hover:scale-105 transition"
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                          <rect x="3" y="4" width="14" height="16" rx="2" fill="#E5E7EB" />
                          <path d="M7 15l2-2 2 1 4-4" stroke="#111827" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M15 7h3v10H6v-2" stroke="#111827" strokeWidth="1.5" fill="none" />
                        </svg>
                      </div>
                      <div className="font-medium">Laporan Progres</div>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/dashboard/riwayat-laporan" className="group">
                  <Card className="h-full transition hover:shadow-md">
                    <CardHeader className="flex items-center text-center">
                      <div
                        className="mx-auto mb-2 h-12 w-12 rounded-xl grid place-items-center bg-gradient-to-br from-sky-50 to-slate-100 text-neutral-800 ring-1 ring-neutral-200 group-hover:scale-105 transition"
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                          <rect x="5" y="3" width="12" height="18" rx="2" fill="#E5E7EB" />
                          <path d="M8 8h6M8 11h6M8 14h4" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
                          <path d="M14 3v4h4" fill="#9CA3AF" />
                        </svg>
                      </div>
                      <div className="font-medium">Riwayat Laporan</div>
                    </CardHeader>
                  </Card>
                </Link>

                {/* Pusat Admin dihapus sesuai permintaan */}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tips */}
        <section className="mb-4 md:mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
              <CardDescription>Optimalkan dokumentasi Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 text-sm text-neutral-600 space-y-2">
                <li>Unggah bukti foto dengan resolusi cukup.</li>
                <li>Gunakan deskripsi singkat, jelas, dan terstruktur.</li>
                <li>Perbarui progres secara rutin untuk akurasi.</li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Bottom Nav (mobile only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-t border-neutral-200">
        <div className="mx-auto max-w-6xl grid grid-cols-3 text-xs">
          <Link href="/dashboard" className="flex flex-col items-center justify-center h-14 text-neutral-900 gap-0.5">
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
