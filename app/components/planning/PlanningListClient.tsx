"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectKey, PlanningItem } from "@/lib/firestore/planning";
import { createPlanning, diffDaysInclusive, fetchPlannings, listProjectKeys } from "@/lib/firestore/planning";

export default function PlanningListClient(props: {
  projectKey: ProjectKey;
  mode: "admin" | "readonly";
  basePath: string;
  detailQuery?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [workerCount, setWorkerCount] = useState("1");
  const [saving, setSaving] = useState(false);

  const projectLabel = useMemo(() => {
    return listProjectKeys().find((p) => p.key === props.projectKey)?.label ?? props.projectKey;
  }, [props.projectKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPlannings(props.projectKey);
        if (!cancelled) setItems(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Gagal memuat planning");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.projectKey]);

  const durationDays = useMemo(() => {
    if (!startDate || !dueDate) return null;
    if (startDate > dueDate) return null;
    const n = diffDaysInclusive(startDate, dueDate);
    return n > 0 ? n : null;
  }, [startDate, dueDate]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 sm:p-5 shadow-sm flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">Planning Proyek {projectLabel}</div>
          <div className="text-xs text-neutral-500">
            Menampilkan daftar pekerjaan + target harian + progres real (dengan bukti foto).
          </div>
        </div>

        {props.mode === "admin" && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white px-3 py-2 text-xs font-semibold shadow-sm"
          >
            {showCreate ? "Tutup" : "Tambah"}
          </button>
        )}
      </div>

      {props.mode === "admin" && showCreate && (
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="text-sm font-semibold text-neutral-900">Buat Planning Baru</div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700">Nama pekerjaan</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Pengecoran lantai 2"
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700">Jumlah pekerja</label>
              <input
                type="number"
                min={1}
                step={1}
                value={workerCount}
                onChange={(e) => setWorkerCount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <div className="mt-1 text-[11px] text-neutral-500">
                {durationDays ? `Durasi otomatis: ${durationDays} hari` : "Durasi otomatis akan dihitung"}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700">Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700">Seharusnya selesai</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              disabled={saving}
              onClick={async () => {
                if (saving) return;
                setError(null);
                const t = title.trim();
                if (!t) return setError("Nama pekerjaan wajib diisi");
                if (!startDate || !dueDate) return setError("Tanggal mulai & selesai wajib diisi");
                if (startDate > dueDate) return setError("Tanggal mulai tidak boleh setelah tanggal selesai");
                const wc = Math.max(1, Math.floor(Number(workerCount) || 0));
                if (!Number.isFinite(wc) || wc < 1) return setError("Jumlah pekerja wajib diisi (minimal 1)");
                setSaving(true);
                try {
                  const id = await createPlanning({
                    projectKey: props.projectKey,
                    title: t,
                    startDate,
                    dueDate,
                    workerCount: wc,
                  });
                  router.push(`${props.basePath}/${id}`);
                } catch (e: any) {
                  setError(e?.message || "Gagal membuat planning");
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-semibold shadow-sm disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Buat & buka detail"}
            </button>
            <div className="text-xs text-neutral-500">
              Setelah dibuat, admin bisa isi target per tanggal dan update real + foto bukti.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl ring-1 ring-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full text-sm text-neutral-500 py-10 text-center">Memuat...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full text-sm text-neutral-500 py-10 text-center">Belum ada planning.</div>
        ) : (
          items.map((p) => (
            <Link
              key={p.id}
              href={`${props.basePath}/${p.id}${props.detailQuery || ""}`}
              className="group rounded-2xl ring-1 ring-neutral-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-2">{p.title}</div>
                  <div className="text-xs text-neutral-500">
                    {`${p.startDate} -> ${p.dueDate}`}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {typeof p.workerCount === "number" ? `Pekerja: ${p.workerCount}` : "Pekerja: -"}
                    {" | "}
                    {typeof p.durationDays === "number" ? `Durasi: ${p.durationDays} hari` : "Durasi: -"}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
                  <span
                    className={[
                      "text-[10px] px-2 py-1 rounded-full font-semibold ring-1",
                      p.status === "done"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        : p.status === "archived"
                        ? "bg-neutral-100 text-neutral-700 ring-neutral-200"
                        : "bg-rose-50 text-rose-700 ring-rose-200",
                    ].join(" ")}
                  >
                    {p.status || "active"}
                  </span>
                  {props.mode === "admin" && (
                    <Link
                      href={`${props.basePath}/${p.id}${props.detailQuery || ""}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-800 hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2 1.5h-.5v-.5l9.56-9.56.5.5L5 18.75ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 group-hover:translate-x-0.5 transition-transform">
                Buka detail
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="m13 5 7 7-7 7v-4H4v-6h9V5Z" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
