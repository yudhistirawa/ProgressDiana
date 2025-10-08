"use client";
import { useMemo, useState } from "react";

export type User = {
  id: number;
  username: string;
  role: string;
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  avatar?: string;
  createdAt?: number;
};

function storageKey(type: "admin" | "pelaksana") {
  return `users_${type}`;
}

function useUsers(type: "admin" | "pelaksana") {
  const key = storageKey(type);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as User[]) : [];
    } catch {
      return [];
    }
  });

  const save = (next: User[]) => {
    setUsers(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  return { users, save };
}

export default function UsersClient({ type }: { type: "admin" | "pelaksana" }) {
  const title = type === "admin" ? "List User Admin" : "List User Pelaksana";
  const { users, save } = useUsers(type);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState<null | { id?: number }>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formRole, setFormRole] = useState(type === "admin" ? "admin" : "pelaksana");
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirm, setFormConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.username, u.role].some((v) => v.toLowerCase().includes(q)));
  }, [query, users]);

  return (
    <div className="space-y-4">
      <h2 className="text-center text-sm sm:text-base font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M10 2a8 8 0 1 0 4.9 14.3l4.4 4.4a1 1 0 0 0 1.4-1.4l-4.4-4.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12A6 6 0 0 1 10 4Z" />
            </svg>
          </span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search.." className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-10 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
        </div>
        <button onClick={() => { setShowForm({}); setFormUsername(""); setFormRole(type === "admin" ? "admin" : "pelaksana"); setFormFullName(""); setFormPhone(""); setFormEmail(""); setFormPassword(""); setFormConfirm(""); }} className="inline-flex items-center justify-center h-10 w-10 rounded-full ring-1 ring-neutral-300 bg-white shadow" title="Tambah">
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
                <div className="text-xs text-neutral-500 truncate">{u.role}</div>
              </div>
              <div className="text-right min-w-[150px]">
                <div className="mt-1 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => { setShowForm({ id: u.id }); setFormUsername(u.username || ""); setFormRole(u.role || (type === "admin" ? "admin" : "pelaksana")); setFormFullName(u.name || ""); setFormPhone(u.phone || ""); setFormEmail(u.email || ""); setFormPassword(u.password || ""); setFormConfirm(u.password || ""); }} className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs">Edit</button>
                  <button type="button" onClick={() => save(users.filter((x) => x.id !== u.id))} className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-red-500 text-white hover:bg-red-600 text-xs">Hapus</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={() => setShowForm(null)}>
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowForm(null)} className="absolute -left-3 -top-3 h-10 w-10 rounded-full bg-white text-neutral-800 shadow ring-1 ring-neutral-200 grid place-items-center" aria-label="Tutup">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M13.7 7.3a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4-1.4L10.41 12l3.3-3.3a1 1 0 0 0 0-1.4Z"/></svg>
            </button>
            <div className="rounded-2xl bg-white shadow-xl ring-1 ring-neutral-200 p-4 sm:p-6">
              <div className="text-center font-semibold mb-3">Formulir Tambah User</div>
              <div className="rounded-xl ring-1 ring-neutral-300 p-4">
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (formPassword !== formConfirm) {
                      alert("Konfirmasi kata sandi tidak sama");
                      return;
                    }
                    const id = showForm.id ?? Date.now();
                    const record: User = {
                      id,
                      username: formUsername || "",
                      role: formRole,
                      name: formFullName,
                      phone: formPhone,
                      email: formEmail,
                      password: formPassword,
                      createdAt: Date.now(),
                    };
                    const next = showForm.id ? users.map((x) => (x.id === id ? record : x)) : [...users, record];
                    save(next);
                    setShowForm(null);
                  }}
                >
                  <div>
                    <div className="text-sm">Nama</div>
                    <input value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="Masukkan Nama" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm" />
                  </div>
                  <div>
                    <div className="text-sm">Role</div>
                    <div className="relative">
                      <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full appearance-none rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm">
                        <option value="admin">Admin</option>
                        <option value="pelaksana">Pelaksana</option>
                      </select>
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-600">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M6.3 9.3a1 1 0 0 1 1.4 0L12 13.6l4.3-4.3a1 1 0 1 1 1.4 1.4l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 0 1 0-1.4Z"/></svg>
                      </span>
                    </div>
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
        </div>
      )}
    </div>
  );
}
