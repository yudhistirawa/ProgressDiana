"use client";

import { useEffect, useState, useRef } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { collection, getDocs, query, where } from "firebase/firestore";

interface DailyData {
  tanggal: string;
  jumlah: number;
  items: any[];
}

export default function DataHarianClient() {
  const [dailyStats, setDailyStats] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
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
      // We'll fetch documents and normalize tanggal values client-side
      // because some documents store tanggal in different formats
      const snapshot = await getDocs(query(col));
      
      // Helper: parse various date formats into epoch millis
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
        // Normalize tanggal to YYYY-MM-DD key when possible
        const rawTanggal = data.tanggal;
        let epoch = parseToEpoch(rawTanggal ?? data.createdAt ?? data.ts ?? null);
        // Fallback: if createdAt is a number timestamp
        if (epoch == null && typeof data.createdAt === 'number') epoch = data.createdAt;
        const tanggalKey = epoch != null ? epochToKey(epoch) : (String(rawTanggal || "Tanggal tidak tersedia"));

        if (!dataByDate[tanggalKey]) {
          dataByDate[tanggalKey] = [];
        }
        // attach normalizedTanggal for display/logic if needed
        dataByDate[tanggalKey].push({ id: doc.id, normalizedTanggal: tanggalKey, rawTanggal, ...data });
      });

      // Convert to array and sort by date (descending). If filterMonth/year present, apply client-side filter.
      const stats: DailyData[] = Object.entries(dataByDate)
        .map(([tanggal, items]) => ({
          tanggal,
          jumlah: items.length,
          items,
        }))
        .filter((day) => {
          if (!filterYear) return true;
          const [y, m] = day.tanggal.split('-');
          if (!m || !y) return false;
          if (filterYear && filterMonth) return y === filterYear && m === filterMonth.padStart(2, '0');
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
      // Try to parse jam field first (e.g., "16.46.34" or "16:46:34")
      const timeA = a.jam?.replace(/\./g, ':') || '';
      const timeB = b.jam?.replace(/\./g, ':') || '';
      
      // If both have jam field, compare them
      if (timeA && timeB) return timeA.localeCompare(timeB);
      
      // Fallback to createdAt/uploadedAt/ts timestamps
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

  // Preserve page scroll position when modal opens so closing it doesn't jump page to top
  const savedScrollRef = useRef<number | null>(null);
  useEffect(() => {
    if (selectedDate) {
      // save scroll and lock body
      savedScrollRef.current = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      // restore scroll and unlock body
      if (savedScrollRef.current != null) {
        document.body.style.position = '';
        const y = savedScrollRef.current;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, y);
        savedScrollRef.current = null;
      } else {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
      }
    }

    // cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
    };
  }, [selectedDate]);

  const totalData = dailyStats.reduce((sum, day) => sum + day.jumlah, 0);

  return (
    <>
  {/* Header & Filters */}
  <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Data Masuk Per Hari</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadDailyData}
              className="w-full rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <div className="text-sm text-neutral-600">
          Total Data: <span className="font-semibold text-neutral-900">{totalData}</span> laporan
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-neutral-600">Memuat data...</p>
        </div>
      )}

      {/* Daily Stats Table */}
      {!loading && dailyStats.length > 0 && (
        <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden flex-1">
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold">Hari</th>
                  <th className="px-4 py-3 text-center font-semibold">Jumlah Data</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {dailyStats.map((day) => {
                  const date = new Date(day.tanggal);
                  const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });
                  const formattedDate = date.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <tr key={day.tanggal} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">{formattedDate}</td>
                      <td className="px-4 py-3 text-neutral-600">{dayName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold">
                          {day.jumlah}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDateClick(day.tanggal, day.items)}
                          className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-xs font-medium transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                          </svg>
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
          <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-neutral-400" fill="currentColor">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
          </svg>
          <p className="mt-2 text-neutral-600">Tidak ada data untuk periode yang dipilih</p>
        </div>
      )}

  {/* Modal Detail */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
    <div className="relative w-full max-w-5xl my-8 rounded-2xl bg-white shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Fixed close button to ensure visibility when header is clipped */}
            <button
              onClick={closeModal}
              aria-label="Tutup"
              title="Tutup"
              className="fixed top-4 right-4 z-60 flex items-center justify-center w-10 h-10 rounded-md bg-white text-gray-600 shadow-md hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 rounded-t-2xl">
              <h3 className="text-lg font-semibold">
                Detail Data - {new Date(selectedDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4 text-sm text-neutral-600">
                Total: <span className="font-semibold text-neutral-900">{selectedItems.length}</span> laporan
              </div>

              <div className="space-y-4">
                {selectedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-neutral-200 bg-white shadow-sm p-5"
                  >
                    {/* Header Card */}
                    <div className="mb-4 flex items-start justify-between border-b border-neutral-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-red-600 text-white px-3 py-1 text-sm font-bold">
                          #{index + 1}
                        </span>
                        {item.stage && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                            Tahap {item.stage}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-neutral-500">Waktu Upload</div>
                        <div className="text-sm font-medium text-neutral-900">
                          {item.jam || "Tidak tersedia"}
                        </div>
                      </div>
                    </div>

                    {/* Data Utama */}
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
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all"
                                  style={{ width: `${item.progress_percentage}%` }}
                                />
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

                    {/* Form Title & Source */}
                    {(item.formTitle || item.formSource) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {item.formTitle && (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-neutral-500 uppercase">Formulir</div>
                            <div className="text-sm text-neutral-900">{item.formTitle}</div>
                          </div>
                        )}
                        {item.formSource && (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-neutral-500 uppercase">Sumber</div>
                            <div className="text-sm text-neutral-900">{item.formSource}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answers/Jawaban */}
                    {item.answers && item.answers.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Jawaban Formulir</div>
                        <div className="bg-neutral-50 rounded-lg p-3 space-y-3">
                          {item.answers.map((answer: any, idx: number) => {
                            // Check if value is a photo URL
                            const isPhotoUrl = typeof answer.value === 'string' && 
                              (answer.value.includes('firebasestorage.googleapis.com') || 
                               answer.value.startsWith('http') && 
                               (answer.value.includes('.jpg') || answer.value.includes('.png') || 
                                answer.value.includes('.jpeg') || answer.value.includes('.webp')));
                            
                            if (isPhotoUrl) {
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="font-medium text-neutral-700 text-sm">{answer.label}</div>
                                  <a
                                    href={answer.value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block relative w-full max-w-2xl rounded-lg overflow-hidden border border-neutral-200 hover:border-red-400 transition-colors group"
                                    style={{
                                      height: answer.label?.toLowerCase().includes('geostamp') ? '400px' : 'auto',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <img
                                      src={answer.value}
                                      alt={answer.label}
                                      style={{
                                        transform: answer.label?.toLowerCase().includes('geostamp') ? 'scale(2)' : 'none',
                                        transformOrigin: 'bottom'
                                      }}
                                      className="w-full h-auto object-contain min-h-[300px] group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        // Fallback if image fails to load
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `<div class="p-2 text-xs text-neutral-500">📷 <a href="${answer.value}" target="_blank" class="text-blue-600 hover:underline break-all">Lihat Foto</a></div>`;
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">Klik untuk perbesar</span>
                                    </div>
                                  </a>
                                  {answer.label?.toLowerCase().includes('geostamp') && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setZoomedImage(answer.value);
                                      }}
                                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      🔍 Lihat Geostamp Diperbesar
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            
                            return (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-neutral-700">{answer.label}:</span>{" "}
                                <span className="text-neutral-900">
                                  {typeof answer.value === 'object' ? JSON.stringify(answer.value) : (answer.value || "-")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Photos */}
                    {item.photos && Object.keys(item.photos).length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-2">Foto</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(item.photos).map(([key, url]: [string, any]) => (
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200 hover:border-red-400 transition-colors group"
                            >
                              <img
                                src={url}
                                alt={key}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Catatan Admin */}
                    {item.catatan_admin && (
                      <div className="pt-3 border-t border-neutral-200">
                        <div className="text-xs font-semibold text-neutral-500 uppercase mb-1">Catatan Admin</div>
                        <div className="text-sm text-neutral-900 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          {item.catatan_admin}
                        </div>
                      </div>
                    )}

                    {/* Data Type & ID */}
                    <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-400">
                      <span>ID: {item.id}</span>
                      {item.dataType && <span>Type: {item.dataType}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
  {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative w-[95vw] h-[95vh]">
            <img
              src={zoomedImage}
              alt="Zoomed view"
              className="w-full h-full max-w-none max-h-none object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 rounded-full p-2 bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
