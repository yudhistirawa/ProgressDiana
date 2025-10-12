"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import LogoImg from "@/Logo/Logo_BGD__1_-removebg-preview.png";
import { setRole, verifyPetugas } from "@/lib/authClient";

type AlertState = {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  show: boolean;
};

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({ type: 'error', title: '', message: '', show: false });

  const showAlert = (type: 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertState({ type, title, message, show: true });
    setTimeout(() => setAlertState(prev => ({ ...prev, show: false })), 5000); // Auto hide after 5 seconds
  };

  const closeAlert = () => setAlertState(prev => ({ ...prev, show: false }));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white to-neutral-50 flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
        <div aria-hidden className="absolute -left-24 -top-24 w-80 h-80 bg-neutral-900/95 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute left-24 -top-14 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute left-56 -top-20 w-80 h-80 bg-neutral-200 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-20 bottom-24 w-80 h-80 bg-neutral-100 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-10 -bottom-10 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute right-40 -bottom-24 w-72 h-72 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 sm:hidden">
        <div aria-hidden className="absolute -left-16 -top-16 w-40 h-40 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-16 -bottom-16 w-40 h-40 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

          <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-700 ease-out">
            <div className="rounded-3xl ring-1 ring-neutral-200 bg-white/90 shadow-xl backdrop-blur p-6 sm:p-8 transform-gpu animate-in zoom-in-95 fade-in duration-500 delay-200">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src={LogoImg} alt="BGD" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 leading-tight">Sistem Dokumentasi Progres</h1>
              <p className="mt-1 text-xs sm:text-sm text-neutral-500">Silakan login untuk masuk ke sistem</p>
            </div>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (isLoading) return;
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const username = String(fd.get("username") || "").trim();
              const password = String(fd.get("password") || "");
              const res = await verifyPetugas(username, password);
              if (!res.ok) {
                const msg = res.message.toLowerCase();
                if (msg.includes('user not found') || msg.includes('user tidak ditemukan') || msg.includes('no user record')) {
                  showAlert('error', 'Username Tidak Ditemukan', `Username "${username}" tidak terdaftar di sistem.\n\nPastikan username yang dimasukkan sudah benar atau hubungi administrator.`);
                } else if (msg.includes('wrong-password') || msg.includes('password is invalid') || msg.includes('invalid password')) {
                  showAlert('error', 'Password Salah', `Password yang Anda masukkan untuk username "${username}" tidak sesuai.\n\nSilakan cek kembali password Anda.`);
                } else if (msg.includes('too many requests') || msg.includes('blocked')) {
                  showAlert('warning', 'Terlalu Banyak Percobaan', 'Anda telah mencoba login beberapa kali.\n\nSilakan tunggu beberapa menit sebelum mencoba lagi.');
                } else {
                  showAlert('error', 'Login Gagal', res.message || 'Terjadi kesalahan yang tidak diketahui.');
                }
                return;
              }
              setIsLoading(true);
              setRole("petugas");
              setTimeout(() => router.push("/dashboard"), 300);
            }}
          >
            <div className="space-y-1">
              <label htmlFor="username" className="block text-xs font-medium text-neutral-700">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
                  </svg>
                </span>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="masukkan username"
                  autoComplete="username"
                  className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-medium text-neutral-700">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Z" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="password"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 pr-12 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M3 3 21 21" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 5c-6 0-9 7-9 7s1.5 3 4.5 5M20.5 16.5C22 15 21 12 21 12s-3-7-9-7a8 8 0 0 0-3 .6" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M12 5c-6 0-9 7-9 7s3 7 9 7 9-7 9-7-3-7-9-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 select-none">
                <input type="checkbox" className="size-4 rounded border-neutral-300 text-red-600 focus:ring-red-300" />
                <span className="text-neutral-600">Ingat saya</span>
              </label>
              <a href="#" className="text-neutral-500 hover:text-neutral-700">Lupa password?</a>
            </div>

            <button
              type="submit"
              aria-busy={isLoading}
              className="w-full rounded-2xl bg-gradient-to-b from-red-500 to-red-600 text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-neutral-400 text-center">
            Dengan masuk, Anda menyetujui kebijakan penggunaan dan privasi.
          </p>
          <div className="mt-3 text-center">
            <a href="/admin" className="text-xs text-neutral-500 hover:text-neutral-700 underline-offset-2 hover:underline">Login admin</a>
          </div>
        </div>

        {/* Custom Alert Modal - Modern & Professional */}
        {alertState.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Animated Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
              onClick={closeAlert}
            />

            {/* Alert Card with Staggered Animation */}
            <div className="relative w-full max-w-sm animate-in slide-in-from-top-3 duration-500 transform-gpu">
              <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu animate-in zoom-in-98 fade-in duration-400 delay-100">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100">
                  {/* Icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    alertState.type === 'error'
                      ? 'bg-red-50 text-red-600'
                      : alertState.type === 'warning'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                      <path d={
                        alertState.type === 'error'
                          ? 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.706-6.294a1 1 0 1 1 1.414-1.414 1 1 0 0 1-1.414 1.414zM12 8a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V9a1 1 0 0 0-1-1z'
                          : alertState.type === 'warning'
                          ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
                          : 'M13 16h-1v-4h-1m1-4h.01M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3M7 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3M3 4V2.64a.64.64 0 0 1 .64-.64h1.72M21 4V2.64a.64.64 0 0 0-.64-.64h-1.72'
                      } />
                    </svg>
                  </div>

                  {/* Title */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 text-sm">{alertState.title}</h3>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={closeAlert}
                    className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    aria-label="Tutup"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                      <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="px-4 py-4">
                  <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{alertState.message}</p>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-4 py-4 bg-neutral-50 border-t border-neutral-100">
                  <button
                    onClick={closeAlert}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
