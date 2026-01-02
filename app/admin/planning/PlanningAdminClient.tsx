"use client";

import { useEffect, useState } from "react";
import type { ProjectKey } from "@/lib/firestore/planning";
import { listProjectKeys } from "@/lib/firestore/planning";
import PlanningListClient from "@/app/components/planning/PlanningListClient";

const PROJECT_STORAGE_KEY = "admin_selected_project";

export default function PlanningAdminClient() {
  const [project, setProject] = useState<ProjectKey>("diana");

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? (localStorage.getItem(PROJECT_STORAGE_KEY) as ProjectKey | null) : null;
    if (saved === "bungtomo" || saved === "diana") setProject(saved);
  }, []);

  const handleProject = (p: ProjectKey) => {
    setProject(p);
    if (typeof window !== "undefined") localStorage.setItem(PROJECT_STORAGE_KEY, p);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 sm:p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-900">Pilih Proyek</div>
          <div className="text-xs text-neutral-500">Planning dipisah per proyek (tab).</div>
        </div>
        <div className="inline-flex rounded-xl ring-1 ring-neutral-200 bg-neutral-50 p-1">
          {listProjectKeys().map((p) => {
            const active = project === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handleProject(p.key)}
                className={[
                  "px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                  active ? "bg-red-600 text-white shadow-sm" : "text-neutral-700 hover:bg-white",
                ].join(" ")}
              >
                {p.key === "diana" ? "Proyek Diana" : "Proyek Bung Tomo"}
              </button>
            );
          })}
        </div>
      </div>

      <PlanningListClient projectKey={project} mode="admin" basePath="/admin/planning" />
    </div>
  );
}

