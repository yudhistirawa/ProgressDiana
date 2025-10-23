"use client";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { getFirebaseClient, getFirebaseStorage } from "../../../../lib/firebaseClient";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import dynamic from 'next/dynamic';

// Lazy load the ProgressTable component to avoid SSR issues with Firebase
const ProgressTable = dynamic(
  () => import('../../../../components/ProgressTable'),
  { ssr: false, loading: () => <div className="text-center py-4">Memuat data progress...</div> }
);

type FieldSpec = { id: number; label: string; type: "text" | "photo" };

async function addGeotagToImage(file: File, lat: number, lon: number, accuracy?: number, userInfo?: { name?: string; email?: string; uid?: string }, address?: string): Promise<File> {
  try {
    // For mobile devices with camera, try to add GPS metadata
    if ('ImageCapture' in window || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      console.log('📍 Adding comprehensive geotag to image:', { lat, lon, accuracy, userInfo, fileName: file.name });

      try {
        // Get device information
        const deviceInfo = getDeviceInfo();
        const timestamp = new Date();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Create a canvas with the image and comprehensive overlay
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = await createImageFromFile(file);

        if (ctx && img) {
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the original image
          ctx.drawImage(img, 0, 0);

          // Create semi-transparent overlay background
          const overlayHeight = 180; // Increased height for more info
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(10, canvas.height - overlayHeight - 10, Math.min(450, canvas.width - 20), overlayHeight);

          // Set text properties
          ctx.fillStyle = 'white';
          ctx.textAlign = 'left';

          // Title with Progress Diana branding
          ctx.font = 'bold 16px Arial';
          ctx.fillText('📍 PROGRESS DIANA - GEOSTAMP', 20, canvas.height - overlayHeight + 25);

          // Content
          ctx.font = '12px Arial';
          let yPos = canvas.height - overlayHeight + 50;

          // Date & Time with Timezone
          const localDateTime = timestamp.toLocaleString('id-ID', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          ctx.font = 'bold 12px Arial';
          ctx.fillText('⏰ WAKTU & TANGGAL', 20, yPos);
          yPos += 20;
          ctx.font = '11px Arial';
          ctx.fillText(`   ${localDateTime}`, 20, yPos);
          yPos += 20;

          // GPS Coordinates (WGS84)
          ctx.font = 'bold 12px Arial';
          ctx.fillText('📍 KOORDINAT GPS', 20, yPos);
          yPos += 20;
          ctx.font = '11px Arial';
          ctx.fillText(`   ${lat.toFixed(8)}, ${lon.toFixed(8)} (WGS84)`, 20, yPos);
          yPos += 20;

          // Accuracy
          if (accuracy) {
            ctx.font = 'bold 12px Arial';
            ctx.fillText('🎯 AKURASI GPS', 20, yPos);
            yPos += 20;
            ctx.font = '11px Arial';
            ctx.fillText(`   ±${Math.round(accuracy)}m`, 20, yPos);
            yPos += 20;
          }

          // Address (if available)
          if (address) {
            ctx.font = 'bold 12px Arial';
            ctx.fillText('🏠 ALAMAT', 20, yPos);
            yPos += 20;
            ctx.font = '11px Arial';
            // Wrap text if too long
            const maxWidth = Math.min(430, canvas.width - 40);
            const words = address.split(' ');
            let line = '';
            for (const word of words) {
              const testLine = line + word + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(`   ${line}`, 20, yPos);
                yPos += 18;
                line = word + ' ';
              } else {
                line = testLine;
              }
            }
            ctx.fillText(`   ${line}`, 20, yPos);
            yPos += 20;
          }

          // User Information
          if (userInfo?.name || userInfo?.email) {
            ctx.font = 'bold 12px Arial';
            ctx.fillText('👤 INFORMASI PETUGAS', 20, yPos);
            yPos += 20;
            ctx.font = '11px Arial';
            const userText = userInfo.name ? `${userInfo.name}` : `${userInfo.email}`;
            ctx.fillText(`   ${userText}`, 20, yPos);
            yPos += 20;
          }

          // Device Information
          ctx.font = 'bold 12px Arial';
          ctx.fillText('📱 PERANGKAT', 20, yPos);
          yPos += 20;
          ctx.font = '11px Arial';
          ctx.fillText(`   ${deviceInfo.model} (${deviceInfo.os})`, 20, yPos);
          yPos += 20;

          // Add separator line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(20, yPos - 10);
          ctx.lineTo(Math.min(430, canvas.width - 30), yPos - 10);
          ctx.stroke();

          // Add system info
          ctx.font = '10px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillText('Sistem Dokumentasi Progress - Diana', 20, yPos);

          // Convert canvas to blob
          const geotaggedBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
          });

          if (geotaggedBlob) {
            const geotaggedFile = new File([geotaggedBlob], `geostamped_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            console.log('✅ Comprehensive geotagged image created successfully');
            console.log('📋 Geostamp data:', {
              timestamp: localDateTime,
              coordinates: `${lat.toFixed(8)}, ${lon.toFixed(8)}`,
              accuracy: accuracy ? `±${Math.round(accuracy)}m` : 'N/A',
              user: userInfo,
              device: deviceInfo,
              timezone: timezone
            });

            return geotaggedFile;
          }
        }
      } catch (canvasError) {
        console.warn('⚠️ Could not create comprehensive geotagged canvas:', canvasError);
      }

      // If canvas approach fails, try to use the original file
      // Modern mobile browsers should automatically geotag when using capture="environment"
      console.log('📱 Using original file - mobile browser should handle geotagging automatically');
    }

    return file;
  } catch (error) {
    console.warn('⚠️ Geotagging failed:', error);
    return file;
  }
}

// Helper function to get device information
function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  let os = 'Unknown';
  let model = 'Unknown Device';

  // Detect OS
  if (/Windows NT/i.test(userAgent)) {
    os = 'Windows';
    if (/Windows NT 10/i.test(userAgent)) os = 'Windows 10/11';
  } else if (/Android/i.test(userAgent)) {
    os = 'Android';
    const match = userAgent.match(/Android (\d+\.\d+)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = 'iOS';
    const match = userAgent.match(/OS (\d+_\d+)/);
    if (match) {
      const version = match[1].replace('_', '.');
      os = `iOS ${version}`;
    }
  } else if (/Mac OS X/i.test(userAgent)) {
    os = 'macOS';
    const match = userAgent.match(/Mac OS X (\d+_\d+)/);
    if (match) {
      const version = match[1].replace('_', '.');
      os = `macOS ${version}`;
    }
  } else if (/Linux/i.test(userAgent)) {
    os = 'Linux';
  }

  // Try to get device model (limited support)
  if (/iPhone/i.test(userAgent)) {
    const match = userAgent.match(/iPhone(\d+),?(\d+)?/);
    model = match ? `iPhone ${match[1]}${match[2] ? ` (${match[2]})` : ''}` : 'iPhone';
  } else if (/iPad/i.test(userAgent)) {
    model = 'iPad';
  } else if (/Android/i.test(userAgent)) {
    // Try to extract Android device model
    const match = userAgent.match(/;\s([^;]+)\sBuild/);
    model = match ? match[1].trim() : 'Android Device';
  }

  return { os, model };
}

// Helper function to create image element from file
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

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
  const [dateISO, setDateISO] = useState<string>("");
  const [timeStr, setTimeStr] = useState<string>("");
  const [gpsStatus, setGpsStatus] = useState<"init" | "tracking" | "denied" | "unsupported" | "error">("init");
  const [gps, setGps] = useState<{ lat?: number; lon?: number; accuracy?: number; updated?: number }>({});
  const [address, setAddress] = useState<string>("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeErr, setGeocodeErr] = useState<string | null>(null);
  const [autoTimestamp, setAutoTimestamp] = useState<boolean>(true);
  
  // State untuk menyimpan data progress
  const [progressData, setProgressData] = useState<Array<{
    id: string;
    nama?: string;
    lokasi?: string;
    pekerjaan?: string;
    keterangan?: string;
    status?: string;
    tanggal?: string;
    jam?: string;
    createdAt?: Timestamp;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inputFileWajibRef = useRef<HTMLInputElement>(null);
  const inputFileOpsionalRef = useRef<HTMLInputElement>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Dynamic schema from admin (Firestore)
  const [schema, setSchema] = useState<FieldSpec[]>([]);
  const [dynPhotoFiles, setDynPhotoFiles] = useState<Array<File | null>>([]);
  const [dynPhotoNames, setDynPhotoNames] = useState<string[]>([]);
  const [dynPhotoPreviews, setDynPhotoPreviews] = useState<Array<string | null>>([]);
  const dynInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [uploadPerc, setUploadPerc] = useState<number[]>([]);
  const [uploadErr, setUploadErr] = useState<(string | null)[]>([]);
  const [photoSource, setPhotoSource] = useState<Record<number, 'camera' | 'gallery'>>({});

  // Load persisted data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAutoTimestamp = localStorage.getItem('autoTimestamp');
      if (storedAutoTimestamp !== null) {
        const parsedAutoTimestamp = JSON.parse(storedAutoTimestamp);
        setAutoTimestamp(parsedAutoTimestamp);

        const isManual = !parsedAutoTimestamp;
        if (isManual) {
          const storedDateStr = localStorage.getItem('manualDateStr');
          const storedDateISO = localStorage.getItem('manualDateISO');
          const storedTimeStr = localStorage.getItem('manualTimeStr');

          if (storedDateStr) setDateStr(storedDateStr);
          if (storedDateISO) setDateISO(storedDateISO);
          if (storedTimeStr) setTimeStr(storedTimeStr);
        }
      }
    }
  }, []);

  // Persist autoTimestamp to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoTimestamp', JSON.stringify(autoTimestamp));
    }
  }, [autoTimestamp]);

  // Persist manual date and time to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !autoTimestamp) {
      localStorage.setItem('manualDateStr', dateStr);
      localStorage.setItem('manualDateISO', dateISO);
      localStorage.setItem('manualTimeStr', timeStr);
    }
  }, [dateStr, dateISO, timeStr, autoTimestamp]);

  // Initialize clock from device time and keep ticking
  useEffect(() => {
    if (!autoTimestamp) return;
    const setFrom = (d: Date) => {
      setDateISO(d.toISOString().slice(0, 10));
      setDateStr(d.toLocaleDateString("id-ID"));
      setTimeStr(
        d.toLocaleTimeString("id-ID", { hour12: false })
      );
    };
    setFrom(new Date());
    const t = setInterval(() => setFrom(new Date()), 1000);
    return () => clearInterval(t);
  }, [autoTimestamp]);

  // Load schema per stage
  useEffect(() => {
    (async () => {
      try {
        const fb = getFirebaseClient();
        if (!fb) {
          setSchema([
            { id: 1, label: "Nama", type: "text" },
            { id: 2, label: "Lokasi Proyek", type: "text" },
          ]);
          return;
        }
        const ref = doc(fb.db, "config", "stages_config");
        const snap = await getDoc(ref);
        const list = snap.exists() ? (snap.data()?.list as any[] | undefined) : undefined;
        const item = Array.isArray(list) ? (list[stage - 1] ?? list[0]) : undefined;
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
    })();
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
        // Only update time if in auto mode
        if (autoTimestamp) {
          const gpsTime = new Date(pos.timestamp || Date.now());
          setDateISO(gpsTime.toISOString().slice(0, 10));
          setDateStr(gpsTime.toLocaleDateString("id-ID"));
          setTimeStr(gpsTime.toLocaleTimeString("id-ID", { hour12: false }));
        }
      },
      (err) => {
        setGpsStatus(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [autoTimestamp]);

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
        <div className="text-sm sm:text-base font-semibold">Upload Foto Progress</div>
      </div>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmitting) return;

          // Validate that at least one photo is selected
          const hasPhoto = dynPhotoFiles.some(file => file !== null);
          if (!hasPhoto) {
            alert("Silakan pilih minimal satu foto untuk diupload");
            return;
          }

          setIsSubmitting(true);
          // Kumpulkan data dan gunakan file hasil konversi WEBP
          const formEl = e.currentTarget as HTMLFormElement;
          const fd = new FormData(formEl);
          // Siapkan upload ke Firebase (jika tersedia)
          const fb = getFirebaseClient();
          let storage: FirebaseStorage | null = null;
          if (fb) {
            try {
              storage = await getFirebaseStorage();
            } catch (storageErr) {
              console.error("Gagal menginisialisasi Firebase Storage:", storageErr);
            }
          }
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
              if (file && fb && storage) {
                try {
                  const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
                  // Use unique object name to avoid 412 (precondition) when same filename is uploaded twice
                  const uniq = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
                    ? (crypto as any).randomUUID()
                    : Math.random().toString(36).slice(2);
                  const path = `Progress_Diana/${recId}/${i + 1}_${uniq}_${file.name}`;
                  const r = ref(storage, path);
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
          // Simpan ke Firestore saja (no localStorage)
          try {
            // Kaitkan dengan akun petugas yang sedang login (Auth)
            let uid: string | null = null;
            let email: string | null = null;
            try {
              const { getAuth } = await import("firebase/auth");
              const auth = getAuth();
              uid = auth.currentUser?.uid ?? null;
              email = auth.currentUser?.email ?? null;
            } catch {}

            const data = {
              id: recId,
              stage,
              answers,
              uid,
              email,
              tanggal: String(fd.get("tanggal") || dateStr),
              jam: String(fd.get("jam") || timeStr),
              latitude: gps.lat ?? null,
              longitude: gps.lon ?? null,
              accuracy: gps.accuracy ?? null,
              alamat: address || null,
              createdAt: Date.now(),
            };
            
            // Simpan laporan ke Firestore
            if (fb) {
              try {
                const { collection, doc, setDoc, serverTimestamp } = await import("firebase/firestore");
                const col = collection(fb.db, "Progress_Diana");
                await setDoc(doc(col, recId), {
                  ...data,
                  // Gunakan timestamp server agar urutan konsisten di query
                  createdAt: serverTimestamp(),
                  uploadedAt: serverTimestamp(),
                  ts: serverTimestamp(),
                });

                // Tambah ke collection notifikasi
                const firstTwoTexts = answers.filter((a: any) => a.type === "text").map((a: any) => a.value).filter(Boolean).slice(0, 2);
                const notif = {
                  id: recId,
                  stage: data.stage,
                  title: `Laporan Tahap ${data.stage}`,
                  message: firstTwoTexts.join(" • ") || "Laporan masuk",
                  tanggal: data.tanggal,
                  jam: data.jam,
                  createdAt: data.createdAt,
                  read: false,
                };
                const notifCol = collection(fb.db, "Progress_Diana_Notifikasi");
                await setDoc(doc(notifCol, recId), {
                  ...notif,
                  ts: serverTimestamp(),
                });

                // Trigger real-time update untuk admin
                console.log("✅ Data berhasil disimpan ke Firestore:", recId);
                console.log("📋 Data structure:", data);
              } catch (firestoreError: any) {
                console.error("❌ Firestore Error:", firestoreError);
                console.error("❌ Error Code:", firestoreError.code);
                console.error("❌ Error Message:", firestoreError.message);
                alert(`❌ Gagal menyimpan ke Firestore: ${firestoreError.message}`);
                throw firestoreError;
              }
            } else {
              console.error("❌ Firebase client tidak tersedia");
              throw new Error("Firebase tidak tersedia");
            }
          } catch (err) {
            console.error("Error saving to Firestore:", err);
            throw err;
          }

          setTimeout(() => {
            setIsSubmitting(false);
            console.log("✅ Form submitted successfully!");
            console.log("📊 Data yang dikirim:", {
              recId,
              stage,
              answers: answers.length,
              hasPhoto: answers.some(a => a.type === "photo" && a.value),
              location: `${gps.lat}, ${gps.lon}`,
              address: address
            });
            console.log("🔥 Firebase config check:", {
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing",
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing",
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "✅ Set" : "❌ Missing"
            });

            // Show success alert and redirect to progress report
            alert("✅ Data laporan berhasil dikirim ke admin!\n\nAnda akan diarahkan kembali ke halaman laporan progress.");

            // Redirect back to progress report page
            window.location.href = "/dashboard/laporan-progres";
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
                {/* Photo source selection buttons only */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSource(prev => ({ ...prev, [i]: 'camera' }));
                      // Small delay to ensure state is updated before clicking
                      setTimeout(() => {
                        const cameraInput = document.getElementById(`camera_${i}`) as HTMLInputElement;
                        cameraInput?.click();
                      }, 100);
                    }}
                    className={`flex-1 text-xs px-3 py-2 rounded-xl border transition-colors ${
                      photoSource[i] === 'camera' || !photoSource[i]
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    📷 Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSource(prev => ({ ...prev, [i]: 'gallery' }));
                      // Small delay to ensure state is updated before clicking
                      setTimeout(() => {
                        const galleryInput = document.getElementById(`gallery_${i}`) as HTMLInputElement;
                        galleryInput?.click();
                      }, 100);
                    }}
                    className={`flex-1 text-xs px-3 py-2 rounded-xl border transition-colors ${
                      photoSource[i] === 'gallery'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    🖼️ Galeri
                  </button>
                </div>

                {/* Hidden camera input */}
                <input
                  id={`camera_${i}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={async (e) => {
                    const f0 = e.target.files?.[0];
                    if (!f0) return;

                    console.log('📸 Camera photo taken, adding geotag...');

                    setDynPhotoNames((arr) => {
                      const next = [...arr];
                      next[i] = "Menambahkan geotag...";
                      return next;
                    });

                    // Add geotag to the image if GPS is available
                    let geotaggedFile = f0;
                    if (gps.lat && gps.lon) {
                      try {
                        // Get current user information for geotagging
                        let userInfo: { name?: string; email?: string; uid?: string } | undefined;
                        try {
                          const { getAuth } = await import("firebase/auth");
                          const auth = getAuth();
                          if (auth.currentUser) {
                            userInfo = {
                              name: auth.currentUser.displayName ?? undefined,
                              email: auth.currentUser.email ?? undefined,
                              uid: auth.currentUser.uid
                            };
                          }
                        } catch (authError) {
                          console.warn('⚠️ Could not get user info for geotagging:', authError);
                        }

                        geotaggedFile = await addGeotagToImage(f0, gps.lat, gps.lon, gps.accuracy, userInfo, address);
                        console.log('✅ Comprehensive geotag added successfully');
                      } catch (geotagError) {
                        console.warn('⚠️ Geotagging failed, using original file:', geotagError);
                        geotaggedFile = f0;
                      }
                    } else {
                      console.warn('⚠️ No GPS data available for geotagging');
                    }

                    const webp = await fileToWebp(geotaggedFile, 0.85);
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
                />

                {/* Hidden gallery input */}
                <input
                  id={`gallery_${i}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f0 = e.target.files?.[0];
                    if (!f0) return;
                    setDynPhotoNames((arr) => {
                      const next = [...arr];
                      next[i] = "Menambahkan geotag...";
                      return next;
                    });

                    // Add geotag to the image if GPS is available
                    let geotaggedFile = f0;
                    if (gps.lat && gps.lon) {
                      try {
                        // Get current user information for geotagging
                        let userInfo: { name?: string; email?: string; uid?: string } | undefined;
                        try {
                          const { getAuth } = await import("firebase/auth");
                          const auth = getAuth();
                          if (auth.currentUser) {
                            userInfo = {
                              name: auth.currentUser.displayName ?? undefined,
                              email: auth.currentUser.email ?? undefined,
                              uid: auth.currentUser.uid
                            };
                          }
                        } catch (authError) {
                          console.warn('⚠️ Could not get user info for geotagging:', authError);
                        }

                        geotaggedFile = await addGeotagToImage(f0, gps.lat, gps.lon, gps.accuracy, userInfo, address);
                        console.log('✅ Comprehensive geotag added successfully');
                      } catch (geotagError) {
                        console.warn('⚠️ Geotagging failed, using original file:', geotagError);
                        geotaggedFile = f0;
                      }
                    } else {
                      console.warn('⚠️ No GPS data available for geotagging');
                    }

                    const webp = await fileToWebp(geotaggedFile, 0.85);
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
                />

                {/* Preview and controls - shown only when photo is selected */}
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
                        onClick={() => {
                          const source = photoSource[i] || 'camera';
                          const inputId = `${source}_${i}`;
                          const input = document.getElementById(inputId) as HTMLInputElement;
                          input?.click();
                        }}
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
              setFileWajibName("Menambahkan geotag...");

              // Add geotag to the image if GPS is available
              let geotaggedFile = f;
              if (gps.lat && gps.lon) {
                try {
                  // Get current user information for geotagging
                  let userInfo: { name?: string; email?: string; uid?: string } | undefined;
                  try {
                    const { getAuth } = await import("firebase/auth");
                    const auth = getAuth();
                    if (auth.currentUser) {
                      userInfo = {
                        name: auth.currentUser.displayName ?? undefined,
                        email: auth.currentUser.email ?? undefined,
                        uid: auth.currentUser.uid
                      };
                    }
                  } catch (authError) {
                    console.warn('⚠️ Could not get user info for geotagging:', authError);
                  }

                  geotaggedFile = await addGeotagToImage(f, gps.lat, gps.lon, gps.accuracy, userInfo, address);
                  console.log('✅ Comprehensive geotag added successfully');
                } catch (geotagError) {
                  console.warn('⚠️ Geotagging failed, using original file:', geotagError);
                  geotaggedFile = f;
                }
              } else {
                console.warn('⚠️ No GPS data available for geotagging');
              }

              const webp = await fileToWebp(geotaggedFile, 0.85);
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
              setFileOpsionalName("Menambahkan geotag...");

              // Add geotag to the image if GPS is available
              let geotaggedFile = f;
              if (gps.lat && gps.lon) {
                try {
                  // Get current user information for geotagging
                  let userInfo: { name?: string; email?: string; uid?: string } | undefined;
                  try {
                    const { getAuth } = await import("firebase/auth");
                    const auth = getAuth();
                    if (auth.currentUser) {
                      userInfo = {
                        name: auth.currentUser.displayName ?? undefined,
                        email: auth.currentUser.email ?? undefined,
                        uid: auth.currentUser.uid
                      };
                    }
                  } catch (authError) {
                    console.warn('⚠️ Could not get user info for geotagging:', authError);
                  }

                  geotaggedFile = await addGeotagToImage(f, gps.lat, gps.lon, gps.accuracy, userInfo, address);
                  console.log('✅ Comprehensive geotag added successfully');
                } catch (geotagError) {
                  console.warn('⚠️ Geotagging failed, using original file:', geotagError);
                  geotaggedFile = f;
                }
              } else {
                console.warn('⚠️ No GPS data available for geotagging');
              }

              const webp = await fileToWebp(geotaggedFile, 0.85);
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
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-medium text-neutral-700">Tanggal</label>
              <button
                type="button"
                onClick={() =>
                  setAutoTimestamp((prev) => {
                    const next = !prev;
                    if (next) {
                      const now = new Date();
                      setDateISO(now.toISOString().slice(0, 10));
                      setDateStr(now.toLocaleDateString("id-ID"));
                    }
                    return next;
                  })
                }
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline"
                suppressHydrationWarning={true}
              >
                {autoTimestamp ? "Ubah manual" : "Gunakan otomatis"}
              </button>
            </div>
            {autoTimestamp ? (
              <input
                type="text"
                value={dateStr}
                readOnly
                className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm shadow-inner text-neutral-700"
                placeholder="cth: 18/10/2025"
              />
            ) : (
              <input
                type="date"
                value={dateISO}
                onChange={(e) => {
                  const iso = e.target.value;
                  setDateISO(iso);
                  if (iso) {
                    const local = new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID");
                    setDateStr(local);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('manualDateISO', iso);
                      localStorage.setItem('manualDateStr', local);
                    }
                  } else {
                    setDateStr("");
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('manualDateISO', iso);
                      localStorage.setItem('manualDateStr', "");
                    }
                  }
                }}
                className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner text-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            )}
            <input type="hidden" name="tanggal" value={dateStr} />
            <p className="text-[11px] text-neutral-500">
              {autoTimestamp
                ? "Data tanggal mengikuti waktu realtime perangkat."
                : "Anda mengatur tanggal secara manual. Pastikan format benar."}
            </p>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-neutral-700">Jam</label>
            <input
              type="text"
              value={timeStr}
              onChange={(e) => {
                const value = e.target.value;
                setTimeStr(value);
                if (typeof window !== 'undefined' && !autoTimestamp) {
                  localStorage.setItem('manualTimeStr', value);
                }
              }}
              readOnly={autoTimestamp}
              className={`w-full rounded-2xl border-0 ring-1 ring-neutral-300 px-4 py-2.5 text-sm shadow-inner text-neutral-700 transition-colors ${
                autoTimestamp ? "bg-neutral-50" : "bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              }`}
              placeholder="cth: 14.35.00"
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
