import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, Timestamp, where } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebaseClient";

interface ProgressData {
  id: string;
  nama?: string;
  lokasi?: string;
  pekerjaan?: string;
  keterangan?: string;
  status?: string;
  tanggal?: string;
  jam?: string;
  createdAt?: Timestamp;
  stage?: number;
  progress_percentage?: number;
  answers?: { label: string; type: string; value: any }[];
  photos?: { [key: string]: string };
}

export default function ProgressTable() {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | Timestamp | undefined) => {
    if (!date) return '-';
    
    let jsDate: Date;
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (date instanceof Date) {
      jsDate = date;
    } else {
      return '-';
    }
    
    return jsDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const fb = getFirebaseClient();
    
    // Tambahkan pengecekan eksplisit untuk koneksi Firebase
    if (!fb) {
      console.error('❌ Firebase client tidak tersedia. Periksa konfigurasi environment variables.');
      setError("Koneksi ke Firebase gagal. Pastikan NEXT_PUBLIC_FIREBASE_API_KEY dan variabel lingkungan lainnya sudah dikonfigurasi.");
      setLoading(false);
      return;
    }
    
    console.log('✅ Firebase client berhasil diinisialisasi');
    
    let unsubscribe: () => void;
    
    const run = async () => {
      try {
        const { collection, query: qBuilder, where, onSnapshot, orderBy } = await import(
          "firebase/firestore"
        );
        const col = collection(fb.db, "Progress_Diana");
        
        // Gunakan onSnapshot seperti di komponen admin yang berfungsi
        const q = qBuilder(col, orderBy("createdAt", "desc"));

        unsubscribe = onSnapshot(
          q,
          (snap) => {
            if (snap.empty) {
              console.log('⚠️ Query returned empty result. Collection might be empty or have different name.');
              setProgressData([]);
              setError(null);
              setLoading(false);
              return;
            }
            
            const fetchedItems = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as any)
            })) as ProgressData[];
            
            console.log('Firestore snapshot received:', {
              docsCount: snap.size,
              hasDocs: !snap.empty
            });
            
            setProgressData(fetchedItems);
            setError(null);
            setLoading(false);
          },
          (err) => {
            console.error("❌ Firestore error:", err);
            setError("Gagal memuat data dari Firestore. Detail: " + (err instanceof Error ? err.message : String(err)));
            setProgressData([]);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error setting up Firestore listener:", err);
        setError("Gagal menginisialisasi koneksi ke Firestore. Detail: " + (err instanceof Error ? err.message : String(err)));
        setProgressData([]);
        setLoading(false);
      }
    };

    run();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (loading) return <div className="text-center py-4">Memuat data dari Firestore...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (progressData.length === 0) return <div className="text-center py-4 text-gray-500">Tidak ada data ditemukan di koleksi Progress_Diana. Silakan periksa:
    <ul className="mt-2 text-sm">
      <li>1. Apakah environment variables Firebase sudah dikonfigurasi?</li>
      <li>2. Apakah nama koleksi benar (Progress_Diana)?</li>
      <li>3. Apakah ada data di Firestore?</li>
      <li>4. Apakah aturan keamanan Firestore mengizinkan pembacaan?</li>
    </ul>
  </div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pekerjaan</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahap</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu Input</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {progressData.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Tidak ada data ditemukan</td>
            </tr>
          ) : (
            progressData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nama || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.lokasi || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pekerjaan || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.stage || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.progress_percentage !== undefined ? `${item.progress_percentage}%` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggal || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.createdAt ? formatDate(item.createdAt) : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}