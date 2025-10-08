"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function AvatarMenuClient() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Profil"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white shadow-lg ring-1 ring-neutral-200 p-2 z-50"
        >
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
      )}
    </div>
  );
}

