"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";

interface ProgressData {
  stage: number;
  totalItems: number;
  items: any[];
}

export default function ViewerLaporanProgressClient() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [stageTitles, setStageTitles] = useState<Record<string, string>>({
    '1': 'Pekerjaan Persiapan',
    '2': 'Struktur Atas',
    '3': 'Struktur Bawah',
    '4': 'Hammer Test',
    // Add more default titles if needed
  });

  useEffect(() => {
    loadProgressData();
  }, [filterMonth, filterYear]);

  async function loadProgressData() {
    setLoading(true);
    try {
      const fb = getFirebaseClient();
      if (!fb) throw new Error("Firebase not initialized");

      const col = collection(fb.db, "Progress_Diana");
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
      {/* Header & Filters */}
      <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Progres Berdasarkan Tahapan</h2>
          <p className="text-sm text-neutral-600">
            Total Laporan: <span className="font-semibold text-neutral-900">{loading ? '...' : totalData}</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
          <div>
            <label className="block text-sm font-medium mb-1">Tahun</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bulan</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <option value="">Semua Bulan</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={loadProgressData} disabled={loading} className="w-full rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-neutral-400">
              Refresh Data
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stagesToDisplay.map(stageNumber => {
            const data = progressData.find(d => d.stage === stageNumber);
            const totalItems = data?.totalItems || 0;
            const title = stageTitles[stageNumber] || `Tahap ${stageNumber}`;
            return (
              <div key={stageNumber} className="group block rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-200/50 hover:ring-red-400 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <span className="text-2xl font-bold">{stageNumber}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-neutral-900">{totalItems}</p>
                    <p className="text-sm text-neutral-500">Laporan</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                </div>
              </div>
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