"use client";
import Link from "next/link";
import LogoutLink from "@/components/LogoutLink";
import { useRef, useState } from "react";

export default function KelolaAkunPage() {
  const [username, setUsername] = useState("Data Username");
  const [email, setEmail] = useState("Data Email");
  const [nama, setNama] = useState("Data Nama");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const userRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const namaRef = useRef<HTMLInputElement>(null);

  const [lockUser, setLockUser] = useState(true);
  const [lockEmail, setLockEmail] = useState(true);
  const [lockNama, setLockNama] = useState(true);

  const toggleAndFocus = (which: "u" | "e" | "n") => {
    if (which === "u") {
      setLockUser((v) => !v);
      setTimeout(() => userRef.current?.focus(), 0);
    } else if (which === "e") {
      setLockEmail((v) => !v);
      setTimeout(() => emailRef.current?.focus(), 0);
    } else {
      setLockNama((v) => !v);
      setTimeout(() => namaRef.current?.focus(), 0);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError(null);
    if (pwd || pwd2) {
      if (pwd !== pwd2) {
        setError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
      if (pwd.length < 6) {
        setError("Kata sandi minimal 6 karakter.");
        return;
      }
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setPwd("");
      setPwd2("");
      setLockUser(true);
      setLockEmail(true);
      setLockNama(true);
    }, 800);
  };

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
        <div className="mx-auto max-w-6xl px-2 sm:px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/profil" className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm" title="Kembali">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M15 5 7 12l8 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="font-semibold text-sm sm:text-base">Kelola Akun</div>
          </div>
          <LogoutLink
            href="/"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm"
            title="Logout"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M10 3a1 1 0 1 0 0 2h6v14h-6a1 1 0 1 0 0 2h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-7Z" />
              <path d="M12.7 8.3a1 1 0 1 0-1.4 1.4L13.59 12l-2.3 2.3a1 1 0 1 0 1.42 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
            </svg>
          </LogoutLink>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 pb-24 sm:pb-10 pt-6 sm:pt-8">
        <div className="max-w-md mx-auto">
          <form onSubmit={submit} className="rounded-2xl ring-1 ring-neutral-300 bg-white/95 backdrop-blur shadow p-4 sm:p-5">
            <div className="text-center text-sm font-medium text-neutral-700 mb-4">Kelola Akun Anda Dibawah ini</div>

            {saved && (
              <div className="mb-3 rounded-lg bg-green-50 text-green-700 ring-1 ring-green-200 px-3 py-2 text-sm">
                Perubahan berhasil disimpan.
              </div>
            )}
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-neutral-600">Username</label>
              <div className="relative">
                <input
                  ref={userRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={lockUser}
                  className="w-full rounded-xl border-0 ring-1 ring-neutral-300 bg-white px-3 py-2 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <button type="button" onClick={() => toggleAndFocus("u")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-800" title={lockUser ? "Edit" : "Kunci"}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <label className="text-xs text-neutral-600">Email</label>
              <div className="relative">
                <input
                  ref={emailRef}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={lockEmail}
                  type="email"
                  className="w-full rounded-xl border-0 ring-1 ring-neutral-300 bg-white px-3 py-2 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <button type="button" onClick={() => toggleAndFocus("e")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-800" title={lockEmail ? "Edit" : "Kunci"}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <label className="text-xs text-neutral-600">Nama</label>
              <div className="relative">
                <input
                  ref={namaRef}
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  readOnly={lockNama}
                  className="w-full rounded-xl border-0 ring-1 ring-neutral-300 bg-white px-3 py-2 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <button type="button" onClick={() => toggleAndFocus("n")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-800" title={lockNama ? "Edit" : "Kunci"}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <label className="text-xs text-neutral-600">Kata Sandi Baru</label>
              <input
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                type="password"
                placeholder="Masukkan Sandi Baru Jika Ingin Mengubah"
                className="w-full rounded-xl border-0 ring-1 ring-neutral-300 bg-white px-3 py-2 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <div className="mt-3 space-y-1">
              <label className="text-xs text-neutral-600">Konfirmasi Kata Sandi</label>
              <input
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                type="password"
                placeholder="Masukkan Ulang Kata Sandi Baru"
                className="w-full rounded-xl border-0 ring-1 ring-neutral-300 bg-white px-3 py-2 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-200 text-neutral-900 ring-1 ring-blue-300 px-5 py-2.5 font-semibold shadow hover:bg-blue-300 disabled:opacity-60"
              >
                {saving && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                  </svg>
                )}
                Simpan Perubahan
              </button>
            </div>
          </form>
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


