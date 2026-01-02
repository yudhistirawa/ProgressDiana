import { getFirebaseClient, getFirebaseStorage } from "../firebaseClient";
import type { DocumentData } from "firebase/firestore";

export type ProjectKey = "diana" | "bungtomo";
export type PlanningStatus = "active" | "done" | "archived";

export type PlanningItem = {
  id: string;
  projectKey: ProjectKey;
  title: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  workerCount?: number;
  durationDays?: number;
  status: PlanningStatus;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string | null;
};

export type PlanningDay = {
  id: string; // date (YYYY-MM-DD)
  date: string; // YYYY-MM-DD
  targetPercent: number; // 0..100
  realPercent: number | null; // 0..100
  note?: string;
  photoUrls: string[];
  updatedAt?: any;
  updatedBy?: string | null;
};

function assertFirebase() {
  const fb = getFirebaseClient();
  if (!fb) throw new Error("Firebase belum terkonfigurasi");
  return fb;
}

export function listProjectKeys(): { key: ProjectKey; label: string }[] {
  return [
    { key: "diana", label: "Diana" },
    { key: "bungtomo", label: "Bung Tomo" },
  ];
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function eachDayInclusive(startISO: string, endISO: string): string[] {
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const days: string[] = [];
  let cur = start;
  while (cur.getTime() <= end.getTime()) {
    days.push(toISODate(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    if (days.length > 370) break; // safety cap
  }
  return days;
}

export function diffDaysInclusive(startISO: string, endISO: string): number {
  const days = eachDayInclusive(startISO, endISO);
  return days.length;
}

export function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function fetchPlannings(projectKey: ProjectKey): Promise<PlanningItem[]> {
  const fb = assertFirebase();
  const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore");
  const base = query(collection(fb.db, "plannings"), where("projectKey", "==", projectKey));
  try {
    const qy = query(base, orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PlanningItem[];
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (!msg.includes("requires an index") && !msg.includes("FAILED_PRECONDITION")) throw e;
    const snap = await getDocs(base);
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PlanningItem[];
    return items.sort((a, b) => {
      const ta = (a as any)?.createdAt?.toMillis?.() ?? (a as any)?.createdAt ?? 0;
      const tb = (b as any)?.createdAt?.toMillis?.() ?? (b as any)?.createdAt ?? 0;
      return tb - ta;
    });
  }
}

export async function fetchPlanning(planningId: string): Promise<PlanningItem | null> {
  const fb = assertFirebase();
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(fb.db, "plannings", planningId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as PlanningItem;
}

export async function fetchPlanningDays(planningId: string): Promise<PlanningDay[]> {
  const fb = assertFirebase();
  const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
  try {
    const qy = query(collection(fb.db, "plannings", planningId, "days"), orderBy("date", "asc"));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => normalizePlanningDay(d.id, d.data() as any));
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (!msg.includes("requires an index") && !msg.includes("FAILED_PRECONDITION")) throw e;
    const snap = await getDocs(collection(fb.db, "plannings", planningId, "days"));
    const items = snap.docs.map((d) => normalizePlanningDay(d.id, d.data() as any));
    return items.sort((a, b) => a.date.localeCompare(b.date));
  }
}

function normalizePlanningDay(id: string, raw: any): PlanningDay {
  const photoUrls =
    Array.isArray(raw?.photoUrls) && raw.photoUrls.length
      ? raw.photoUrls.filter((u: any) => typeof u === "string" && u.trim())
      : typeof raw?.photoUrl === "string" && raw.photoUrl.trim()
      ? [raw.photoUrl.trim()]
      : [];
  return {
    id,
    date: String(raw?.date || id),
    targetPercent: typeof raw?.targetPercent === "number" ? raw.targetPercent : 0,
    realPercent: typeof raw?.realPercent === "number" ? raw.realPercent : null,
    note: typeof raw?.note === "string" ? raw.note : "",
    photoUrls,
    updatedAt: raw?.updatedAt,
    updatedBy: raw?.updatedBy ?? null,
  };
}

export async function createPlanning(args: {
  projectKey: ProjectKey;
  title: string;
  startDate: string;
  dueDate: string;
  workerCount: number;
}): Promise<string> {
  const fb = assertFirebase();
  const { collection, addDoc, serverTimestamp, writeBatch, doc } = await import("firebase/firestore");

  const days = eachDayInclusive(args.startDate, args.dueDate);
  if (days.length === 0) throw new Error("Rentang tanggal tidak valid");
  if (days.length > 366) throw new Error("Rentang tanggal terlalu panjang (maks 366 hari)");
  const workerCount = Math.max(1, Math.floor(Number(args.workerCount) || 0));
  if (!Number.isFinite(workerCount) || workerCount < 1) throw new Error("Jumlah pekerja wajib diisi (minimal 1)");

  const planningRef = await addDoc(collection(fb.db, "plannings"), {
    projectKey: args.projectKey,
    title: args.title.trim(),
    startDate: args.startDate,
    dueDate: args.dueDate,
    workerCount,
    durationDays: days.length,
    status: "active" as PlanningStatus,
    createdBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const batch = writeBatch(fb.db);
  for (const date of days) {
    batch.set(doc(fb.db, "plannings", planningRef.id, "days", date), {
      date,
      targetPercent: date === args.dueDate ? 100 : 0,
      realPercent: null,
      photoUrls: [],
      note: "",
      updatedAt: serverTimestamp(),
      updatedBy: null,
    });
  }

  await batch.commit();
  return planningRef.id;
}

export async function updatePlanningStatus(planningId: string, status: PlanningStatus) {
  const fb = assertFirebase();
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  await updateDoc(doc(fb.db, "plannings", planningId), { status, updatedAt: serverTimestamp() });
}

export async function updatePlanningInfo(planningId: string, data: { title?: string; workerCount?: number }) {
  const fb = assertFirebase();
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");

  const payload: Record<string, any> = { updatedAt: serverTimestamp() };
  if (typeof data.title === "string") {
    payload.title = data.title.trim();
  }
  if (data.workerCount !== undefined) {
    const wc = Math.max(1, Math.floor(Number(data.workerCount) || 0));
    if (!Number.isFinite(wc) || wc < 1) throw new Error("Jumlah pekerja wajib diisi (minimal 1)");
    payload.workerCount = wc;
  }

  await updateDoc(doc(fb.db, "plannings", planningId), payload);
}

export async function deletePlanning(planningId: string) {
  const fb = assertFirebase();
  const { collection, doc, getDocs, writeBatch, deleteDoc } = await import("firebase/firestore");

  const daysSnap = await getDocs(collection(fb.db, "plannings", planningId, "days"));
  const dayDocs = daysSnap.docs;

  // Hapus sub-dokumen hari dalam batch agar aman dari batas 500 operasi
  const chunkSize = 400;
  for (let i = 0; i < dayDocs.length; i += chunkSize) {
    const batch = writeBatch(fb.db);
    for (const d of dayDocs.slice(i, i + chunkSize)) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }

  await deleteDoc(doc(fb.db, "plannings", planningId));
}

export async function setDayTarget(args: {
  planningId: string;
  date: string;
  targetPercent: number;
  prevDate?: string;
  nextDate?: string;
  prevTarget?: number;
  nextTarget?: number;
  dueDate?: string;
}) {
  const fb = assertFirebase();
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  const target = clampPercent(args.targetPercent);

  if (args.dueDate && args.date === args.dueDate) {
    if (target !== 100) throw new Error("Target pada tanggal selesai harus 100%");
  }
  if (args.prevTarget != null && target < args.prevTarget) {
    throw new Error("Target tidak boleh lebih kecil dari hari sebelumnya");
  }
  if (args.nextTarget != null && target > args.nextTarget) {
    throw new Error("Target tidak boleh lebih besar dari hari setelahnya");
  }

  await updateDoc(doc(fb.db, "plannings", args.planningId, "days", args.date), {
    targetPercent: target,
    updatedAt: serverTimestamp(),
  });
}

async function uploadDayPhoto(planningId: string, date: string, file: File): Promise<string> {
  const storage = await getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage belum terkonfigurasi");
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

  const ext = (() => {
    const n = file.name.toLowerCase();
    const m = n.match(/\.(jpg|jpeg|png|webp)$/);
    return m?.[1] ?? "jpg";
  })();

  const safeRand = Math.random().toString(16).slice(2);
  const path = `planning/${planningId}/${date}/${Date.now()}-${safeRand}.${ext}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(r);
}

export async function setDayReal(args: {
  planningId: string;
  date: string;
  realPercent: number;
  note?: string;
  existingPhotoUrls?: string[] | null;
  photoFiles?: File[] | null;
}): Promise<{ photoUrls: string[] }> {
  const fb = assertFirebase();
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");

  const real = clampPercent(args.realPercent);
  const nextUrls: string[] = Array.isArray(args.existingPhotoUrls)
    ? args.existingPhotoUrls.filter((u) => typeof u === "string" && u.trim())
    : [];
  const files = Array.isArray(args.photoFiles) ? args.photoFiles.filter(Boolean) : [];
  for (const f of files) {
    nextUrls.push(await uploadDayPhoto(args.planningId, args.date, f));
  }
  if (nextUrls.length === 0) {
    throw new Error("Foto bukti wajib 1");
  }

  await updateDoc(doc(fb.db, "plannings", args.planningId, "days", args.date), {
    realPercent: real,
    note: args.note ?? "",
    photoUrls: nextUrls,
    updatedAt: serverTimestamp(),
    updatedBy: null,
  });
  return { photoUrls: nextUrls };
}

export async function setTargetsBatch(args: {
  planningId: string;
  days: { date: string; targetPercent: number }[];
  dueDate?: string;
}) {
  const fb = assertFirebase();
  const { writeBatch, doc, serverTimestamp } = await import("firebase/firestore");
  const sorted = [...args.days].sort((a, b) => a.date.localeCompare(b.date));
  let prev = -1;
  for (const d of sorted) {
    const t = clampPercent(d.targetPercent);
    if (t < prev) throw new Error("Target harus logis (tidak boleh turun)");
    prev = t;
    if (args.dueDate && d.date === args.dueDate && t !== 100) {
      throw new Error("Target pada tanggal selesai harus 100%");
    }
  }
  const batch = writeBatch(fb.db);
  for (const d of sorted) {
    batch.update(doc(fb.db, "plannings", args.planningId, "days", d.date), {
      targetPercent: clampPercent(d.targetPercent),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export function computeSummary(days: PlanningDay[]) {
  const withReal = days.filter((d) => typeof d.realPercent === "number");
  const last = withReal[withReal.length - 1] ?? null;
  return {
    lastRealPercent: last?.realPercent ?? null,
    lastRealDate: last?.date ?? null,
  };
}
