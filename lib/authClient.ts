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

export type Role = "admin" | "petugas" | "pelaksana" | "viewer" | "sampoerna";

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

async function resolveEmailByUsername(username: string, role: Role) {
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

export async function verifyUser(usernameOrEmail: string, password: string) {
  const fb = getFirebaseClient();
  if (!fb) return { ok: false, message: "Firebase belum terkonfigurasi" } as const;

  const loginValue = usernameOrEmail.trim();
  let email = loginValue.includes("@") ? loginValue : "";

  if (!email) {
    const usernameQuery = query(
      collection(fb.db, "users"),
      where("username", "==", loginValue),
      limit(1)
    );
    const usernameSnap = await getDocs(usernameQuery);
    email = usernameSnap.empty
      ? ""
      : String((usernameSnap.docs[0].data() as { email?: string }).email || "");
  }

  // Pertahankan dukungan akun admin awal sebelum dokumen user-nya terbentuk.
  if (!email && loginValue.toLowerCase() === "admin") {
    const adminResult = await verifyAdmin(loginValue, password);
    if (!adminResult.ok) return adminResult;
    return {
      ok: true,
      user: { ...adminResult.user, role: "admin" as const },
    } as const;
  }

  if (!email) return { ok: false, message: "User tidak ditemukan" } as const;

  try {
    const auth = getAuth(fb.app);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userById = await getDoc(doc(fb.db, "users", cred.user.uid));
    let role = userById.exists()
      ? String((userById.data() as { role?: string }).role || "")
      : "";

    if (!role) {
      const emailQuery = query(
        collection(fb.db, "users"),
        where("email", "==", email),
        limit(1)
      );
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        role = String((emailSnap.docs[0].data() as { role?: string }).role || "");
      }
    }

    if (role !== "admin" && role !== "viewer" && role !== "pelaksana" && role !== "sampoerna") {
      await signOut(auth);
      return { ok: false, message: "Role akun tidak dikenali" } as const;
    }

    return {
      ok: true,
      user: { uid: cred.user.uid, email, role: role as "admin" | "viewer" | "pelaksana" | "sampoerna" },
    } as const;
  } catch (e: any) {
    return { ok: false, message: e?.message || "Gagal login" } as const;
  }
}

export async function verifyPetugas(usernameOrEmail: string, password: string) {
  const fb = getFirebaseClient();
  if (!fb) return { ok: false, message: "Firebase belum terkonfigurasi" } as const;
  const auth = getAuth();
  const email = usernameOrEmail.includes("@")
    ? usernameOrEmail
    : (await resolveEmailByUsername(usernameOrEmail, "pelaksana"))
      || (await resolveEmailByUsername(usernameOrEmail, "sampoerna"))
      || "";
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
    if (role !== "pelaksana" && role !== "sampoerna") {
      await signOut(auth);
      return { ok: false, message: "Akun bukan role petugas" } as const;
    }
    return { ok: true, user: { uid: u.uid, email, role: role as "pelaksana" | "sampoerna" } } as const;
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

export async function verifyViewer(usernameOrEmail: string, password: string) {
  const fb = getFirebaseClient();
  if (!fb) return { ok: false, message: "Firebase belum terkonfigurasi" } as const;
  const auth = getAuth();
  const email = usernameOrEmail.includes("@")
    ? usernameOrEmail
    : (await resolveEmailByUsername(usernameOrEmail, "viewer")) || "";
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
    if (role !== "viewer") {
      await signOut(auth);
      return { ok: false, message: "Akun bukan role viewer" } as const;
    }
    return { ok: true, user: { uid: u.uid, email, role } } as const;
  } catch (e: any) {
    return { ok: false, message: e?.message || "Gagal login" } as const;
  }
}

export async function hashPassword(pwd: string) {
  const enc = new TextEncoder();
  const data = enc.encode(pwd);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}





