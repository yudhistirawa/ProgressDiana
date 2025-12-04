"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";

type ProjectKey = "diana" | "bungtomo";
const CONFIG_KEYS: Record<ProjectKey, string> = {
  diana: "stages_config",
  bungtomo: "stages_config_bungtomo",
};

interface ProgressData {
  stage: number;
  totalItems: number;
  items: any[];
}

export default function ViewerLaporanProgressClient({ project = "diana" }: { project?: ProjectKey }) {
  const projectKey: ProjectKey = project === "bungtomo" ? "bungtomo" : "diana";
  const progressCollection = projectKey === "bungtomo" ? "Progress_BungTomo" : "Progress_Diana";
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [stageTitles, setStageTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProgressData();
  }, [filterMonth, filterYear, projectKey]);

  // Load stage titles from config per proyek
  useEffect(() => {
    const fb = getFirebaseClient();
    if (!fb) return;
    (async () => {
      try {
        const ref = doc(fb.db, "config", CONFIG_KEYS[projectKey]);
        const snap = await getDoc(ref);
        const list = snap.exists() ? (snap.data()?.list as any[] | undefined) : undefined;
        if (Array.isArray(list)) {
          const mapped: Record<string, string> = {};
          list.forEach((item, idx) => {
            mapped[String(idx + 1)] = item?.name || `Tahap ${idx + 1}`;
          });
          setStageTitles(mapped);
        } else {
          setStageTitles({});
        }
      } catch {
        setStageTitles({});
      }
    })();
  }, [projectKey]);

  async function loadProgressData() {
    setLoading(true);
    try {
      const fb = getFirebaseClient();
      if (!fb) throw new Error("Firebase not initialized");

      const col = collection(fb.db, progressCollection);
      const snapshot = await getDocs(query(col));

      const parseToEpoch = (v: any): number | null => {
        if (v == null) return null;
        if (typeof v === 'number') return v;
        if (v instanceof Date) return v.getTime();
        if (typeof v === 'object' && typeof v.toDate === 'function') {
          try { return v.toDate().getTime(); } catch { return null; }
        }
        if (typeof v === 'string') {
          const s = v.trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const t = Date.parse(s);
            if (!Number.isNaN(t)) return t;
          }
          const dmy = /^(\d{1,2})\/\-\/\-/.exec(s);
          if (dmy) {
            const dt = new Date(parseInt(dmy[3], 10), parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10));
            if (!Number.isNaN(dt.getTime())) return dt.getTime();
          }
          const t = Date.parse(s);
          if (!Number.isNaN(t)) return t;
        }
        return null;
      };

      const epochToKey = (epoch: number) => {
        const d = new Date(epoch);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const filteredDocs = snapshot.docs.filter(doc => {
        if (!filterYear) return true;
        const data = doc.data();
        const rawTanggal = data.tanggal;
        let epoch = parseToEpoch(rawTanggal ?? data.createdAt ?? data.ts ?? null);
        if (epoch == null && typeof data.createdAt === 'number') epoch = data.createdAt;
        
        if (epoch) {
          const tanggalKey = epochToKey(epoch);
          const [y, m] = tanggalKey.split('-');
          if (filterYear && filterMonth) {
            return y === filterYear && m === String(filterMonth).padStart(2, '0');
          }
          if (filterYear) {
            return y === filterYear;
          }
        }
        return false;
      });
      
      // Group data by stage
      const dataByStage: { [key: string]: any[] } = {};
      filteredDocs.forEach((doc) => {
        const data = doc.data();
        const stage = data.stage || "Tidak ada tahap";
        if (!dataByStage[stage]) {
          dataByStage[stage] = [];
        }
        dataByStage[stage].push({ id: doc.id, ...data });
      });

      // Convert to array format
      const progressStats: ProgressData[] = Object.entries(dataByStage)
        .map(([stage, items]) => ({
          stage: isNaN(parseInt(stage)) ? 0 : parseInt(stage),
          totalItems: items.length,
          items,
        }))
        .sort((a, b) => a.stage - b.stage);

      setProgressData(progressStats);
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalData = progressData.reduce((sum, data) => sum + data.totalItems, 0);

  const stagesToDisplay = useMemo(() => {
    const allStages = new Set(Object.keys(stageTitles).map(Number));
    progressData.forEach(d => allStages.add(d.stage));
    return Array.from(allStages).filter(s => s > 0).sort((a, b) => a - b);
  }, [progressData, stageTitles]);

  return (
    <div className="space-y-6">
      {/* Hero summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#fef2f2] via-white to-[#eef2ff] ring-1 ring-white shadow-lg shadow-rose-100/50">
        <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-rose-100/70 blur-2xl" />
        <div className="absolute right-6 bottom-6 h-24 w-24 rounded-full bg-indigo-100/60 blur-2xl" />
        <div className="relative px-6 py-6 sm:px-8 sm:py-7 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-1">Laporan Progres</p>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Progres Berdasarkan Tahapan</h2>
              <p className="text-sm text-neutral-600">Filter berdasarkan tahun & bulan. Pilih proyek di atas.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px] shadow-emerald-100" aria-hidden />
              Total Laporan: <span className="text-neutral-900">{loading ? "..." : totalData}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/80 rounded-2xl ring-1 ring-white/60 p-4 shadow-sm">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600">Tahun</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600">Bulan</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white"
              >
                <option value="">Semua Bulan</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadProgressData}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-rose-200/70 hover:from-rose-600 hover:to-red-700 transition-all disabled:bg-neutral-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M5 4a1 1 0 0 1 1-1h4v2H7v4H5V4Zm13 6V6h-3V4h4a1 1 0 0 1 1 1v5h-2Zm-2 7v-3h2v4a1 1 0 0 1-1 1h-4v-2h3ZM7 18v-4H5v4a1 1 0 0 0 1 1h4v-2H7Z" />
                </svg>
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-neutral-600">Memuat data...</p>
        </div>
      )}

      {/* Progress Stats */}
      {!loading && progressData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {stagesToDisplay.map(stageNumber => {
            const data = progressData.find(d => d.stage === stageNumber);
            const totalItems = data?.totalItems || 0;
            const title = stageTitles[stageNumber] || `Tahap ${stageNumber}`;
            return (
              <Link
                key={stageNumber}
                href={`/viewer/laporan-progress/${stageNumber}?project=${projectKey}`}
                className="group relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-neutral-200/60 shadow-lg shadow-rose-50/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-inner">
                    <span className="text-2xl font-bold">{stageNumber}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-neutral-900">{totalItems}</p>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">Laporan</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                  <p className="text-sm text-neutral-500 mt-1">
                    Klik untuk lihat detail tahap {stageNumber}.
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-500 group-hover:translate-x-1 transition-transform">
                  Detail
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="m13 5 7 7-7 7v-4H4v-6h9V5Z" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && progressData.length === 0 && (
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-8 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-neutral-400" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z" />
          </svg>
          <p className="mt-2 text-neutral-600">Tidak ada data progress untuk periode yang dipilih</p>
        </div>
      )}
    </div>
  );
}
