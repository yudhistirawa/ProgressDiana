"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { fetchProgressPage, getTotalCount, type ProgressFilters, type ProgressItem } from "@/lib/firestore/progress";
import { Pagination } from "@/components/ui/pagination";

type AdminProgressItem = ProgressItem;

type SummaryStats = {
  totalAdminInputs: number;
  totalPhotos: number;
  averageProgress: number;
  totalDuration: number;
  inputsByMonth: { [key: string]: number };
  topLocations: { name: string; count: number }[];
  recentActivity: AdminProgressItem[];
};

export default function LaporanAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL
  const getInitialPage = () => {
    const page = searchParams.get('page');
    return page ? parseInt(page, 10) : 1;
  };

  const getInitialSearch = () => {
    return searchParams.get('search') || '';
  };

  const getInitialDateFilter = () => {
    const start = searchParams.get('dateStart');
    const end = searchParams.get('dateEnd');
    return {
      start: start || undefined,
      end: end || undefined,
    };
  };

  const [items, setItems] = useState<AdminProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>(getInitialDateFilter);
  const [searchQuery, setSearchQuery] = useState(getInitialSearch);
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [lastDocs, setLastDocs] = useState<Map<number, any>>(() => new Map([[0, null]]));
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 5;

  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Bulk selection functions
  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return;

    const fb = getFirebaseClient();
    if (!fb) return;

    try {
      const { doc, deleteDoc } = await import("firebase/firestore");

      // Delete all selected items
      const deletePromises = Array.from(selectedItems).map(async (itemId) => {
        const docRef = doc(fb.db, "Progress_Diana", itemId);
        await deleteDoc(docRef);

        // Delete notification if exists
        try {
          const notifRef = doc(fb.db, "Progress_Diana_Notifikasi", itemId);
          await deleteDoc(notifRef);
        } catch {}
      });

      await Promise.all(deletePromises);

      // Update local state
      setItems(items.filter((x) => !selectedItems.has(x.id)));
      clearSelection();
    } catch (err) {
      console.error("Error bulk deleting:", err);
      alert("Gagal menghapus data");
    }
  };

  // Reset pagination cache when filters change
  useEffect(() => {
    setLastDocs(new Map([[0, null]]));
    setCurrentPage(1);
  }, [searchQuery, dateFilter.start, dateFilter.end]);

  // URL synchronization effect
  useEffect(() => {
    const params = new URLSearchParams();

    if (currentPage > 1) {
      params.set('page', currentPage.toString());
    }

    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    if (dateFilter.start) {
      params.set('dateStart', dateFilter.start);
    }

    if (dateFilter.end) {
      params.set('dateEnd', dateFilter.end);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    if (newUrl !== window.location.href) {
      router.replace(newUrl, { scroll: false });
    }
  }, [currentPage, searchQuery, dateFilter, router]);

  // Ensure we have a cursor for jumping directly to page N
  const ensureCursorForPage = useCallback(
    async (targetPage: number) => {
      if (targetPage <= 1) return null;
      let map = new Map(lastDocs);
      let lastCursor = map.get(0) ?? null;
      for (let p = 1; p < targetPage; p++) {
        if (!map.has(p)) {
          const res = await fetchProgressPage({
            pageSize: itemsPerPage,
            cursor: lastCursor,
            filters: {
              search: searchQuery.trim() || undefined,
              dateStart: dateFilter.start,
              dateEnd: dateFilter.end,
              dataType: "historical",
            },
            dataType: "historical",
          });
          map.set(p, res.lastDoc ?? null);
          lastCursor = res.lastDoc ?? null;
        } else {
          lastCursor = map.get(p) ?? null;
        }
      }
      setLastDocs(map);
      return map.get(targetPage - 1) ?? null;
    },
    [lastDocs, itemsPerPage, searchQuery, dateFilter]
  );

  // Load data effect
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: ProgressFilters = {
          search: searchQuery.trim() || undefined,
          dateStart: dateFilter.start,
          dateEnd: dateFilter.end,
          dataType: "historical"
        };

        // Get total count
        const count = await getTotalCount(filters, "historical");
        setTotalCount(count);

        // Get current page data with cursor (build chain if jumping)
        const cursor = await ensureCursorForPage(currentPage);
        const result = await fetchProgressPage({
          pageSize: itemsPerPage,
          cursor,
          filters,
          dataType: "historical"
        });

        setItems(result.items);
        setHasNext(result.hasNext);
        setHasPrev(currentPage > 1);

        // Cache the last document for this page
        if (result.items.length > 0) {
          const newLastDocs = new Map(lastDocs);
          newLastDocs.set(currentPage, result.items[result.items.length - 1]);
          setLastDocs(newLastDocs);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage, searchQuery, dateFilter, ensureCursorForPage]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by date range
    if (dateFilter.start && dateFilter.end) {
      filtered = filtered.filter(item => {
        const itemDate = item.tanggal;
        return itemDate >= dateFilter.start! && itemDate <= dateFilter.end!;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.nama?.toLowerCase().includes(query)) ||
        (item.lokasi?.toLowerCase().includes(query)) ||
        (item.pekerjaan?.toLowerCase().includes(query)) ||
        (item.jenis_pekerjaan?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [items, dateFilter, searchQuery]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    if (page < 1) return;
    const max = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    if (page > max) return;
    setCurrentPage(page);
  }, [totalCount]);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearchQuery(newSearch);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const handleDateFilterChange = useCallback((newFilter: { start?: string; end?: string }) => {
    setDateFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const summaryStats: SummaryStats = useMemo(() => {
    const totalAdminInputs = filteredItems.length;

    // Count total photos
    const totalPhotos = filteredItems.reduce((acc, item) => {
      const photoCount = item.photos ? Object.keys(item.photos).length : 0;
      return acc + photoCount;
    }, 0);

    // Calculate average progress
    const validProgressItems = filteredItems.filter(item => item.progress_percentage !== undefined);
    const averageProgress = validProgressItems.length > 0
      ? validProgressItems.reduce((acc, item) => acc + (item.progress_percentage || 0), 0) / validProgressItems.length
      : 0;

    // Calculate total duration
    const totalDuration = filteredItems.reduce((acc, item) => acc + (item.durasi_jam || 0), 0);

    // Count by month
    const inputsByMonth: { [key: string]: number } = {};
    filteredItems.forEach(item => {
      const month = item.tanggal.substring(0, 7); // YYYY-MM format
      inputsByMonth[month] = (inputsByMonth[month] || 0) + 1;
    });

    // Top locations
    const locationCounts: { [key: string]: number } = {};
    filteredItems.forEach(item => {
      const location = item.lokasi || 'Tidak ada lokasi';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity (last 10 items)
    const recentActivity = filteredItems.slice(0, 10);

    return {
      totalAdminInputs,
      totalPhotos,
      averageProgress: Math.round(averageProgress * 100) / 100,
      totalDuration,
      inputsByMonth,
      topLocations,
      recentActivity,
    };
  }, [filteredItems]);

  const exportAdminData = () => {
    const data = {
      summary: {
        totalAdminInputs: summaryStats.totalAdminInputs,
        totalPhotos: summaryStats.totalPhotos,
        averageProgress: summaryStats.averageProgress,
        totalDuration: summaryStats.totalDuration,
        dateRange: dateFilter.start && dateFilter.end ? `${dateFilter.start} - ${dateFilter.end}` : 'Semua periode',
        exportDate: new Date().toLocaleString('id-ID'),
      },
      inputsByMonth: summaryStats.inputsByMonth,
      topLocations: summaryStats.topLocations,
      adminInputs: filteredItems.map(item => ({
        id: item.id,
        nama: item.nama,
        lokasi: item.lokasi,
        jenis_pekerjaan: item.jenis_pekerjaan,
        pekerjaan: item.pekerjaan,
        tanggal: item.tanggal,
        jam: item.jam,
        durasi_jam: item.durasi_jam,
        progress_percentage: item.progress_percentage,
        catatan_admin: item.catatan_admin,
        formTitle: item.formTitle,
        createdAt: new Date(item.createdAt).toLocaleString('id-ID'),
        photos: item.photos ? Object.keys(item.photos).length : 0,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-admin-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-2xl p-6 h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-2xl p-6 h-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Selection Actions Bar */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M3 6a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zM4 17a1 1 0 100 2h16a1 1 0 100-2H4z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-blue-900">
                  {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} dipilih
                </div>
                <div className="text-xs text-blue-700">
                  Pilih aksi yang ingin dilakukan
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <svg viewBox="0 0 24 24" className={`h-3 w-3 ${selectedItems.size === filteredItems.length ? 'text-blue-600' : ''}`} fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {selectedItems.size === filteredItems.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>

              <button
                type="button"
                onClick={deleteSelectedItems}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Hapus Dipilih ({selectedItems.size})
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Data Admin</h1>
          <p className="text-gray-600 mt-1">Data progress yang diinput oleh admin</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportAdminData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              <path d="M12,11L10,13L8,11V16H16V11L14,13L12,11Z" />
            </svg>
            Export Data
          </button>
          <button
            type="button"
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs sm:text-sm shadow-sm whitespace-nowrap transition-colors ${
              isSelectionMode
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              {isSelectionMode ? (
                <path d="M6 18L18 6M6 6l12 12"/>
              ) : (
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              )}
            </svg>
            {isSelectionMode ? 'Exit Selection' : 'Select Mode'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={dateFilter.start || ''}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Akhir</label>
            <input
              type="date"
              value={dateFilter.end || ''}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cari</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, lokasi, atau pekerjaan..."
              className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 ring-1 ring-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Input Admin</p>
              <p className="text-3xl font-bold text-blue-900">{summaryStats.totalAdminInputs}</p>
            </div>
            <div className="h-12 w-12 bg-blue-200 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 ring-1 ring-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Foto</p>
              <p className="text-3xl font-bold text-green-900">{summaryStats.totalPhotos}</p>
            </div>
            <div className="h-12 w-12 bg-green-200 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600" fill="currentColor">
                <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 10 2.5-3 2 2.5L15 12l3 3H8Z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 ring-1 ring-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Rata-rata Progress</p>
              <p className="text-3xl font-bold text-purple-900">{summaryStats.averageProgress}%</p>
            </div>
            <div className="h-12 w-12 bg-purple-200 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-purple-600" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 ring-1 ring-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Total Durasi</p>
              <p className="text-3xl font-bold text-orange-900">{summaryStats.totalDuration} jam</p>
            </div>
            <div className="h-12 w-12 bg-orange-200 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-orange-600" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13L16.2,16.2L17,14.9L12.5,12.2V7H11Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Locations */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasi Terbanyak</h3>
          <div className="space-y-3">
            {summaryStats.topLocations.slice(0, 5).map((location, index) => (
              <div key={location.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{location.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(location.count / summaryStats.totalAdminInputs) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{location.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Input per Bulan</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(summaryStats.inputsByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([month, count]) => (
                <div key={month} className="text-center">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <p className="text-2xl font-bold text-purple-900">{count}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Admin Inputs Table */}
      <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Input Admin</h3>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg viewBox="0 0 24 24" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">Belum ada data admin</p>
            <p className="text-sm text-gray-600">Data yang diinput admin akan muncul di sini</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {isSelectionMode && (
                      <th className="w-12 py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      </th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nama</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Lokasi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Pekerjaan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Progress</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Foto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${
                      selectedItems.has(item.id) ? 'bg-blue-50/30' : ''
                    }`}>
                      {isSelectionMode && (
                        <td className="py-3 px-4 w-12">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelection(item.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.nama || 'Tidak ada nama'}</p>
                          {item.jenis_pekerjaan && (
                            <p className="text-xs text-gray-500">{item.jenis_pekerjaan}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-700">{item.lokasi || 'Tidak ada lokasi'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-700 truncate max-w-xs" title={item.pekerjaan}>
                          {item.pekerjaan || 'Tidak ada pekerjaan'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-700">{item.tanggal}</p>
                          {item.jam && (
                            <p className="text-xs text-gray-500">{item.jam}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${item.progress_percentage || 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.progress_percentage || 0}%
                          </span>
                        </div>
                        {item.durasi_jam && (
                          <p className="text-xs text-gray-500 mt-1">{item.durasi_jam} jam</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {item.photos && Object.keys(item.photos).length > 0 ? (
                            <>
                              <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-600" fill="currentColor">
                                <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 10 2.5-3 2 2.5L15 12l3 3H8Z"/>
                              </svg>
                              <span className="text-sm text-gray-700">
                                {Object.keys(item.photos).length}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Tidak ada</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  hasNext={hasNext}
                  hasPrev={hasPrev}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Input Terbaru</h3>
        <div className="space-y-3">
          {summaryStats.recentActivity.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.nama || 'Tidak ada nama'}</p>
                  <p className="text-sm text-gray-600">{item.lokasi || 'Tidak ada lokasi'}</p>
                  {item.catatan_admin && (
                    <p className="text-xs text-gray-500 mt-1">{item.catatan_admin}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{item.progress_percentage || 0}%</p>
                <p className="text-xs text-gray-500">{item.tanggal} {item.jam}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
