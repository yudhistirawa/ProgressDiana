import { getFirebaseClient } from "../firebaseClient";
import type {
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";

export interface ProgressFilters {
  search?: string;
  dateStart?: string;
  dateEnd?: string;
  dataType?: string;
}

export interface PaginationResult<T> {
  items: T[];
  hasNext: boolean;
  hasPrev: boolean;
  totalCount?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface ProgressItem {
  id: string;
  nama?: string;
  lokasi?: string;
  pekerjaan?: string;
  jenis_pekerjaan?: string;
  tanggal: string;
  jam?: string;
  durasi_jam?: number;
  progress_percentage?: number;
  catatan_admin?: string;
  photos?: { [key: string]: string };
  formTitle?: string;
  formSource?: string;
  dataType?: string;
  createdAt: number;
  answers?: { label: string; type: string; value: any }[];
  stage?: number;
}

/**
 * Fetch progress data with cursor pagination
 */
export async function fetchProgressPage({
  pageSize = 5,
  cursor,
  filters = {},
  dataType = "historical"
}: {
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  filters?: ProgressFilters;
  dataType?: string;
}): Promise<PaginationResult<ProgressItem>> {
  const fb = getFirebaseClient();
  if (!fb) {
    throw new Error("Firebase client not available");
  }

  try {
    const {
      collection,
      query,
      where,
      orderBy,
      limit,
      startAfter,
      getDocs,
      getCountFromServer
    } = await import("firebase/firestore");

    const col = collection(fb.db, "Progress_Diana");
    let q = query(col, where("dataType", "==", dataType));

    // Apply search filter if provided
    if (filters.search && filters.search.trim()) {
      // Note: Firestore doesn't support full-text search directly
      // This would need to be implemented with a search index or Algolia
      // For now, we'll filter in memory after fetching
    }

    // Apply date filters if provided
    if (filters.dateStart || filters.dateEnd) {
      // Note: Firestore date filtering would need composite queries
      // For now, we'll filter in memory after fetching
    }

    // Add stable ordering and limit (prefer 'ts' server timestamp; fallback to createdAt)
    let timeField: 'ts' | 'createdAt' = 'ts';
    try {
      const probe = await getDocs(query(col, limit(1)));
      const d = probe.docs[0]?.data() as any;
      if (!d || d.ts == null) timeField = 'createdAt';
    } catch {
      timeField = 'createdAt';
    }
    q = query(q, orderBy(timeField as any, "desc"), orderBy("__name__", "desc" as any), limit(pageSize + 1));

    // Apply cursor if provided
    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    // Check if there's a next page
    const hasNext = docs.length > pageSize;

    // Remove the extra document if it exists (for next page detection)
    const items = hasNext ? docs.slice(0, -1) : docs;

    // Get total count (simplified - in production you'd want to cache this)
    const totalCount = await getTotalCount(filters, dataType);

    return {
      items: items.map((doc) => ({
        id: doc.id,
        ...(doc.data() as DocumentData),
      }) as ProgressItem),
      hasNext,
      hasPrev: !!cursor || false,
      totalCount,
      lastDoc: docs.length > 0 ? (docs[docs.length - 1] as QueryDocumentSnapshot<DocumentData>) : null,
    };
  } catch (error) {
    console.error("Error fetching progress page:", error);
    throw error;
  }
}

/**
 * Get total count of progress items with filters
 */
export async function getTotalCount(
  filters: ProgressFilters = {},
  dataType = "historical"
): Promise<number> {
  const fb = getFirebaseClient();
  if (!fb) {
    throw new Error("Firebase client not available");
  }

  try {
    const { collection, query, where, getCountFromServer } = await import("firebase/firestore");

    const col = collection(fb.db, "Progress_Diana");
    let q = query(col, where("dataType", "==", dataType));

    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting total count:", error);
    // Fallback to 0 if count fails
    return 0;
  }
}

/**
 * Stage-based cursor pagination with optional client-side search and server-side date range filtering.
 * Attempts to keep exactly `pageSize` matching items by fetching additional pages when search is active.
 */
export async function fetchStageProgressPage({
  tahap,
  pageSize = 5,
  cursor,
  search,
  dateRange,
}: {
  tahap: number;
  pageSize?: number;
  cursor?: QueryDocumentSnapshot<DocumentData> | null;
  search?: string;
  dateRange?: { start?: string; end?: string };
}): Promise<PaginationResult<ProgressItem>> {
  const fb = getFirebaseClient();
  if (!fb) {
    throw new Error("Firebase client not available");
  }

  const {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getDocs,
  } = await import("firebase/firestore");

  const col = collection(fb.db, "Progress_Diana");

  // Detect which field holds the stage: prefer 'stage', fallback to 'tahap'
  let fieldKey: 'stage' | 'tahap' = 'stage';
  // Detect which time field to order by: prefer 'ts' (server timestamp), then createdAt, uploadedAt, waktuUpload, timestamp
  let timeField: 'ts' | 'createdAt' | 'uploadedAt' | 'waktuUpload' | 'timestamp' = 'ts';
  if (!cursor) {
    try {
      const probeStage = await getDocs(query(col, where('stage', '==', tahap), limit(1)));
      if (probeStage.size === 0) {
        const probeTahap = await getDocs(query(col, where('tahap', '==', tahap), limit(1)));
        if (probeTahap.size > 0) fieldKey = 'tahap';
      }
    } catch {
      // Ignore; default remains 'stage'
    }

    try {
      const docProbeSnap = await getDocs(query(col, where(fieldKey, '==', tahap), limit(1)));
      const d = docProbeSnap.docs[0]?.data() as any;
      if (d) {
        if (d.ts != null) timeField = 'ts';
        else if (d.createdAt != null) timeField = 'createdAt';
        else if (d.uploadedAt != null) timeField = 'uploadedAt';
        else if (d.waktuUpload != null) timeField = 'waktuUpload';
        else if (d.timestamp != null) timeField = 'timestamp';
      }
    } catch {}
  }

  // Helper to run one page query from a cursor, primary path with constraints
  const runPrimary = async (from: QueryDocumentSnapshot<DocumentData> | null | undefined) => {
    const constraints = [where(fieldKey, "==", tahap)];
    if (dateRange?.start) constraints.push(where("tanggal", ">=", dateRange.start));
    if (dateRange?.end) constraints.push(where("tanggal", "<=", dateRange.end));
    // Stable ordering: chosen time field desc + docId desc
    let q1 = query(col, ...constraints, orderBy(timeField as any, "desc"), orderBy("__name__", "desc" as any), limit(pageSize + 1));
    if (from) q1 = query(q1, startAfter(from));
    return getDocs(q1);
  };

  // Fallback without where constraints (avoid composite index); filter in memory
  const runFallback = async (from: QueryDocumentSnapshot<DocumentData> | null | undefined) => {
    // Stable ordering in fallback path as well
    let q2 = query(col, orderBy(timeField as any, "desc"), orderBy("__name__", "desc" as any), limit(pageSize + 1));
    if (from) q2 = query(q2, startAfter(from));
    return getDocs(q2);
  };

  const searchTerm = (search || "").trim().toLowerCase();
  const matchesSearch = (item: ProgressItem) => {
    if (!searchTerm) return true;
    const fields = [item.nama, item.jenis_pekerjaan, item.pekerjaan, item.lokasi];
    return fields.some((v) => (v || "").toLowerCase().includes(searchTerm));
  };

  const collected: { item: ProgressItem; snap: QueryDocumentSnapshot<DocumentData> }[] = [];
  let lastSeen: QueryDocumentSnapshot<DocumentData> | null | undefined = cursor ?? null;
  let hasMoreDocs = true;
  let useFallback = false;

  // Probe once to decide whether we need fallback (e.g., missing composite index)
  if (!cursor) {
    try {
      await runPrimary(null);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("requires an index") || msg.includes("FAILED_PRECONDITION") || msg.includes("failed-precondition")) {
        useFallback = true;
      } else {
        throw e;
      }
    }
  }

  // Keep fetching until we have `pageSize` matches or run out of docs
  while (collected.length < pageSize && hasMoreDocs) {
    let snap;
    try {
      snap = await (useFallback ? runFallback(lastSeen) : runPrimary(lastSeen));
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("requires an index") || msg.includes("FAILED_PRECONDITION") || msg.includes("failed-precondition")) {
        useFallback = true;
        snap = await runFallback(lastSeen);
      } else {
        throw e;
      }
    }
    const docs = snap.docs as QueryDocumentSnapshot<DocumentData>[];
    if (docs.length === 0) {
      hasMoreDocs = false;
      break;
    }

    for (const d of docs) {
      const raw = d.data() as DocumentData;
      const item = ({ id: d.id, ...raw } as unknown) as ProgressItem;
      // Filter by stage when using fallback; otherwise stage already filtered
      const stageOk = useFallback ? ((item as any)[fieldKey] === tahap) : true;
      // Date range is already filtered in primary; apply again in fallback
      const dateOk = useFallback
        ? (!dateRange?.start || (item.tanggal ?? "") >= dateRange.start!) && (!dateRange?.end || (item.tanggal ?? "") <= dateRange.end!)
        : true;
      if (stageOk && dateOk && matchesSearch(item)) {
        collected.push({ item, snap: d });
        if (collected.length === pageSize) {
          lastSeen = d;
          break;
        }
      }
      lastSeen = d; // Always advance cursor even if not matching
    }

    // If we didn't fill the page, continue loop; otherwise break
    if (collected.length >= pageSize) break;

    // If the batch returned fewer than requested (pageSize+1), we may be at the end
    if (docs.length < pageSize + 1) {
      // Try another fetch only if we still didn't reach pageSize and we think there may be more
      // Otherwise break to avoid infinite loop
      if (docs.length === 0) {
        hasMoreDocs = false;
      }
    }
  }

  // Determine hasNext by probing one more matching item beyond the lastSeen
  let hasNext = false;
  if (hasMoreDocs) {
    const probe = await (useFallback ? runFallback(lastSeen ?? null) : runPrimary(lastSeen ?? null));
    const probeDocs = probe.docs as QueryDocumentSnapshot<DocumentData>[];
    for (const d of probeDocs) {
      const raw = d.data() as DocumentData;
      const item = ({ id: d.id, ...raw } as unknown) as ProgressItem;
      const stageOk = useFallback ? item.stage === tahap : true;
      const dateOk = useFallback
        ? (!dateRange?.start || (item.tanggal ?? "") >= dateRange.start!) && (!dateRange?.end || (item.tanggal ?? "") <= dateRange.end!)
        : true;
      if (stageOk && dateOk && matchesSearch(item)) {
        hasNext = true;
        break;
      }
    }
  }

  const items = collected.map((c) => c.item);

  return {
    items,
    hasNext,
    hasPrev: !!cursor,
    totalCount: undefined,
    lastDoc: (lastSeen as QueryDocumentSnapshot<DocumentData> | null) ?? null,
  };
}

/**
 * Count progress items for a given stage with optional search and date range.
 * Uses Firestore aggregation when possible; falls back to manual count when search is present.
 */
export async function countProgress({
  tahap,
  search,
  dateRange,
}: {
  tahap: number;
  search?: string;
  dateRange?: { start?: string; end?: string };
}): Promise<number> {
  const fb = getFirebaseClient();
  if (!fb) {
    throw new Error("Firebase client not available");
  }

  const {
    collection,
    query,
    where,
    orderBy,
    getCountFromServer,
    getDocs,
    limit,
    startAfter,
  } = await import("firebase/firestore");

  const col = collection(fb.db, "Progress_Diana");
  // Detect whether docs use 'stage' or 'tahap'
  let fieldKey: 'stage' | 'tahap' = 'stage';
  // Detect a reasonable time field for ordering during manual count
  let timeField: 'ts' | 'createdAt' | 'uploadedAt' | 'waktuUpload' | 'timestamp' = 'ts';
  try {
    const probeStage = await getDocs(query(col, where('stage', '==', tahap), limit(1)));
    if (probeStage.size === 0) {
      const probeTahap = await getDocs(query(col, where('tahap', '==', tahap), limit(1)));
      if (probeTahap.size > 0) fieldKey = 'tahap';
    }
    const probeDoc = await getDocs(query(col, where(fieldKey, '==', tahap), limit(1)));
    const d = probeDoc.docs[0]?.data() as any;
    if (d) {
      if (d.ts != null) timeField = 'ts';
      else if (d.createdAt != null) timeField = 'createdAt';
      else if (d.uploadedAt != null) timeField = 'uploadedAt';
      else if (d.waktuUpload != null) timeField = 'waktuUpload';
      else if (d.timestamp != null) timeField = 'timestamp';
    }
  } catch {}

  const constraints = [where(fieldKey, "==", tahap)];
  if (dateRange?.start) constraints.push(where("tanggal", ">=", dateRange.start));
  if (dateRange?.end) constraints.push(where("tanggal", "<=", dateRange.end));

  const baseQuery = query(col, ...constraints);

  const searchTerm = (search || "").trim();
  if (!searchTerm) {
    // Use aggregation count when no search filter
    try {
      const snap = await getCountFromServer(baseQuery);
      return snap.data().count;
    } catch {
      // Fall through to manual if aggregation fails
    }
  }

  // Fallback: manual count with pagination over the base query ordered by createdAt
  let count = 0;
  let last: QueryDocumentSnapshot<DocumentData> | null = null;
  const probeLimit = 200; // batch size for counting

  const matchesSearch = (item: ProgressItem) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const fields = [item.nama, item.jenis_pekerjaan, item.pekerjaan, item.lokasi];
    return fields.some((v) => (v || "").toLowerCase().includes(q));
  };

  let useFallback = false;
  // Probe once to decide if we need fallback (missing composite index)
  try {
    const probeQ = query(col, ...constraints, orderBy(timeField as any, "desc"), orderBy("__name__", "desc" as any), limit(1));
    await getDocs(probeQ);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("requires an index") || msg.includes("FAILED_PRECONDITION") || msg.includes("failed-precondition")) {
      useFallback = true;
    } else {
      throw e;
    }
  }

  while (true) {
    let q = useFallback
      ? query(col, orderBy(timeField as any, "desc"), orderBy("__name__", "desc" as any), limit(probeLimit))
      : query(col, ...constraints, orderBy(timeField as any, "desc"), orderBy("__name__", "desc" as any), limit(probeLimit));
    if (last) q = query(q, startAfter(last));
    const snap = await getDocs(q);
    const docs = snap.docs as QueryDocumentSnapshot<DocumentData>[];
    if (docs.length === 0) break;

    for (const d of docs) {
      const raw = d.data() as DocumentData;
      const item = ({ id: d.id, ...raw } as unknown) as ProgressItem;
      if (useFallback) {
        if ((item as any)[fieldKey] !== tahap) continue;
        if (dateRange?.start && (item.tanggal ?? "") < dateRange.start) continue;
        if (dateRange?.end && (item.tanggal ?? "") > dateRange.end) continue;
      }
      if (matchesSearch(item)) count += 1;
    }

    last = docs[docs.length - 1] ?? null;
    if (docs.length < probeLimit) break;
  }

  return count;
}

/**
 * Apply client-side filters to progress items
 */
export function applyClientFilters<T extends ProgressItem>(
  items: T[],
  filters: ProgressFilters
): T[] {
  let filtered = [...items];

  // Date range filter
  if (filters.dateStart || filters.dateEnd) {
    filtered = filtered.filter(item => {
      const itemDate = item.tanggal;
      if (filters.dateStart && itemDate < filters.dateStart) return false;
      if (filters.dateEnd && itemDate > filters.dateEnd) return false;
      return true;
    });
  }

  // Search filter (client-side)
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase().trim();
    filtered = filtered.filter(item =>
      (item.nama?.toLowerCase().includes(searchTerm)) ||
      (item.lokasi?.toLowerCase().includes(searchTerm)) ||
      (item.pekerjaan?.toLowerCase().includes(searchTerm)) ||
      (item.jenis_pekerjaan?.toLowerCase().includes(searchTerm))
    );
  }

  return filtered;
}
