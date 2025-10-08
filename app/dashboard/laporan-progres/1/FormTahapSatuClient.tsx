"use client";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { getFirebaseClient } from "../../../../lib/firebaseClient";

type FieldSpec = { id: number; label: string; type: "text" | "photo" };

async function fileToWebp(file: File, quality = 0.85): Promise<File> {
  try {
    // Try decode with createImageBitmap for performance
    const bitmap = await (window.createImageBitmap
      ? window.createImageBitmap(file)
      : Promise.reject("no createImageBitmap" as const)).catch(async () => {
      // Fallback via <img>
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      // Wrap image into a canvas later using natural sizes
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      const MAX = 2560;
      if (width > MAX || height > MAX) {
        const scale = Math.min(MAX / width, MAX / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/webp", quality)
      );
      if (!blob) return file;
      const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
      return new File([blob], newName, { type: "image/webp" });
    });

    if (bitmap instanceof File) return bitmap; // from fallback branch above

    // Draw bitmap to canvas
    let { width, height } = bitmap;
    const MAX = 2560;
    if (width > MAX || height > MAX) {
      const scale = Math.min(MAX / width, MAX / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", quality)
    );
    if (!blob) return file;
    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    // If anything fails, return original file
    return file;
  }
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

type Props = { stage?: number };

export default function FormTahapSatuClient({ stage = 1 }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileWajibName, setFileWajibName] = useState("");
  const [fileOpsionalName, setFileOpsionalName] = useState("");
  const [fileWajib, setFileWajib] = useState<File | null>(null);
  const [fileOpsional, setFileOpsional] = useState<File | null>(null);
  const [fileWajibPreview, setFileWajibPreview] = useState<string | null>(null);
  const [fileOpsionalPreview, setFileOpsionalPreview] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState<string>("");
  const [timeStr, setTimeStr] = useState<string>("");
  const [gpsStatus, setGpsStatus] = useState<"init" | "tracking" | "denied" | "unsupported" | "error">("init");
  const [gps, setGps] = useState<{ lat?: number; lon?: number; accuracy?: number; updated?: number }>({});
  const [address, setAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeErr, setGeocodeErr] = useState<string | null>(null);

  const inputFileWajibRef = useRef<HTMLInputElement>(null);
  const inputFileOpsionalRef = useRef<HTMLInputElement>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Dynamic schema from admin (localStorage)
  const [schema, setSchema] = useState<FieldSpec[]>([]);
  const [dynPhotoFiles, setDynPhotoFiles] = useState<Array<File | null>>([]);
  const [dynPhotoNames, setDynPhotoNames] = useState<string[]>([]);
  const [dynPhotoPreviews, setDynPhotoPreviews] = useState<Array<string | null>>([]);
  const dynInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadPerc, setUploadPerc] = useState<number[]>([]);
  const [uploadErr, setUploadErr] = useState<(string | null)[]>([]);

  // Initialize clock from device time and keep ticking
  useEffect(() => {
    const setFrom = (d: Date) => {
      setDateStr(d.toLocaleDateString("id-ID"));
      setTimeStr(
        d.toLocaleTimeString("id-ID", { hour12: false })
      );
    };
    setFrom(new Date());
    const t = setInterval(() => setFrom(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load schema per stage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("stages_config");
      const list = raw ? JSON.parse(raw) : [];
      const item = list?.[stage - 1] ?? list?.[0];
      let fields: FieldSpec[] = [];
      if (item?.fields) {
        fields = (item.fields as any[]).map((f: any, i: number) =>
          typeof f === "string"
            ? { id: Date.now() + i, label: f, type: "text" }
            : { id: f.id ?? Date.now() + i, label: f.label ?? String(f.name ?? "Field"), type: f.type === "photo" ? "photo" : "text" }
        );
      } else if (item?.forms) {
        fields = (item.forms as any[]).map((f: any, i: number) => ({ id: f.id ?? Date.now() + i, label: f.name ?? "Field", type: "text" }));
      } else {
        fields = [
          { id: 1, label: "Nama", type: "text" },
          { id: 2, label: "Lokasi Proyek", type: "text" },
        ];
      }
      setSchema(fields);
      const size = fields.length;
      setDynPhotoFiles(Array.from({ length: size }, () => null));
      setDynPhotoNames(Array.from({ length: size }, () => ""));
      setDynPhotoPreviews(Array.from({ length: size }, () => null));
      setUploadPerc(Array.from({ length: size }, () => 0));
      setUploadErr(Array.from({ length: size }, () => null));
    } catch {
      setSchema([
        { id: 1, label: "Nama", type: "text" },
        { id: 2, label: "Lokasi Proyek", type: "text" },
      ]);
    }
  }, [stage]);

  // Geolocation realtime
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("unsupported");
      return;
    }
    setGpsStatus("tracking");
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGps({ lat: latitude, lon: longitude, accuracy, updated: pos.timestamp });
        const gpsTime = new Date(pos.timestamp || Date.now());
        setDateStr(gpsTime.toLocaleDateString("id-ID"));
        setTimeStr(gpsTime.toLocaleTimeString("id-ID", { hour12: false }));
      },
      (err) => {
        setGpsStatus(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Reverse geocoding when lat/lon available
  useEffect(() => {
    if (!gps.lat || !gps.lon) return;
    setIsGeocoding(true);
    setGeocodeErr(null);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ lat: String(gps.lat), lon: String(gps.lon) });
        const res = await fetch(`/api/geocode?${params.toString()}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAddress(data?.label || "");
      } catch (e: any) {
        setGeocodeErr(e?.message || "gagal memuat alamat");
      } finally {
        setIsGeocoding(false);
      }
    }, 500); // debounce sedikit
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [gps.lat, gps.lon]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (fileWajibPreview) URL.revokeObjectURL(fileWajibPreview);
      if (fileOpsionalPreview) URL.revokeObjectURL(fileOpsionalPreview);
    };
  }, [fileWajibPreview, fileOpsionalPreview]);

  function setPreviewSafely(
    setter: Dispatch<SetStateAction<string | null>>,
    prevUrl: string | null,
    nextBlob: Blob | null
  ) {
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    if (nextBlob) {
      const url = URL.createObjectURL(nextBlob);
      setter(url);
    } else {
      setter(null);
    }
  }

  return (
    <div className="mx-auto max-w-md sm:max-w-lg rounded-3xl ring-1 ring-neutral-200 bg-white/95 shadow-xl backdrop-blur p-4 sm:p-6">
      <div className="text-center mb-4">
        <div className="text-sm sm:text-base font-semibold">Lengkapi Formulir Dibawah ini</div>
      </div>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmitting) return;
          setIsSubmitting(true);
          // Kumpulkan data dan gunakan file hasil konversi WEBP
          const formEl = e.currentTarget as HTMLFormElement;
          const fd = new FormData(formEl);
          // Siapkan upload ke Firebase (jika tersedia)
          const fb = getFirebaseClient();
          const recId = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
            ? (crypto as any).randomUUID()
            : String(Date.now());

          // Upload foto dinamika jika ada, dan bangun answers
          const answers: { label: string; type: string; value: any }[] = [];
          for (let i = 0; i < schema.length; i++) {
            const fdef = schema[i];
            if (fdef.type === "photo") {
              const file = dynPhotoFiles[i];
              let value: any = null;
              if (file && fb) {
                try {
                  const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
                  // Use unique object name to avoid 412 (precondition) when same filename is uploaded twice
                  const uniq = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
                    ? (crypto as any).randomUUID()
                    : Math.random().toString(36).slice(2);
                  const path = `Progress_Diana/${recId}/${i + 1}_${uniq}_${file.name}`;
                  const r = ref(fb.storage, path);
                  await new Promise<void>((resolve, reject) => {
                    const task = uploadBytesResumable(r, file, { contentType: file.type || "image/webp" });
                    task.on(
                      "state_changed",
                      (snap) => {
                        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                        setUploadPerc((arr) => {
                          const next = [...arr];
                          next[i] = pct;
                          return next;
                        });
                      },
                      (err) => {
                        setUploadErr((arr) => {
                          const next = [...arr];
                          next[i] = err?.message || "Upload gagal";
                          return next;
                        });
                        reject(err);
                      },
                      () => resolve()
                    );
                  });
                  value = await getDownloadURL(r);
                } catch (e: any) {
                  value = null;
                }
              } else {
                value = file?.name ?? null;
              }
              answers.push({ label: fdef.label, type: "photo", value });
            } else {
              const val = String(fd.get(`f_${i}`) || "");
              answers.push({ label: fdef.label, type: "text", value: val });
            }
          }

          const photoInfos = answers.filter(a => a.type === "photo" && a.value).map(a => String(a.value)).join(", ") || "-";
          // Simpan ke localStorage sebagai riwayat tahap terkait
          try {
            const data = {
              id: Date.now(),
              stage,
              answers,
              tanggal: String(fd.get("tanggal") || dateStr),
              jam: String(fd.get("jam") || timeStr),
              latitude: gps.lat ?? null,
              longitude: gps.lon ?? null,
              accuracy: gps.accuracy ?? null,
              alamat: address || null,
              createdAt: Date.now(),
            };
            // Simpan ke Firestore
            try {
              if (fb) {
                const { collection, doc, setDoc, serverTimestamp } = await import("firebase/firestore");
                const col = collection(fb.db, "Progress_Diana");
                await setDoc(doc(col, recId), {
                  ...data,
                  id: recId,
                  ts: serverTimestamp(),
                });
              }
            } catch {}
            const key = `riwayat_stage_${stage}`;
            const list: any[] = JSON.parse(localStorage.getItem(key) || "[]");
            list.push(data);
            localStorage.setItem(key, JSON.stringify(list));

            // Tambah ke feed notifikasi global
            const firstTwoTexts = answers.filter((a: any) => a.type === "text").map((a: any) => a.value).filter(Boolean).slice(0, 2);
            const notif = {
              id: data.id,
              stage: data.stage,
              title: `Laporan Tahap ${data.stage}`,
              message: firstTwoTexts.join(" • ") || "Laporan masuk",
              tanggal: data.tanggal,
              jam: data.jam,
              createdAt: data.createdAt,
            };
            const feedKey = "notif_feed";
            const feed: any[] = JSON.parse(localStorage.getItem(feedKey) || "[]");
            feed.push(notif);
            localStorage.setItem(feedKey, JSON.stringify(feed));
            // Broadcast ke tab lain
            try {
              const bc = new BroadcastChannel("laporan-notif");
              bc.postMessage({ type: "new", item: notif });
              bc.close();
            } catch {}
          } catch {}

          setTimeout(() => {
            setIsSubmitting(false);
            alert(`Terkirim!\nFoto: ${photoInfos}`);
          }, 300);
        }}
      >
        {/* Dynamic fields from admin */}
        {schema.map((f, i) => (
          <div className="space-y-1" key={f.id ?? i}>
            <label className="block text-xs font-medium text-neutral-700">
              {f.label} {f.type === "text" && <span className="text-red-600">*</span>}
            </label>
            {f.type === "text" ? (
              <input
                id={`f_${i}`}
                name={`f_${i}`}
                type="text"
                placeholder={f.label}
                required
                className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            ) : (
              <>
                <input
                  ref={(el) => { dynInputRefs.current[i] = el; }}
                  id={`f_${i}`}
                  name={`f_${i}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={async (e) => {
                    const f0 = e.target.files?.[0];
                    if (!f0) return;
                    setDynPhotoNames((arr) => {
                      const next = [...arr];
                      next[i] = "Mengonversi...";
                      return next;
                    });
                    const webp = await fileToWebp(f0, 0.85);
                    setDynPhotoFiles((arr) => {
                      const next = [...arr];
                      next[i] = webp;
                      return next;
                    });
                    setDynPhotoNames((arr) => {
                      const next = [...arr];
                      next[i] = `${webp.name} (${formatBytes(webp.size)})`;
                      return next;
                    });
                    setDynPhotoPreviews((arr) => {
                      const next = [...arr];
                      const prev = next[i];
                      if (prev) URL.revokeObjectURL(prev as any);
                      next[i] = URL.createObjectURL(webp);
                      return next;
                    });
                  }}
                  required
                />
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    onClick={() => dynInputRefs.current[i]?.click()}
                    placeholder="Masukkan Foto (klik untuk ambil)"
                    value={dynPhotoNames[i] || ""}
                    className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
                  />
                </div>
                {dynPhotoPreviews[i] && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(dynPhotoPreviews[i] as string)}
                        className="overflow-hidden rounded-xl ring-1 ring-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                        title="Lihat pratinjau"
                      >
                        <img src={dynPhotoPreviews[i] as string} alt="Preview foto" className="block h-20 w-20 object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => dynInputRefs.current[i]?.click()}
                        className="text-xs px-3 py-1.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
                      >
                        Ganti Foto
                      </button>
                    </div>
                    {typeof uploadPerc[i] === "number" && uploadPerc[i] > 0 && (
                      <div className="mt-2 w-48">
                        <div className="h-2 rounded bg-neutral-200 overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${uploadPerc[i]}%` }} />
                        </div>
                        <div className="text-[11px] text-neutral-600 mt-1">{uploadPerc[i]}%</div>
                      </div>
                    )}
                    {uploadErr[i] && (
                      <div className="mt-1 text-xs text-red-600">Upload error: {uploadErr[i]}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {/* Legacy static fields (disabled) */}
        <div className="hidden">
          <label htmlFor="nama" className="block text-xs font-medium text-neutral-700">
            Nama <span className="text-red-600">*</span>
          </label>
          <input
            id="_legacy_nama"
            name="_legacy_nama"
            type="text"
            placeholder="Masukkan Nama Anda"
            disabled
            className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        {/* Lokasi Proyek */}
        <div className="hidden">
          <label htmlFor="lokasi" className="block text-xs font-medium text-neutral-700">
            Lokasi Proyek <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <select
              id="_legacy_lokasi"
              name="_legacy_lokasi"
              disabled
              defaultValue=""
              className="appearance-none w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <option value="" disabled>
                Pilih Lokasi Proyek
              </option>
              <option>Diana</option>
              <option>Grahaku</option>
              <option>Bung Tomo</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M6.3 9.3a1 1 0 0 1 1.4 0L12 13.6l4.3-4.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 0 1 0-1.4Z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Pekerjaan (input manual) */}
        <div className="hidden">
          <label htmlFor="pekerjaan" className="block text-xs font-medium text-neutral-700">
            Pekerjaan <span className="text-red-600">*</span>
          </label>
          <input
            id="_legacy_pekerjaan"
            name="_legacy_pekerjaan"
            type="text"
            disabled
            placeholder="Tuliskan pekerjaan"
            className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        {/* Upload Foto Progres (Wajib) */}
        <div className="hidden">
          <label className="block text-xs font-medium text-neutral-700">
            Upload Foto Progres <span className="text-red-600">*</span>
          </label>
          <input
            ref={inputFileWajibRef}
            id="foto-wajib"
            name="fotoWajib"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFileWajibName("Mengonversi...");
              const webp = await fileToWebp(f, 0.85);
              setFileWajib(webp);
              setFileWajibName(`${webp.name} (${formatBytes(webp.size)})`);
              setPreviewSafely(setFileWajibPreview, fileWajibPreview, webp);
            }}
            disabled
          />
          <div className="relative">
            <input
              type="text"
              readOnly
              onClick={() => inputFileWajibRef.current?.click()}
              placeholder="Masukkan Foto (klik untuk ambil)"
              value={fileWajibName}
              className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
            />
          </div>
          {fileWajibPreview && (
            <div className="mt-2">
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(fileWajibPreview)}
                  className="overflow-hidden rounded-xl ring-1 ring-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                  title="Lihat pratinjau"
                >
                  <img
                    src={fileWajibPreview}
                    alt="Preview foto progres wajib"
                    className="block h-20 w-20 object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => inputFileWajibRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
                >
                  Ganti Foto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Foto Progres (Opsional) */}
        <div className="hidden">
          <label className="block text-xs font-medium text-neutral-700">
            Upload Foto Progres opsional
          </label>
          <input
            ref={inputFileOpsionalRef}
            id="foto-opsional"
            name="fotoOpsional"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setFileOpsionalName("Mengonversi...");
              const webp = await fileToWebp(f, 0.85);
              setFileOpsional(webp);
              setFileOpsionalName(`${webp.name} (${formatBytes(webp.size)})`);
              setPreviewSafely(setFileOpsionalPreview, fileOpsionalPreview, webp);
            }}
            disabled
          />
          <div className="relative">
            <input
              type="text"
              readOnly
              onClick={() => inputFileOpsionalRef.current?.click()}
              placeholder="Masukkan Foto (klik untuk ambil)"
              value={fileOpsionalName}
              className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer"
            />
          </div>
          {fileOpsionalPreview && (
            <div className="mt-2">
              <div className="inline-flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(fileOpsionalPreview)}
                  className="overflow-hidden rounded-xl ring-1 ring-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                  title="Lihat pratinjau"
                >
                  <img
                    src={fileOpsionalPreview}
                    alt="Preview foto progres opsional"
                    className="block h-20 w-20 object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => inputFileOpsionalRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
                >
                  Ganti Foto
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Waktu (realtime, tidak bisa diubah) */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">Tanggal</label>
            <input
              type="text"
              value={dateStr}
              readOnly
              disabled
              className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm shadow-inner text-neutral-700"
            />
            <input type="hidden" name="tanggal" value={dateStr} />
            <p className="text-[11px] text-neutral-500">Data tanggal realtime</p>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">Jam</label>
            <input
              type="text"
              value={timeStr}
              readOnly
              disabled
              className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm shadow-inner text-neutral-700"
            />
            <input type="hidden" name="jam" value={timeStr} />
          </div>
        </div>

        {/* GPS Realtime */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-neutral-700">Lokasi (GPS realtime)</label>
          <div className="rounded-2xl ring-1 ring-neutral-300 bg-white px-4 py-3 text-sm shadow-inner text-neutral-700">
            {gpsStatus === "unsupported" && <span>Perangkat tidak mendukung GPS.</span>}
            {gpsStatus !== "unsupported" && (
              <div className="flex flex-col gap-1">
                <div>
                  Koordinat: {gps.lat?.toFixed(6) ?? "-"}, {gps.lon?.toFixed(6) ?? "-"}
                </div>
                <div>
                  Akurasi: {gps.accuracy ? `± ${Math.round(gps.accuracy)} m` : "-"}
                </div>
                <div>
                  Alamat: {isGeocoding ? "Memuat..." : address || (geocodeErr ? `Gagal (${geocodeErr})` : "-")}
                </div>
                <div className="text-xs text-neutral-500">
                  Status: {gpsStatus === "tracking" ? "melacak" : gpsStatus === "denied" ? "izin lokasi ditolak" : gpsStatus === "error" ? "gagal membaca lokasi" : "-"}
                </div>
              </div>
            )}
          </div>
          {/* Hidden fields for submission */}
          <input type="hidden" name="latitude" value={gps.lat ?? ""} />
          <input type="hidden" name="longitude" value={gps.lon ?? ""} />
          <input type="hidden" name="accuracy" value={gps.accuracy ?? ""} />
          <input type="hidden" name="alamat" value={address} />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            aria-busy={isSubmitting}
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-b from-neutral-200 to-neutral-300 text-neutral-900 px-5 py-2.5 text-sm font-semibold shadow-md hover:from-neutral-300 hover:to-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"></path>
                </svg>
                Mengirim...
              </span>
            ) : (
              "Kirim"
            )}
          </button>
        </div>
      </form>
      {/* Lightbox Preview */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-w-[92vw] max-h-[86vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxUrl}
              alt="Preview foto"
              className="max-w-full max-h-[86vh] object-contain rounded-xl shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white text-neutral-800 shadow ring-1 ring-neutral-200 grid place-items-center"
              title="Tutup"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M6.2 5.2a1 1 0 0 0-1.4 1.4L10.6 12l-5.8 5.4a1 1 0 1 0 1.4 1.5L12 13.4l5.4 5.5a1 1 0 0 0 1.5-1.4L13.4 12l5.5-5.4A1 1 0 1 0 17.4 5L12 10.6 6.2 5.2Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
