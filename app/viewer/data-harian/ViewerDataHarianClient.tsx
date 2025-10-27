"use client";

import { useEffect, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { collection, getDocs, query } from "firebase/firestore";

interface DailyData {
  tanggal: string;
  jumlah: number;
  items: any[];
}

export default function ViewerDataHarianClient() {
  const [dailyStats, setDailyStats] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    loadDailyData();
  }, [filterMonth, filterYear]);

  async function loadDailyData() {
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
          // ISO-like
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
            const t = Date.parse(s);
            if (!Number.isNaN(t)) return t;
          }
          // dd/MM/yyyy or dd-MM-yyyy [optional time with : or .]
          const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[ T](\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?)?/.exec(s);
          if (dmy) {
            const day = parseInt(dmy[1], 10);
            const month = parseInt(dmy[2], 10) - 1;
            const year = parseInt(dmy[3], 10);
            const hour = dmy[4] ? parseInt(dmy[4], 10) : 0;
            const min = dmy[5] ? parseInt(dmy[5], 10) : 0;
            const sec = dmy[6] ? parseInt(dmy[6], 10) : 0;
            const dt = new Date(year, month, day, hour, min, sec);
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

      const dataByDate: { [key: string]: any[] } = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const rawTanggal = data.tanggal;
        // Fallback logic for date field
        let epoch = parseToEpoch(rawTanggal ?? data.createdAt ?? data.ts ?? null);
        if (epoch == null && typeof data.createdAt === 'number') epoch = data.createdAt;
        const tanggalKey = epoch != null ? epochToKey(epoch) : (String(rawTanggal || "Tanggal tidak tersedia"));

        if (!dataByDate[tanggalKey]) dataByDate[tanggalKey] = [];
        // Push the document data with its ID
        dataByDate[tanggalKey].push({ id: doc.id, ...data });
      });

      const stats: DailyData[] = Object.entries(dataByDate)
        .map(([tanggal, items]) => ({ tanggal, jumlah: items.length, items }))
        .filter((day) => {
          // Pastikan hanya memproses entri dengan format tanggal yang valid (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}/.test(day.tanggal)) {
            return false; // Abaikan entri dengan kunci tanggal tidak valid seperti "Tanggal tidak tersedia"
          }

          const [y, m] = day.tanggal.split('-');
          // Terapkan filter tahun dan bulan jika ada
          if (filterYear && filterMonth) return y === filterYear && m === String(filterMonth).padStart(2, '0');
          if (filterYear) return y === filterYear;
          return true;
        })
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

      setDailyStats(stats);
    } catch (error) {
      console.error("Error loading daily data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleDateClick(date: string, items: any[]) {
    setSelectedDate(date);
    // Sort items by time (jam field or upload time) from earliest to latest
    const sortedItems = [...items].sort((a, b) => {
      const timeA = a.jam?.replace(/\./g, ':') || '';
      const timeB = b.jam?.replace(/\./g, ':') || '';
      if (timeA && timeB) return timeA.localeCompare(timeB);
      const timestampA = a.createdAt || a.uploadedAt || a.ts || 0;
      const timestampB = b.createdAt || b.uploadedAt || b.ts || 0;
      return timestampA - timestampB;
    });
    setSelectedItems(sortedItems);
  }

  function closeModal() {
    setSelectedDate(null);
    setSelectedItems([]);
  }

  const totalData = dailyStats.reduce((sum, day) => sum + day.jumlah, 0);

  return (
    <>
      {/* Summary Cards & Filters */}
      <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 ring-1 ring-blue-200">
            <p className="text-sm font-medium text-blue-600">Total Laporan</p>
            <p className="text-3xl font-bold text-blue-900">{loading ? '...' : totalData}</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 ring-1 ring-green-200">
            <p className="text-sm font-medium text-green-600">Total Hari</p>
            <p className="text-3xl font-bold text-green-900">{loading ? '...' : dailyStats.length}</p>
          </div>
          <div className="col-span-1 sm:col-span-2 rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-100 p-4 ring-1 ring-neutral-200 flex items-center justify-center">
            <p className="text-sm text-neutral-600 text-center">
              Menampilkan data untuk periode: <br />
              <span className="font-semibold text-neutral-800">
                {filterMonth ? new Date(0, parseInt(filterMonth)-1).toLocaleString('id-ID', { month: 'long' }) : 'Semua Bulan'} {filterYear}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200">
          <div>
            <label className="block text-sm font-medium mb-1">Tahun</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bulan</label>
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
              <option value="">Semua Bulan</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={loadDailyData} disabled={loading} className="w-full rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-neutral-400 disabled:cursor-wait">
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

      {/* Data Table */}
      {!loading && dailyStats.length > 0 && (
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden flex-1">
          <div className="overflow-auto h-full">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold">Hari</th>
                  <th className="px-4 py-3 text-center font-semibold">Jumlah Data</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {dailyStats.map((day) => {
                  const date = new Date(day.tanggal + 'T00:00:00'); // Prevent timezone shift issues
                  const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });
                  const formattedDate = date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                  return (
                    <tr key={day.tanggal} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 truncate">{formattedDate}</td>
                      <td className="px-4 py-3 text-neutral-600">{dayName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
                          {day.jumlah}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDateClick(day.tanggal, day.items)} className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && dailyStats.length === 0 && (
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-8 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-neutral-400" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" /></svg>
          <p className="mt-2 text-neutral-600">Tidak ada data untuk periode yang dipilih</p>
        </div>
      )}

      {/* Modal Detail */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={closeModal}>
          <div className="relative w-full max-w-5xl my-8 rounded-2xl bg-white shadow-xl max-h-[calc(100vh-4rem)] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-semibold">
                Detail Data - {new Date(selectedDate + 'T00:00:00').toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </h3>
              <button onClick={closeModal} className="rounded-full p-2 hover:bg-neutral-100 transition-colors">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="mb-4 text-sm text-neutral-600">
                Total: <span className="font-semibold text-neutral-900">{selectedItems.length}</span> laporan
              </div>
              <div className="space-y-4">
                {selectedItems.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm p-5">
                    <div className="mb-4 flex items-start justify-between border-b border-neutral-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-red-600 text-white px-3 py-1 text-sm font-bold">#{index + 1}</span>
                        {item.stage && <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">Tahap {item.stage}</span>}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">Waktu Upload</div>
                        <div className="text-sm font-medium text-neutral-900">{item.jam || "Tidak tersedia"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-500 uppercase">Nama</div>
                        <div className="text-sm text-neutral-900 font-medium">{item.nama || "-"}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-500 uppercase">Lokasi</div>
                        <div className="text-sm text-neutral-900 font-medium">{item.lokasi || "-"}</div>
                      </div>
                    </div>
                    {/* Pekerjaan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-500 uppercase">Pekerjaan</div>
                        <div className="text-sm text-neutral-900">{item.pekerjaan || "-"}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-neutral-500 uppercase">Jenis Pekerjaan</div>
                        <div className="text-sm text-neutral-900">{item.jenis_pekerjaan || "-"}</div>
                      </div>
                    </div>

                    {/* Progress & Durasi */}
                    {(item.progress_percentage !== undefined || item.durasi_jam !== undefined) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {item.progress_percentage !== undefined && (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-neutral-500 uppercase">Progress</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-neutral-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${item.progress_percentage}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-neutral-900">{item.progress_percentage}%</span>
                            </div>
                          </div>
                        )}
                        {item.durasi_jam !== undefined && (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-neutral-500 uppercase">Durasi</div>
                            <div className="text-sm text-neutral-900">{item.durasi_jam} jam</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Jawaban Formulir */}
                    {item.answers && item.answers.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Jawaban Formulir</div>
                        <div className="bg-neutral-50 rounded-lg p-3 space-y-3">
                          {item.answers.map((answer: any, idx: number) => {
                            const isPhotoUrl = typeof answer.value === 'string' && 
                              (answer.value.includes('firebasestorage.googleapis.com') || 
                               (answer.value.startsWith('http') && 
                               (answer.value.includes('.jpg') || answer.value.includes('.png') || 
                                answer.value.includes('.jpeg') || answer.value.includes('.webp'))));
                            
                            if (isPhotoUrl) {
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="font-medium text-neutral-700 text-sm">{answer.label}</div>
                                  <a href={answer.value} target="_blank" rel="noopener noreferrer" className="block relative w-full max-w-xs rounded-lg overflow-hidden border border-neutral-200 hover:border-red-400 transition-colors group">
                                    <img src={answer.value} alt={answer.label} className="w-full h-auto object-contain min-h-[150px] group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Klik untuk perbesar</span>
                                    </div>
                                  </a>
                                </div>
                              );
                            }
                            
                            return (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-neutral-700">{answer.label}:</span>{" "}
                                <span className="text-neutral-900 break-words">{typeof answer.value === 'object' ? JSON.stringify(answer.value) : (answer.value || "-")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {item.photos && Object.keys(item.photos).length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Foto</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(item.photos).map(([key, url]: [string, any]) => (
                            <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 hover:border-red-400 transition-colors group">
                              <img src={url} alt={key} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Catatan Admin */}
                    {item.catatan_admin && (
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Catatan Admin</div>
                        <div className="text-sm text-neutral-900 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          {item.catatan_admin}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}