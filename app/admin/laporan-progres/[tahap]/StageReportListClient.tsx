"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "../../../../lib/firebaseClient";

type Item = {
  id: number | string;
  stage: number;
  // legacy fields
  nama?: string;
  lokasi?: string;
  pekerjaan?: string;
  // new dynamic
  answers?: { label: string; type: string; value: any }[];
  files?: string[];
  tanggal: string;
  jam?: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  alamat: string | null;
  fotoWajibName?: string | null;
  fotoOpsionalName?: string | null;
  createdAt: number;
};

export default function StageReportListClient({ stage }: { stage: number }) {
  const storageKey = `riwayat_stage_${stage}`;
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [asc, setAsc] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editLokasi, setEditLokasi] = useState("");
  const [editPekerjaan, setEditPekerjaan] = useState("");
  const [editFotoName, setEditFotoName] = useState("");
  const [editTanggal, setEditTanggal] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const load = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      setItems(raw ? (JSON.parse(raw) as Item[]) : []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    // try fetch from Firestore to keep in sync
    (async () => {
      const fb = getFirebaseClient();
      if (!fb) return;
      try {
        const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore");
        const col = collection(fb.db, "Progress_Diana");
        const q = query(col, where("stage", "==", stage), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const cloud: Item[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        if (cloud.length) {
          localStorage.setItem(storageKey, JSON.stringify(cloud));
          load();
        }
      } catch {}
    })();
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) load();
    };
    window.addEventListener("storage", onStorage);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("laporan-notif");
      bc.onmessage = (ev) => {
        const data = ev?.data?.item;
        if (ev?.data?.type === "new" && data?.stage === stage) {
          load();
        }
      };
    } catch {}
    return () => {
      window.removeEventListener("storage", onStorage);
      bc?.close?.();
    };
  }, [stage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.map((i) => {
      const firstTwo = Array.isArray(i.answers)
        ? i.answers.filter((a) => a.type !== "photo").map((a) => String(a.value || "")).filter(Boolean).slice(0, 2)
        : [] as string[];
      const title = i.pekerjaan || firstTwo[0] || "-";
      const subtitle = i.lokasi || firstTwo[1] || "-";
      return { ...i, _title: title, _subtitle: subtitle } as any;
    });
    if (q) {
      list = list.filter((i: any) => [i._title, i._subtitle, i.alamat || ""].some((v: any) => String(v || "").toLowerCase().includes(q)));
    }
    list = [...list].sort((a, b) => (asc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
    return list;
  }, [items, query, asc]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center text-sm text-neutral-600">List Pekerjaan Tahap {stage}</div>

      {/* Search + Filter Tanggal */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
        <button
          type="button"
          onClick={() => setAsc((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white text-neutral-700 px-3 py-2 text-xs sm:text-sm shadow-sm hover:bg-neutral-50 whitespace-nowrap"
        >
          Filter Tanggal
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${asc ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>
      </div>

      {/* List */}
      <ul className="space-y-3">
        {filtered.map((i) => (
          <li key={i.id} className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 flex items-start gap-3">
              <div className="shrink-0">
                <span className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 text-xs">Foto</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{(i as any)._title || "-"}</div>
                <div className="text-xs text-neutral-500 truncate">{(i as any)._subtitle || "-"}</div>
              </div>
              <div className="text-right min-w-[150px]">
                <div className="text-[11px] text-neutral-500 whitespace-nowrap">{i.tanggal}</div>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(i)}
                    className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditItem(i);
                      setEditNama(i.nama || "");
                      setEditLokasi(i.lokasi || "");
                      setEditPekerjaan(i.pekerjaan || "");
                      setEditFotoName(i.fotoWajibName || i.fotoOpsionalName || "");
                      setEditTanggal(i.tanggal || "");
                    }}
                    className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Delete from storage
                      const next = items.filter((x) => x.id !== i.id);
                      setItems(next);
                      try {
                        localStorage.setItem(storageKey, JSON.stringify(next));
                        // Remove from notif feed too
                        const feedKey = "notif_feed";
                        const raw = localStorage.getItem(feedKey);
                        if (raw) {
                          const arr = JSON.parse(raw).filter((n: any) => n.id !== i.id);
                          localStorage.setItem(feedKey, JSON.stringify(arr));
                        }
                      } catch {}
                    }}
                    className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-red-500 text-white hover:bg-red-600 text-xs"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="text-center text-sm text-neutral-500 py-10">Belum ada laporan dari petugas untuk tahap ini.</div>
      )}

      {/* Detail modal (lebih profesional & elegan) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100" aria-hidden>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-2-5 2V6a2 2 0 0 1 2-2Z" />
                    </svg>
                  </span>
                  <div className="font-semibold">Detail Laporan</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditItem(selected);
                      setSelected(null);
                      setEditNama(selected.nama || "");
                      setEditLokasi(selected.lokasi || "");
                      setEditPekerjaan(selected.pekerjaan || "");
                      setEditFotoName(selected.fotoWajibName || selected.fotoOpsionalName || "");
                      setEditTanggal(selected.tanggal || "");
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Tutup"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-5 py-5 space-y-5">
                {/* Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500">Tanggal</div>
                    <div className="mt-1 rounded-lg bg-slate-50 ring-1 ring-neutral-200 px-3 py-2 text-sm">{selected.tanggal || "-"}</div>
                  </div>
                  {selected.alamat && (
                    <div>
                      <div className="text-xs text-neutral-500">Alamat</div>
                      <div className="mt-1 rounded-lg bg-slate-50 ring-1 ring-neutral-200 px-3 py-2 text-sm">{selected.alamat}</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.isArray(selected.answers) && selected.answers.length > 0 ? (
                  selected.answers.map((a, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-xs text-neutral-500">{a.label}</div>
                      {a.type === "photo" ? (
                        (() => {
                          const url = typeof a.value === "string" ? a.value : "";
                          if (!url) {
                            return (
                              <div className="text-xs text-neutral-500">Tidak ada foto</div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(url)}
                                className="overflow-hidden rounded-xl ring-1 ring-neutral-200 shadow-sm hover:shadow-md"
                                title="Lihat foto"
                              >
                                <img src={url} alt={a.label || "Foto"} className="block h-20 w-20 object-cover" />
                              </button>
                              <a href={url} target="_blank" rel="noreferrer" className="truncate text-sm text-blue-700 hover:underline">
                                {url}
                              </a>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="mt-1 rounded-lg bg-slate-50 ring-1 ring-neutral-200 px-3 py-2 text-sm text-neutral-800">
                          {String(a.value || "-")}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="text-xs text-neutral-500">Nama</div>
                      <div className="mt-1 rounded-lg bg-slate-50 ring-1 ring-neutral-200 px-3 py-2 text-sm">{selected.nama || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-neutral-500">Lokasi Proyek</div>
                      <div className="mt-1 rounded-lg bg-slate-50 ring-1 ring-neutral-200 px-3 py-2 text-sm">{selected.lokasi || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-neutral-500">Pekerjaan</div>
                      <div className="mt-1 rounded-lg bg-slate-50 ring-1 ring-neutral-200 px-3 py-2 text-sm">{selected.pekerjaan || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-neutral-500">Foto Progres</div>
                      <div className="mt-1 rounded-lg bg-slate-50 ring-1 ring-neutral-200 px-3 py-2 text-sm">{[selected.fotoWajibName, selected.fotoOpsionalName].filter(Boolean).join(", ") || "-"}</div>
                    </div>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox preview */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 grid place-items-center p-4" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Preview" className="max-h-[85vh] rounded-xl shadow-2xl" />
        </div>
      )}

      {/* Edit modal (lebih rapi) */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditItem(null)}>
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200 overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                <div className="font-semibold">Edit Laporan</div>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  aria-label="Tutup"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="px-5 py-5">
                <form
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editItem) return;
                    const next = items.map((x) =>
                      x.id === editItem.id
                        ? {
                            ...x,
                            nama: editNama,
                            lokasi: editLokasi,
                            pekerjaan: editPekerjaan,
                            fotoWajibName: editFotoName || x.fotoWajibName,
                            tanggal: editTanggal || x.tanggal,
                          }
                        : x
                    );
                    setItems(next);
                    try {
                      localStorage.setItem(storageKey, JSON.stringify(next));
                      // sinkronkan ringkas pesan di feed notifikasi jika ada
                      const feedKey = "notif_feed";
                      const raw = localStorage.getItem(feedKey);
                      if (raw) {
                        const arr = JSON.parse(raw).map((n: any) =>
                          n.id === editItem.id
                            ? { ...n, message: `${editPekerjaan || editItem.pekerjaan} • ${editLokasi || editItem.lokasi}`, tanggal: editTanggal || editItem.tanggal }
                            : n
                        );
                        localStorage.setItem(feedKey, JSON.stringify(arr));
                      }
                    } catch {}
                    setEditItem(null);
                  }}
                >
                  <div>
                    <div className="text-xs text-neutral-600">Nama</div>
                    <input value={editNama} onChange={(e) => setEditNama(e.target.value)} className="mt-1 w-full rounded-lg ring-1 ring-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-600">Lokasi Proyek</div>
                    <input value={editLokasi} onChange={(e) => setEditLokasi(e.target.value)} className="mt-1 w-full rounded-lg ring-1 ring-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-600">Pekerjaan</div>
                    <input value={editPekerjaan} onChange={(e) => setEditPekerjaan(e.target.value)} className="mt-1 w-full rounded-lg ring-1 ring-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-neutral-600">Foto Progres</div>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={editFotoName}
                        onChange={(e) => setEditFotoName(e.target.value)}
                        placeholder="Data Foto Progres"
                        className="w-full rounded-lg ring-1 ring-neutral-300 px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                      <input id="edit-file" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setEditFotoName(e.target.files?.[0]?.name || editFotoName)} />
                      <label htmlFor="edit-file" className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 cursor-pointer hover:bg-neutral-50">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M9 3a1 1 0 0 0-.9.6L7.4 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2.4l-.7-1.4A1 1 0 0 0 13 4H10a1 1 0 0 1-1-1Z" />
                          <circle cx="12" cy="13" r="3.5" />
                        </svg>
                      </label>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-600">Tanggal</div>
                    <input value={editTanggal} onChange={(e) => setEditTanggal(e.target.value)} className="mt-1 w-full rounded-lg ring-1 ring-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                  </div>
                  <div className="sm:col-span-2 pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditItem(null)}
                      className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      Batal
                    </button>
                    <button type="submit" className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
