"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getFirebaseClient } from "../../../../lib/firebaseClient";

type Item = {
  id: string;
  stage?: number | string;
  // legacy fields
  nama?: string;
  lokasi?: string;
  pekerjaan?: string;
  kodeBendaUji?: string;
  kode_benda_uji?: string;
  mutuBeton?: string;
  mutu_beton?: string;
  elemenPekerjaan?: string;
  elemen_pekerjaan?: string;
  elementPekerjaan?: string;
  // new dynamic
  answers?: { label: string; type: string; value: any }[];
  files?: string[];
  tanggal: string;
  jam?: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  alamat: string | null;
  fotoWajibName?: string | null;
  fotoOpsionalName?: string | null;
  createdAt?:
    | number
    | Date
    | string
    | {
        seconds?: number;
        nanoseconds?: number;
        toDate?: () => Date;
        _seconds?: number;
        _nanoseconds?: number;
      }
    | null;
};

type AlertState = {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  show: boolean;
};

type EnrichedItem = Item & {
  displayName: string;
  namaPetugasLabel: string;
  pekerjaanLabel: string;
  jenisPekerjaanLabel: string;
  elemenPekerjaanLabel: string;
  sudutPukulLabel: string;
  lokasiLabel: string;
  waktuLabel: string;
  fotoCount: number;
};

export default function StageReportListClient({ stage }: { stage: number | string }) {
  const stageNumber = Number(stage);
  const stageFilter = Number.isNaN(stageNumber) ? stage : stageNumber;
  const isStage4 = Number(stageFilter) === 4;
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [selected, setSelected] = useState<Item | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editLokasi, setEditLokasi] = useState("");
  const [editPekerjaan, setEditPekerjaan] = useState("");
  const [editKodeBendaUji, setEditKodeBendaUji] = useState("");
  const [editMutuBeton, setEditMutuBeton] = useState("");
  const [editElemenPekerjaan, setEditElemenPekerjaan] = useState("");
  const [editSudutPukul, setEditSudutPukul] = useState("");

  // Reset edit form when modal is closed
  useEffect(() => {
    if (editItem === null) {
      // Reset all edit form states
      setEditNama("");
      setEditLokasi("");
      setEditPekerjaan("");
      setEditKodeBendaUji("");
      setEditMutuBeton("");
      setEditElemenPekerjaan("");
      setEditSudutPukul("");
      setEditTanggal("");
      setEditTanggalIso("");
    }
  }, [editItem]);

  const [editTanggal, setEditTanggal] = useState("");
  const [editTanggalIso, setEditTanggalIso] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  const detailModalRef = useRef<HTMLDivElement | null>(null);
  const editModalRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const bodyOverflowRef = useRef<string | null>(null);
  const isModalOpen = Boolean(selected || editItem);

  // Delete confirmation alert state
  const [deleteAlert, setDeleteAlert] = useState<AlertState>({ type: 'warning', title: '', message: '', show: false });
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  useEffect(() => {
    if (!selected || typeof window === "undefined") return;
    const target = detailModalRef.current;
    if (!target) return;

    // Auto scroll to modal center
    const timeout = window.setTimeout(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });

      // Focus management
      target.focus();

      // Add visual focus indication
      target.style.outline = '2px solid transparent';
      target.style.outlineOffset = '2px';

      // Keep focus in modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setSelected(null);
        } else if (e.key === 'Tab') {
          // Trap focus within modal
          const modalElements = target.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = modalElements[0] as HTMLElement;
          const lastElement = modalElements[modalElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [selected]);

  useEffect(() => {
    if (!editItem || typeof window === "undefined") return;
    const target = editModalRef.current;
    if (!target) return;

    // Auto scroll to modal center
    const timeout = window.setTimeout(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });

      // Focus management - only focus initially, don't jump back later
      if (firstInputRef.current) {
        // Check if it's the first time opening the modal (no previous focus)
        const currentActive = document.activeElement;
        if (!currentActive || !target.contains(currentActive)) {
          firstInputRef.current.focus();
        }
      } else {
        target.focus();
      }

      // Add visual focus indication
      target.style.outline = '2px solid transparent';
      target.style.outlineOffset = '2px';

      // Keep focus in modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setEditItem(null);
        } else if (e.key === 'Tab') {
          // Trap focus within modal
          const modalElements = target.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = modalElements[0] as HTMLElement;
          const lastElement = modalElements[modalElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, 100);

    return () => window.clearTimeout(timeout);
  }, [editItem]);

  const normalizeDateToISO = (value: string | null | undefined): string => {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (!trimmed) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

    const digits = trimmed.match(/\d+/g);
    if (!digits || digits.length < 3) return "";
    let [a, b, c] = digits;
    const parse = (yearStr: string, monthStr: string, dayStr: string) => {
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return "";
      if (year < 1900 || year > 3000) return "";
      if (month < 1 || month > 12) return "";
      if (day < 1 || day > 31) return "";
      const dt = new Date(Date.UTC(year, month - 1, day));
      if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return "";
      return `${year.toString().padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    };

    if (a.length === 4) {
      return parse(a, b, c);
    }
  if (c.length === 4) {
    return parse(c, b, a);
  }
  return parse(a, b, c);
};

  const getCreatedAtMilliseconds = (value: Item["createdAt"]): number | null => {
    if (value == null) return null;

    if (typeof value === "number") {
      const ms = value < 1_000_000_000_000 ? value * 1000 : value;
      return Number.isFinite(ms) ? ms : null;
    }

    if (value instanceof Date) {
      const ms = value.getTime();
      return Number.isNaN(ms) ? null : ms;
    }

    if (typeof value === "string") {
      const isoGuess = normalizeDateToISO(value);
      if (isoGuess) {
        const ms = Date.parse(`${isoGuess}T00:00:00Z`);
        if (!Number.isNaN(ms)) return ms;
      }
      const ms = Date.parse(value);
      return Number.isNaN(ms) ? null : ms;
    }

    if (typeof value === "object") {
      const maybeDate = typeof (value as { toDate?: () => Date }).toDate === "function"
        ? (value as { toDate?: () => Date }).toDate!()
        : null;
      if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
        return maybeDate.getTime();
      }

      const seconds =
        typeof (value as { seconds?: number }).seconds === "number"
          ? (value as { seconds?: number }).seconds
          : typeof (value as { _seconds?: number })._seconds === "number"
          ? (value as { _seconds?: number })._seconds
          : undefined;

      if (typeof seconds === "number") {
        const nanosRaw =
          typeof (value as { nanoseconds?: number }).nanoseconds === "number"
            ? (value as { nanoseconds?: number }).nanoseconds
            : typeof (value as { _nanoseconds?: number })._nanoseconds === "number"
            ? (value as { _nanoseconds?: number })._nanoseconds
            : 0;
        const nanos = typeof nanosRaw === "number" ? nanosRaw : 0;
        return seconds * 1000 + nanos / 1e6;
      }
    }

    return null;
  };

  const getItemDateKey = (item: Pick<Item, "createdAt" | "tanggal">): string | null => {
    const rawTanggal = item.tanggal != null ? normalizeDateToISO(String(item.tanggal)) : "";
    if (rawTanggal) return rawTanggal;

    const ms = getCreatedAtMilliseconds(item.createdAt ?? null);
    if (ms == null) return null;
    const dt = new Date(ms);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  };

  const formatISOToDisplay = (iso: string): string => {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const [year, month, day] = parts;
    if (!year || !month || !day) return iso;
    return `${day}/${month}/${year}`;
  };

  const populateEditFields = (item: Item) => {
    // Start with legacy field values
    let namaVal = item.nama || "";
    let lokasiVal = item.lokasi || "";
    let pekerjaanVal = item.pekerjaan || "";
    let elemenPekerjaanVal = item.elemenPekerjaan || "";
    let sudutPukulVal = "";

    let displayDate = (item.tanggal || "").trim();
    let isoDate = normalizeDateToISO(displayDate);

    if (!displayDate && isoDate) {
      displayDate = formatISOToDisplay(isoDate);
    }

    // Extract values from answers array with improved mapping
    if (Array.isArray(item.answers)) {
      item.answers.forEach((answer) => {
        if (!answer || typeof answer.label !== "string") return;
        const label = answer.label.toLowerCase();
        const type = String(answer.type || "").toLowerCase();
        const rawValue = answer.value != null ? String(answer.value) : "";
        if (!rawValue) return;

        if (type === "text") {
          // Nama Petugas - various possible labels
          if (label.includes("nama") && !label.includes("keterangan") && !label.includes("petugas")) {
            namaVal = rawValue;
          }
          if (label.includes("nama") && label.includes("petugas")) {
            namaVal = rawValue;
          }

          // Lokasi Proyek - various possible labels
          if (label.includes("lokasi") || label.includes("alamat") || label.includes("tempat")) {
            lokasiVal = rawValue;
          }

          // Pekerjaan/Kode Benda Uji
          if (label.includes("pekerjaan") || label.includes("kegiatan")) {
            if (label.includes("elemen")) {
              elemenPekerjaanVal = rawValue;
            } else {
              pekerjaanVal = rawValue;
            }
          }

          // Stage 4 specific fields
          if (isStage4) {
            if (label.includes("kode") && label.includes("benda")) {
              pekerjaanVal = rawValue;
            }
            if (label.includes("mutu") && label.includes("beton")) {
              elemenPekerjaanVal = rawValue;
            }
            if (label.includes("sudut") && label.includes("pukul")) {
              sudutPukulVal = rawValue;
            }
          } else {
            // Non-stage 4: elemen pekerjaan
            if (label.includes("elemen") && label.includes("pekerjaan")) {
              elemenPekerjaanVal = rawValue;
            }
          }

          // Tanggal
          if (label.includes("tanggal")) {
            const parsed = normalizeDateToISO(rawValue);
            if (parsed) {
              isoDate = parsed;
              displayDate = formatISOToDisplay(parsed);
            } else {
              displayDate = rawValue;
            }
          }
        }
      });
    }

    // Fallback: if no date from answers, try to parse from legacy tanggal field
    if (!isoDate && displayDate) {
      const parsed = normalizeDateToISO(displayDate);
      if (parsed) {
        isoDate = parsed;
        displayDate = formatISOToDisplay(parsed);
      }
    }

    // Set all the state values
    setEditNama(namaVal);
    setEditLokasi(lokasiVal);
    setEditPekerjaan(pekerjaanVal);
    setEditElemenPekerjaan(elemenPekerjaanVal);
    setEditSudutPukul(sudutPukulVal);

    setEditTanggal(displayDate);
    setEditTanggalIso(isoDate);
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (!body) return;

    if (isModalOpen) {
      if (bodyOverflowRef.current === null) {
        bodyOverflowRef.current = body.style.overflow;
      }
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = bodyOverflowRef.current ?? "";
        bodyOverflowRef.current = null;
      };
    }

    if (bodyOverflowRef.current !== null) {
      body.style.overflow = bodyOverflowRef.current ?? "";
      bodyOverflowRef.current = null;
    }

    return () => {};
  }, [isModalOpen]);

  const enrichItem = (item: Item): EnrichedItem => {
    let headerNama = item.nama || "";
    let keteranganNama = "";
    let pekerjaan = item.pekerjaan || "";
    let jenisPekerjaan = "";
    let elemenPekerjaan = item.elemenPekerjaan || "";
    let sudutPukul = "";
    let lokasi = item.lokasi || "";

    if (Array.isArray(item.answers)) {
      item.answers.forEach((answer) => {
        if (!answer || typeof answer.label !== "string") return;
        const label = answer.label.toLowerCase();
        const type = String(answer.type || "").toLowerCase();
        const value = answer.value != null ? String(answer.value) : "";

        if (type === "text") {
          const isKeteranganNama = label.includes("keterangan") && label.includes("nama");
          const isNamaPetugas = label.includes("nama") && label.includes("petugas") && !label.includes("keterangan");

          if (isKeteranganNama) {
            keteranganNama = value;
            return;
          }

          if (!headerNama && (isNamaPetugas || label.includes("nama"))) {
            headerNama = value;
          }
        }

        if (type === "text" && label.includes("pekerjaan")) {
          if (label.includes("jenis")) {
            jenisPekerjaan = value;
          } else if (label.includes("elemen")) {
            elemenPekerjaan = value;
          } else {
            pekerjaan = value;
          }
        }

        // For stage 4 specific fields
        if (isStage4) {
          if (type === "text" && label.includes("kode") && label.includes("benda")) {
            pekerjaan = value; // Map to pekerjaanLabel for display
          }
          if (type === "text" && label.includes("mutu") && label.includes("beton")) {
            jenisPekerjaan = value; // Map to jenisPekerjaanLabel for display
          }
          if (type === "text" && label.includes("sudut") && label.includes("pukul")) {
            sudutPukul = value; // Map to sudutPukulLabel for display
          }
        }

        if (!lokasi && type === "text" && (label.includes("lokasi") || label.includes("alamat"))) {
          lokasi = value;
        }
      });
    }

    if (!jenisPekerjaan) jenisPekerjaan = pekerjaan;
    if (!headerNama) headerNama = item.nama || keteranganNama || "";

    const waktuLabel = [item.tanggal || "", item.jam || ""].filter(Boolean).join(" ");
    const fotoCount = Array.isArray(item.answers)
      ? item.answers.filter((a) => String(a.type || "").toLowerCase() === "photo" && a.value).length
      : 0;

    return {
      ...item,
      displayName: headerNama || "Tanpa Nama",
      namaPetugasLabel: keteranganNama || headerNama || "-",
      pekerjaanLabel: pekerjaan || "-",
      jenisPekerjaanLabel: jenisPekerjaan || "-",
      elemenPekerjaanLabel: elemenPekerjaan || "-",
      sudutPukulLabel: sudutPukul || "-",
      lokasiLabel: lokasi || "-",
      waktuLabel: waktuLabel || "-",
      fotoCount,
    };
  };

  const load = async () => {
    setLoading(true);
    const fb = getFirebaseClient();
    if (!fb) {
      setLoading(false);
      return;
    }

    try {
      const { collection, query, where, orderBy, getDocs, onSnapshot } = await import("firebase/firestore");
      const col = collection(fb.db, "Progress_Diana");
      const q = query(col, where("stage", "==", stage));

      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (snap) => {
        const items: Item[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setItems(items);
        setLoading(false);
        console.log("Γ£à Loaded", items.length, "reports for stage", stage);
      }, (err) => {
        console.error("Γ¥î Firestore error:", err);
        setItems([]);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up Firestore listener:", err);
      setItems([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = load();
    return () => {
      unsubscribe?.then(unsub => unsub?.());
    };
  }, [stage]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.map(enrichItem);
    if (q) {
      list = list.filter((item) =>
        [
          item.displayName,
          item.namaPetugasLabel,
          item.pekerjaanLabel,
          item.jenisPekerjaanLabel,
          item.elemenPekerjaanLabel,
          item.sudutPukulLabel,
          item.lokasiLabel,
          item.alamat || "",
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q))
      );
    }

    // Filter by selected date
    if (selectedDate) {
      list = list.filter((item) => getItemDateKey(item) === selectedDate);
    }

    list = [...list].sort((a, b) => {
      const aMs = getCreatedAtMilliseconds(a.createdAt ?? null) ?? 0;
      const bMs = getCreatedAtMilliseconds(b.createdAt ?? null) ?? 0;
      return asc ? aMs - bMs : bMs - aMs;
    });
    return list;
  }, [items, query, asc, selectedDate]);

  // Reset/clamp page when data or filters change
  useEffect(() => {
    setPage(1);
  }, [query, asc, stage, selectedDate]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [filtered.length]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const showDeleteAlert = (item: Item) => {
    setItemToDelete(item);
    setDeleteAlert({
      type: 'warning',
      title: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus laporan "${item.pekerjaan || 'tanpa nama'}"?\n\nData yang sudah dihapus tidak dapat dikembalikan.`,
      show: true
    });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const fb = getFirebaseClient();
    if (!fb) return;

    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const docRef = doc(fb.db, "Progress_Diana", itemToDelete.id);
      await deleteDoc(docRef);

      // Delete notification if exists
      try {
        const notifRef = doc(fb.db, "Progress_Diana_Notifikasi", itemToDelete.id);
        await deleteDoc(notifRef);
      } catch {}

      // Update local state
      setItems(items.filter((x) => x.id !== itemToDelete.id));
      setDeleteAlert(prev => ({ ...prev, show: false }));
      setItemToDelete(null);
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Gagal menghapus laporan");
    }
  };

  const closeDeleteAlert = () => {
    setDeleteAlert(prev => ({ ...prev, show: false }));
    setItemToDelete(null);
  };

  const resetDateFilter = () => {
    setSelectedDate("");
  };

  const handleExportExcel = () => {
    const exportData = filtered;
    if (!exportData.length) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const rows: string[] = [];
    rows.push(`<table border="1" style="border-collapse:collapse;">`);
    rows.push(`<tr><th colspan="2" style="font-size:16px;background:#EEF2FF;">Laporan Tahap ${stage}</th></tr>`);
    rows.push(`<tr><th style="background:#F4F4F5;">Sub Judul</th><th style="background:#F4F4F5;">Isi</th></tr>`);

    exportData.forEach((item, index) => {
      const addRow = (title: string, value: string) => {
        rows.push(`<tr><td>${title}</td><td>${value || "-"}</td></tr>`);
      };

      rows.push(
        `<tr><td colspan="2" style="font-weight:bold;background:#E0F2FE;">No. ${index + 1} - ${item.displayName || "Tanpa Nama"}</td></tr>`
      );

      addRow("Nama Petugas", item.displayName || "-");
      addRow("Keterangan Nama Pekerja", item.namaPetugasLabel || "-");
      addRow("Tanggal Laporan", item.tanggal || "-");
      addRow("Waktu Laporan", item.jam || "-");
      addRow("Lokasi Proyek", item.lokasiLabel || item.alamat || "-");
      addRow(
        "Koordinat GPS",
        item.latitude && item.longitude
          ? `Lat: ${item.latitude} | Lon: ${item.longitude}${item.accuracy ? ` (&plusmn;${Math.round(item.accuracy)}m)` : ""}`
          : "-"
      );
      addRow(isStage4 ? "Kode Benda Uji" : "Pekerjaan", item.pekerjaanLabel || "-");
      addRow(isStage4 ? "Mutu Beton" : "Jenis Pekerjaan", item.jenisPekerjaanLabel || "-");
      if (isStage4) {
        addRow("Elemen Pekerjaan", item.elemenPekerjaanLabel || "-");
        addRow("Sudut Pukul", item.sudutPukulLabel || "-");
      }

      if (Array.isArray(item.answers)) {
        item.answers.forEach((answer: any) => {
          if (!answer || typeof answer.label !== "string") return;
          const label = answer.label;
          const type = String(answer.type || "").toLowerCase();
          if (type === "photo") {
            const url = typeof answer.value === "string" ? answer.value : "";
            addRow(label, url ? `<a href="${url}">${url}</a>` : "-");
          } else {
            const value = answer.value == null ? "" : String(answer.value);
            addRow(label, value);
          }
        });
      }

      if (item.fotoWajibName || item.fotoOpsionalName) {
        addRow(
          "Nama File Foto",
          [item.fotoWajibName, item.fotoOpsionalName].filter(Boolean).join(", ") || "-"
        );
      }

      rows.push(`<tr><td colspan="2" style="height:12px;background:#FFFFFF;"></td></tr>`);
    });

    rows.push(`</table>`);

    const tableHtml = `\uFEFF${rows.join("")}`;
    const blob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-tahap-${stage}-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center text-sm text-neutral-600">List Pekerjaan Tahap {stage}</div>

      {/* Search + Filter Tanggal */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search......."
            className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="button"
            onClick={resetDateFilter}
            className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white text-neutral-700 px-3 py-2 text-xs sm:text-sm shadow-sm hover:bg-neutral-50 whitespace-nowrap"
          >
            Reset
          </button>
        </div>
        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 text-blue-600 px-3 py-2 text-xs sm:text-sm shadow-sm hover:bg-blue-100 whitespace-nowrap"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h6.66V9h3.84L12 2z" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* List */}
      <ul className="space-y-4">
        {paginated.map((item) => (
          <li
            key={item.id}
            className="rounded-3xl border border-neutral-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200"
          >
            <div className="p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-neutral-900 leading-tight">
                      {item.displayName || "Tanpa Nama"}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {item.lokasiLabel || "-"}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {item.fotoCount > 0 && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-600 px-3 py-1 text-xs font-medium ring-1 ring-blue-100">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                            <path d="M21 5a2 2 0 00-2-2h-3.172a2 2 0 01-1.414-.586l-.828-.828A2 2 0 0012.172 1h-2.344a2 2 0 00-1.414.586l-.828.828A2 2 0 006.172 3H3a2 2 0 00-2 2v13a2 2 0 002 2h16a2 2 0 002-2V5zM8 5a1 1 0 011-1h6a1 1 0 011 1v1H8V5zm7 7a3 3 0 11-3-3 3 3 0 013 3z" />
                          </svg>
                          {item.fotoCount} Foto
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 rounded-full bg-purple-50 text-purple-600 px-3 py-1 text-xs font-medium ring-1 ring-purple-100">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {item.waktuLabel || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M12 5c-7.633 0-11 6.5-11 7s3.367 7 11 7 11-6.5 11-7-3.367-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 103 3 3 3 0 00-3-3z" />
                    </svg>
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditItem(item);
                      populateEditFields(item);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => showDeleteAlert(item)}
                    className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                  </button>
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-${isStage4 ? '6' : '4'} gap-3`}>
                <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-slate-50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Keterangan Nama Pekerja</div>
                    <div className="text-sm font-semibold text-neutral-900">{item.namaPetugasLabel || "-"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                      {isStage4 ? "Kode Benda Uji" : "Pekerjaan"}
                    </div>
                    <div className="text-sm font-semibold text-blue-700">{item.pekerjaanLabel || "-"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                      {isStage4 ? "Mutu Beton" : "Jenis Pekerjaan"}
                    </div>
                    <div className="text-sm font-semibold text-indigo-700">{item.jenisPekerjaanLabel || "-"}</div>
                  </div>
                </div>

                {isStage4 && (
                  <div className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Elemen Pekerjaan</div>
                      <div className="text-sm font-semibold text-yellow-700">{item.elemenPekerjaanLabel || "-"}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Lokasi</div>
                    <div className="text-sm font-semibold text-emerald-700">{item.lokasiLabel || "-"}</div>
                  </div>
                </div>

                {isStage4 && (
                  <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Sudut Pukul</div>
                      <div className="text-sm font-semibold text-red-700">{item.sudutPukulLabel || "-"}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="text-center text-sm text-neutral-500 py-10">Belum ada laporan dari petugas untuk tahap ini.</div>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="text-neutral-600">
            Menampilkan {(page - 1) * pageSize + 1}
            {"–"}
            {Math.min(page * pageSize, filtered.length)} dari {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              const buttons: JSX.Element[] = [];
              const go = (p: number) => () => setPage(p);

              // Prev
              buttons.push(
                <button
                  key="prev"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  Prev
                </button>
              );

              // Page numbers (windowed)
              const pageWindow = 2; // show current +/- 2
              const start = Math.max(1, page - pageWindow);
              const end = Math.min(totalPages, page + pageWindow);
              if (start > 1) {
                buttons.push(
                  <button key={1} onClick={go(1)} className={`px-3 py-1.5 rounded-md border ${page === 1 ? "bg-red-500 text-white border-red-500" : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"}`}>
                    1
                  </button>
                );
                if (start > 2) {
                  buttons.push(<span key="dots-start" className="px-2 text-neutral-400">…</span>);
                }
              }
              for (let p = start; p <= end; p++) {
                buttons.push(
                  <button
                    key={p}
                    onClick={go(p)}
                    className={`px-3 py-1.5 rounded-md border ${page === p ? "bg-red-500 text-white border-red-500" : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"}`}
                  >
                    {p}
                  </button>
                );
              }
              if (end < totalPages) {
                if (end < totalPages - 1) {
                  buttons.push(<span key="dots-end" className="px-2 text-neutral-400">…</span>);
                }
                buttons.push(
                  <button key={totalPages} onClick={go(totalPages)} className={`px-3 py-1.5 rounded-md border ${page === totalPages ? "bg-red-500 text-white border-red-500" : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"}`}>
                    {totalPages}
                  </button>
                );
              }

              // Next
              buttons.push(
                <button
                  key="next"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
                >
                  Next
                </button>
              );

              return <>{buttons}</>;
            })()}
          </div>
        </div>
      )}

      {/* Modern Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelected(null)}
          />

          {/* Modal Card */}
          <div
            ref={detailModalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden mx-4 animate-in slide-in-from-bottom-4 duration-500 transform-gpu animate-in zoom-in-98 fade-in duration-400 delay-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu">

              {/* Professional Header */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 border-b border-gray-200 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Detail Laporan</h2>
                      <p className="text-sm text-gray-500 font-medium">Tahap {stage} - ID: {selected.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (!selected) return;
                        populateEditFields(selected);
                        setEditItem(selected);
                        setSelected(null);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit Data
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                      aria-label="Tutup"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[85vh] overflow-y-auto px-8 py-6">

                {/* Status & Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 font-medium">Status</div>
                        <div className="text-sm font-semibold text-green-800">Laporan Masuk</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600 font-medium">Tanggal Laporan</div>
                        <div className="text-sm font-semibold text-blue-800">{selected.tanggal || "-"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-purple-600 font-medium">Waktu Laporan</div>
                        <div className="text-sm font-semibold text-purple-800">{selected.jam || "00:00:00"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Location & Technical Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Informasi Lokasi</h3>

                    <div className="space-y-3">
                      {selected.alamat && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">Lokasi Proyek</div>
                              <div className="text-sm text-gray-600 leading-relaxed">{selected.alamat}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selected.latitude && selected.longitude && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 flex-shrink-0">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">Koordinat GPS</div>
                              <div className="text-xs text-gray-500">
                                Lat: {selected.latitude?.toFixed(6)} | Lon: {selected.longitude?.toFixed(6)}
                                {selected.accuracy && <span className="ml-1">┬▒ {Math.round(selected.accuracy)}m</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Data Laporan</h3>

                    <div className="grid gap-3">
                      {Array.isArray(selected.answers) && selected.answers.length > 0 ? (
                        selected.answers.map((a, idx) => (
                          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 mb-2">{a.label}</div>
                                {a.type === "photo" ? (
                                  (() => {
                                    const url = typeof a.value === "string" ? a.value : "";
                                    if (!url) {
                                      return <div className="text-sm text-gray-500 italic">Tidak ada foto</div>;
                                    }
                                    return (
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => setLightboxUrl(url)}
                                          className="overflow-hidden rounded-lg ring-1 ring-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:ring-blue-300"
                                        >
                                          <img src={url} alt={a.label || "Foto"} className="block h-16 w-16 object-cover" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-xs text-gray-500 mb-1">Klik gambar untuk preview</div>
                                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all">
                                            Lihat foto asli
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                    {String(a.value || "-")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          {selected.nama && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Nama Petugas</div>
                              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                {selected.nama}
                              </div>
                            </div>
                          )}

                          {selected.lokasi && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Lokasi Proyek</div>
                              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                {selected.lokasi}
                              </div>
                            </div>
                          )}

                          {selected.pekerjaan && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Jenis Pekerjaan</div>
                              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                {selected.pekerjaan}
                              </div>
                            </div>
                          )}

                          {(selected.fotoWajibName || selected.fotoOpsionalName) && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">File Foto</div>
                              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 italic">
                                {[selected.fotoWajibName, selected.fotoOpsionalName].filter(Boolean).join(", ") || "Tidak ada foto"}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => showDeleteAlert(selected)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus Laporan
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Photo Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setLightboxUrl(null)}
          />

          {/* Lightbox Card */}
          <div className="relative max-w-5xl max-h-[90vh] animate-in slide-in-from-bottom-4 duration-500 transform-gpu" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform-gpu">

              {/* Header */}
              <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Preview Foto</h3>
                    <p className="text-gray-300 text-sm">Klik area gelap untuk menutup</p>
                  </div>
                </div>

                <button
                  onClick={() => setLightboxUrl(null)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  aria-label="Tutup preview"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>

              {/* Image Container */}
              <div className="relative bg-gray-100 p-6 flex items-center justify-center min-h-[400px]">
                <img
                  src={lightboxUrl}
                  alt="Full size preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />

                {/* Image Info Overlay */}
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                  <div className="text-sm">
                    Klik gambar untuk membuka di tab baru
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Preview foto laporan progress
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={lightboxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6a2 2 0 012 2v1.5a.5.5 0 001 0V8a3 3 0 00-3-3H5a3 3 0 00-3 3v11a3 3 0 003 3h11a3 3 0 003-3v-6a.5.5 0 00-.5-.5H18a.5.5 0 00-.5.5z"/>
                      <path d="M15 3a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-2 0V5.41l-9.79 9.8a1 1 0 01-1.42-1.42L18.59 4H16a1 1 0 010-2z"/>
                    </svg>
                    Buka Full Size
                  </a>
                  <button
                    onClick={() => setLightboxUrl(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Enhanced Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditItem(null)}
          />

          {/* Modal Container */}
          <div
            ref={editModalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

              {/* Professional Header */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 border-b border-gray-200 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Edit Laporan</h2>
                      <p className="text-sm text-gray-500 font-medium">ID: {editItem.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setEditItem(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                    aria-label="Tutup"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Professional Content */}
              <div className="max-h-[85vh] overflow-y-auto px-8 py-6">

                {/* Status & Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-green-600 font-medium">Status</div>
                        <div className="text-sm font-semibold text-green-800">Edit Laporan</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600 font-medium">Tanggal Laporan</div>
                        <div className="text-sm font-semibold text-blue-800">{editTanggal || "-"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-200/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs text-purple-600 font-medium">Waktu Laporan</div>
                        <div className="text-sm font-semibold text-purple-800">{editItem?.jam || "00:00:00"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Location & Technical Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Informasi Lokasi</h3>

                    <div className="space-y-3">
                      {editItem?.alamat && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 flex-shrink-0 mt-0.5">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">Lokasi Proyek</div>
                              <div className="text-sm text-gray-600 leading-relaxed">{editItem.alamat}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {editItem?.latitude && editItem?.longitude && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700 flex-shrink-0">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">Koordinat GPS</div>
                              <div className="text-xs text-gray-500">
                                Lat: {editItem.latitude?.toFixed(6)} | Lon: {editItem.longitude?.toFixed(6)}
                                {editItem.accuracy && <span className="ml-1">┬▒ {Math.round(editItem.accuracy)}m</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Data */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Data Laporan</h3>

                    <form
                      className="grid gap-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!editItem) return;

                        const fb = getFirebaseClient();
                        if (!fb) return;

                        // Use the updated answers from editItem if available, otherwise rebuild from form state
                        let updatedAnswers: { label: string; type: string; value: any }[];

                        if (Array.isArray(editItem.answers) && editItem.answers.length > 0) {
                          // Use the answers array that was updated by the form inputs
                          updatedAnswers = [...editItem.answers];
                        } else {
                          // Fallback to rebuilding from form state variables
                          updatedAnswers = [];

                          // Add all current form values to answers array
                          if (editNama) {
                            updatedAnswers.push({ label: "nama", type: "text", value: editNama });
                          }
                          if (editLokasi) {
                            updatedAnswers.push({ label: "lokasi", type: "text", value: editLokasi });
                          }
                          if (editPekerjaan) {
                            if (isStage4) {
                              updatedAnswers.push({ label: "kode benda", type: "text", value: editPekerjaan });
                            } else {
                              updatedAnswers.push({ label: "pekerjaan", type: "text", value: editPekerjaan });
                            }
                          }
                          if (editElemenPekerjaan) {
                            if (isStage4) {
                              updatedAnswers.push({ label: "mutu beton", type: "text", value: editElemenPekerjaan });
                            } else {
                              updatedAnswers.push({ label: "elemen pekerjaan", type: "text", value: editElemenPekerjaan });
                            }
                          }
                          if (isStage4 && editSudutPukul) {
                            updatedAnswers.push({ label: "sudut pukul", type: "text", value: editSudutPukul });
                          }
                          if (editTanggal) {
                            updatedAnswers.push({ label: "tanggal", type: "text", value: editTanggal });
                          }
                        }

                        // Preserve existing photo answers that weren't edited
                        if (Array.isArray(editItem.answers)) {
                          editItem.answers.forEach(existingAnswer => {
                            if (existingAnswer.type === "photo" && existingAnswer.value) {
                              // Check if this photo answer already exists in updated answers
                              const alreadyExists = updatedAnswers.some(newAnswer =>
                                newAnswer.type === "photo" && newAnswer.value === existingAnswer.value
                              );
                              if (!alreadyExists) {
                                updatedAnswers.push(existingAnswer);
                              }
                            }
                          });
                        }

                        const answersPayload = (updatedAnswers || [])
                          .filter((ans): ans is { label: string; type: string; value: any } => Boolean(ans && ans.label))
                          .map((ans) => ({
                            ...ans,
                            value: ans.value === undefined ? "" : ans.value,
                          }));

                        const sanitizedTanggal =
                          editTanggalIso || editTanggal || editItem.tanggal || "";

                        // Update the editItem with current form values for immediate UI feedback
                        const updatedItem = {
                          ...editItem,
                          nama: editNama,
                          lokasi: editLokasi,
                          pekerjaan: editPekerjaan,
                          elemenPekerjaan: editElemenPekerjaan,
                          tanggal: sanitizedTanggal,
                          answers: answersPayload,
                        };

                        try {
                          const { doc, updateDoc } = await import("firebase/firestore");
                          const docRef = doc(fb.db, "Progress_Diana", editItem.id);

                          // Prepare update data with both legacy fields and answers array
                          const updateData: any = {
                            nama: editNama || "",
                            lokasi: editLokasi || "",
                            pekerjaan: editPekerjaan || "",
                            elemenPekerjaan: editElemenPekerjaan || "",
                            tanggal: sanitizedTanggal || "",
                            answers: answersPayload,
                          };

                          // Only update fields that have values
                          Object.keys(updateData).forEach(key => {
                            if (updateData[key] === "" || updateData[key] === null || updateData[key] === undefined) {
                              delete updateData[key];
                            }
                          });

                          await updateDoc(docRef, updateData);

                          // Update notification if exists
                          try {
                            const notifRef = doc(fb.db, "Progress_Diana_Notifikasi", editItem.id);
                            const message = isStage4
                              ? `${updatedItem.pekerjaan || editItem.pekerjaan} • ${updatedItem.elemenPekerjaan || editItem.elemenPekerjaan} • ${updatedItem.lokasi || editItem.lokasi} • ${editSudutPukul || "-"}`
                              : `${updatedItem.pekerjaan || editItem.pekerjaan} • ${updatedItem.lokasi || editItem.lokasi}`;
                            await updateDoc(notifRef, {
                              message,
                              tanggal: updatedItem.tanggal,
                            });
                          } catch {}

                          // Update local state
                          const next = items.map((x) =>
                            x.id === editItem.id ? updatedItem : x
                          );
                          setItems(next);
                          setEditItem(null);
                        } catch (err) {
                          console.error("Error updating:", err);
                          alert("Gagal memperbarui laporan");
                        }
                      }}
                    >
                      <div className="grid gap-3">
                        {Array.isArray(editItem.answers) && editItem.answers && editItem.answers.length > 0 ? (
                          editItem.answers.map((a, idx) => (
                            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900 mb-2">{a.label}</div>
                                  {a.type === "photo" ? (
                                    (() => {
                                      const url = typeof a.value === "string" ? a.value : "";
                                      if (!url) {
                                        return <div className="text-sm text-gray-500 italic">Tidak ada foto</div>;
                                      }
                                      return (
                                        <div className="flex items-center gap-3">
                                          <img src={url} alt={a.label || "Foto"} className="block h-16 w-16 object-cover rounded-lg ring-1 ring-gray-200 shadow-sm" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-500 mb-1">Foto tidak dapat diedit</div>
                                            <div className="text-xs text-gray-400">Foto hanya dapat dilihat</div>
                                          </div>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <input
                                      ref={idx === 0 ? firstInputRef : null}
                                      type="text"
                                      value={(() => {
                                        // Find the current value for this field
                                        const currentValue = editItem.answers?.[idx]?.value || "";
                                        return String(currentValue);
                                      })()}
                                      onChange={(e) => {
                                        const newValue = e.target.value;
                                        // Update the answers array
                                        const updatedAnswers = [...(editItem.answers || [])];
                                        if (updatedAnswers[idx]) {
                                          updatedAnswers[idx].value = newValue;
                                        }

                                        // Also update the corresponding form state variable
                                        const label = a.label.toLowerCase();
                                        if (label.includes("nama")) {
                                          setEditNama(newValue);
                                        } else if (label.includes("lokasi")) {
                                          setEditLokasi(newValue);
                                        } else if (label.includes("pekerjaan") || (isStage4 && label.includes("kode") && label.includes("benda"))) {
                                          setEditPekerjaan(newValue);
                                        } else if (label.includes("elemen") && label.includes("pekerjaan") || (isStage4 && label.includes("mutu") && label.includes("beton"))) {
                                          setEditElemenPekerjaan(newValue);
                                        } else if (isStage4 && label.includes("sudut") && label.includes("pukul")) {
                                          setEditSudutPukul(newValue);
                                        } else if (label.includes("tanggal")) {
                                          setEditTanggal(newValue);
                                          // Also update the ISO date if it's a valid date
                                          const parsed = normalizeDateToISO(newValue);
                                          if (parsed) {
                                            setEditTanggalIso(parsed);
                                          }
                                        }

                                        // Update the editItem state
                                        setEditItem({ ...editItem, answers: updatedAnswers });
                                      }}
                                      className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                      placeholder="Masukkan nilai"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <>
                            {/* Nama Petugas */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Nama Petugas</div>
                              <input
                                type="text"
                                value={editNama}
                                onChange={(e) => setEditNama(e.target.value)}
                                className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                placeholder="Masukkan nama petugas"
                              />
                            </div>

                            {/* Lokasi Proyek */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Lokasi Proyek</div>
                              <input
                                type="text"
                                value={editLokasi}
                                onChange={(e) => setEditLokasi(e.target.value)}
                                className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus:bg-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                                placeholder="Masukkan lokasi proyek"
                              />
                            </div>

                            {/* Pekerjaan / Kode Benda Uji */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                {isStage4 ? "Kode Benda Uji" : "Jenis Pekerjaan"}
                              </div>
                              <input
                                type="text"
                                value={editPekerjaan}
                                onChange={(e) => setEditPekerjaan(e.target.value)}
                                className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus:bg-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                                placeholder={isStage4 ? "Masukkan kode benda uji" : "Masukkan jenis pekerjaan"}
                              />
                            </div>

                            {/* Elemen Pekerjaan / Mutu Beton */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">
                                {isStage4 ? "Mutu Beton" : "Elemen Pekerjaan"}
                              </div>
                              <input
                                type="text"
                                value={editElemenPekerjaan}
                                onChange={(e) => setEditElemenPekerjaan(e.target.value)}
                                className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                                placeholder={isStage4 ? "Masukkan mutu beton" : "Masukkan elemen pekerjaan"}
                              />
                            </div>

                            {/* Tanggal Laporan */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="text-sm font-medium text-gray-900 mb-2">Tanggal Laporan</div>
                              <input
                                type="date"
                                value={editTanggalIso}
                                onChange={(e) => {
                                  const iso = e.target.value;
                                  setEditTanggalIso(iso);
                                  setEditTanggal(iso ? formatISOToDisplay(iso) : "");
                                }}
                                className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
                              />
                            </div>

                            {/* Sudut Pukul for Stage 4 */}
                            {isStage4 && (
                              <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <div className="text-sm font-medium text-gray-900 mb-2">Sudut Pukul</div>
                                <input
                                  type="text"
                                  value={editSudutPukul}
                                  onChange={(e) => setEditSudutPukul(e.target.value)}
                                  className="w-full text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 focus:bg-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                                  placeholder="Masukkan sudut pukul"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Professional Action Buttons */}
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setEditItem(null)}
                          className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <span className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                              <path d="M5 13l4 4L19 7"/>
                            </svg>
                            Simpan Perubahan
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => showDeleteAlert(editItem)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus Laporan
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {deleteAlert.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={closeDeleteAlert}
          />

          {/* Delete Confirmation Card */}
          <div className="relative w-full max-w-sm animate-in slide-in-from-top-3 duration-500 transform-gpu">
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu animate-in zoom-in-98 fade-in duration-400 delay-100">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100">
                {/* Warning Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 text-sm">{deleteAlert.title}</h3>
                </div>

                {/* Close button */}
                <button
                  onClick={closeDeleteAlert}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-4">
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{deleteAlert.message}</p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-4 py-4 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={closeDeleteAlert}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
