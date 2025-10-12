import { Suspense } from "react";
import AdminLoginForm from "./AdminLoginForm";

export const metadata = {
  title: "Login Admin - Sistem Dokumentasi Progres",
  description: "Silakan login sebagai admin untuk masuk ke sistem",
};

export default function AdminLogin() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white to-neutral-50 flex items-center justify-center px-4 py-10 sm:px-6">
      {/* Decorative background for desktop/tablet */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
        <div aria-hidden className="absolute -left-24 -top-24 w-80 h-80 bg-neutral-900/95 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute left-24 -top-14 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute left-56 -top-20 w-80 h-80 bg-neutral-200 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-20 bottom-24 w-80 h-80 bg-neutral-100 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-10 -bottom-10 w-60 h-60 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute right-40 -bottom-24 w-72 h-72 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      {/* Decorative background for mobile */}
      <div className="pointer-events-none absolute inset-0 -z-10 sm:hidden">
        <div aria-hidden className="absolute -left-16 -top-16 w-40 h-40 bg-red-600 rounded-3xl rotate-[25deg]" />
        <div aria-hidden className="absolute -right-16 -bottom-16 w-40 h-40 bg-neutral-300 rounded-3xl rotate-[25deg]" />
      </div>

      {/* Desktop split layout */}
      <div className="hidden sm:grid sm:grid-cols-2 sm:gap-8 sm:w-full sm:max-w-5xl">
        {/* Left brand panel */}
        <div className="relative rounded-3xl ring-1 ring-neutral-200 bg-white/70 shadow-xl backdrop-blur p-6 grid place-items-center">
          <div className="text-center select-none">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center text-red-600">
              {/* Mark */}
              <svg viewBox="0 0 100 100" className="h-full w-full" fill="currentColor" aria-hidden>
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
            </div>
            <div className="font-semibold text-neutral-800">System By: Bali Gerbang Digital</div>
            <div className="mt-2 text-neutral-500">Selamat Datang Di Sistem</div>
            <div className="text-neutral-900 font-semibold">Dokumentasi Progres</div>
          </div>
        </div>

        {/* Right login card */}
        <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-3xl h-96"></div>}>
          <AdminLoginForm />
        </Suspense>
      </div>

      {/* Mobile single card layout */}
      <div className="sm:hidden relative w-full max-w-md">
        <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-3xl h-80"></div>}>
          <AdminLoginForm compact />
        </Suspense>
      </div>
    </div>
  );
}
