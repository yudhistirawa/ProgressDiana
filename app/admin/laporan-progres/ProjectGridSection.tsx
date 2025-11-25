"use client";

import { useState } from "react";
import ProgressGridClient from "./ProgressGridClient";

type ProjectKey = "diana" | "bungtomo";

const PROJECTS: Record<ProjectKey, { key: ProjectKey; label: string; badge: string }> = {
  diana: { key: "diana", label: "Proyek Diana", badge: "Aktif" },
  bungtomo: { key: "bungtomo", label: "Proyek Bung Tomo", badge: "Baru" },
};

export default function ProjectGridSection() {
  const [project, setProject] = useState<ProjectKey>("diana");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-neutral-900">Pilih Proyek</div>
          <div className="text-xs text-neutral-500">Data terpisah per proyek</div>
        </div>
        <div className="inline-flex rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-1">
          {(Object.values(PROJECTS) as (typeof PROJECTS)[keyof typeof PROJECTS][]).map((p) => {
            const active = project === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setProject(p.key)}
                className={[
                  "relative px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                  active
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-neutral-700 hover:bg-white",
                ].join(" ")}
              >
                {p.label}
                <span
                  className={[
                    "ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
                    active ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700",
                  ].join(" ")}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ProgressGridClient project={project} />
    </div>
  );
}
