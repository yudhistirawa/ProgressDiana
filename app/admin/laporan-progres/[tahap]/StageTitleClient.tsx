"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";

type ProjectKey = "diana" | "bungtomo" | "bisma";

const CONFIG_KEYS: Record<ProjectKey, string> = {
  diana: "stages_config",
  bungtomo: "stages_config_bungtomo",
  bisma: "stages_config_bisma",
};

export default function StageTitleClient({
  stage,
  stageId,
  project = "diana",
}: {
  stage: number | string;
  stageId?: string | number | null;
  project?: ProjectKey;
}) {
  const [stageName, setStageName] = useState<string>("");
  const stageNumber = Number(stage);
  const normalizedStageId = useMemo(() => {
    if (stageId === undefined || stageId === null || stageId === "") return null;
    const n = Number(stageId);
    return Number.isNaN(n) ? String(stageId) : n;
  }, [stageId]);

  useEffect(() => {
    const fb = getFirebaseClient();
    if (!fb) return;
    (async () => {
      try {
        const key = CONFIG_KEYS[project === "bungtomo" ? "bungtomo" : project === "bisma" ? "bisma" : "diana"];
        const snap = await getDoc(doc(fb.db, "config", key));
        const list = snap.exists() ? (snap.data()?.list as any[] | undefined) : undefined;
        let name = "";
        if (Array.isArray(list)) {
          if (normalizedStageId !== null) {
            const match = list.find((s: any) => s?.id === normalizedStageId);
            name = match?.name ?? "";
          }
          if (!name && Number.isFinite(stageNumber)) {
            const idx = Math.max(0, Number(stageNumber) - 1);
            name = list[idx]?.name ?? "";
          }
        }
        setStageName(name);
      } catch {
        setStageName("");
      }
    })();
  }, [project, normalizedStageId, stageNumber]);

  const stageLabel = Number.isNaN(stageNumber) ? String(stage) : String(stageNumber);
  const display = stageName ? `Tahap ${stageLabel} — ${stageName}` : `Tahap ${stageLabel}`;

  return <div className="text-sm sm:text-base font-semibold tracking-wide">{display}</div>;
}
