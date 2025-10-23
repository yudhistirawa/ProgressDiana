"use client";
import { useEffect, useState } from "react";
import { getFirebaseClient } from "../../../lib/firebaseClient";

// Re-using the Item type, but it will have deletedAt
type DeletedItem = {
  id: string;
  deletedAt: number;
  pekerjaan?: string;
  lokasi?: string;
  [key: string]: any;
};

export default function SampahClient() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadDeletedItems = async () => {
      const fb = getFirebaseClient();
      if (!fb) {
        setLoading(false);
        return;
      }

      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const q = query(collection(fb.db, "Progress_Diana_Deleted"), orderBy("deletedAt", "desc"));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const deletedItems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as DeletedItem));
        setItems(deletedItems);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching deleted items:", error);
        setLoading(false);
      });
    };

    loadDeletedItems();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleRestore = async (item: DeletedItem) => {
    if (!confirm(`Apakah Anda yakin ingin memulihkan laporan "${item.pekerjaan || item.id}"?`)) return;

    const fb = getFirebaseClient();
    if (!fb) return;
    const { doc, getDoc, setDoc, deleteDoc } = await import("firebase/firestore");

    const deletedDocRef = doc(fb.db, "Progress_Diana_Deleted", item.id);
    
    try {
        const docSnap = await getDoc(deletedDocRef);
        if (docSnap.exists()) {
            const { deletedAt, ...originalData } = docSnap.data();
            const originalDocRef = doc(fb.db, "Progress_Diana", item.id);
            
            await setDoc(originalDocRef, originalData);
            await deleteDoc(deletedDocRef);
            
            alert("Laporan berhasil dipulihkan.");
        }
    } catch (err) {
        console.error("Error restoring document:", err);
        alert("Gagal memulihkan laporan.");
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    if (!confirm(`PERINGATAN: Laporan "${item.pekerjaan || item.id}" akan dihapus permanen. Aksi ini tidak dapat dibatalkan. Lanjutkan?`)) return;

    const fb = getFirebaseClient();
    if (!fb) return;
    const { doc, deleteDoc } = await import("firebase/firestore");

    const deletedDocRef = doc(fb.db, "Progress_Diana_Deleted", item.id);

    try {
        await deleteDoc(deletedDocRef);
        alert("Laporan berhasil dihapus permanen.");
    } catch (err) {
        console.error("Error permanently deleting document:", err);
        alert("Gagal menghapus laporan secara permanen.");
    }
  };

  if (loading) {
    return <div className="text-center py-10">Memuat data sampah...</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-10 text-neutral-500">Tempat sampah kosong.</div>;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-800 truncate">{item.pekerjaan || "Tanpa Judul"}</p>
                <p className="text-sm text-neutral-600 truncate">{item.lokasi || "Tanpa Lokasi"}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Dihapus pada: {new Date(item.deletedAt).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleRestore(item)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  Pulihkan
                </button>
                <button
                  onClick={() => handlePermanentDelete(item)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
