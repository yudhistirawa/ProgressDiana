"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "../../../../lib/firebaseClient";

type Item = {
  id: string;
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

type AlertState = {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  show: boolean;
};

export default function StageReportListClient({ stage }: { stage: number }) {
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
  const [loading, setLoading] = useState(true);

  // Delete confirmation alert state
  const [deleteAlert, setDeleteAlert] = useState<AlertState>({ type: 'warning', title: '', message: '', show: false });
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const load = async () => {
    setLoading(true);
    const fb = getFirebaseClient();
    if (!fb) {
      setLoading(false);
      return;
    }

    try {
      const { collection, query, where, orderBy, getDocs, onSnapshot } = await import("firebase/firestore");
      const col = collection(fb.db, "Progress_Diana");
      const q = query(col, where("stage", "==", stage));

      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (snap) => {
        const items: Item[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setItems(items);
        setLoading(false);
        console.log("✅ Loaded", items.length, "reports for stage", stage);
      }, (err) => {
        console.error("❌ Firestore error:", err);
        setItems([]);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up Firestore listener:", err);
      setItems([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = load();
    return () => {
      unsubscribe?.then(unsub => unsub?.());
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

  const showDeleteAlert = (item: Item) => {
    setItemToDelete(item);
    setDeleteAlert({
      type: 'warning',
      title: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus laporan "${item.pekerjaan || 'tanpa nama'}"?\n\nData yang sudah dihapus tidak dapat dikembalikan.`,
      show: true
    });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const fb = getFirebaseClient();
    if (!fb) return;

    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const docRef = doc(fb.db, "Progress_Diana", itemToDelete.id);
      await deleteDoc(docRef);

      // Delete notification if exists
      try {
        const notifRef = doc(fb.db, "Progress_Diana_Notifikasi", itemToDelete.id);
        await deleteDoc(notifRef);
      } catch {}

      // Update local state
      setItems(items.filter((x) => x.id !== itemToDelete.id));
      setDeleteAlert(prev => ({ ...prev, show: false }));
      setItemToDelete(null);
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Gagal menghapus laporan");
    }
  };

  const closeDeleteAlert = () => {
    setDeleteAlert(prev => ({ ...prev, show: false }));
    setItemToDelete(null);
  };

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

                      // Initialize basic fields
                      setEditNama(i.nama || "");
                      setEditLokasi(i.lokasi || "");
                      setEditPekerjaan(i.pekerjaan || "");
                      setEditFotoName(i.fotoWajibName || i.fotoOpsionalName || "");
                      setEditTanggal(i.tanggal || "");

                      // For dynamic answers, pre-populate any text fields
                      if (Array.isArray(i.answers)) {
                        const namaField = i.answers.find((a: any) => a.label.toLowerCase().includes('nama') && a.type === 'text');
                        const lokasiField = i.answers.find((a: any) => a.label.toLowerCase().includes('lokasi') && a.type === 'text');
                        const pekerjaanField = i.answers.find((a: any) => a.label.toLowerCase().includes('pekerjaan') || a.label.toLowerCase().includes('kegiatan') && a.type === 'text');

                        if (namaField) setEditNama(String(namaField.value || ""));
                        if (lokasiField) setEditLokasi(String(lokasiField.value || ""));
                        if (pekerjaanField) setEditPekerjaan(String(pekerjaanField.value || ""));
                      }
                    }}
                    className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => showDeleteAlert(i)}
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

      {/* Modern Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" style={{animation: 'modal-scale-in 0.5s cubic-bezier(0.4, 0, 0.2, 1)'}}>
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
            style={{animation: 'modal-scale-in 0.3s ease-out'}}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden transform-gpu" onClick={(e) => e.stopPropagation()} style={{animation: 'modal-slide-in 0.6s cubic-bezier(0.4, 0, 0.2, 1)'}}>
            <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu">

              {/* Header with gradient background */}
              <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-700/90" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Detail Laporan Tahap {stage}</h2>
                      <p className="text-blue-100 text-sm mt-0.5">ID: {selected.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditItem(selected);
                        setSelected(null);
                        setEditNama(selected.nama || "");
                        setEditLokasi(selected.lokasi || "");
                        setEditPekerjaan(selected.pekerjaan || "");
                        setEditFotoName(selected.fotoWajibName || selected.fotoOpsionalName || "");
                        setEditTanggal(selected.tanggal || "");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all duration-200"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="m11.25 6c.398 0 .75.352.75.75 0 .414-.336.75-.75.75-1.505 0-7.75 5.886-7.75 7.646 0 1.76 6.245 7.646 7.75 7.646.414 0 .75.336.75.75s-.336.75-.75.75c-2.05 0-9.25-6.582-9.25-9.146s7.2-9.146 9.25-9.146z"/>
                        <path d="m14.664 6.52 2.083 2.083c.26.26.26.682 0 .943l-7.216 7.216-3.406.29.29-3.406 7.216-7.216c.26-.26.682-.26.943 0z"/>
                      </svg>
                      Edit Data
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                      aria-label="Tutup"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto px-8 py-6">

                {/* Status & Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 font-medium">Status</div>
                        <div className="text-sm font-semibold text-green-800">Laporan Masuk</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600 font-medium">Tanggal Laporan</div>
                        <div className="text-sm font-semibold text-blue-800">{selected.tanggal || "-"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-purple-600 font-medium">Waktu Laporan</div>
                        <div className="text-sm font-semibold text-purple-800">{selected.jam || "00:00:00"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Location & Technical Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Informasi Lokasi</h3>

                    <div className="space-y-3">
                      {selected.alamat && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">Lokasi Proyek</div>
                              <div className="text-sm text-gray-600 leading-relaxed">{selected.alamat}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selected.latitude && selected.longitude && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 flex-shrink-0">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">Koordinat GPS</div>
                              <div className="text-xs text-gray-500">
                                Lat: {selected.latitude?.toFixed(6)} | Lon: {selected.longitude?.toFixed(6)}
                                {selected.accuracy && <span className="ml-1">± {Math.round(selected.accuracy)}m</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Data Laporan</h3>

                    <div className="grid gap-3">
                      {Array.isArray(selected.answers) && selected.answers.length > 0 ? (
                        selected.answers.map((a, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 mb-2">{a.label}</div>
                                {a.type === "photo" ? (
                                  (() => {
                                    const url = typeof a.value === "string" ? a.value : "";
                                    if (!url) {
                                      return <div className="text-sm text-gray-500 italic">Tidak ada foto</div>;
                                    }
                                    return (
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => setLightboxUrl(url)}
                                          className="overflow-hidden rounded-lg ring-1 ring-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:ring-blue-300"
                                        >
                                          <img src={url} alt={a.label || "Foto"} className="block h-16 w-16 object-cover" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs text-gray-500 mb-1">Klik gambar untuk preview</div>
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all">
                                            Lihat foto asli
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                    {String(a.value || "-")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          {selected.nama && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Nama Petugas</div>
                              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                {selected.nama}
                              </div>
                            </div>
                          )}

                          {selected.lokasi && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Lokasi Proyek</div>
                              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                {selected.lokasi}
                              </div>
                            </div>
                          )}

                          {selected.pekerjaan && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Jenis Pekerjaan</div>
                              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                {selected.pekerjaan}
                              </div>
                            </div>
                          )}

                          {(selected.fotoWajibName || selected.fotoOpsionalName) && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">File Foto</div>
                              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 italic">
                                {[selected.fotoWajibName, selected.fotoOpsionalName].filter(Boolean).join(", ") || "Tidak ada foto"}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => showDeleteAlert(selected)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus Laporan
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Photo Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setLightboxUrl(null)}
          />

          {/* Lightbox Card */}
          <div className="relative max-w-5xl max-h-[90vh] animate-in slide-in-from-bottom-4 duration-500 transform-gpu" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform-gpu">

              {/* Header */}
              <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Preview Foto</h3>
                    <p className="text-gray-300 text-sm">Klik area gelap untuk menutup</p>
                  </div>
                </div>

                <button
                  onClick={() => setLightboxUrl(null)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  aria-label="Tutup preview"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>

              {/* Image Container */}
              <div className="relative bg-gray-100 p-6 flex items-center justify-center min-h-[400px]">
                <img
                  src={lightboxUrl}
                  alt="Full size preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />

                {/* Image Info Overlay */}
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                  <div className="text-sm">
                    Klik gambar untuk membuka di tab baru
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Preview foto laporan progress
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={lightboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6a2 2 0 012 2v1.5a.5.5 0 001 0V8a3 3 0 00-3-3H5a3 3 0 00-3 3v11a3 3 0 003 3h11a3 3 0 003-3v-6a.5.5 0 00-.5-.5H18a.5.5 0 00-.5.5z"/>
                      <path d="M15 3a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-2 0V5.41l-9.79 9.8a1 1 0 01-1.42-1.42L18.59 4H16a1 1 0 010-2z"/>
                    </svg>
                    Buka Full Size
                  </a>
                  <button
                    onClick={() => setLightboxUrl(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{animation: 'modal-scale-in 0.4s cubic-bezier(0.4, 0, 0.2, 1)'}}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setEditItem(null)}
            style={{animation: 'modal-scale-in 0.3s ease-out'}}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden transform-gpu" onClick={(e) => e.stopPropagation()} style={{animation: 'modal-slide-in 0.5s cubic-bezier(0.4, 0, 0.2, 1)'}}>
            <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu">

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="m11.25 6c.398 0 .75.352.75.75 0 .414-.336.75-.75.75-1.505 0-7.75 5.886-7.75 7.646 0 1.76 6.245 7.646 7.75 7.646.414 0 .75.336.75.75s-.336.75-.75.75c-2.05 0-9.25-6.582-9.25-9.146s7.2-9.146 9.25-9.146z"/>
                        <path d="m14.664 6.52 2.083 2.083c.26.26.26.682 0 .943l-7.216 7.216-3.406.29.29-3.406 7.216-7.216c.26-.26.682-.26.943 0z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Edit Laporan</h2>
                      <p className="text-blue-100 text-sm">ID: {editItem.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditItem(null)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
                    aria-label="Tutup"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
                <form
                  className="space-y-6"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editItem) return;

                    const fb = getFirebaseClient();
                    if (!fb) return;

                    const updatedItem = {
                      ...editItem,
                      nama: editNama,
                      lokasi: editLokasi,
                      pekerjaan: editPekerjaan,
                      fotoWajibName: editFotoName || editItem.fotoWajibName,
                      tanggal: editTanggal || editItem.tanggal,
                    };

                    try {
                      const { doc, updateDoc } = await import("firebase/firestore");
                      const docRef = doc(fb.db, "Progress_Diana", editItem.id);
                      await updateDoc(docRef, {
                        nama: updatedItem.nama,
                        lokasi: updatedItem.lokasi,
                        pekerjaan: updatedItem.pekerjaan,
                        fotoWajibName: updatedItem.fotoWajibName,
                        tanggal: updatedItem.tanggal,
                      });

                      // Update notification if exists
                      try {
                        const notifRef = doc(fb.db, "Progress_Diana_Notifikasi", editItem.id);
                        await updateDoc(notifRef, {
                          message: `${updatedItem.pekerjaan || editItem.pekerjaan} • ${updatedItem.lokasi || editItem.lokasi}`,
                          tanggal: updatedItem.tanggal,
                        });
                      } catch {}

                      // Update local state
                      const next = items.map((x) =>
                        x.id === editItem.id ? updatedItem : x
                      );
                      setItems(next);
                      setEditItem(null);
                    } catch (err) {
                      console.error("Error updating:", err);
                      alert("Gagal memperbarui laporan");
                    }
                  }}
                >
                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Nama Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-600" fill="currentColor">
                            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
                          </svg>
                          Nama Petugas
                        </span>
                      </label>
                      <input
                        type="text"
                        value={editNama}
                        onChange={(e) => setEditNama(e.target.value)}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                        placeholder="Masukkan nama petugas"
                      />
                    </div>

                    {/* Lokasi Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-600" fill="currentColor">
                            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                          </svg>
                          Lokasi Proyek
                        </span>
                      </label>
                      <input
                        type="text"
                        value={editLokasi}
                        onChange={(e) => setEditLokasi(e.target.value)}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200"
                        placeholder="Masukkan lokasi proyek"
                      />
                    </div>

                    {/* Pekerjaan Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-purple-600" fill="currentColor">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                          </svg>
                          Jenis Pekerjaan
                        </span>
                      </label>
                      <input
                        type="text"
                        value={editPekerjaan}
                        onChange={(e) => setEditPekerjaan(e.target.value)}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
                        placeholder="Masukkan jenis pekerjaan"
                      />
                    </div>

                    {/* Tanggal Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-900">
                        <span className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-600" fill="currentColor">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Tanggal Laporan
                        </span>
                      </label>
                      <input
                        type="date"
                        value={editTanggal}
                        onChange={(e) => setEditTanggal(e.target.value)}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all duration-200"
                      />
                    </div>

                  </div>

                  {/* Foto Field - Full Width */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      <span className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-600" fill="currentColor">
                          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        Nama File Foto
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFotoName}
                        onChange={(e) => setEditFotoName(e.target.value)}
                        placeholder="Masukkan nama file foto..."
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <input
                          id="edit-file"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="sr-only"
                          onChange={(e) => setEditFotoName(e.target.files?.[0]?.name || editFotoName)}
                        />
                        <label
                          htmlFor="edit-file"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 cursor-pointer transition-colors"
                          title="Pilih foto baru"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setEditItem(null)}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg"
                    >
                      <span className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                        Simpan Perubahan
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {deleteAlert.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={closeDeleteAlert}
          />

          {/* Delete Confirmation Card */}
          <div className="relative w-full max-w-sm animate-in slide-in-from-top-3 duration-500 transform-gpu">
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu animate-in zoom-in-98 fade-in duration-400 delay-100">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100">
                {/* Warning Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 text-sm">{deleteAlert.title}</h3>
                </div>

                {/* Close button */}
                <button
                  onClick={closeDeleteAlert}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-4">
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{deleteAlert.message}</p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-4 py-4 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={closeDeleteAlert}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
