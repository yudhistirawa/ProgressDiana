"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanningDay, PlanningItem } from "@/lib/firestore/planning";
import {
  clampPercent,
  computeSummary,
  fetchPlanning,
  fetchPlanningDays,
  listProjectKeys,
  setDayReal,
  setDayTarget,
  setTargetsBatch,
  updatePlanningInfo,
  updatePlanningStatus,
  deletePlanning,
} from "@/lib/firestore/planning";

export default function PlanningDetailClient(props: {
  planningId: string;
  mode: "admin" | "readonly";
  backHref: string;
}) {
  const router = useRouter();
  const [planning, setPlanning] = useState<PlanningItem | null>(null);
  const [days, setDays] = useState<PlanningDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [realDraft, setRealDraft] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [fileDraft, setFileDraft] = useState<Record<string, File[] | null>>({});

  const [gallery, setGallery] = useState<{
    open: boolean;
    urls: string[];
    index: number;
  }>({ open: false, urls: [], index: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editWorkers, setEditWorkers] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const projectLabel = useMemo(() => {
    const key = planning?.projectKey;
    if (!key) return "-";
    return listProjectKeys().find((p) => p.key === key)?.label ?? key;
  }, [planning?.projectKey]);

  const summary = useMemo(() => computeSummary(days), [days]);
  const durationDays = useMemo(() => (days.length ? days.length : planning?.durationDays ?? null), [days.length, planning?.durationDays]);

  useEffect(() => {
    if (!gallery.open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGallery((g) => ({ ...g, open: false }));
      if (e.key === "ArrowLeft") setGallery((g) => ({ ...g, index: Math.max(0, g.index - 1) }));
      if (e.key === "ArrowRight") setGallery((g) => ({ ...g, index: Math.min(g.urls.length - 1, g.index + 1) }));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gallery.open]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchPlanning(props.planningId);
        if (!p) throw new Error("Planning tidak ditemukan");
        const d = await fetchPlanningDays(props.planningId);
        if (!cancelled) {
          setPlanning(p);
          setDays(d);
          setEditTitle(p.title || "");
          setEditWorkers(p.workerCount != null ? String(p.workerCount) : "");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Gagal memuat detail planning");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [props.planningId]);

  if (loading) {
    return <div className="text-sm text-neutral-500 py-10 text-center">Memuat...</div>;
  }

  if (!planning) {
    return (
      <div className="rounded-2xl ring-1 ring-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
        Planning tidak ditemukan. <Link href={props.backHref} className="underline">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gallery.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setGallery((g) => ({ ...g, open: false }))}
          />
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-neutral-100">
              <div className="text-sm font-semibold text-neutral-900">
                Foto bukti ({gallery.index + 1}/{gallery.urls.length})
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={gallery.urls[gallery.index]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-blue-600 underline"
                >
                  Buka tab baru
                </a>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  onClick={() => setGallery((g) => ({ ...g, open: false }))}
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
              <div className="md:col-span-4 bg-neutral-950/5 flex items-center justify-center p-3">
                <div className="relative w-full">
                  <img
                    src={gallery.urls[gallery.index]}
                    alt={`Foto bukti ${gallery.index + 1}`}
                    className="max-h-[70vh] w-full object-contain rounded-xl bg-white"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <button
                      disabled={gallery.index === 0}
                      onClick={() => setGallery((g) => ({ ...g, index: Math.max(0, g.index - 1) }))}
                      className="m-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 ring-1 ring-neutral-200 text-neutral-800 shadow disabled:opacity-40"
                      aria-label="Sebelumnya"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                        <path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z" />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      disabled={gallery.index >= gallery.urls.length - 1}
                      onClick={() => setGallery((g) => ({ ...g, index: Math.min(g.urls.length - 1, g.index + 1) }))}
                      className="m-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 ring-1 ring-neutral-200 text-neutral-800 shadow disabled:opacity-40"
                      aria-label="Berikutnya"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                        <path d="M10.3 16.7a1 1 0 0 0 1.4 0l4-4a1 1 0 0 0 0-1.4l-4-4a1 1 0 1 0-1.4 1.4L13.59 12l-3.3 3.3a1 1 0 0 0 0 1.4Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 border-l border-neutral-100 p-3 space-y-2 max-h-[70vh] overflow-auto">
                <div className="text-xs font-semibold text-neutral-700">Daftar foto</div>
                <div className="grid grid-cols-4 md:grid-cols-1 gap-2">
                  {gallery.urls.map((u, i) => {
                    const active = i === gallery.index;
                    return (
                      <button
                        key={u}
                        onClick={() => setGallery((g) => ({ ...g, index: i }))}
                        className={[
                          "rounded-xl overflow-hidden ring-1",
                          active ? "ring-rose-300" : "ring-neutral-200 hover:ring-neutral-300",
                        ].join(" ")}
                        title={`Foto ${i + 1}`}
                      >
                        <img src={u} alt={`Thumbnail ${i + 1}`} className="h-20 w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-neutral-500">Tips: gunakan tombol panah atau ESC.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl ring-1 ring-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="rounded-2xl ring-1 ring-neutral-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Proyek {projectLabel}</div>
            <div className="text-lg font-semibold text-neutral-900">{planning.title}</div>
            <div className="mt-1 text-xs text-neutral-500">
              {planning.startDate} {'->'} {planning.dueDate}
              {typeof planning.workerCount === "number" ? (
                <>
                  {" | "}Pekerja: <span className="font-semibold text-neutral-700">{planning.workerCount}</span>
                </>
              ) : null}
              {durationDays ? (
                <>
                  {" | "}Durasi: <span className="font-semibold text-neutral-700">{durationDays} hari</span>
                </>
              ) : null}
              {summary.lastRealDate ? (
                <>
                  {" | "}Real terakhir:{" "}
                  <span className="font-semibold text-neutral-700">
                    {summary.lastRealPercent}% ({summary.lastRealDate})
                  </span>
                </>
              ) : (
                <> | Belum ada progres real</>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
            {props.mode === "admin" ? (
              <select
                value={planning.status || "active"}
                disabled={busy === "status"}
                onChange={async (e) => {
                  const next = e.target.value as any;
                  setBusy("status");
                  setError(null);
                  try {
                    await updatePlanningStatus(planning.id, next);
                    setPlanning((p) => (p ? { ...p, status: next } : p));
                  } catch (err: any) {
                    setError(err?.message || "Gagal mengubah status");
                  } finally {
                    setBusy(null);
                  }
                }}
                className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option value="active">active</option>
                <option value="done">done</option>
                <option value="archived">archived</option>
              </select>
            ) : (
              <span className="text-[10px] px-2 py-1 rounded-full font-semibold ring-1 bg-neutral-100 text-neutral-700 ring-neutral-200">
                {planning.status || "active"}
              </span>
            )}

            {props.mode === "admin" && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50"
                >
                  Edit planning
                </button>
                <button
                  disabled={busy === "autofill"}
                  onClick={async () => {
                    setError(null);
                    setBusy("autofill");
                    try {
                      const n = days.length;
                      if (n === 0) throw new Error("Tidak ada rentang tanggal");
                      const updates = days.map((d, idx) => {
                        const t = n === 1 ? 100 : Math.round((idx / (n - 1)) * 100);
                        return { date: d.date, targetPercent: t };
                      });
                      await setTargetsBatch({ planningId: planning.id, days: updates, dueDate: planning.dueDate });
                      setDays((cur) =>
                        cur.map((d) => {
                          const u = updates.find((x) => x.date === d.date);
                          return u ? { ...d, targetPercent: clampPercent(u.targetPercent) } : d;
                        })
                      );
                    } catch (e: any) {
                      setError(e?.message || "Gagal auto-fill target");
                    } finally {
                      setBusy(null);
                    }
                  }}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60"
                >
                  Auto-fill target
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-xl bg-rose-600 text-white px-3 py-2 text-xs font-semibold hover:bg-rose-700"
                >
                  Hapus planning
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit planning modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditOpen(false)}>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 text-sm font-semibold">Edit planning</div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Nama pekerjaan</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="Nama planning"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Jumlah pekerja</label>
                  <input
                    type="number"
                    min={1}
                    value={editWorkers}
                    onChange={(e) => setEditWorkers(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="Misal: 5"
                  />
                  <p className="text-[11px] text-neutral-500">Kosongkan pekerja jika tidak ingin diubah.</p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-end gap-2 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  disabled={savingMeta}
                  onClick={async () => {
                    if (!planning) return;
                    const nextTitle = editTitle.trim() || planning.title;
                    const hasWorkers = editWorkers.trim().length > 0;
                    const nextWorkers = hasWorkers ? Math.max(1, Math.floor(Number(editWorkers) || 0)) : planning.workerCount;
                    setSavingMeta(true);
                    setError(null);
                    try {
                      await updatePlanningInfo(planning.id, {
                        title: nextTitle,
                        workerCount: nextWorkers,
                      });
                      setPlanning((cur) =>
                        cur ? { ...cur, title: nextTitle, workerCount: nextWorkers ?? cur.workerCount } : cur
                      );
                      setEditOpen(false);
                    } catch (e: any) {
                      setError(e?.message || "Gagal menyimpan perubahan planning");
                    } finally {
                      setSavingMeta(false);
                    }
                  }}
                  className="rounded-lg bg-neutral-900 text-white px-5 py-2 text-sm font-semibold hover:bg-neutral-800 disabled:opacity-60"
                >
                  {savingMeta ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={() => setConfirmDelete(false)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 text-sm font-semibold">Hapus planning</div>
              <div className="p-5 space-y-2 text-sm text-neutral-700">
                <p>Planning dan seluruh data hari (target/real + foto) akan dihapus permanen.</p>
                <p className="text-rose-600 font-semibold">Tindakan ini tidak bisa dibatalkan.</p>
              </div>
              <div className="px-4 py-3 flex items-center justify-end gap-2 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  disabled={deleting}
                  onClick={async () => {
                    if (!planning) return;
                    setDeleting(true);
                    setError(null);
                    try {
                      await deletePlanning(planning.id);
                      setConfirmDelete(false);
                      router.push(props.backHref);
                    } catch (e: any) {
                      setError(e?.message || "Gagal menghapus planning");
                      setConfirmDelete(false);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="rounded-lg bg-rose-600 text-white px-5 py-2 text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? "Menghapus..." : "Hapus sekarang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-700">
              <tr className="text-xs">
                <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
                <th className="text-left px-4 py-3 font-semibold">Target %</th>
                <th className="text-left px-4 py-3 font-semibold">Real %</th>
                <th className="text-left px-4 py-3 font-semibold">Selisih</th>
                <th className="text-left px-4 py-3 font-semibold">Foto bukti</th>
                <th className="text-left px-4 py-3 font-semibold">Catatan</th>
                {props.mode === "admin" && <th className="text-left px-4 py-3 font-semibold">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {days.map((d, idx) => {
                const realValue = realDraft[d.date] ?? (d.realPercent != null ? String(d.realPercent) : "");
                const noteValue = noteDraft[d.date] ?? (d.note ?? "");
                const diff = (typeof d.realPercent === "number" ? d.realPercent : null) != null ? (d.realPercent! - d.targetPercent) : null;
                const diffClass =
                  diff == null ? "text-neutral-400" : diff < 0 ? "text-rose-600" : diff > 0 ? "text-emerald-600" : "text-neutral-700";
                const photoUrls = Array.isArray(d.photoUrls) ? d.photoUrls : [];
                return (
                  <tr key={d.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 text-xs font-semibold text-neutral-800">{d.date}</td>
                    <td className="px-4 py-3">
                      {props.mode === "admin" ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={d.targetPercent}
                          onChange={(e) => {
                            const v = clampPercent(Number(e.target.value));
                            setDays((cur) => cur.map((x) => (x.id === d.id ? { ...x, targetPercent: v } : x)));
                          }}
                          className="w-24 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-neutral-800">{d.targetPercent}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {props.mode === "admin" ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={realValue}
                          onChange={(e) => setRealDraft((cur) => ({ ...cur, [d.date]: e.target.value }))}
                          placeholder="-"
                          className="w-24 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-neutral-800">{d.realPercent != null ? `${d.realPercent}%` : "-"}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-xs font-semibold ${diffClass}`}>{diff == null ? "-" : `${diff}%`}</td>
                    <td className="px-4 py-3">
                      {props.mode === "admin" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const fs = e.target.files ? Array.from(e.target.files) : [];
                              setFileDraft((cur) => ({ ...cur, [d.date]: fs.length ? fs : null }));
                            }}
                            className="text-xs"
                          />
                          {photoUrls.length ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setGallery({ open: true, urls: photoUrls, index: 0 })}
                                className="text-xs text-blue-600 underline"
                              >
                                lihat ({photoUrls.length})
                              </button>
                              {photoUrls.length > 1 ? <span className="text-[11px] text-neutral-500">+{photoUrls.length - 1}</span> : null}
                            </div>
                          ) : (
                            <span className="text-[11px] text-rose-600 font-semibold">wajib 1</span>
                          )}
                        </div>
                      ) : photoUrls.length ? (
                        <button
                          type="button"
                          onClick={() => setGallery({ open: true, urls: photoUrls, index: 0 })}
                          className="text-xs text-blue-600 underline"
                        >
                          lihat ({photoUrls.length})
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {props.mode === "admin" ? (
                        <input
                          value={noteValue}
                          onChange={(e) => setNoteDraft((cur) => ({ ...cur, [d.date]: e.target.value }))}
                          placeholder="Catatan..."
                          className="w-full min-w-[240px] rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      ) : (
                        <span className="text-xs text-neutral-700">{d.note?.trim() ? d.note : "-"}</span>
                      )}
                    </td>
                    {props.mode === "admin" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={busy === `target:${d.date}`}
                            onClick={async () => {
                              setBusy(`target:${d.date}`);
                              setError(null);
                              try {
                                const prevTarget = idx > 0 ? days[idx - 1]?.targetPercent : undefined;
                                const nextTarget = idx < days.length - 1 ? days[idx + 1]?.targetPercent : undefined;
                                await setDayTarget({
                                  planningId: planning.id,
                                  date: d.date,
                                  targetPercent: d.targetPercent,
                                  prevTarget,
                                  nextTarget,
                                  dueDate: planning.dueDate,
                                });
                              } catch (e: any) {
                                setError(e?.message || "Gagal menyimpan target");
                              } finally {
                                setBusy(null);
                              }
                            }}
                            className="rounded-lg bg-neutral-900 text-white px-2.5 py-1.5 text-xs font-semibold disabled:opacity-60"
                          >
                            Simpan target
                          </button>

                          <button
                            disabled={busy === `real:${d.date}`}
                            onClick={async () => {
                              setBusy(`real:${d.date}`);
                              setError(null);
                              try {
                                const raw = realDraft[d.date] ?? (d.realPercent != null ? String(d.realPercent) : "");
                                if (!raw.trim()) throw new Error("Real % wajib diisi");
                                const realPercent = clampPercent(Number(raw));
                                const photoFiles = fileDraft[d.date] ?? null;
                                const { photoUrls: updatedPhotoUrls } = await setDayReal({
                                  planningId: planning.id,
                                  date: d.date,
                                  realPercent,
                                  note: noteDraft[d.date] ?? d.note ?? "",
                                  existingPhotoUrls: photoUrls,
                                  photoFiles,
                                });
                                setDays((cur) =>
                                  cur.map((x) =>
                                    x.id === d.id
                                      ? { ...x, realPercent, note: noteDraft[d.date] ?? x.note, photoUrls: updatedPhotoUrls }
                                      : x
                                  )
                                );
                                setFileDraft((cur) => ({ ...cur, [d.date]: null }));
                              } catch (e: any) {
                                setError(e?.message || "Gagal menyimpan real");
                              } finally {
                                setBusy(null);
                              }
                            }}
                            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60"
                          >
                            Simpan real
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {props.mode === "admin" && (
          <div className="px-4 py-3 text-[11px] text-neutral-500 border-t border-neutral-100">
            Catatan: target harus logis (tidak turun) dan target pada tanggal selesai harus 100%. Update real wajib disertai 1 foto bukti.
          </div>
        )}
      </div>
    </div>
  );
}
