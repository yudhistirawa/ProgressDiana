"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { PROJECTS, type ProjectKey } from "@/lib/projects";

type Props = {
  project: ProjectKey;
  stage: number | string;
  stageId?: string;
};

export default function ProgressStageTitle({ project, stage, stageId }: Props) {
  const usesSingleActiveForm = project === "bungtomo" || project === "sampoerna";
  const fallback = usesSingleActiveForm ? "Laporan Progres" : `Laporan Tahap ${stage}`;
  const [title, setTitle] = useState(fallback);

  useEffect(() => {
    let active = true;
    setTitle(fallback);

    (async () => {
      try {
        const fb = getFirebaseClient();
        if (!fb) return;

        const snap = await getDoc(doc(fb.db, "config", PROJECTS[project].configKey));
        const list = snap.exists() ? snap.data()?.list : undefined;
        if (!Array.isArray(list)) return;

        const selected = usesSingleActiveForm
          ? (list.find((item) => item?.active === true) ?? list[0])
          : stageId
          ? list.find((item) => String(item?.id) === String(stageId))
          : list[Number(stage) - 1];
        const rawName = typeof selected?.name === "string" ? selected.name.trim() : "";
        const configuredName = usesSingleActiveForm && /^(laporan\s+)?tahap(an)?\s*\d+$/i.test(rawName)
          ? "Laporan Progres"
          : rawName;

        if (active && configuredName) setTitle(configuredName);
      } catch {
        // Gunakan judul tahap baku jika konfigurasi belum dapat dimuat.
      }
    })();

    return () => {
      active = false;
    };
  }, [fallback, project, stage, stageId, usesSingleActiveForm]);

  return <div className="text-sm sm:text-base font-semibold tracking-wide text-center">{title}</div>;
}
