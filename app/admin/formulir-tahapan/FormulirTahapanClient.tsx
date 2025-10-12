"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc } from "firebase/firestore";

type FieldSpec = { id: number; label: string; type: "text" | "photo" };
type Stage = { id: number; name: string; date: string; fields?: FieldSpec[] | string[] };

type AlertState = {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  show: boolean;
};

const KEY = "stages_config";

function useStages() {
  const [stages, setStages] = useState<Stage[]>([]);
  // Load from Firestore only
  useEffect(() => {
    const fb = getFirebaseClient();
    if (!fb) return;
    (async () => {
      try {
        const ref = doc(fb.db, "config", KEY);
        const snap = await getDoc(ref);
        const list = snap.exists() ? (snap.data()?.list as Stage[] | undefined) : undefined;
        setStages(Array.isArray(list) ? list : []);
      } catch {
        setStages([]);
      }
    })();
  }, []);

  const save = (next: Stage[]) => {
    setStages(next);
    const fb = getFirebaseClient();
    if (fb) {
      setDoc(doc(fb.db, "config", KEY), { list: next, updatedAt: Date.now() }).catch(() => {});
    }
  };
  return { stages, save };
}

export default function FormulirTahapanClient() {
  const { stages, save } = useStages();
  const [showForm, setShowForm] = useState<null | { id?: number }>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [detail, setDetail] = useState<Stage | null>(null);

  // Add wizard states (step 1 -> step 2)
  const [addStep, setAddStep] = useState<0 | 1 | 2>(0);
  const [addName, setAddName] = useState("");
  const [builderFields, setBuilderFields] = useState<FieldSpec[]>([
    { id: Date.now(), label: "Nama", type: "text" },
    { id: Date.now() + 1, label: "Lokasi Proyek", type: "text" },
  ]);
  const [renaming, setRenaming] = useState<null | { index: number; value: string }>(null);
  const [addMenuTop, setAddMenuTop] = useState(false);
  const [addMenuRow, setAddMenuRow] = useState<number | null>(null);

  // Delete confirmation alert state
  const [deleteAlert, setDeleteAlert] = useState<AlertState>({ type: 'warning', title: '', message: '', show: false });
  const [stageToDelete, setStageToDelete] = useState<Stage | null>(null);

  // Photo preview modal state
  const [photoPreview, setPhotoPreview] = useState<{ url: string; title: string; show: boolean }>({ url: '', title: '', show: false });

  // Tampilkan sesuai urutan yang tersimpan (bisa di-reorder)
  const ordered = useMemo(() => stages, [stages]);

  const showDeleteAlert = (stage: Stage) => {
    setStageToDelete(stage);
    setDeleteAlert({
      type: 'warning',
      title: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus tahapan "${stage.name}"?\n\nData yang sudah dihapus tidak dapat dikembalikan.`,
      show: true
    });
  };

  const confirmDelete = () => {
    if (stageToDelete) {
      save(stages.filter(x => x.id !== stageToDelete.id));
      setDeleteAlert(prev => ({ ...prev, show: false }));
      setStageToDelete(null);
    }
  };

  const closeDeleteAlert = () => {
    setDeleteAlert(prev => ({ ...prev, show: false }));
    setStageToDelete(null);
  };

  const move = <T,>(arr: T[], from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
    const next = [...arr];
    const [sp] = next.splice(from, 1);
    next.splice(to, 0, sp);
    return next;
  };

  return (
    <div className="relative space-y-4">
      <h2 className="text-center text-sm sm:text-base font-semibold">Daftar Tahapan & Formulir</h2>
      <div className="hidden sm:flex items-center justify-end pr-2 text-xs text-neutral-500">Tanggal</div>

      <ul className="space-y-3">
        {ordered.length===0 && (<li className="text-center text-neutral-500 text-sm py-10 ring-1 ring-neutral-200 bg-white rounded-2xl">Belum ada tahapan. Klik tombol + untuk menambah.</li>)}
        {ordered.map((s, idx)=> (
          <li key={s.id} className="rounded-2xl ring-1 ring-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-3">
              <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{s.name}</div></div>
              <div className="hidden sm:block text-xs text-neutral-500 min-w-[110px] text-right">{new Date(s.date).toLocaleDateString('id-ID')}</div>
              <div className="text-right min-w-[210px]">
                <div className="mt-1 flex items-center justify-end gap-2">
                  <button type="button" disabled={idx===0} onClick={()=> save(move(stages, idx, idx-1))} className="inline-flex items-center justify-center h-7 w-7 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40" title="Pindah ke atas">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 6 6 12h12L12 6Z"/></svg>
                  </button>
                  <button type="button" disabled={idx===stages.length-1} onClick={()=> save(move(stages, idx, idx+1))} className="inline-flex items-center justify-center h-7 w-7 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40" title="Pindah ke bawah">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 18 18 12H6l6 6Z"/></svg>
                  </button>
                  <button type="button" onClick={()=>{ setShowForm({id:s.id}); setName(s.name); setDate(s.date); }} className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs">Edit</button>
                  <button type="button" onClick={()=> setDetail(s)} className="inline-flex items-center justify-center h-7 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs">Detail</button>
                  <button type="button" onClick={() => showDeleteAlert(s)} className="inline-flex items-center justify-center h-7 px-3 rounded-full bg-red-500 text-white hover:bg-red-600 text-xs">Hapus</button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button type="button" onClick={()=>{ setAddStep(1); setAddName(""); setBuilderFields([{ id: Date.now(), label: "Nama", type: "text" }, { id: Date.now()+1, label: "Lokasi Proyek", type: "text" }]); }} className="fixed bottom-6 right-6 inline-flex items-center justify-center h-12 w-12 rounded-2xl ring-1 ring-neutral-300 bg-white text-neutral-700 shadow-md hover:bg-neutral-100" title="Tambah Tahapan" aria-label="Tambah Tahapan">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z"/></svg>
      </button>

      {/* Add Wizard - Step 1: Nama Tahapan */}
      {addStep === 1 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={()=> setAddStep(0)}>
          <div className="relative w-full max-w-lg" onClick={(e)=> e.stopPropagation()}>
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 text-center font-semibold text-sm">Tambah Tahapan</div>
              <div className="p-6">
                <div className="space-y-2 max-w-xl mx-auto">
                  <div className="text-sm">Nama Tahapan</div>
                  <input value={addName} onChange={(e)=> setAddName(e.target.value)} placeholder="Masukkan Nama Tahapan" className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-300" />
                </div>
                <div className="pt-6 flex items-center justify-center gap-3">
                  <button type="button" onClick={()=> setAddStep(0)} className="rounded-xl bg-white ring-1 ring-neutral-300 px-5 py-2 text-sm hover:bg-neutral-50">Batal</button>
                  <button type="button" onClick={()=> setAddStep(2)} className="rounded-xl bg-neutral-100 ring-1 ring-neutral-300 px-6 py-2.5 text-sm font-semibold hover:bg-neutral-200">Selanjutnya</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Wizard - Step 2: Lengkapi Formulir */}
      {addStep === 2 && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={()=> setAddStep(0)}>
          <div className="relative w-full max-w-3xl" onClick={(e)=> e.stopPropagation()}>
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 text-center font-semibold text-sm">Lengkapi Formulir</div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-end relative">
                  <button
                    type="button"
                    onClick={() => setAddMenuTop((v) => !v)}
                    className="inline-flex items-center justify-center h-8 px-3 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 text-xs"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1" fill="currentColor" aria-hidden>
                      <path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z" />
                    </svg>
                    Tambah Field
                  </button>
                  {addMenuTop && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white ring-1 ring-neutral-200 shadow-lg p-1 z-10">
                      <button type="button" onClick={() => { setBuilderFields((prev)=> [...prev, { id: Date.now(), label: "Field Teks", type: "text" }]); setAddMenuTop(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 text-sm">Field Teks</button>
                      <button type="button" onClick={() => { setBuilderFields((prev)=> [...prev, { id: Date.now()+1, label: "Upload Foto", type: "photo" }]); setAddMenuTop(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 text-sm">Upload Foto</button>
                    </div>
                  )}
                </div>
                {builderFields.map((field, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-xs font-medium text-neutral-700 flex items-center gap-2">
                      <span>{field.label}</span>
                      <button type="button" onClick={()=> setRenaming({ index: idx, value: field.label })} className="text-neutral-600 hover:text-neutral-800" title="Ganti nama">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2 1.5h-.5v-.5l9.56-9.56.5.5L5 18.75ZM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z"/></svg>
                      </button>
                    </div>
                    <div className="relative">
                      {field.type === "text" ? (
                        <input disabled placeholder={field.label} className="w-full rounded-2xl border-0 ring-1 ring-neutral-300 bg-white px-4 py-2.5 text-sm shadow-inner" />
                      ) : (
                        <div className="w-full rounded-2xl ring-1 ring-dashed ring-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-500 grid place-items-center">
                          <div className="inline-flex items-center gap-2">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 10 2.5-3 2 2.5L15 12l3 3H8Z"/></svg>
                            Upload Foto
                          </div>
                        </div>
                      )}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="relative">
                          <button type="button" onClick={()=> setAddMenuRow(idx)} className="inline-flex items-center justify-center h-7 w-7 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100" title="Tambah field">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 3a1 1 0 0 1 1 1v7h7a1 1 0 1 1 0 2h-7v7a1 1 0 1 1-2 0v-7H4a1 1 0 1 1 0-2h7V4a1 1 0 0 1 1-1Z"/></svg>
                          </button>
                          {addMenuRow === idx && (
                            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl bg-white ring-1 ring-neutral-200 shadow-lg p-1 z-10">
                              <button type="button" onClick={() => { const next=[...builderFields]; next.splice(idx+1,0,{ id: Date.now(), label: "Field Teks", type: "text" }); setBuilderFields(next); setAddMenuRow(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 text-sm">Field Teks</button>
                              <button type="button" onClick={() => { const next=[...builderFields]; next.splice(idx+1,0,{ id: Date.now()+1, label: "Upload Foto", type: "photo" }); setBuilderFields(next); setAddMenuRow(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50 text-sm">Upload Foto</button>
                            </div>
                          )}
                        </div>
                        <button type="button" disabled={idx===0} onClick={()=> { const next=move(builderFields, idx, idx-1) as FieldSpec[]; setBuilderFields(next); }} className="inline-flex items-center justify-center h-7 w-7 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40" title="Pindah ke atas">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 6 6 12h12L12 6Z"/></svg>
                        </button>
                        <button type="button" disabled={idx===builderFields.length-1} onClick={()=> { const next=move(builderFields, idx, idx+1) as FieldSpec[]; setBuilderFields(next); }} className="inline-flex items-center justify-center h-7 w-7 rounded-full ring-1 ring-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40" title="Pindah ke bawah">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 18 18 12H6l6 6Z"/></svg>
                        </button>
                        <button type="button" onClick={()=> { if (builderFields.length<=1) return; const next=[...builderFields]; next.splice(idx,1); setBuilderFields(next); }} className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-red-500 text-white hover:bg-red-600" title="Hapus field">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M6 7h12v2H6V7Zm2 3h8l-1 10H9L8 10Zm3-5h2l1 2H10l1-2Z"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button type="button" onClick={()=> setAddStep(0)} className="rounded-xl bg-white ring-1 ring-neutral-300 px-5 py-2 text-sm hover:bg-neutral-50">Batal</button>
                  <button type="button" onClick={()=> {
                    const d=new Date();
                    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    const item: Stage = { id: Date.now(), name: addName || 'Tahapan Baru', date: iso, fields: builderFields };
                    save([...stages, item]);
                    setAddStep(0);
                  }} className="rounded-xl bg-neutral-100 ring-1 ring-neutral-300 px-6 py-2.5 text-sm font-semibold hover:bg-neutral-200">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename field small dialog */}
      {renaming && (
        <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4" onClick={() => setRenaming(null)}>
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 text-sm font-semibold">Ubah nama field</div>
              <div className="p-4 space-y-3">
                <input
                  autoFocus
                  value={renaming.value}
                  onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                  className="w-full rounded-xl ring-1 ring-neutral-300 px-3 py-2 text-sm"
                />
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setRenaming(null)} className="rounded-lg bg-white ring-1 ring-neutral-300 px-4 py-1.5 text-sm hover:bg-neutral-50">Batal</button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...builderFields];
                      const current = next[renaming.index];
                      next[renaming.index] = { ...current, label: renaming.value.trim() || current.label };
                      setBuilderFields(next);
                      setRenaming(null);
                    }}
                    className="rounded-lg bg-neutral-900 text-white px-4 py-1.5 text-sm hover:bg-neutral-800"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4" onClick={()=> setShowForm(null)}>
          <div className="relative w-full max-w-md" onClick={(e)=> e.stopPropagation()}>
            <div className="rounded-2xl bg-white ring-1 ring-neutral-200 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200 font-semibold text-sm">{showForm.id? 'Edit Tahapan':'Tambah Tahapan'}</div>
              <form className="p-4 grid gap-3" onSubmit={(e)=>{ e.preventDefault(); if(showForm.id){ save(stages.map(s=> s.id===showForm.id? {...s,name,date}:s)); } else { save([...stages,{ id:Date.now(), name:name||'Tahapan Baru', date }]); } setShowForm(null); }}>
                <div><div className="text-sm">Nama Tahapan</div><input value={name} onChange={(e)=> setName(e.target.value)} placeholder="Masukkan nama tahapan" className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm"/></div>
                <div><div className="text-sm">Tanggal</div><input type="date" value={date} onChange={(e)=> setDate(e.target.value)} className="w-full rounded-md ring-1 ring-neutral-300 px-3 py-1.5 text-sm"/></div>
                <div className="pt-2"><button type="submit" className="mx-auto block rounded-xl bg-neutral-100 ring-1 ring-neutral-300 px-5 py-2 text-sm font-semibold hover:bg-neutral-200">Simpan</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={() => setDetail(null)}
          />

          {/* Detail Modal Card */}
          <div className="relative w-full max-w-lg animate-in slide-in-from-top-3 duration-500 transform-gpu" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu animate-in zoom-in-98 fade-in duration-400 delay-100">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
                {/* Info Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                    <path d="M7 4h10a2 2 0 0 1 2 2v14l-5-2-5 2V6a2 2 0 0 1 2-2Z" />
                  </svg>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 text-base">Detail Tahapan</h3>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setDetail(null)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-5 py-5 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">Nama Tahapan</div>
                    <div className="text-sm font-medium text-neutral-800 bg-slate-50 rounded-lg px-3 py-2">{detail.name}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">Tanggal</div>
                    <div className="text-sm font-medium text-neutral-800 bg-slate-50 rounded-lg px-3 py-2">{new Date(detail.date).toLocaleDateString('id-ID')}</div>
                  </div>
                </div>

                {/* Field Formulir */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-neutral-700">Field Formulir</div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    {(detail.fields ?? []).map((f: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-3">
                          {/* Field Type Icon */}
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            f.type === 'photo' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                              <path d={
                                f.type === 'photo'
                                  ? 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 10 2.5-3 2 2.5L15 12l3 3H8Z'
                                  : 'M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Zm2 1v8h14V7H5Z'
                              } />
                            </svg>
                          </div>

                          {/* Field Info */}
                          <div>
                            <div className="text-sm font-medium text-neutral-800">{f.label}</div>
                            <div className="text-xs text-neutral-500">{f.type === 'photo' ? 'Upload Foto' : 'Field Teks'}</div>
                          </div>
                        </div>

                        {/* Preview Button for Photos */}
                        {f.type === 'photo' && (
                          <button
                            type="button"
                            onClick={() => {
                              // Show photo preview modal
                              setPhotoPreview({
                                url: 'https://picsum.photos/400/300?random=' + f.id, // Placeholder URL
                                title: f.label,
                                show: true
                              });
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden>
                              <path d="M12 5c-6 0-9 7-9 7s3 7 9 7 9-7 9-7-3-7-9-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z" />
                            </svg>
                            Preview
                          </button>
                        )}
                      </div>
                    ))}

                    {(!detail.fields || detail.fields.length === 0) && (
                      <div className="text-center py-6 text-sm text-neutral-500">
                        Belum ada field formulir
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-5 py-4 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={() => setDetail(null)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {deleteAlert.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={closeDeleteAlert}
          />

          {/* Delete Confirmation Card */}
          <div className="relative w-full max-w-sm animate-in slide-in-from-top-3 duration-500 transform-gpu">
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu animate-in zoom-in-98 fade-in duration-400 delay-100">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100">
                {/* Warning Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 text-sm">{deleteAlert.title}</h3>
                </div>

                {/* Close button */}
                <button
                  onClick={closeDeleteAlert}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-4 py-4">
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{deleteAlert.message}</p>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-4 py-4 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={closeDeleteAlert}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {photoPreview.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={() => setPhotoPreview(prev => ({ ...prev, show: false }))}
          />

          {/* Photo Preview Card */}
          <div className="relative w-full max-w-2xl animate-in slide-in-from-top-3 duration-500 transform-gpu" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-neutral-200 overflow-hidden transform-gpu animate-in zoom-in-98 fade-in duration-400 delay-100">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-neutral-100">
                {/* Photo Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                    <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 10 2.5-3 2 2.5L15 12l3 3H8Z" />
                  </svg>
                </div>

                {/* Title */}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 text-base">Preview Foto: {photoPreview.title}</h3>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setPhotoPreview(prev => ({ ...prev, show: false }))}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                    <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L10.586 12 4.81 17.776a1 1 0 1 0 1.414 1.415L12 13.414l5.776 5.776a1 1 0 0 0 1.414-1.414L13.415 12l5.776-5.776a1 1 0 0 0-1.414-1.414L12 10.586 6.225 4.811Z" />
                  </svg>
                </button>
              </div>

              {/* Photo Content */}
              <div className="px-5 py-5">
                <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={photoPreview.url}
                    alt={photoPreview.title}
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/400x300/e5e7eb/6b7280?text=Image+Not+Found';
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-5 py-4 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={() => setPhotoPreview(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-all"
                >
                  Tutup
                </button>
                <a
                  href={photoPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  Buka di Tab Baru
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
