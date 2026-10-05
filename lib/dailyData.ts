import { and, collection, getCountFromServer, getDocs, or, query, Timestamp, where } from "firebase/firestore";
import { getFirebaseClient } from "./firebaseClient";

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dailyDates(month: string, year: string, now = new Date()): string[] {
  const start = month ? new Date(Number(year), Number(month) - 1, 1) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const end = month ? new Date(Number(year), Number(month), 1) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const dates: string[] = [];
  for (const day = new Date(start); day < end; day.setDate(day.getDate() + 1)) dates.push(dateKey(day));
  return dates.reverse();
}

function dailyQuery(collectionName: string, key: string) {
  const fb = getFirebaseClient();
  if (!fb) throw new Error("Firebase not initialized");
  const start = new Date(`${key}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const [year, month, day] = key.split("-");
  const legacyDates = [...new Set([day, String(Number(day))].flatMap(d =>
    [month, String(Number(month))].flatMap(m => [`${d}/${m}/${year}`, `${d}-${m}-${year}`])
  ))];
  const range = (lower: string | number | Timestamp, upper: string | number | Timestamp) =>
    and(where("tanggal", ">=", lower), where("tanggal", "<", upper));
  return query(collection(fb.db, collectionName), or(
    range(key, dateKey(end)),
    range(start.getTime(), end.getTime()),
    range(Timestamp.fromDate(start), Timestamp.fromDate(end)),
    ...legacyDates.map(date => range(date, `${date}\uf8ff`)),
  ));
}

// Aggregations return counts without downloading the report documents.
export async function loadDailyCounts(collectionName: string, dates: string[]) {
  const rows = [];
  // Bound concurrency for a manually selected month.
  for (let i = 0; i < dates.length; i += 7) {
    rows.push(...await Promise.all(dates.slice(i, i + 7).map(async tanggal => {
      const result = await getCountFromServer(dailyQuery(collectionName, tanggal));
      return { tanggal, jumlah: result.data().count, items: [] as any[] };
    })));
  }
  return rows.filter(row => row.jumlah > 0);
}

export async function loadDailyItems(collectionName: string, tanggal: string) {
  const result = await getDocs(dailyQuery(collectionName, tanggal));
  return result.docs.map(doc => ({ ...doc.data(), id: doc.id, normalizedTanggal: tanggal }));
}
