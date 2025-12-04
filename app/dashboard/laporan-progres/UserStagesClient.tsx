"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

type FieldSpec = { id: number; label: string; type: "text" | "photo" };
type StageItem = { id: number; name: string; date?: string | number; fields?: FieldSpec[] | any[] };

type ProjectKey = "diana" | "bungtomo";
const CONFIG_KEYS: Record<ProjectKey, string> = {
  diana: "stages_config",
  bungtomo: "stages_config_bungtomo",
};

export default function UserStagesClient({ project = "diana" }: { project?: ProjectKey }) {
  const [stages, setStages] = useState<StageItem[]>([]);

  useEffect(() => {
    const fb = getFirebaseClient();
    if (!fb) return; // require Firebase configured
    (async () => {
      try {
        const key = CONFIG_KEYS[project === "bungtomo" ? "bungtomo" : "diana"];
        const ref = doc(fb.db, "config", key);
        const snap = await getDoc(ref);
        const list = snap.exists() ? (snap.data()?.list as StageItem[] | undefined) : undefined;
        if (Array.isArray(list)) {
          setStages(list);
        } else {
          setStages([]);
        }
      } catch {
        setStages([]);
      }
    })();
  }, [project]);

  const items = useMemo(() => stages.map((s, i) => ({ id: i + 1, title: s.name || `Laporan ${i + 1}` })), [stages]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-6 text-center text-sm text-neutral-500">
        Belum ada tahapan untuk proyek {project === "bungtomo" ? "Bung Tomo" : "Diana"}. Admin dapat menambah dari menu Kelola Formulir & Tahapan.
      </div>
    );
  }

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {items.map((stage, idx) => (
        <Link
          key={stage.id}
          href={`/dashboard/laporan-progres/${stage.id}?project=${project === "bungtomo" ? "bungtomo" : "diana"}`}
          className="group rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 p-3 sm:p-4 text-center backdrop-blur hover:-translate-y-0.5"
        >
          <div className="mx-auto mb-3 sm:mb-4 h-16 w-16 sm:h-20 sm:w-20 rounded-xl grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-neutral-200 text-neutral-800 group-hover:scale-105 transition-transform" aria-hidden>
            {idx % 2 === 0 ? (
              <svg viewBox="0 0 48 48" className="h-9 w-9 sm:h-10 sm:w-10" fill="none">
                <rect x="6" y="4" width="30" height="40" rx="4" fill="#E5E7EB" />
                <path d="M14 33l4-4 4 2 8-8" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M28 12h6v20H12v-2" stroke="#0F172A" strokeWidth="2" fill="none" />
                <rect x="28" y="4" width="12" height="12" rx="2" fill="#F43F5E" opacity=".85" />
                <path d="M28 4v8h8" fill="#FDA4AF" />
              </svg>
            ) : (
              <svg viewBox="0 0 48 48" className="h-9 w-9 sm:h-10 sm:w-10" fill="none">
                <rect x="8" y="6" width="28" height="36" rx="4" fill="#E5E7EB" />
                <path d="M16 18h12M16 24h12M16 30h8" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
                <path d="M30 6v8h8" fill="#9CA3AF" />
                <circle cx="14" cy="18" r="2" fill="#0F172A" />
                <circle cx="14" cy="24" r="2" fill="#0F172A" />
                <circle cx="14" cy="30" r="2" fill="#0F172A" />
              </svg>
            )}
          </div>
          <div className="text-[13px] sm:text-sm font-medium text-neutral-900">{stage.title}</div>
        </Link>
      ))}
    </section>
  );
}
