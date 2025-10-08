"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (compact) {
    return (
      <div className="rounded-3xl ring-1 ring-neutral-200 bg-white/90 shadow-xl backdrop-blur p-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="inline-flex h-8 w-8 text-red-600" aria-hidden>
            <svg viewBox="0 0 100 100" className="h-full w-full" fill="currentColor">
              <g transform="translate(50,50)">
                <rect x="-6" y="-36" width="12" height="22" rx="3" />
                <rect x="-6" y="14" width="12" height="22" rx="3" transform="rotate(180)" />
                <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(45)" />
                <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(90)" />
                <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(135)" />
                <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(225)" />
                <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(270)" />
                <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(315)" />
              </g>
            </svg>
          </span>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-neutral-900 leading-tight">Sistem Dokumentasi Progres</h1>
            <p className="mt-1 text-xs text-neutral-500">Silakan login untuk masuk ke sistem</p>
          </div>
        </div>

        <form
          className="mt-2 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (isLoading) return;
            setIsLoading(true);
            setTimeout(() => router.push("/admin/dashboard"), 400);
          }}
        >
          <div className="space-y-1">
            <label htmlFor="m-username" className="block text-xs font-medium text-neutral-700">Username</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
                </svg>
              </span>
              <input id="m-username" type="text" name="username" placeholder="masukkan username" className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="m-password" className="block text-xs font-medium text-neutral-700">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Z" />
                </svg>
              </span>
              <input id="m-password" type={showPassword ? "text" : "password"} name="password" placeholder="password" className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 pr-12 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
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

          <button type="submit" aria-busy={isLoading} className="w-full rounded-2xl bg-gradient-to-b from-red-500 to-red-600 text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isLoading}>
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
          <div className="mt-3 text-center">
            <a href="/" className="text-xs text-neutral-500 hover:text-neutral-700 underline-offset-2 hover:underline">Kembali ke login pengguna</a>
          </div>
        </form>
      </div>
    );
  }

  // Desktop card version
  return (
    <div className="rounded-3xl ring-1 ring-neutral-200 bg-white/90 shadow-xl backdrop-blur p-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="inline-flex h-8 w-8 text-red-600" aria-hidden>
          <svg viewBox="0 0 100 100" className="h-full w-full" fill="currentColor">
            <g transform="translate(50,50)">
              <rect x="-6" y="-36" width="12" height="22" rx="3" />
              <rect x="-6" y="14" width="12" height="22" rx="3" transform="rotate(180)" />
              <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(45)" />
              <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(90)" />
              <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(135)" />
              <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(225)" />
              <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(270)" />
              <rect x="-6" y="-36" width="12" height="22" rx="3" transform="rotate(315)" />
            </g>
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 leading-tight">BGD</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Silakan Login Untuk Masuk Ke Sistem</p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (isLoading) return;
          setIsLoading(true);
          setTimeout(() => router.push("/admin/dashboard"), 400);
        }}
      >
        <div className="space-y-1">
          <label htmlFor="admin-username" className="block text-xs font-medium text-neutral-700">Username</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
              </svg>
            </span>
            <input id="admin-username" type="text" name="username" placeholder="Masukkan Username" className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="admin-password" className="block text-xs font-medium text-neutral-700">Password</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8 0V7a3 3 0 0 1 6 0v2H9Z" />
              </svg>
            </span>
            <input id="admin-password" type={showPassword ? "text" : "password"} name="password" placeholder="Password" className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 pr-12 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
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

        <button type="submit" aria-busy={isLoading} className="w-full rounded-2xl bg-gradient-to-b from-red-500 to-red-600 text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isLoading}>
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

        <p className="text-[11px] text-neutral-400 text-center">
          Dengan masuk, Anda menyetujui kebijakan penggunaan dan privasi.
        </p>
        <div className="mt-3 text-center">
          <a href="/" className="text-xs text-neutral-500 hover:text-neutral-700 underline-offset-2 hover:underline">Kembali ke login pengguna</a>
        </div>
      </form>
    </div>
  );
}
