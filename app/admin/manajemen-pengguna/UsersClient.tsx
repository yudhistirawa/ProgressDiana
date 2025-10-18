"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import {
    collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query as qf,
  serverTimestamp,
  updateDoc, setDoc
} from "firebase/firestore";
import { hashPassword } from "@/lib/authClient";
import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

export type User = {
  id: string;
  username: string;
  role: string; // "admin" | "pelaksana"
  name?: string;
  phone?: string;
  email?: string;
  passwordHash?: string;
  avatar?: string;
  createdAt?: any;
  category?: string;
  isAdminPetugas?: boolean;
};

type UserClientType = "admin" | "pelaksana" | "petugasAdmin";

export default function UsersClient({ type }: { type: UserClientType }) {
  const isPetugasAdmin = type === "petugasAdmin";
  const baseRole: "admin" | "pelaksana" = type === "admin" ? "admin" : "pelaksana";
  const title =
    type === "admin" ? "List User Admin" : type === "pelaksana" ? "List User Pelaksana" : "List User Admin Petugas";
  const fb = getFirebaseClient();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState<null | { id?: string }>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "pelaksana">(baseRole);
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirm, setFormConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  useEffect(() => {
    setFormRole(baseRole);
  }, [baseRole]);

  useEffect(() => {
    if (!fb) return;
    const ref = collection(fb.db, "users");
    const unsub = onSnapshot(qf(ref, orderBy("createdAt", "desc")), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as User[];
      const next = list.filter((u) => {
        const roleValue = String(u.role || "").toLowerCase();
        const categoryValue = String(u.category || "").toLowerCase();
        const flag = Boolean((u as any).isAdminPetugas);
        const usernameValue = String(u.username || "").toLowerCase();
        const emailValue = String(u.email || "").toLowerCase();
        const adminPetugasHint =
          flag ||
          categoryValue === "admin-petugas" ||
          roleValue === "admin-petugas" ||
          usernameValue === "petugasadmin" ||
          emailValue.includes("petugas.admin");

        if (type === "admin") {
          return roleValue === "admin";
        }

        if (type === "pelaksana") {
          // exclude admin petugas from regular pelaksana list
          return roleValue === "pelaksana" && !adminPetugasHint;
        }

        // petugas admin
        if (type === "petugasAdmin") {
          return (
            roleValue === "admin-petugas" ||
            (roleValue === "pelaksana" && adminPetugasHint)
          );
        }

        return false;
      });
      setUsers(next);
    });
    return () => unsub();
  }, [fb, type]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.username, u.role, u.name ?? "", u.category ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [search, users]);

  const openNew = () => {
    setShowForm({});
    setFormUsername(isPetugasAdmin ? "petugasadmin" : "");
    setFormRole(baseRole);
    setFormFullName("");
    setFormPhone("");
    setFormEmail(isPetugasAdmin ? "petugas.admin@bgd.local" : "");
    setFormPassword("");
    setFormConfirm("");
  };

  const openEdit = (u: User) => {
    setShowForm({ id: u.id });
    setFormUsername(u.username || "");
    const roleValue = String(u.role || "").toLowerCase() === "admin" ? "admin" : "pelaksana";
    setFormRole(roleValue);
    setFormFullName(u.name || "");
    setFormPhone(u.phone || "");
    setFormEmail(u.email || "");
    setFormPassword("");
    setFormConfirm("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-center text-sm sm:text-base font-semibold">{title}</h2>
      {isPetugasAdmin && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs sm:text-sm px-4 py-3">
          Akun Admin Petugas menggunakan role pelaksana agar dapat login melalui portal petugas. Gunakan email dan
          password yang valid; role dan kategori akan dikunci otomatis sebagai admin petugas.
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
            </svg>
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search.." className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
        </div>
        <button onClick={openNew} className="inline-flex items-center justify-center h-10 w-10 rounded-full ring-1 ring-neutral-300 bg-white shadow" title="Tambah">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z"/></svg>
        </button>
      </div>

      <ul className="space-y-3">
        {filtered.map((u) => (
          <li key={u.id} className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-100 grid place-items-center text-[11px] text-neutral-600 ring-1 ring-neutral-200">Foto</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{u.username}</div>
                <div className="text-xs text-neutral-500 truncate">
                  {u.role}
                  {u.category ? ` • ${u.category}` : ""}
                </div>
              </div>
              <div className="text-right min-w-[150px]">
                <div className="mt-1 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => openEdit(u)} className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs">Edit</button>
                  <button type="button" onClick={async () => { if (!fb) return alert("Firebase belum siap"); if (!confirm(`Hapus user ${u.username}?`)) return; await deleteDoc(doc(fb.db, "users", u.id)); alert("User berhasil dihapus."); }} className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-red-500 text-white hover:bg-red-600 text-xs">Hapus</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(null)}>
          <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-xl p-4">
              <div className="text-sm font-semibold mb-3">{showForm?.id ? "Edit Pengguna" : "Tambah Pengguna"}</div>
              <form className="grid sm:grid-cols-2 gap-3" onSubmit={async (e) => {
                e.preventDefault();
                if (!fb) { alert("Firebase belum siap"); return; }
                if (!formUsername.trim()) { alert("Username wajib diisi"); return; }
                if (formPassword !== formConfirm) { alert("Konfirmasi kata sandi tidak cocok"); return; }
                const resolvedRole: "admin" | "pelaksana" = isPetugasAdmin ? "pelaksana" : formRole;
                const data: any = {
                  username: formUsername.trim(),
                  role: resolvedRole,
                  name: formFullName.trim(),
                  phone: formPhone.trim(),
                  email: formEmail.trim(),
                };
                if (isPetugasAdmin) {
                  data.category = "admin-petugas";
                  data.isAdminPetugas = true;
                }
                if (formPassword) data.passwordHash = await hashPassword(formPassword);
                if (showForm?.id) {
                  if (!confirm("Simpan perubahan pengguna?")) return;
                  // Edit profil (tidak mengubah password Auth di sini)
                  await updateDoc(doc(fb.db, "users", showForm.id), data);
                  alert("Perubahan pengguna tersimpan.");
                } else {
                  if (!confirm("Tambah pengguna baru?")) return;
                  // Tambah user baru: buat akun Auth via secondary app agar admin tidak logout
                  if (!data.email) { alert("Email wajib diisi untuk akun baru"); return; }
                  if (!formPassword) { alert("Kata sandi wajib diisi untuk akun baru"); return; }
                  const cfg: FirebaseOptions = {
                    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
                    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
                    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
                    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
                  };
                  const existing = getApps().find((a) => a.name === "secondary");
                  const secApp = existing ?? initializeApp(cfg, "secondary");
                  const secAuth = getAuth(secApp);
                  const cred = await createUserWithEmailAndPassword(secAuth, data.email, formPassword);
                  await signOut(secAuth);
                  const uid = cred.user.uid;
                  await setDoc(doc(fb.db, "users", uid), { ...data, createdAt: serverTimestamp() });
                  alert("Pengguna berhasil ditambahkan.");
                }
                setShowForm(null);
              }}>
                <div>
                  <div className="text-sm">Nama</div>
                  <input value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Masukkan Nama" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <div className="text-sm">Role</div>
                  <div className="relative">
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value as any)}
                      disabled={isPetugasAdmin}
                      className={`w-full appearance-none rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm ${
                        isPetugasAdmin ? "bg-neutral-100 text-neutral-500 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="admin">Admin</option>
                      <option value="pelaksana">Pelaksana</option>
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M6.3 9.3a1 1 0 0 1 1.4 0L12 13.6l4.3-4.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 0 1 0-1.4Z"/></svg>
                    </span>
                  </div>
                  {isPetugasAdmin && (
                    <p className="mt-1 text-[11px] text-neutral-500">Role dikunci sebagai pelaksana untuk Admin Petugas.</p>
                  )}
                </div>
                <div>
                  <div className="text-sm">User Name</div>
                  <input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="Masukkan Username" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <div className="text-sm">No. Telp</div>
                  <input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Masukkan No. Telp" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <div className="text-sm">Email</div>
                  <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="Masukkan Email" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <div className="text-sm">Kata Sandi</div>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="masukkan Kata Sandi" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 pr-10 text-sm" />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600" aria-label="toggle password">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">{showPwd ? <path d="M3 3 21 21"/> : <path d="M12 5c-6 0-9 7-9 7s3 7 9 7 9-7 9-7-3-7-9-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>}</svg>
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-sm">Konfirmasi Kata Sandi</div>
                  <div className="relative">
                    <input type={showPwd2 ? "text" : "password"} value={formConfirm} onChange={(e) => setFormConfirm(e.target.value)} placeholder="masukkan Kata Sandi Ulang" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 pr-10 text-sm" />
                    <button type="button" onClick={() => setShowPwd2((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600" aria-label="toggle confirm">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">{showPwd2 ? <path d="M3 3 21 21"/> : <path d="M12 5c-6 0-9 7-9 7s3 7 9 7 9-7 9-7-3-7-9-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/>}</svg>
                    </button>
                  </div>
                </div>
                <div className="pt-3">
                  <button type="submit" className="mx-auto block rounded-xl bg-neutral-100 ring-1 ring-neutral-300 px-5 py-2 text-sm font-semibold hover:bg-neutral-200">Simpan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}











