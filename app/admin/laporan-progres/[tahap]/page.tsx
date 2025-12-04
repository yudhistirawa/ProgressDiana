import Link from "next/link";
import AvatarMenuClient from "../../components/AvatarMenuClient";
import StageReportListClient from "./StageReportListClient";

type Props = { params: Promise<{ tahap: string }>; searchParams?: Promise<{ project?: string }> };

export async function generateMetadata({ params }: Props) {
  const { tahap } = await params;
  return { title: `Tahap ${tahap} - Laporan Progres (Admin)` };
}

export default async function AdminTahapPage({ params, searchParams }: Props) {
  const { tahap } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const projectParam = sp?.project === "bungtomo" ? "bungtomo" : "diana";
  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Home",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3Z" />
        </svg>
      ),
    },
    {
      href: "/admin/laporan-progres",
      label: "Laporan Progres",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M5 3a2 2 0 0 0-2 2v14l3-3h11a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm2 4h10v2H7V7Zm0 4h7v2H7v-2Z" />
        </svg>
      ),
    },
    {
      href: "/admin/data-harian",
      label: "Data Masuk Harian",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M6 2a2 2 0 0 0-2 2v16h16V4a2 2 0 0 0-2-2H6Zm1 5h10v2H7V7Zm0 4h6v2H7v-2Z" />
        </svg>
      ),
    },
    {
      href: "/admin/manajemen-pengguna",
      label: "Manajemen Pengguna",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Zm7-6h2v2h-2v-2Zm0 4h2v2h-2v-2Zm0 4h2v2h-2v-2Z" />
        </svg>
      ),
    },
    {
      href: "/admin/formulir-tahapan",
      label: "Kelola Formulir & Tahapan",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M5 4a2 2 0 0 0-2 2v13l4-4h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5Zm2 4h10v2H7V8Zm0 4h6v2H7v-2Z" />
        </svg>
      ),
    },
    {
      href: "/admin/sampah",
      label: "Tempat Sampah",
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M9 3a1 1 0 0 0-1 1v1H4v2h16V5h-4V4a1 1 0 0 0-1-1H9Zm-4 6v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9H5Zm3 2h2v8H8v-8Zm6 0h2v8h-2v-8Z" />
        </svg>
      ),
    },
  ];
  const activePath = "/admin/laporan-progres";
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
            <Link href="/admin/laporan-progres" className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Kembali">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
              </svg>
            </Link>
            <div className="text-sm sm:text-base font-semibold tracking-wide">Tahap {tahap}</div>
          </div>
          <div className="col-span-12 sm:col-span-6" />
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

      <div className="mx-auto max-w-6xl grid grid-cols-12 gap-4 px-4 py-6">
        {/* Sidebar */}
        <aside className="col-span-12 sm:col-span-3 lg:col-span-3">
          <div className="rounded-3xl ring-1 ring-neutral-200 bg-white shadow-md overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-900">Menu Utama</div>
              <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-rose-100 text-rose-600">Admin</span>
            </div>
            <nav className="p-3 space-y-2 text-sm">
              {navItems.map((item) => {
                const isActive = item.href === activePath;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 w-full rounded-2xl px-4 py-3 transition-all",
                      isActive
                        ? "bg-red-600 text-white shadow-[0_10px_30px_-12px_rgba(239,68,68,0.9)] ring-1 ring-red-500"
                        : "bg-white text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50"
                    ].join(" ")}
                  >
                    <span className={[
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      isActive ? "bg-white/15 text-white" : "bg-neutral-100 text-neutral-700"
                    ].join(" ")}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 sm:col-span-9 space-y-4">
          <StageReportListClient stage={Number(tahap)} project={projectParam} />
        </main>
      </div>
    </div>
  );
}
