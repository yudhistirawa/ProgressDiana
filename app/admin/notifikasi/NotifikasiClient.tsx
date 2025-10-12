"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "../../../lib/firebaseClient";

type Notif = {
  id: string;
  stage: number;
  title: string;
  message: string;
  tanggal: string;
  jam: string;
  createdAt: number;
  read: boolean;
};

export default function NotifikasiClient() {
  const [items, setItems] = useState<Notif[]>([]);
  const [query, setQuery] = useState("");
  const [asc, setAsc] = useState(false);

  const loadFeed = async () => {
    const fb = getFirebaseClient();
    if (!fb) {
      setItems([]);
      return;
    }
    
    try {
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      const col = collection(fb.db, "Progress_Diana_Notifikasi");
      const q = query(col, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const notifications = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notif[];
      setItems(notifications);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setItems([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      const fb = getFirebaseClient();
      if (!fb) {
        setItems([]);
        return;
      }

      try {
        const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
        const col = collection(fb.db, "Progress_Diana_Notifikasi");
        const q = query(col, orderBy("createdAt", "desc"));

        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(q, (snap) => {
          const notifications = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Notif[];
          setItems(notifications);
        }, (err) => {
          console.error("Error loading notifications:", err);
          setItems([]);
        });

        return unsubscribe;
      } catch (err) {
        console.error("Error setting up notifications listener:", err);
        setItems([]);
      }
    };

    const unsubscribe = load();
    return () => {
      unsubscribe?.then(unsub => unsub?.());
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter((i) =>
        [i.title, i.message, String(i.stage)].some((v) => v.toLowerCase().includes(q))
      );
    }
    list = [...list].sort((a, b) => (asc ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
    return list;
  }, [items, query, asc]);

  return (
    <div className="space-y-4">
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
        <button
          type="button"
          onClick={() => setAsc((v) => !v)}
          className="inline-flex items-center gap-2 rounded-2xl border border-neutral-300 bg-white text-neutral-700 px-3 py-2 text-xs sm:text-sm shadow-sm hover:bg-neutral-50 whitespace-nowrap"
        >
          Urut Tgl
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${asc ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
            <path d="M7 10l5 5 5-5H7z" />
          </svg>
        </button>
      </div>

      <ul className="space-y-3">
        {filtered.map((i) => (
          <li key={i.id} className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-neutral-100 grid place-items-center text-neutral-700 ring-1 ring-neutral-200">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M6 3h12a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{i.title}</div>
                <div className="text-xs text-neutral-500 truncate">{i.message}</div>
              </div>
              <div className="text-right whitespace-nowrap text-xs text-neutral-500">
                {i.tanggal}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="text-center text-sm text-neutral-500 py-10">Belum ada notifikasi.</div>
      )}
    </div>
  );
}
