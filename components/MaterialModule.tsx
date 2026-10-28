"use client";

import Link from "next/link";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { fetchMaterials, fetchMaterialMovements, submitMaterial, manageMaterial, type MaterialSubmission } from "@/lib/firestore/materials";
import { MATERIAL_PROJECTS, MOVEMENT_LABELS, materialDate, type Material, type MaterialMovement, type MaterialProject, type MovementType, type StockCategory } from "@/lib/materialStock";
import { exportMaterialWorkbook } from "@/lib/materialExport";

const number = (value: number) => value.toLocaleString("id-ID", { maximumFractionDigits: 3 });
const field = "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50";
const button = "rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-50";
const secondary = "rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50";
type Action = { type: MovementType; material?: Material; original?: MaterialMovement };

export default function MaterialModule({ admin = false, lockedToSampoerna = false }: { admin?: boolean; lockedToSampoerna?: boolean }) {
  const [project, setProject] = useState<MaterialProject | null>(lockedToSampoerna ? "sampoerna" : null);
  const [category, setCategory] = useState<StockCategory>("material");
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-rose-50/30 text-neutral-900">
      <header className="border-b bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href={admin ? "/admin/dashboard" : "/dashboard"} className={secondary}>← Beranda</Link>
          <div><h1 className="text-xl font-semibold">Stok Material dan Alat</h1><p className="text-xs text-neutral-500">{admin ? "Kelola stok, stok masuk, koreksi, dan rekap material serta alat" : "Catat pemakaian dan pantau sisa material dan alat"}</p></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="self-start rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <p className="mb-3 text-sm font-semibold">Menu Utama <span className="text-xs text-red-600">{admin ? "Admin" : "Petugas"}</span></p>
          <nav className="grid gap-2 text-sm">
            <Link className={secondary} href={admin ? "/admin/dashboard" : "/dashboard"}>Home</Link>
            <Link className={secondary} href={admin ? "/admin/planning" : "/dashboard/planning"}>Planning</Link>
            <Link className={secondary} href={admin ? "/admin/laporan-progres" : "/dashboard/laporan-progres"}>Laporan Progres</Link>
            <Link className={button} href={admin ? "/admin/material" : "/dashboard/material"} aria-current="page">Stok Material dan Alat</Link>
            {admin && <Link className={secondary} href="/admin/data-harian">Data Masuk Harian</Link>}
          </nav>
        </aside>
        <main className="min-w-0 space-y-5">
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <div><h2 className="font-semibold">{lockedToSampoerna ? "Proyek aktif" : "Pilih proyek"}</h2><p className="text-xs text-neutral-500">{lockedToSampoerna ? "Akun Anda khusus untuk Proyek DR Sampurna." : "Stok dan riwayat terpisah untuk setiap proyek."}</p></div>
            <div className="flex flex-wrap gap-2">{MATERIAL_PROJECTS.filter(p => !lockedToSampoerna || p.key === "sampoerna").map(p => <button key={p.key} aria-pressed={project === p.key} onClick={() => setProject(p.key)} className={project === p.key ? button : secondary}>{p.label}</button>)}</div>
          </section>
          {project ? <><div className="flex flex-wrap gap-2" aria-label="Jenis stok">{(["material", "alat"] as StockCategory[]).map(kind => <button key={kind} aria-pressed={category === kind} className={category === kind ? button : secondary} onClick={() => setCategory(kind)}>{kind === "alat" ? "Alat" : "Material"}</button>)}</div><MaterialWorkspace key={`${project}-${category}`} project={project} admin={admin} category={category} /></> : <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-500">Pilih proyek untuk menampilkan stok material dan alat.</div>}
        </main>
      </div>
    </div>
  );
}

function MaterialWorkspace({ project, admin, category }: { project: MaterialProject; admin: boolean; category: StockCategory }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"stock" | "recap">("stock");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [management, setManagement] = useState<{ material: Material; mode: "edit" | "delete" } | null>(null);
  const [history, setHistory] = useState<MaterialMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyReady, setHistoryReady] = useState(false);
  const [start, setStart] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return materialDate(d); });
  const [end, setEnd] = useState(() => materialDate());
  const [appliedPeriod, setAppliedPeriod] = useState<{ start: string; end: string } | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const mounted = useRef(true);
  const stockRequest = useRef(0);
  const historyRequest = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const loadStock = useCallback(async () => {
    const request = ++stockRequest.current;
    setLoading(true);
    try {
      const data = await fetchMaterials(project, category);
      if (mounted.current && request === stockRequest.current) setMaterials(data);
    } catch (err) {
      if (mounted.current && request === stockRequest.current) setError(message(err));
    } finally { if (mounted.current && request === stockRequest.current) setLoading(false); }
  }, [project, category]);
  useEffect(() => { void loadStock(); }, [loadStock]);

  async function loadHistory() {
    const request = ++historyRequest.current;
    setHistoryLoading(true);
    setHistoryReady(false);
    setError("");
    try {
      const data = await fetchMaterialMovements(project, start, end, category);
      if (mounted.current && request === historyRequest.current) {
        setHistory(data); setHistoryReady(true); setAppliedPeriod({ start, end }); setPage(1);
      }
    } catch (err) { if (mounted.current && request === historyRequest.current) setError(message(err)); }
    finally { if (mounted.current && request === historyRequest.current) setHistoryLoading(false); }
  }
  const activeMaterials = materials.filter(m => !m.isDeleted);
  const reportMaterials = materials.filter(m => !m.historyDeleted);
  const stock = activeMaterials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
  const records = history.filter(m => !selectedMaterial || m.materialId === selectedMaterial);
  const corrected = new Set(history.filter(m => m.correctionOf).map(m => m.correctionOf));
  const periodChanged = appliedPeriod?.start !== start || appliedPeriod?.end !== end;

  async function saved() {
    setAction(null); setNotice("Transaksi berhasil disimpan. Stok dan riwayat telah diperbarui.");
    // Invalidate the recap instead of leaving a pre-save export available.
    historyRequest.current++; setHistoryReady(false); setHistoryLoading(false); setHistory([]);
    await loadStock();
  }
  async function managementSaved(historyRemoved = false) {
    const deleting = management?.mode === "delete";
    setManagement(null);
    if (historyRemoved && selectedMaterial === management?.material.id) setSelectedMaterial("");
    setError("");
    await saved();
    if (mounted.current) setNotice(historyRemoved ? label("Material beserta seluruh riwayatnya berhasil dihapus dari rekap dan Excel.", category) : deleting ? label("Material berhasil dihapus dari daftar pemakaian. Riwayatnya tetap tersedia di rekap.", category) : label("Perubahan material berhasil disimpan.", category));
  }
  async function download() {
    if (!appliedPeriod || !historyReady || periodChanged) return;
    setExporting(true); setError("");
    try {
      const fresh = await fetchMaterials(project, category);
      const available = fresh.filter(m => !m.historyDeleted && (!selectedMaterial || m.id === selectedMaterial));
      const availableIds = new Set(available.map(m => m.id));
      await exportMaterialWorkbook(project, available, records.filter(r => availableIds.has(r.materialId)), appliedPeriod.start, appliedPeriod.end, category);
    } catch (err) { if (mounted.current) setError(message(err)); }
    finally { if (mounted.current) setExporting(false); }
  }
  return <>
    <div className="flex flex-wrap items-center gap-2">
      <button className={tab === "stock" ? button : secondary} onClick={() => setTab("stock")}>{label("Stok material", category)}</button>
      <button className={tab === "recap" ? button : secondary} onClick={() => { setTab("recap"); if (!historyReady && !historyLoading) void loadHistory(); }}>Rekap & riwayat {category}</button>
      {admin && <button className={`${button} sm:ml-auto`} disabled={loading} onClick={() => { setNotice(""); setAction({ type: "initial" }); }}>{label("+ Tambah material", category)}</button>}
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    {admin && materials.filter(m => m.historyPurgePending).map(m => <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><span>Penghapusan riwayat {m.name} belum selesai.</span><button className={secondary} onClick={() => setManagement({ material: m, mode: "delete" })}>Lanjutkan penghapusan</button></div>)}
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label={label("Jenis material", category)} value={String(activeMaterials.length)} />
      <Stat label={label("Material stok habis", category)} value={String(activeMaterials.filter(m => m.stock === 0).length)} />
      <Stat label="Riwayat dalam periode" value={historyReady ? `${records.length} transaksi` : "Pilih rekap"} />
    </div>
    {tab === "stock" ? <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
      <div className="flex flex-wrap gap-3"><input aria-label={label("Cari material", category)} placeholder={label("Cari nama material...", category)} value={search} onChange={e => setSearch(e.target.value)} className={`${field} sm:max-w-xs`} /><button className={secondary} disabled={loading} onClick={() => { setError(""); void loadStock(); }}>Refresh stok</button></div>
      <p className="text-xs text-neutral-500">{label("Saldo stok saat ini. Jumlah mengikuti satuan masing-masing material.", category)}</p>
      {loading ? <p role="status" className="p-8 text-center">Memuat stok...</p> : stock.length === 0 ? <p className="p-8 text-center text-neutral-500">{materials.length ? label("Material tidak ditemukan.", category) : admin ? label("Belum ada material. Tambahkan material dan stok awal terlebih dahulu.", category) : label("Admin belum menambahkan material untuk proyek ini.", category)}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-neutral-50"><tr>{[label("Material", category), "Stok awal*", "Masuk*", "Dipakai*", "Sisa", "Foto terakhir", "Aksi"].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{stock.map(m => <tr key={m.id} className="border-t border-neutral-100">
          <td className="p-3"><span className="font-semibold">{m.name}</span><span className="block text-xs text-neutral-500">{m.unit}</span></td>
          <td className="p-3">{number(m.initialStock)}</td><td className="p-3">{number(m.receivedTotal)}</td><td className="p-3">{number(m.usedTotal)}</td><td className={`p-3 font-bold ${m.stock === 0 ? "text-red-600" : "text-emerald-700"}`}>{number(m.stock)} {m.unit}</td>
          <td className="p-3"><PhotoLink url={m.photoUrl} /></td><td className="p-3"><div className="flex flex-wrap gap-2"><button className={secondary} disabled={!admin && m.stock <= 0} onClick={() => setAction({ type: admin ? "incoming" : "usage", material: m })}>{admin ? "+ Stok masuk" : label("Pakai material", category)}</button>{admin && <><button className={secondary} onClick={() => setManagement({ material: m, mode: "edit" })}>Edit</button><button className={`${secondary} text-red-700`} onClick={() => setManagement({ material: m, mode: "delete" })}>Hapus</button></>}</div></td>
        </tr>)}</tbody>
      </table><p className="mt-3 text-xs text-neutral-500">* Jumlah kumulatif setelah koreksi admin. Catatan asli tetap tersedia di riwayat.</p></div>}
    </section> : <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
      <h2 className="text-lg font-semibold">{label("Rekap material", category)}</h2>
      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Dari tanggal<input className={field} type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
        <label className="text-sm">Sampai tanggal<input className={field} type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
        <label className="text-sm">{label("Material", category)}<select className={field} value={selectedMaterial} onChange={e => { setSelectedMaterial(e.target.value); setPage(1); }}><option value="">{label("Semua material", category)}</option>{reportMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit}){m.isDeleted ? " — dihapus" : ""}</option>)}</select></label>
        <button className={button} disabled={historyLoading} onClick={() => void loadHistory()}>{historyLoading ? "Memuat..." : "Tampilkan rekap"}</button>
      </div>
      {periodChanged && historyReady && <p className="text-sm text-amber-700">Tanggal berubah. Klik Tampilkan rekap untuk menerapkan filter.</p>}
      {historyLoading && <p role="status">Memuat riwayat periode...</p>}
      {historyReady && appliedPeriod && <>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-neutral-600">Periode pencatatan {appliedPeriod.start} sampai {appliedPeriod.end} · {records.length} transaksi</p>{admin && <button className={secondary} disabled={exporting || periodChanged} onClick={() => void download()}>{exporting ? "Menyiapkan Excel..." : "↓ Download Excel"}</button>}</div>
        <h3 className="font-semibold">Mutasi dalam periode</h3>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-neutral-50"><tr>{[label("Material", category), "Stok awal dicatat", "Masuk", "Dipakai", "Penyesuaian koreksi"].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{reportMaterials.filter(m => !selectedMaterial || m.id === selectedMaterial).map(m => {
          const rows = records.filter(r => r.materialId === m.id);
          const sum = (type: MovementType) => rows.filter(r => r.type === type).reduce((n,r) => n + (type === "correction" ? r.delta : r.quantity),0);
          return <tr className="border-t" key={m.id}><td className="p-3">{m.name} ({m.unit}){m.isDeleted && <><span className="block text-xs text-red-600">Dihapus</span>{admin && <button className={`${secondary} mt-2 text-red-700`} onClick={() => setManagement({ material: m, mode: "delete" })}>Hapus riwayat</button>}</>}</td>{(["initial", "incoming", "usage", "correction"] as MovementType[]).map(type => <td key={type} className="p-3">{number(sum(type))}</td>)}</tr>;
        })}</tbody></table></div>
        <p className="text-xs text-neutral-500">{label("Mutasi menampilkan pencatatan asli dan penyesuaian koreksi pada periode ini. Sisa terkini ada di tab Stok material.", category)}</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-neutral-50"><tr>{["Waktu / petugas", label("Material", category), "Transaksi", "Perubahan / sisa", "Tujuan / alasan", "Foto", ...(admin ? ["Koreksi"] : [])].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>
          {records.slice((page - 1) * 20, page * 20).map(r => <tr className="border-t align-top" key={r.id}>
            <td className="p-3">{r.createdAt ? new Date(r.createdAt.toMillis()).toLocaleString("id-ID") : "Menunggu waktu server"}<span className="block text-xs text-neutral-500">{r.actorName}</span></td>
            <td className="p-3">{r.materialName}<span className="block text-xs text-neutral-500">{r.unit}</span></td>
            <td className="p-3">{MOVEMENT_LABELS[r.type]}<span className="block font-semibold">{number(r.quantity)} {r.unit}{r.type === "correction" ? " (jumlah pengganti)" : ""}</span>{r.correctionOf && <span className="block max-w-48 break-all text-xs text-neutral-500">Transaksi asal: {r.correctionOf}</span>}{corrected.has(r.id) && <span className="block text-xs text-amber-700">Sudah dikoreksi</span>}</td>
            <td className="p-3"><span className={r.delta < 0 ? "text-red-600" : "text-emerald-700"}>{r.delta > 0 ? "+" : ""}{number(r.delta)}</span><span className="block text-xs text-neutral-500">{number(r.beforeStock)} → {number(r.afterStock)} {r.unit}</span></td>
            <td className="max-w-xs whitespace-pre-wrap break-words p-3">{r.purpose}</td><td className="p-3"><PhotoLink url={r.photoUrl} /></td>
            {admin && <td className="p-3">{r.type !== "correction" && !corrected.has(r.id) && !materials.find(m => m.id === r.materialId)?.isDeleted && <button className={secondary} onClick={() => { const material = materials.find(m => m.id === r.materialId); if (material) setAction({ type: "correction", material, original: r }); }}>Koreksi</button>}</td>}
          </tr>)}
        </tbody></table></div>
        {records.length === 0 && <p className="p-8 text-center text-neutral-500">Tidak ada transaksi untuk filter ini.</p>}
        {records.length > 20 && <div className="flex items-center justify-between"><button className={secondary} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</button><span className="text-sm">{page} / {Math.ceil(records.length / 20)}</span><button className={secondary} disabled={page * 20 >= records.length} onClick={() => setPage(p => p + 1)}>Berikutnya</button></div>}
      </>}
    </section>}
    {action && <MaterialForm category={category} project={project} action={action} onClose={() => setAction(null)} onSaved={saved} />}
    {management && <MaterialManageForm category={category} project={project} material={management.material} mode={management.mode} onClose={() => setManagement(null)} onSaved={managementSaved} />}
  </>;
}

function MaterialManageForm({ category, project, material, mode, onClose, onSaved }: {
  category: StockCategory; project: MaterialProject; material: Material; mode: "edit" | "delete"; onClose: () => void; onSaved: (historyRemoved?: boolean) => Promise<void>;
}) {
  const [operationId] = useState(() => crypto.randomUUID());
  const [photo, setPhoto] = useState<File | undefined>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [removeHistory, setRemoveHistory] = useState(material.isDeleted === true);
  const canChangeUnit = material.lastMovementId === material.id;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = new FormData(event.currentTarget);
    pending.current = true; setBusy(true); setError("");
    try {
      await manageMaterial(project, { operationId, materialId: material.id, action: mode,
        name: String(form.get("name") || ""), unit: canChangeUnit ? String(form.get("unit") || "") : material.unit, photo,
        removeHistory: mode === "delete" && removeHistory, confirmation: String(form.get("confirmation") || "") }, category);
      await onSaved(mode === "delete" && removeHistory);
    } catch (err) { setError(message(err)); }
    finally { pending.current = false; setBusy(false); }
  }
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="manage-material-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-xl">
      <h2 id="manage-material-title" className="mb-4 text-lg font-semibold">{mode === "delete" ? label("Hapus material", category) : label("Edit material", category)}</h2>
      <form onSubmit={submit} className="space-y-4">
        {mode === "delete" ? <fieldset disabled={busy} className="space-y-4"><p className="text-sm">Hapus <strong>{material.name}</strong>? Sisa stok tercatat {number(material.stock)} {material.unit}.</p>
          <label className="flex items-start gap-2 text-sm"><input type="radio" name="deleteMode" checked={!removeHistory} disabled={material.isDeleted} onChange={() => setRemoveHistory(false)} /><span>{label("Hapus dari daftar material saja. Riwayat tetap tersedia di rekap dan Excel.", category)}</span></label>
          <label className="flex items-start gap-2 text-sm"><input type="radio" name="deleteMode" checked={removeHistory} onChange={() => setRemoveHistory(true)} /><span>{label("Hapus material beserta seluruh riwayat pemakaian, stok masuk, dan koreksinya.", category)}</span></label>
          {removeHistory && <div className="space-y-2 rounded-xl bg-red-50 p-3 text-sm text-red-800"><p>{label("Seluruh riwayat material ini pada proyek ini akan dihapus permanen, termasuk di luar periode rekap yang sedang dipilih. Tidak dapat dikembalikan.", category)}</p><label className="block">Ketik HAPUS untuk melanjutkan<input className={field} name="confirmation" required pattern="HAPUS" autoComplete="off" /></label></div>}
        </fieldset> : <fieldset disabled={busy} className="space-y-4">
          <label className="block text-sm">{label("Nama material", category)}<input autoFocus required name="name" defaultValue={material.name} maxLength={120} className={field} /></label>
          <label className="block text-sm">Satuan<input name="unit" required defaultValue={material.unit} disabled={!canChangeUnit} maxLength={30} className={field} /></label>
          {!canChangeUnit && <p className="text-xs text-neutral-500">Satuan terkunci setelah ada transaksi lanjutan untuk menjaga konsistensi riwayat.</p>}
          <label className="block text-sm">Ganti foto stok terakhir (opsional)<input type="file" accept="image/jpeg,image/png,image/webp" className={field} onChange={e => setPhoto(e.target.files?.[0])} /></label>
          <p className="text-xs text-neutral-500">Kosongkan foto untuk mempertahankan foto saat ini. Untuk mengubah jumlah, gunakan Koreksi pada Rekap & riwayat.</p>
        </fieldset>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" disabled={busy} className={secondary} onClick={onClose}>Batal</button><button type="submit" disabled={busy} className={button}>{busy ? "Menyimpan..." : mode === "delete" ? label("Ya, hapus material", category) : "Simpan perubahan"}</button></div>
      </form>
    </section>
  </div>, document.body);
}

function MaterialForm({ category, project, action, onClose, onSaved }: { category: StockCategory; project: MaterialProject; action: Action; onClose: () => void; onSaved: () => Promise<void> }) {
  const [operationId] = useState(() => crypto.randomUUID());
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!photo) { setPreview(""); return; }
    const url = URL.createObjectURL(photo); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current) return;
    if (!photo) { setError("Foto stok wajib diunggah."); return; }
    const data = new FormData(event.currentTarget);
    const raw = String(data.get("quantity") || "").trim();
    if (!raw) { setError(label("Isi jumlah material.", category)); return; }
    const input: MaterialSubmission = {
      operationId, type: action.type, materialId: action.material?.id,
      name: String(data.get("name") || ""), unit: String(data.get("unit") || ""),
      quantity: Number(raw), purpose: String(data.get("purpose") || ""), photo, correctionOf: action.original?.id,
    };
    busyRef.current = true; setBusy(true); setError("");
    try { await submitMaterial(project, input, category); await onSaved(); }
    catch (err) { setError(message(err)); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const title = action.type === "initial" ? label("Tambah material", category) : action.type === "incoming" ? "Tambah stok masuk" : action.type === "usage" ? label("Pakai material", category) : "Koreksi transaksi";
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="material-form-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 id="material-form-title" className="text-lg font-semibold">{title}</h2><button type="button" disabled={busy} className={secondary} onClick={onClose}>Tutup</button></div>
      <form className="space-y-4" onSubmit={submit}>
        <fieldset disabled={busy} className="space-y-4">
          {action.type === "initial" ? <><label className="block text-sm">{label("Nama material", category)}<input autoFocus name="name" required maxLength={120} placeholder={category === "alat" ? "Misalnya: Bor listrik" : "Misalnya: Semen Portland"} className={field} /></label><label className="block text-sm">Satuan<input name="unit" required maxLength={30} placeholder="Misalnya: sak, kg, batang, m³" className={field} /></label></> : <p className="rounded-xl bg-neutral-50 p-3 text-sm"><strong>{action.material?.name}</strong> · Sisa saat ini {number(action.material!.stock)} {action.material?.unit}</p>}
          {action.original && <p className="text-sm text-amber-800">Transaksi asal: {MOVEMENT_LABELS[action.original.type]}, {number(action.original.quantity)} {action.original.unit}. Masukkan jumlah yang seharusnya. Catatan asli tetap tersimpan; satu transaksi hanya dapat dikoreksi sekali.</p>}
          <label className="block text-sm">{action.type === "correction" ? "Jumlah pengganti yang benar" : action.type === "initial" ? "Jumlah stok awal" : "Jumlah"} {action.material?.unit && `(${action.material.unit})`}<input name="quantity" type="number" required min={["initial", "correction"].includes(action.type) ? 0 : 0.001} step="0.001" max={action.type === "usage" ? action.material?.stock : 1000000000} defaultValue={action.original?.quantity} className={field} /></label>
          <label className="block text-sm">{action.type === "usage" ? "Dipakai untuk pekerjaan apa?" : action.type === "correction" ? "Alasan koreksi / tujuan pemakaian yang benar" : "Keterangan stok"}<textarea name="purpose" required maxLength={1000} rows={3} className={field} placeholder={action.type === "usage" ? "Contoh: pengecoran lantai 2" : "Tuliskan keterangan pencatatan"} /></label>
          <label className="block text-sm">{action.type === "initial" ? "Foto stok awal" : "Foto kondisi stok setelah transaksi"}<input type="file" required accept="image/jpeg,image/png,image/webp" className={`${field} mt-1`} onChange={e => setPhoto(e.target.files?.[0] || null)} /><span className="text-xs text-neutral-500">JPG, PNG, WebP · maksimal 10 MB. Foto diperkecil saat disimpan.</span></label>
          {preview && <Image unoptimized src={preview} alt="Pratinjau foto stok" width={640} height={320} className="max-h-48 w-full rounded-xl object-contain" />}
        </fieldset>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className={`${button} w-full`}>{busy ? "Menyimpan foto dan stok..." : "Simpan transaksi"}</button>
      </form>
    </section>
  </div>, document.body);
}

function PhotoLink({ url }: { url: string }) { return /^https:\/\//.test(url) ? <a className="text-blue-700 underline" href={url} target="_blank" rel="noopener noreferrer">Lihat foto</a> : <span className="text-neutral-400">—</span>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200"><p className="text-xs text-neutral-500">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
function message(error: unknown) { return error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba lagi."; }

function label(text: string, category: StockCategory) { return category === "alat" ? text.replace(/Material/g, "Alat").replace(/material/g, "alat") : text; }
