"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "../../../lib/firebaseClient";

type DisplayItem = {
  id: string;
  createdAt: number;
  tanggal: string;
  jam: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  alamat: string | null;
  title: string;
  subtitle: string;
  answers?: { label: string; type: string; value: any }[];
  files?: string[];
};

type ProjectKey = "diana" | "bungtomo" | "bisma" | "sampoerna";

function toMillis(value: any): number {
  if (typeof value === "number") return value;
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (value?.seconds) return Number(value.seconds) * 1000;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function photoValues(value: any): string[] {
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => String(item || "").trim()).filter(Boolean);
}

export default function RiwayatTahapClient({ stage, project = "diana" }: { stage: number; project?: ProjectKey }) {
  const projectKey: ProjectKey = project === "bungtomo" ? "bungtomo" : project === "bisma" ? "bisma" : project === "sampoerna" ? "sampoerna" : "diana";
  const progressCollection = projectKey === "bungtomo" ? "Progress_BungTomo" : projectKey === "bisma" ? "Progress_Bisma" : projectKey === "sampoerna" ? "Progress_Sampoerna" : "Progress_Diana";
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [query, setQuery] = useState("");
  const [asc, setAsc] = useState(false);
  const [selected, setSelected] = useState<DisplayItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const usesSingleActiveForm = projectKey === "bungtomo" || projectKey === "sampoerna";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const fb = getFirebaseClient();
      if (!fb) {
        setError("Firebase belum terkonfigurasi.");
        setLoading(false);
        return;
      }

      try {
        const { collection, query, where, onSnapshot } = await import("firebase/firestore");
        const { getAuth } = await import("firebase/auth");
        const currentUser = getAuth(fb.app).currentUser;
        if (!currentUser) {
          setError("Sesi login tidak ditemukan. Silakan login kembali.");
          setLoading(false);
          return;
        }

        const col = collection(fb.db, progressCollection);
        // Batasi dari Firestore berdasarkan UID. Filter tahap dan urutan dilakukan
        // lokal agar tidak memerlukan composite index dan data petugas lain tidak terbaca.
        const q = query(col, where("uid", "==", currentUser.uid));

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(q, (snap) => {
          const cloud = snap.docs.flatMap((d) => {
            const data = d.data();
            const matchesStage = usesSingleActiveForm || Number(data.stage) === Number(stage);
            if (!matchesStage) return [];

            const answers = Array.isArray(data?.answers)
              ? (data.answers as any[]).map((a) => ({ label: a.label, type: a.type, value: a.value }))
              : undefined;
            const firstTwo = answers?.filter((a) => a.type !== "photo").map((a) => String(a.value || "")).filter(Boolean).slice(0, 2) || [];
            const files = answers?.filter((a) => a.type === "photo").flatMap((a) => photoValues(a.value)) || [];
            const title = data?.pekerjaan || firstTwo[0] || "Laporan Progres";
            const subtitle = data?.lokasi || firstTwo[1] || data?.alamat || "-";
            const createdAt = toMillis(data.createdAt ?? data.uploadedAt ?? data.ts);

            return [{
              id: d.id,
              createdAt,
              tanggal: data.tanggal || (createdAt ? new Date(createdAt).toLocaleDateString("id-ID") : ""),
              jam: data.jam || (createdAt ? new Date(createdAt).toLocaleTimeString("id-ID", { hour12: false }) : ""),
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
              accuracy: data.accuracy ?? null,
              alamat: data.alamat ?? null,
              title,
              subtitle,
              answers,
              files,
            } as DisplayItem];
          });
          setItems(cloud);
          setLoading(false);
        }, (err) => {
          console.error("Error loading from Firestore:", err);
          setItems([]);
          setError("Riwayat laporan gagal dimuat. Periksa koneksi lalu coba lagi.");
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error("Error setting up Firestore listener:", err);
        setItems([]);
        setError("Riwayat laporan gagal dimuat. Periksa koneksi lalu coba lagi.");
        setLoading(false);
      }
    };

    const unsubscribe = load();
    return () => {
      unsubscribe?.then(unsub => unsub?.());
    };
  }, [stage, progressCollection, usesSingleActiveForm]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter((i) => [i.title, i.subtitle, i.alamat || ""].some((v) => String(v || "").toLowerCase().includes(q)));
    }
    list = [...list].sort((a, b) => (asc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
    return list;
  }, [items, query, asc]);

  return (
    <div className="space-y-4">
      {/* Search + Sort */}
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
            placeholder="Search..."
            className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
        <button
          type="button"
          onClick={() => setAsc((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white text-neutral-700 px-3 py-2 text-xs sm:text-sm shadow-sm hover:bg-neutral-50 whitespace-nowrap"
        >
          Filter Tgl
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${asc ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
          Memuat riwayat laporan...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* List */}
      {!loading && !error && <ul className="space-y-3">
        {filtered.map((i) => (
          <li key={i.id} className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-3">
              {i.files?.[0] ? (
                <button type="button" onClick={() => setLightboxUrl(i.files?.[0] || null)} className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200" title="Lihat foto">
                  <img src={i.files[0]} alt="Foto laporan" className="h-full w-full object-cover" />
                </button>
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-100 grid place-items-center text-[10px] text-neutral-500 ring-1 ring-neutral-200">
                  Tanpa foto
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{i.title || "-"}</div>
                <div className="text-xs text-neutral-500 truncate">{i.subtitle || "-"}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-neutral-500 whitespace-nowrap">{i.tanggal}</div>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  className="mt-1 inline-flex items-center justify-center h-8 w-8 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                  title="Detail"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M12 5a9 9 0 0 0-9 7 9 9 0 0 0 18 0 9 9 0 0 0-9-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-sm text-neutral-500 py-8">{project === "bungtomo" || project === "sampoerna" ? "Belum ada riwayat laporan." : "Belum ada riwayat untuk tahap ini."}</div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-neutral-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div className="text-sm font-semibold">Detail Laporan</div>
              <button className="h-8 w-8 grid place-items-center rounded-full bg-neutral-100" onClick={() => setSelected(null)}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M6.2 5.2a1 1 0 0 0-1.4 1.4L10.6 12l-5.8 5.4a1 1 0 1 0 1.4 1.5L12 13.4l5.4 5.5a1 1 0 0 0 1.5-1.4L13.4 12l5.5-5.4A1 1 0 1 0 17.4 5L12 10.6 6.2 5.2Z" />
                </svg>
              </button>
            </div>
            <div className="px-4 py-3 text-sm space-y-1">
              {(() => {
                const a: any[] = (selected as any).answers;
                if (Array.isArray(a) && a.length) {
                  return (
                    <div className="space-y-1">
                      {a.filter((x) => x.type !== "photo").map((x, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2">
                          <div className="text-neutral-500">{x.label}</div>
                          <div className="font-medium text-right break-words max-w-[60%]">{x.value || "-"}</div>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
              {!(selected as any).answers && (
                <>
                  <div>
                    <span className="text-neutral-500">Judul: </span>
                    <span className="font-medium">{(selected as any).title || "-"}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Subjudul: </span>
                    <span className="font-medium">{(selected as any).subtitle || "-"}</span>
                  </div>
                </>
              )}
              <div>
                <span className="text-neutral-500">Alamat: </span>
                <span className="font-medium">{selected.alamat || "-"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <div className="text-neutral-500">Tanggal</div>
                  <div className="font-medium">{selected.tanggal}</div>
                </div>
                <div>
                  <div className="text-neutral-500">Jam</div>
                  <div className="font-medium">{selected.jam}</div>
                </div>
                <div>
                  <div className="text-neutral-500">Koordinat</div>
                  <div className="font-medium">{selected.latitude}, {selected.longitude}</div>
                </div>
                <div>
                  <div className="text-neutral-500">Akurasi</div>
                  <div className="font-medium">{selected.accuracy ? `± ${Math.round(selected.accuracy)} m` : "-"}</div>
                </div>
              </div>
              {Array.isArray(selected.files) && selected.files.length > 0 && (
                <div className="pt-3">
                  <div className="mb-2 text-neutral-500">Foto laporan</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.files.map((url, index) => (
                      <button key={`${url}-${index}`} type="button" onClick={() => setLightboxUrl(url)} className="overflow-hidden rounded-xl ring-1 ring-neutral-200" title={`Lihat foto ${index + 1}`}>
                        <img src={url} alt={`Foto laporan ${index + 1}`} className="aspect-square w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/85 p-4" onClick={() => setLightboxUrl(null)}>
          <button type="button" onClick={() => setLightboxUrl(null)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-xl text-neutral-900" aria-label="Tutup foto">×</button>
          <img src={lightboxUrl} alt="Foto laporan ukuran penuh" className="max-h-[90vh] max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
