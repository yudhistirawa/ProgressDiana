import Link from "next/link";

export default function MaterialNavLink({ admin = true }: { admin?: boolean }) {
  return <Link href={admin ? "/admin/material" : "/dashboard/material"} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50">
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" /></svg>
    </span>Material
  </Link>;
}
