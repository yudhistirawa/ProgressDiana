"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AvatarMenuClient() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mx-auto h-28 w-28 sm:h-32 sm:w-32 rounded-full grid place-items-center bg-neutral-900 text-white shadow-inner ring-2 ring-white focus:outline-none focus:ring-4 focus:ring-red-300/30"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full grid place-items-center ring-2 ring-white">
          <svg viewBox="0 0 24 24" className="h-12 w-12 sm:h-14 sm:w-14" fill="currentColor" aria-hidden>
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
          </svg>
        </div>
      </button>

      {/* Small modal/popover */}
      {open && (
        <div
          role="menu"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-2xl bg-white shadow-lg ring-1 ring-neutral-200 p-2 z-50"
        >
          <div className="text-center text-xs text-neutral-500 mb-1">Aksi Profil</div>
          <div className="grid gap-1">
            <button
              type="button"
              className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-neutral-300 hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M5 6a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Z" />
              </svg>
              Edit Foto Profil
            </button>
            <Link
              href="/dashboard/profil/kelola-akun"
              className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-neutral-300 hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
              </svg>
              Kelola Akun
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-neutral-300 hover:bg-neutral-50 text-red-600"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M10 3a1 1 0 1 0 0 2h6v14h-6a1 1 0 1 0 0 2h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-7Z" />
                <path d="M12.7 8.3a1 1 0 1 0-1.4 1.4L13.59 12l-2.3 2.3a1 1 0 1 0 1.42 1.4l3-3a1 1 0 0 0 0-1.4l-3-3Z" />
              </svg>
              Logout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
