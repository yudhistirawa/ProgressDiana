"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";

type ProgressItem = {
  id: string;
  stage: number;
  nama?: string;
  lokasi?: string;
  pekerjaan?: string;
  answers?: { label: string; type: string; value: any }[];
  tanggal: string;
  jam?: string;
  latitude: number | null;
  longitude: number | null;
  alamat: string | null;
  createdAt: number;
};

type SummaryStats = {
  totalReports: number;
  totalStages: number;
  totalWorkers: number;
  totalLocations: number;
  reportsByStage: { [key: number]: number };
  reportsByMonth: { [key: string]: number };
  topWorkers: { name: string; count: number }[];
  topLocations: { name: string; count: number }[];
  recentActivity: ProgressItem[];
};

type CustomFormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "time" | "select" | "checkbox" | "radio" | "photo";
  required: boolean;
  options?: string[]; // for select, radio, checkbox
  placeholder?: string;
};

type CustomForm = {
  id: string;
  title: string;
  description?: string;
  fields: CustomFormField[];
  createdAt: number;
  updatedAt: number;
};

export default function RekapProgressClient() {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});
  const [stageFilter, setStageFilter] = useState<number | null>(null);

  // Tab management - Only admin input now
  const [activeTab, setActiveTab] = useState<'admin-input'>('admin-input');

  // Custom Forms Management
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [previewForm, setPreviewForm] = useState<CustomForm | null>(null);
  const [formResponses, setFormResponses] = useState<{ [key: string]: any }>({});

  // Photo preview state
  const [photoPreviews, setPhotoPreviews] = useState<{ [key: string]: string }>({});

  // Listen to file input changes inside the preview modal to build client previews
  useEffect(() => {
    if (!previewForm) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      if (!target) return;
      if (target.type === 'file' && target.name) {
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setPhotoPreviews((prev) => ({ ...prev, [target.name]: url }));
        }
      }
    };
    document.addEventListener('change', handler, true);
    return () => document.removeEventListener('change', handler, true);
  }, [previewForm]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const fb = getFirebaseClient();
      if (!fb) {
        setLoading(false);
        return;
      }

      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const col = collection(fb.db, "Progress_Diana");

        const unsubscribe = onSnapshot(
          col,
          (snap) => {
            const progressItems: ProgressItem[] = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as any),
            }));
            setItems(progressItems);
            setLoading(false);
          },
          (err) => {
            console.error("❌ Firestore error:", err);
            setItems([]);
            setLoading(false);
          }
        );

        return unsubscribe;
      } catch (err) {
        console.error("Error setting up Firestore listener:", err);
        setItems([]);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load custom forms from localStorage
  useEffect(() => {
    const savedForms = localStorage.getItem('rekap-custom-forms');
    if (savedForms) {
      try {
        setCustomForms(JSON.parse(savedForms));
      } catch (err) {
        console.error('Error loading custom forms:', err);
      }
    }
  }, []);

  // Save custom forms to localStorage
  const saveCustomForms = (forms: CustomForm[]) => {
    setCustomForms(forms);
    localStorage.setItem('rekap-custom-forms', JSON.stringify(forms));
  };

  // deleteCustomForm is defined later (single definition)

  // Submit a dynamic admin form into Progress_Diana with photo uploads
  const submitAdminCustomForm = async (data: { [key: string]: any }, activeForm: CustomForm) => {
    const fb = getFirebaseClient();
    if (!fb) throw new Error('Firebase client not available');

    const { collection, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

    // Create a new document ID first so storage paths can include it
    const col = collection(fb.db, 'Progress_Diana');
    const docRef = doc(col);
    const recId = docRef.id;

    // Build answers and upload photos
    const answers: { label: string; type: string; value: any }[] = [];
    const photos: { [key: string]: string } = {};

    // Infer common fields from labels (optional)
    let nama = '';
    let lokasi = '';
    let pekerjaan = '';

    const toStr = (v: any) => typeof v === 'string' ? v : (v == null ? '' : String(v));

    // Map answers based on the provided active form
    if (activeForm) {
      for (const field of activeForm.fields) {
        const raw = data[field.id];
        if (field.type === 'photo') {
          const isFile = raw && typeof raw === 'object' && 'size' in (raw as any) && 'name' in (raw as any);
          if (isFile) {
            const path = `Progress_Diana/${recId}/${field.id}_${Date.now()}_${raw.name}`;
            const storageRef = ref(fb.storage, path);
            await uploadBytes(storageRef, raw as Blob);
            const url = await getDownloadURL(storageRef);
            photos[field.id] = url;
            answers.push({ label: field.label, type: 'photo', value: url });
          } else if (typeof raw === 'string' && raw) {
            photos[field.id] = raw;
            answers.push({ label: field.label, type: 'photo', value: raw });
          } else {
            answers.push({ label: field.label, type: 'photo', value: '' });
          }
        } else {
          const value = toStr(raw);
          answers.push({ label: field.label, type: field.type, value });
          const lower = field.label.toLowerCase();
          if (!nama && lower.includes('nama')) nama = value;
          if (!lokasi && (lower.includes('lokasi') || lower.includes('alamat'))) lokasi = value;
          if (!pekerjaan && (lower.includes('pekerjaan') || lower.includes('kegiatan'))) pekerjaan = value;
        }
      }
    }

    const now = new Date();
    const tanggal = (typeof (data as any).admin_date === 'string' && (data as any).admin_date)
      ? String((data as any).admin_date)
      : now.toISOString().slice(0, 10);
    const jam = (typeof (data as any).admin_time === 'string' && (data as any).admin_time)
      ? String((data as any).admin_time).padEnd(5, '0')
      : now.toTimeString().slice(0, 8);

    const payload = {
      id: recId,
      stage: 1, // default for admin input; can be extended to choose stage
      nama,
      lokasi,
      pekerjaan,
      tanggal,
      jam,
      latitude: null,
      longitude: null,
      accuracy: null,
      alamat: lokasi || null,
      jenis_pekerjaan: pekerjaan || '',
      durasi_jam: 0,
      progress_percentage: 0,
      catatan_admin: '',
      photos,
      formTitle: activeForm.title,
      formSource: 'admin-custom-form',
      dataType: 'historical',
      createdAt: serverTimestamp(),
      ts: serverTimestamp(),
      updatedAt: serverTimestamp(),
      inputTimestamp: now.toISOString(),
      answers,
    } as any;

    await setDoc(docRef, payload);
  };

  // Delete custom form
  const deleteCustomForm = (formId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus formulir ini?')) {
      const updatedForms = customForms.filter(form => form.id !== formId);
      saveCustomForms(updatedForms);
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (dateFilter.start && dateFilter.end) {
      filtered = filtered.filter(item => {
        const itemDate = item.tanggal;
        return itemDate >= dateFilter.start! && itemDate <= dateFilter.end!;
      });
    }

    if (stageFilter !== null) {
      filtered = filtered.filter(item => item.stage === stageFilter);
    }

    return filtered;
  }, [items, dateFilter, stageFilter]);

  const summaryStats: SummaryStats = useMemo(() => {
    const totalReports = filteredItems.length;
    const totalStages = new Set(filteredItems.map(item => item.stage)).size;
    const workersSet = new Set<string>();
    const locationsSet = new Set<string>();

    const reportsByStage: { [key: number]: number } = {};
    const reportsByMonth: { [key: string]: number } = {};

    filteredItems.forEach(item => {
      // Count by stage
      reportsByStage[item.stage] = (reportsByStage[item.stage] || 0) + 1;

      // Count by month
      const month = item.tanggal.substring(0, 7); // YYYY-MM format
      reportsByMonth[month] = (reportsByMonth[month] || 0) + 1;

      // Collect unique workers and locations
      if (item.nama) workersSet.add(item.nama);
      if (item.lokasi || item.alamat) {
        locationsSet.add(item.lokasi || item.alamat || '');
      }
    });

    // Top workers
    const workerCounts: { [key: string]: number } = {};
    filteredItems.forEach(item => {
      if (item.nama) {
        workerCounts[item.nama] = (workerCounts[item.nama] || 0) + 1;
      }
    });

    const topWorkers = Object.entries(workerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top locations
    const locationCounts: { [key: string]: number } = {};
    filteredItems.forEach(item => {
      const location = item.lokasi || item.alamat || 'Tidak ada lokasi';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent activity (last 10 items)
    const recentActivity = [...filteredItems]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return {
      totalReports,
      totalStages,
      totalWorkers: workersSet.size,
      totalLocations: locationsSet.size,
      reportsByStage,
      reportsByMonth,
      topWorkers,
      topLocations,
      recentActivity,
    };
  }, [filteredItems]);

  const exportSummary = () => {
    const data = {
      summary: {
        totalReports: summaryStats.totalReports,
        totalStages: summaryStats.totalStages,
        totalWorkers: summaryStats.totalWorkers,
        totalLocations: summaryStats.totalLocations,
        dateRange: dateFilter.start && dateFilter.end ? `${dateFilter.start} - ${dateFilter.end}` : 'Semua periode',
        exportDate: new Date().toLocaleString('id-ID'),
      },
      reportsByStage: summaryStats.reportsByStage,
      reportsByMonth: summaryStats.reportsByMonth,
      topWorkers: summaryStats.topWorkers,
      topLocations: summaryStats.topLocations,
      recentActivity: summaryStats.recentActivity.map(item => ({
        id: item.id,
        tanggal: item.tanggal,
        jam: item.jam,
        nama: item.nama,
        lokasi: item.lokasi || item.alamat,
        pekerjaan: item.pekerjaan,
        stage: item.stage,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekap-progress-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Convert image to WebP format
  const convertToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx?.drawImage(img, 0, 0);

        // Convert to WebP
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(webpFile);
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        }, 'image/webp', 0.8); // 80% quality
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload photo to Firebase Storage
  const uploadPhotoToStorage = async (file: File, fileName: string): Promise<string> => {
    try {
      const fb = getFirebaseClient();
      if (!fb) throw new Error('Firebase client tidak tersedia');

      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const storage = getStorage(fb.app);

      // Convert to WebP if it's an image
      let fileToUpload = file;
      if (file.type.startsWith('image/') && file.type !== 'image/webp') {
        try {
          fileToUpload = await convertToWebP(file);
          console.log(`✅ Converted ${file.name} to WebP format`);
        } catch (error) {
          console.warn('⚠️ Failed to convert to WebP, using original file:', error);
        }
      }

      const storageRef = ref(storage, `progress-photos/${Date.now()}-${fileName}`);
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log(`✅ Photo uploaded successfully: ${downloadURL}`);
      return downloadURL;

    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      throw error;
    }
  };

  // Submit form data to Firebase
  const submitFormToProgress = async (formData: { [key: string]: any }, formTitle: string) => {
    try {
      const fb = getFirebaseClient();
      if (!fb) {
        alert('Firebase client tidak tersedia');
        return;
      }

      const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

      // Handle photo uploads first
      const photoFields = ['upload_foto_1', 'upload_foto_2', 'upload_foto_3', 'upload_foto_4', 'foto_dokumentasi'];
      const photoUploads = [];

      for (const fieldId of photoFields) {
        const fileInput = document.querySelector(`input[type="file"][name="${fieldId}"]`) as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          try {
            const photoURL = await uploadPhotoToStorage(fileInput.files[0], `${fieldId}_${Date.now()}.webp`);
            formData[fieldId] = photoURL;
            photoUploads.push(fieldId);
          } catch (error) {
            console.error(`❌ Failed to upload photo for ${fieldId}:`, error);
            alert(`Gagal mengupload foto untuk ${fieldId}. Menggunakan data tanpa foto.`);
          }
        }
      }

      // Map form data to Progress_Diana format for historical data entry
      const progressData = {
        // Basic info
        nama: formData.nama || '',
        lokasi: formData.lokasi_proyek || '',
        pekerjaan: formData.pekerjaan || '',
        stage: 1, // Default stage for admin-entered historical data

        // Date and time (manual input for historical data)
        tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
        jam: formData.jam || new Date().toTimeString().slice(0, 5),

        // Location (GPS) - bisa kosong jika manual input
        latitude: null,
        longitude: null,
        alamat: null, // Admin historical data doesn't need GPS

        // Additional data from historical form
        jenis_pekerjaan: formData.jenis_pekerjaan || '',
        durasi_jam: formData.durasi_jam ? Number(formData.durasi_jam) : 0,
        progress_percentage: formData.progress_percentage ? Number(formData.progress_percentage) : 0,
        catatan_admin: formData.catatan_admin || '',

        // Photo data
        photos: photoFields.reduce((acc, fieldId) => {
          if (formData[fieldId]) {
            acc[fieldId] = formData[fieldId];
          }
          return acc;
        }, {} as { [key: string]: string }),

        // Form metadata
        formTitle: formTitle,
        formSource: 'admin-historical-form',
        dataType: 'historical', // Mark as historical data entry

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        inputTimestamp: new Date().toISOString(), // When admin entered this data

        // Store all form responses as answers array
        answers: Object.entries(formData).map(([fieldId, value]) => ({
          fieldId,
          value,
          timestamp: new Date().toISOString()
        }))
      };

      const docRef = await addDoc(collection(fb.db, "Progress_Diana"), progressData);

      console.log("✅ Historical progress data berhasil disimpan dengan ID:", docRef.id);

      // Show detailed success message
      const photoMessage = photoUploads.length > 0 ?
        `\n📸 Foto berhasil diupload: ${photoUploads.length} file` : '';

      alert(`✅ Data historis berhasil disimpan!\n\nDetail:\n- Nama: ${progressData.nama}\n- Lokasi: ${progressData.lokasi}\n- Tanggal: ${progressData.tanggal}\n- Jam: ${progressData.jam}\n- Progress: ${progressData.progress_percentage}%\n- Durasi: ${progressData.durasi_jam} jam${photoMessage}\n\nData akan muncul di laporan progress sesuai tanggal pelaksanaan.`);

      return docRef.id;

    } catch (error) {
      console.error("❌ Error saving historical progress data:", error);
      alert(`❌ Gagal menyimpan data historis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
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
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Input Data Progress Admin</h1>
          <p className="text-gray-600 mt-1">Input manual data progress untuk keperluan administrasi</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const now = Date.now();
              setEditingForm({
                id: `temp-${now}`,
                title: 'Form Input Admin',
                description: 'Buat field teks dan foto sesuai kebutuhan',
                fields: [
                  { id: 'nama', label: 'Nama Pekerja', type: 'text', required: true },
                  { id: 'lokasi', label: 'Lokasi Proyek', type: 'text', required: true },
                  { id: 'pekerjaan', label: 'Jenis Pekerjaan', type: 'text', required: true },
                  { id: 'foto', label: 'Upload Foto', type: 'photo', required: true },
                ],
                createdAt: now,
                updatedAt: now,
              });
              setShowFormBuilder(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z" />
            </svg>
            Form Input Admin
          </button>
          <button
            onClick={exportSummary}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl ring-1 ring-emerald-300 hover:bg-emerald-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              <path d="M12,11L10,13L8,11V16H16V11L14,13L12,11Z" />
            </svg>
            Export Data
          </button>
        </div>
      </div>

      {/* Form Admin Saya */}
      <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Form Admin Saya</h3>
          <button
            onClick={() => {
              const now = Date.now();
              setEditingForm({
                id: `temp-${now}`,
                title: 'Form Input Admin',
                description: 'Buat field teks dan foto sesuai kebutuhan',
                fields: [
                  { id: 'nama', label: 'Nama Pekerja', type: 'text', required: true },
                  { id: 'lokasi', label: 'Lokasi Proyek', type: 'text', required: true },
                  { id: 'pekerjaan', label: 'Jenis Pekerjaan', type: 'text', required: true },
                  { id: 'foto', label: 'Upload Foto', type: 'photo', required: true },
                ],
                createdAt: now,
                updatedAt: now,
              });
              setShowFormBuilder(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z" />
            </svg>
            Buat Form
          </button>
        </div>

        {customForms.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Belum ada form admin. Klik "Buat Form" untuk mulai.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customForms.map((f) => (
              <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{f.title}</div>
                    {f.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">{f.description}</div>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500">{new Date(f.updatedAt).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="mt-3 text-xs text-gray-600">{f.fields.length} field</div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setPreviewForm(f)}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                  >
                    Isi
                  </button>
                  <button
                    onClick={() => { setEditingForm(f); setShowFormBuilder(true); }}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-white text-gray-700 ring-1 ring-gray-300 text-xs font-medium hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCustomForm(f.id)}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 text-xs font-medium hover:bg-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {activeTab === 'admin-input' && (
        <div className="space-y-6">
          {/* Admin Input Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Input Data Progress Admin</h2>
              <p className="text-gray-600 mt-1">Input manual data progress untuk keperluan administrasi</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Create default admin input form
                  const newForm: CustomForm = {
                    id: `admin-input-${Date.now()}`,
                    title: 'Input Data Progress Manual',
                    description: 'Form untuk input manual data progress oleh admin',
                    fields: [
                      {
                        id: 'nama',
                        label: 'Nama Pekerja',
                        type: 'text',
                        required: true,
                        placeholder: 'Nama pekerja yang mengerjakan'
                      },
                      {
                        id: 'lokasi_proyek',
                        label: 'Lokasi Proyek',
                        type: 'text',
                        required: true,
                        placeholder: 'Lokasi proyek'
                      },
                      {
                        id: 'jenis_pekerjaan',
                        label: 'Jenis Pekerjaan',
                        type: 'text',
                        required: true,
                        placeholder: 'Jenis pekerjaan yang dilakukan'
                      },
                      {
                        id: 'pekerjaan',
                        label: 'Detail Pekerjaan',
                        type: 'textarea',
                        required: true,
                        placeholder: 'Detail pekerjaan yang dilakukan'
                      },
                      {
                        id: 'tanggal',
                        label: 'Tanggal Pelaksanaan',
                        type: 'date',
                        required: true,
                        placeholder: ''
                      },
                      {
                        id: 'jam',
                        label: 'Jam Pelaksanaan',
                        type: 'time',
                        required: true,
                        placeholder: ''
                      },
                      {
                        id: 'durasi_jam',
                        label: 'Durasi (Jam)',
                        type: 'number',
                        required: true,
                        placeholder: 'Jumlah jam kerja'
                      },
                      {
                        id: 'progress_percentage',
                        label: 'Progress (%)',
                        type: 'number',
                        required: true,
                        placeholder: 'Persentase progress (0-100)'
                      },
                      {
                        id: 'foto_dokumentasi',
                        label: 'Foto Dokumentasi',
                        type: 'photo',
                        required: false,
                        placeholder: ''
                      },
                      {
                        id: 'catatan_admin',
                        label: 'Catatan Admin',
                        type: 'textarea',
                        required: false,
                        placeholder: 'Catatan tambahan dari admin'
                      }
                    ],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  };
                  setEditingForm(newForm);
                  setShowFormBuilder(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Form Input Admin
              </button>
            </div>
          </div>

          {/* Quick Input Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 ring-1 ring-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Input Hari Ini</p>
                  <p className="text-3xl font-bold text-blue-900">-</p>
                </div>
                <div className="h-12 w-12 bg-blue-200 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 ring-1 ring-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Input Bulan Ini</p>
                  <p className="text-3xl font-bold text-green-900">-</p>
                </div>
                <div className="h-12 w-12 bg-green-200 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-green-600" fill="currentColor">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M11,7V13L16.2,16.2L17,14.9L12.5,12.2V7H11Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 ring-1 ring-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Rata-rata Progress</p>
                  <p className="text-3xl font-bold text-purple-900">-</p>
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
                  <p className="text-orange-600 text-sm font-medium">Total Foto</p>
                  <p className="text-3xl font-bold text-orange-900">-</p>
                </div>
                <div className="h-12 w-12 bg-orange-200 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-orange-600" fill="currentColor">
                    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 10 2.5-3 2 2.5L15 12l3 3H8Z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-blue-900">Input Harian</p>
                    <p className="text-xs text-blue-600">Progress harian</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="currentColor">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-green-900">Input Mingguan</p>
                    <p className="text-xs text-green-600">Progress mingguan</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-600" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-purple-900">Input Khusus</p>
                    <p className="text-xs text-purple-600">Input khusus</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-600" fill="currentColor">
                      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 10 2.5-3 2 2.5L15 12l3 3H8Z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-orange-900">Batch Upload</p>
                    <p className="text-xs text-orange-600">Upload banyak foto</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Admin Inputs */}
          <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Input Admin Terbaru</h3>
            <div className="text-center py-12 text-gray-500">
              <svg viewBox="0 0 24 24" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">Belum ada input admin</p>
              <p className="text-sm text-gray-600">Input data progress pertama Anda</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Builder Modal - Simplified like Kelola Formulir & Tahapan */}
      {showFormBuilder && editingForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Lengkapi Formulir</h3>
                <button
                  onClick={() => {
                    setShowFormBuilder(false);
                    setEditingForm(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Basic Form Info */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Judul Formulir</label>
                    <input
                      type="text"
                      value={editingForm.title || ''}
                      onChange={(e) => setEditingForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Masukkan judul formulir"
                      className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi (Opsional)</label>
                    <input
                      type="text"
                      value={editingForm.description || ''}
                      onChange={(e) => setEditingForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Deskripsi singkat formulir"
                      className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fields Section - Simplified like the screenshot */}
              <div className="mb-6">
                <div className="flex items-center justify-end mb-4">
                  <button
                    onClick={() => {
                      const newField: CustomFormField = {
                        id: Date.now().toString(),
                        label: 'Field Baru',
                        type: 'text',
                        required: false,
                        placeholder: ''
                      };
                      setEditingForm(prev => prev ? {
                        ...prev,
                        fields: [...prev.fields, newField]
                      } : null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z" />
                    </svg>
                    Tambah Field
                  </button>
                </div>

                <div className="space-y-3">
                  {editingForm.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      {/* Field Name with Edit Icon */}
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-medium text-gray-900">{field.label}</span>
                        <button
                          onClick={() => {
                            const newLabel = prompt('Masukkan nama field:', field.label);
                            if (newLabel && newLabel.trim()) {
                              const updatedFields = [...editingForm.fields];
                              updatedFields[index] = { ...field, label: newLabel.trim() };
                              setEditingForm(prev => prev ? { ...prev, fields: updatedFields } : null);
                            }
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/>
                          </svg>
                        </button>
                      </div>

                      {/* Field Type Dropdown */}
                      <div className="relative">
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const updatedFields = [...editingForm.fields];
                            updatedFields[index] = {
                              ...field,
                              type: e.target.value as CustomFormField['type']
                            };
                            setEditingForm(prev => prev ? { ...prev, fields: updatedFields } : null);
                          }}
                          className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                        >
                          <option value="text">Field Teks</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="photo">Upload Foto</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="currentColor">
                            <path d="M7 10l5 5 5-5H7z"/>
                          </svg>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {/* Move Up */}
                        <button
                          onClick={() => {
                            if (index > 0) {
                              const updatedFields = [...editingForm.fields];
                              [updatedFields[index - 1], updatedFields[index]] = [updatedFields[index], updatedFields[index - 1]];
                              setEditingForm(prev => prev ? { ...prev, fields: updatedFields } : null);
                            }
                          }}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Pindah ke atas"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M12 6 6 12h12L12 6Z"/>
                          </svg>
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => {
                            if (index < editingForm.fields.length - 1) {
                              const updatedFields = [...editingForm.fields];
                              [updatedFields[index], updatedFields[index + 1]] = [updatedFields[index + 1], updatedFields[index]];
                              setEditingForm(prev => prev ? { ...prev, fields: updatedFields } : null);
                            }
                          }}
                          disabled={index === editingForm.fields.length - 1}
                          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Pindah ke bawah"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M12 18 18 12H6l6 6Z"/>
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (editingForm.fields.length > 1) {
                              const updatedFields = editingForm.fields.filter((_, i) => i !== index);
                              setEditingForm(prev => prev ? { ...prev, fields: updatedFields } : null);
                            }
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus field"
                          disabled={editingForm.fields.length <= 1}
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowFormBuilder(false);
                    setEditingForm(null);
                  }}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (editingForm) {
                      const now = Date.now();
                      const updatedForm = {
                        ...editingForm,
                        updatedAt: now,
                        ...(editingForm.id.startsWith('temp-') && {
                          id: `form-${now}`,
                          createdAt: now
                        })
                      };

                      const existingIndex = customForms.findIndex(f => f.id === editingForm.id);
                      if (existingIndex >= 0) {
                        const updatedForms = [...customForms];
                        updatedForms[existingIndex] = updatedForm;
                        saveCustomForms(updatedForms);
                      } else {
                        saveCustomForms([...customForms, updatedForm]);
                      }

                      setShowFormBuilder(false);
                      setEditingForm(null);
                    }
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-gray-600 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Preview Modal */}
      {previewForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Laporan Tahap 1</h3>
                </div>
                <button
                  onClick={() => setPreviewForm(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Form Title */}
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-900 text-center">Upload Foto Progress</h4>
              </div>

              <form className="space-y-5">
                {/* Custom Tanggal & Waktu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Pelaksanaan</label>
                    <input
                      type="date"
                      name="admin_date"
                      defaultValue={new Date().toISOString().slice(0,10)}
                      className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Waktu Pelaksanaan</label>
                    <input
                      type="time"
                      name="admin_time"
                      defaultValue={(new Date().toTimeString()).slice(0,5)}
                      className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {previewForm.fields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        name={field.id}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        name={field.id}
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        name={field.id}
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        type="date"
                        name={field.id}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {field.type === 'time' && (
                      <input
                        type="time"
                        name={field.id}
                        className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}

                    {field.type === 'photo' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="hidden flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors cursor-pointer">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                              <path d="M14.25 2.26l-.08-.04-.01.02C13.46 2.09 12.74 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-.74-.09-1.46-.24-2.16l.02-.01-.04-.08C21.05 8.99 20.26 8.26 19.5 8.26c-.28 0-.5.22-.5.5 0 .28.22.5.5.5.28 0 .5-.22.5-.5 0-.28-.22-.5-.5-.5-.76 0-1.55.73-2.24 1.49zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                            </svg>
                            Kamera
                            <input
                              type="file"
                              name={field.id}
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onInput={(e) => {
                                const input = e.target as HTMLInputElement;
                                const file = input.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setPhotoPreviews(prev => ({ ...prev, [field.id]: url }));
                                }
                              }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  console.log(`📸 Selected photo for ${field.label}:`, file.name);
                                }
                              }}
                            />
                          </label>
                          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                              <path d="M12,11L10,13L8,11V16H16V11L14,13L12,11Z"/>
                            </svg>
                            Pilih File
                            <input
                              type="file"
                              name={field.id}
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  console.log(`📸 Selected photo for ${field.label}:`, file.name);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                          <svg viewBox="0 0 24 24" className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            <path d="M12,11L10,13L8,11V16H16V11L14,13L12,11Z"/>
                          </svg>
                          {photoPreviews[field.id] ? (
                            <img src={photoPreviews[field.id]} alt={`Preview ${field.label}`} className="max-h-60 rounded-md object-contain mx-auto" />
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                <path d="M12,11L10,13L8,11V16H16V11L14,13L12,11Z"/>
                              </svg>
                              <p className="text-sm text-gray-600">Belum ada foto yang dipilih</p>
                              <p className="text-xs text-gray-500 mt-1">Klik tombol "Pilih File" untuk upload foto</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {field.type === 'select' && field.options && (
                      <select name={field.id} className="w-full rounded-xl border-0 ring-1 ring-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Pilih opsi...</option>
                        {field.options.map((option, idx) => (
                          <option key={idx} value={option}>{option}</option>
                        ))}
                      </select>
                    )}

                    {field.type === 'radio' && field.options && (
                      <div className="space-y-2">
                        {field.options.map((option, idx) => (
                          <label key={idx} className="flex items-center gap-3">
                            <input type="radio" name={field.id} value={option} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {field.type === 'checkbox' && field.options && (
                      <div className="space-y-2">
                        {field.options.map((option, idx) => (
                          <label key={idx} className="flex items-center gap-3">
                            <input type="checkbox" name={field.id} value={option} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setPreviewForm(null)}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        // Collect form data
                        const form = document.querySelector('form');
                        if (!form) {
                          alert('Form tidak ditemukan');
                          return;
                        }

                        const formData = new FormData(form);
                        const data: { [key: string]: any } = {};

                        // Convert FormData to object
                        for (let [key, value] of formData.entries()) {
                          data[key] = value;
                        }

                        // Validate required fields
                        const requiredFields = previewForm.fields.filter(field => field.required);
                        const missingFields = [];

                        for (const field of requiredFields) {
                          const v = data[field.id];
                          if (field.type === 'photo') {
                            if (!(v instanceof File) || v.size === 0) {
                              missingFields.push(field.label);
                            }
                          } else {
                            const s = typeof v === 'string' ? v : String(v ?? '');
                            if (!s || s.trim() === '') missingFields.push(field.label);
                          }
                        }

                        if (missingFields.length > 0) {
                          alert(`Harap lengkapi field yang wajib diisi:\n- ${missingFields.join('\n- ')}`);
                          return;
                        }

                        // Submit to Firebase
                        await submitAdminCustomForm(data, previewForm);
                        setPreviewForm(null);

                      } catch (error) {
                        console.error('Error submitting form:', error);
                        alert('Terjadi kesalahan saat menyimpan data');
                      }
                    }}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Submit & Simpan ke Progress
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
