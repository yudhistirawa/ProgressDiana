"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

type StageItem = { id: number; title: string };
type ProjectKey = "diana" | "bungtomo";
const CONFIG_KEYS: Record<ProjectKey, string> = {
  diana: "stages_config",
  bungtomo: "stages_config_bungtomo",
};


export default function ProgressGridClient({
  query: controlledQuery,
  onQueryChange,
  project = "diana",
}: {
  query?: string;
  onQueryChange?: (v: string) => void;
  project?: ProjectKey;
}) {
  const [stages, setStages] = useState<StageItem[]>([]);

  useEffect(() => {
    const fb = getFirebaseClient();
    if (!fb) return;
    (async () => {
      try {
        const ref = doc(fb.db, "config", CONFIG_KEYS[project === "bungtomo" ? "bungtomo" : "diana"]);
        const snap = await getDoc(ref);
        const list = snap.exists() ? (snap.data()?.list as any[] | undefined) : undefined;
        const items: StageItem[] = Array.isArray(list)
          ? list.map((s: any, i: number) => ({ id: i + 1, title: s?.name || `Tahap ${i + 1}` }))
          : [];
        setStages(items);
      } catch {
        setStages([]);
      }
    })();
  }, [project]);

  const [internalQuery, setInternalQuery] = useState("");
  const query = controlledQuery ?? internalQuery;
  const setQuery = onQueryChange ?? setInternalQuery;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stages;
    return stages.filter((s) => s.title.toLowerCase().includes(q));
  }, [query, stages]);

  return (
    <div className="space-y-4">
      {/* Search (render only if uncontrolled) */}
      {onQueryChange == null && (
        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search......."
            className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
      )}

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map((stage) => (
          <Link
            key={stage.id}
            href={`/admin/laporan-progres/${stage.id}?project=${project}`}
            className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-3 sm:p-4 text-center backdrop-blur hover:-translate-y-0.5"
          >
            <div className="mx-auto mb-3 sm:mb-4 h-14 w-14 sm:h-16 sm:w-16 rounded-xl grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
              {/* Flag + bars line icon */}
              <svg viewBox="0 0 48 48" className="h-8 w-8 sm:h-9 sm:w-9" fill="none">
                <path d="M14 36V12h10l2 3h8v9h-8l-2-3h-8v15Z" stroke="#0F172A" strokeWidth="3" fill="none" />
                <rect x="12" y="36" width="6" height="6" rx="1" stroke="#0F172A" strokeWidth="2" />
                <rect x="20" y="36" width="6" height="6" rx="1" stroke="#0F172A" strokeWidth="2" />
                <rect x="28" y="36" width="6" height="6" rx="1" stroke="#0F172A" strokeWidth="2" />
              </svg>
            </div>
            <div className="text-[13px] sm:text-sm font-medium text-neutral-900">{stage.title}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
