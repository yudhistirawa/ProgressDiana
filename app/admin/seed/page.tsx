"use client";
import { useState, Suspense } from "react";
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, type UserCredential } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import Link from "next/link";

export default function SeedAdminPage() {
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function createAdmin() {
    try {
      setBusy(true);
      setStatus("Membuat admin default...");
      const cfg: FirebaseOptions = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      };
      const existing = getApps().find((a) => a.name === "seed");
      const app = existing ?? initializeApp(cfg, "seed");
      const auth = getAuth(app);
      const email = "admin@bgd.local";
      const password = "1234567";
      const cred = await createUserWithEmailAndPassword(auth, email, password).catch(async (e) => {
        setStatus(`Auth: ${e?.message || e?.code || "error"}`);
        throw e;
      });
      const uid = cred.user.uid;
      const db = getFirestore(app);
      await setDoc(doc(db, "users", uid), {
        username: "admin",
        email,
        role: "admin",
        name: "Admin BGD",
        createdAt: serverTimestamp(),
      });
      await signOut(auth).catch(() => {});
      setStatus("Berhasil membuat admin. Email: admin@bgd.local, Password: 1234567");
    } catch (e: any) {
      setStatus(`Gagal: ${e?.message || e?.code || "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  async function createPetugas() {
    try {
      setBusy(true);
      setStatus("Membuat akun petugas default...");
      const cfg: FirebaseOptions = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      };
      const existing = getApps().find((a) => a.name === "seed-petugas");
      const app = existing ?? initializeApp(cfg, "seed-petugas");
      const auth = getAuth(app);
      const email = "petugas.admin@bgd.local";
      const password = "1234567";
      let cred: UserCredential;
      try {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        if (err?.code === "auth/email-already-in-use") {
          cred = await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw err;
        }
      }
      const uid = cred.user.uid;
      const db = getFirestore(app);
      await setDoc(
        doc(db, "users", uid),
        {
          username: "petugasadmin",
          email,
          role: "pelaksana",
          name: "Petugas Admin",
          category: "admin-petugas",
          isAdminPetugas: true,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      await signOut(auth).catch(() => {});
      setStatus("Berhasil membuat petugas. Username: petugasadmin, Email: petugas.admin@bgd.local, Password: 1234567");
    } catch (e: any) {
      setStatus(`Gagal membuat petugas: ${e?.message || e?.code || "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen grid place-items-center p-6 bg-white text-neutral-900">
        <div className="w-full max-w-md rounded-2xl ring-1 ring-neutral-200 p-5 shadow-sm bg-white animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <div className="min-h-screen grid place-items-center p-6 bg-white text-neutral-900">
        <div className="w-full max-w-md rounded-2xl ring-1 ring-neutral-200 p-5 shadow-sm bg-white">
          <h1 className="text-lg font-semibold mb-2">Bootstrap Admin</h1>
          <p className="text-sm text-neutral-600 mb-4">
            Tombol ini akan membuat akun admin default di Firebase Auth dan Firestore:
            <br />
            Email: <code>admin@bgd.local</code>, Password: <code>1234567</code>
          </p>
          <div className="space-y-3">
            <button
              onClick={createAdmin}
              disabled={busy}
              className="w-full rounded-xl bg-red-600 text-white px-4 py-2 font-semibold disabled:opacity-60"
            >
              {busy ? "Memproses..." : "Buat Admin Default"}
            </button>
            <button
              onClick={createPetugas}
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 text-white px-4 py-2 font-semibold disabled:opacity-60"
            >
              {busy ? "Memproses..." : "Buat Petugas Admin"}
            </button>
          </div>

          {status && (
            <div className="mt-4 rounded-lg bg-neutral-50 ring-1 ring-neutral-200 p-3 text-sm whitespace-pre-wrap">
              {status}
            </div>
          )}

          <div className="mt-4 text-xs text-neutral-500">
            Akun petugas dapat dipakai login melalui halaman utama aplikasi dan mengirim laporan.
          </div>

          <div className="mt-4 text-center">
            <Link href="/admin" className="text-sm text-blue-600 hover:underline">Kembali ke Login Admin</Link>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
