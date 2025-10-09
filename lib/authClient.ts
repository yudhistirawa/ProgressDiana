"use client";

import { getFirebaseClient } from "./firebaseClient";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export type Role = "admin" | "petugas";

const COOKIE_NAME = "role";

export function setRole(role: Role) {
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=${role}; Path=/; SameSite=Lax`;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(COOKIE_NAME, role);
    }
  } catch {}
}

export function getRole(): Role | null {
  try {
    if (typeof document !== "undefined") {
      const m = document.cookie.match(/(?:^|; )role=([^;]+)/);
      if (m) return decodeURIComponent(m[1]) as Role;
    }
    if (typeof window !== "undefined") {
      return (window.localStorage.getItem(COOKIE_NAME) as Role | null) ?? null;
    }
  } catch {}
  return null;
}

export function clearAuth() {
  try {
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(COOKIE_NAME);
    }
  } catch {}
}

async function resolveEmailByUsername(username: string, role: "admin" | "pelaksana") {
  const fb = getFirebaseClient();
  if (!fb) return null;
  const qy = query(
    collection(fb.db, "users"),
    where("username", "==", username),
    where("role", "==", role),
    limit(1)
  );
  const snap = await getDocs(qy);
  if (snap.empty) return null;
  return (snap.docs[0].data() as any)?.email as string | undefined;
}

export async function verifyPetugas(usernameOrEmail: string, password: string) {
  const fb = getFirebaseClient();
  if (!fb) return { ok: false, message: "Firebase belum terkonfigurasi" } as const;
  const auth = getAuth();
  const email = usernameOrEmail.includes("@")
    ? usernameOrEmail
    : (await resolveEmailByUsername(usernameOrEmail, "pelaksana")) || "";
  if (!email) return { ok: false, message: "User tidak ditemukan" } as const;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const u = cred.user;
    const byId = await getDoc(doc(fb.db, "users", u.uid));
    let role: string | null = null;
    if (byId.exists()) role = (byId.data() as any)?.role;
    if (!role) {
      const qy = query(collection(fb.db, "users"), where("email", "==", email), limit(1));
      const snap = await getDocs(qy);
      if (!snap.empty) role = (snap.docs[0].data() as any)?.role;
    }
    if (role !== "pelaksana") {
      await signOut(auth);
      return { ok: false, message: "Akun bukan role petugas" } as const;
    }
    return { ok: true, user: { uid: u.uid, email } } as const;
  } catch (e: any) {
    return { ok: false, message: e?.message || "Gagal login" } as const;
  }
}

export async function verifyAdmin(usernameOrEmail: string, password: string) {
  const fb = getFirebaseClient();
  if (!fb) return { ok: false, message: "Firebase belum terkonfigurasi" } as const;
  const auth = getAuth();
  let email = usernameOrEmail.includes("@")
    ? usernameOrEmail
    : (await resolveEmailByUsername(usernameOrEmail, "admin")) || undefined;
  if (!email && usernameOrEmail.toLowerCase() === "admin") email = "admin@bgd.local";
  if (!email) return { ok: false, message: "Admin tidak ditemukan" } as const;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const u = cred.user;
    const byId = await getDoc(doc(fb.db, "users", u.uid));
    let role: string | null = null;
    if (byId.exists()) role = (byId.data() as any)?.role;
    if (!role) {
      const qy = query(collection(fb.db, "users"), where("email", "==", email), limit(1));
      const snap = await getDocs(qy);
      if (!snap.empty) role = (snap.docs[0].data() as any)?.role;
    }
    if (role !== "admin") {
      await signOut(auth);
      return { ok: false, message: "Akun bukan role admin" } as const;
    }
    return { ok: true, user: { uid: u.uid, email } } as const;
  } catch (e: any) {
    const wantDefault = email === "admin@bgd.local" && password === "1234567";
    if (wantDefault) {
      try {
        const cred2 = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred2.user.uid;
        await setDoc(doc(fb.db, "users", uid), {
          username: "admin",
          email,
          role: "admin",
          name: "Admin BGD",
          createdAt: serverTimestamp(),
        });
        return { ok: true, user: { uid, email } } as const;
      } catch (err: any) {
        return { ok: false, message: err?.message || "Gagal membuat admin default" } as const;
      }
    }
    return { ok: false, message: e?.message || "Gagal login" } as const;
  }
}

export async function hashPassword(pwd: string) {
  const enc = new TextEncoder();
  const data = enc.encode(pwd);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}





