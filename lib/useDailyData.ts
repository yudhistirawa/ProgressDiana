"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dailyDates, loadDailyCounts, loadDailyItems } from "./dailyData";

export function useDailyData(collectionName: string) {
  const [dailyStats, setDailyStats] = useState<{ tanggal: string; jumlah: number; items: any[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const requests = useRef(0);
  const detailRequests = useRef(0);

  const closeModal = useCallback(() => {
    detailRequests.current++;
    setSelectedDate(null);
    setSelectedItems([]);
    setDetailLoading(false);
  }, []);

  const loadDailyData = useCallback(async () => {
    const request = ++requests.current;
    closeModal();
    setLoading(true);
    setDailyStats([]);
    setError(null);
    try {
      const stats = await loadDailyCounts(collectionName, dailyDates(filterMonth, filterYear));
      if (request === requests.current) setDailyStats(stats);
    } catch (err) {
      console.error("Error loading daily data:", err);
      if (request === requests.current) setError("Gagal memuat data. Silakan coba Refresh Data.");
    } finally {
      if (request === requests.current) setLoading(false);
    }
  }, [collectionName, filterMonth, filterYear, closeModal]);

  useEffect(() => {
    const listRequests = requests;
    const modalRequests = detailRequests;
    void loadDailyData();
    return () => { listRequests.current++; modalRequests.current++; };
  }, [loadDailyData]);

  async function handleDateClick(date: string) {
    const request = ++detailRequests.current;
    setSelectedDate(date);
    setSelectedItems([]);
    setDetailLoading(true);
    setError(null);
    try {
      const items = await loadDailyItems(collectionName, date);
      items.sort((a: any, b: any) => String(a.jam || "").replace(/\./g, ":").localeCompare(String(b.jam || "").replace(/\./g, ":")));
      if (request === detailRequests.current) setSelectedItems(items);
    } catch (err) {
      console.error("Error loading daily detail:", err);
      if (request === detailRequests.current) {
        closeModal();
        setError("Gagal memuat detail. Silakan klik Lihat Detail kembali.");
      }
    } finally {
      if (request === detailRequests.current) setDetailLoading(false);
    }
  }

  return { dailyStats, loading, error, filterMonth, setFilterMonth, filterYear, setFilterYear,
    selectedDate, selectedItems, detailLoading, loadDailyData, handleDateClick, closeModal };
}
