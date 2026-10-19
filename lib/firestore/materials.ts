import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, startAfter, Timestamp, where, writeBatch, type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";
import { getFirebaseClient, getFirebaseStorage } from "../firebaseClient";
import { applyStockMovement, stockNumber, validateMaterialPeriod, type Material, type MaterialMovement, type MaterialProject, type MovementType } from "../materialStock";

function context(project: MaterialProject) {
  if (!["diana", "bungtomo", "bisma"].includes(project)) throw new Error("Proyek tidak valid.");
  const fb = getFirebaseClient();
  if (!fb) throw new Error("Firebase belum terkonfigurasi.");
  return { ...fb, materials: collection(fb.db, "materialProjects", project, "materials"), movements: collection(fb.db, "materialProjects", project, "movements") };
}

async function actor(adminOnly: boolean) {
  const fb = getFirebaseClient();
  if (!fb) throw new Error("Firebase belum terkonfigurasi.");
  const user = getAuth(fb.app).currentUser;
  if (!user) throw new Error("Silakan masuk kembali.");
  const profile = await getDoc(doc(fb.db, "users", user.uid));
  const data = profile.data();
  if (!profile.exists() || (adminOnly ? data?.role !== "admin" : !["admin", "pelaksana", "petugas"].includes(data?.role))) {
    throw new Error("Akun tidak memiliki izin untuk tindakan ini.");
  }
  const name = [data?.name, data?.nama, data?.username, user.email, user.uid].find(value => typeof value === "string" && value.length > 0) as string;
  return { uid: user.uid, name, role: data?.role as string };
}

export async function fetchMaterials(project: MaterialProject) {
  const ctx = context(project);
  const result = await getDocs(ctx.materials);
  return result.docs.map(d => ({ ...d.data(), id: d.id } as Material)).sort((a,b) => a.name.localeCompare(b.name, "id"));
}

// One range field avoids requiring a new composite index. Material selection is
// applied after the bounded period has been fetched, so recap/export agree.
export async function fetchMaterialMovements(project: MaterialProject, start: string, end: string): Promise<MaterialMovement[]> {
  const ctx = context(project);
  const { from, until } = validateMaterialPeriod(start, end);
  const hidden = new Set((await getDocs(query(ctx.materials, where("historyDeleted", "==", true)))).docs.map(d => d.id));
  const base = query(ctx.movements, where("createdAt", ">=", Timestamp.fromDate(from)), where("createdAt", "<", Timestamp.fromDate(until)), orderBy("createdAt", "desc"));
  const items: MaterialMovement[] = [];
  let cursor: QueryDocumentSnapshot<DocumentData> | undefined;
  while (true) {
    const snap = await getDocs(query(base, ...(cursor ? [startAfter(cursor)] : []), limit(200)));
    items.push(...snap.docs.map(d => ({ ...d.data(), id: d.id } as MaterialMovement)).filter(item => !hidden.has(item.materialId)));
    if (items.length > 10000) throw new Error("Rekap lebih dari 10.000 transaksi. Persempit rentang tanggal.");
    if (snap.size < 200) return items;
    cursor = snap.docs[snap.docs.length - 1];
  }
}

async function uploadPhoto(project: MaterialProject, uid: string, operationId: string, file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Gunakan foto JPG, PNG, atau WebP.");
  if (file.size === 0 || file.size > 10 * 1024 * 1024) throw new Error("Ukuran foto maksimal 10 MB.");
  const storage = await getFirebaseStorage();
  if (!storage) throw new Error("Penyimpanan foto belum tersedia.");
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const bitmap = await createImageBitmap(file);
  let blob: Blob;
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Foto tidak dapat diproses.");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error("Foto tidak dapat diproses.")), "image/jpeg", 0.85));
  } finally { bitmap.close(); }
  if (blob.size > 5 * 1024 * 1024) throw new Error("Foto terlalu besar setelah diproses.");
  const target = ref(storage, `material-photos/${project}/${uid}/${operationId}-${crypto.randomUUID()}.jpg`);
  await uploadBytes(target, blob, { contentType: "image/jpeg" });
  return getDownloadURL(target);
}

export type MaterialSubmission = {
  operationId: string; type: MovementType; materialId?: string; name?: string; unit?: string;
  quantity: number; purpose: string; photo: File; correctionOf?: string;
};

export async function submitMaterial(project: MaterialProject, input: MaterialSubmission) {
  const ctx = context(project);
  const who = await actor(input.type !== "usage");
  if (!/^[\w-]{10,100}$/.test(input.operationId)) throw new Error("Identitas transaksi tidak valid.");
  const quantity = stockNumber(input.quantity);
  if (quantity < 0 || (!["initial", "correction"].includes(input.type) && quantity === 0)) throw new Error("Periksa jumlah material.");
  const name = input.name?.trim() || "";
  const unit = input.unit?.trim() || "";
  const purpose = input.purpose.trim();
  if (!purpose || purpose.length > 1000) throw new Error("Keterangan wajib diisi, maksimal 1.000 karakter.");
  if (input.type === "initial" && (!name || name.length > 120 || !unit || unit.length > 30)) throw new Error("Isi nama material dan satuannya.");
  if (input.type !== "initial" && (!input.materialId || input.materialId.includes("/"))) throw new Error("Pilih material terlebih dahulu.");
  if (input.type === "correction" && (!input.correctionOf || input.correctionOf.includes("/"))) throw new Error("Pilih transaksi yang akan dikoreksi.");
  const materialRef = doc(ctx.materials, input.type === "initial" ? input.operationId : input.materialId!);
  const movementRef = doc(ctx.movements, input.operationId);
  // Check retry before uploading another photo. The transaction rechecks this.
  const previous = await getDoc(movementRef);
  if (previous.exists()) {
    if (previous.data().actorUid !== who.uid || previous.data().materialId !== materialRef.id || previous.data().type !== input.type) throw new Error("Identitas transaksi sudah digunakan.");
    return;
  }
  const photoUrl = await uploadPhoto(project, who.uid, input.operationId, input.photo);
  await runTransaction(ctx.db, async tx => {
    const existing = await tx.get(movementRef);
    if (existing.exists()) {
      if (existing.data().actorUid !== who.uid || existing.data().materialId !== materialRef.id || existing.data().type !== input.type) throw new Error("Identitas transaksi sudah digunakan.");
      return;
    }
    const materialSnap = await tx.get(materialRef);
    let totals;
    let currentName = name;
    let currentUnit = unit;
    let beforeStock = 0;
    if (input.type === "initial") {
      if (materialSnap.exists()) throw new Error("Material sudah dibuat.");
      totals = { initialStock: quantity, receivedTotal: 0, usedTotal: 0, stock: quantity, delta: quantity };
    } else {
      if (!materialSnap.exists()) throw new Error("Material tidak ditemukan.");
      const material = materialSnap.data() as Material;
      if (material.isDeleted) throw new Error("Material sudah dihapus dan tidak bisa dipakai atau ditambah stoknya.");
      currentName = material.name;
      currentUnit = material.unit;
      beforeStock = material.stock;
      let original: MaterialMovement | undefined;
      if (input.type === "correction") {
        const originalRef = doc(ctx.movements, input.correctionOf!);
        const correctionRef = doc(ctx.db, "materialProjects", project, "corrections", input.correctionOf!);
        const originalSnap = await tx.get(originalRef);
        const corrected = await tx.get(correctionRef);
        if (!originalSnap.exists() || originalSnap.data().materialId !== materialRef.id) throw new Error("Transaksi asal tidak ditemukan pada material ini.");
        if (corrected.exists()) throw new Error("Transaksi sudah dikoreksi. Riwayat koreksi dapat dilihat di rekap.");
        original = originalSnap.data() as MaterialMovement;
        // This marker prevents two administrators correcting the same event twice.
        totals = applyStockMovement(material, input.type, quantity, original);
        tx.set(correctionRef, { movementId: movementRef.id, materialId: materialRef.id, actorUid: who.uid, createdAt: serverTimestamp() });
      } else totals = applyStockMovement(material, input.type, quantity);
    }
    const { delta, initialStock, receivedTotal, usedTotal, stock } = totals;
    const movement = {
      materialId: materialRef.id, materialName: currentName, unit: currentUnit, type: input.type,
      quantity, delta, beforeStock, afterStock: stock, purpose, photoUrl,
      actorUid: who.uid, actorName: who.name, createdAt: serverTimestamp(),
      correctionOf: input.type === "correction" ? input.correctionOf! : null,
      replacementQuantity: input.type === "correction" ? quantity : null,
    };
    tx.set(movementRef, movement);
    if (input.type === "initial") tx.set(materialRef, {
      name, unit, initialStock, receivedTotal, usedTotal, stock, photoUrl,
      lastMovementId: movementRef.id, createdBy: who.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    else tx.update(materialRef, { initialStock, receivedTotal, usedTotal, stock, photoUrl, lastMovementId: movementRef.id, updatedAt: serverTimestamp() });
  });
}

export async function manageMaterial(project: MaterialProject, input: {
  operationId: string; materialId: string; action: "edit" | "delete";
  name?: string; unit?: string; photo?: File; removeHistory?: boolean; confirmation?: string;
}) {
  const ctx = context(project);
  const who = await actor(true);
  if (!/^[\w-]{10,100}$/.test(input.operationId) || !input.materialId || input.materialId.includes("/")) throw new Error("Identitas material tidak valid.");
  if (!["edit", "delete"].includes(input.action)) throw new Error("Tindakan tidak valid.");
  const removeHistory = input.action === "delete" && input.removeHistory === true;
  if (removeHistory && input.confirmation !== "HAPUS") throw new Error("Ketik HAPUS untuk mengonfirmasi penghapusan seluruh riwayat material.");
  const name = input.name?.trim() || "";
  const unit = input.unit?.trim() || "";
  if (input.action === "edit" && (!name || name.length > 120 || !unit || unit.length > 30)) throw new Error("Isi nama material dan satuan dengan benar.");
  const materialRef = doc(ctx.materials, input.materialId);
  const changeRef = doc(ctx.db, "materialProjects", project, "materialChanges", input.operationId);
  const previous = await getDoc(changeRef);
  if (previous.exists()) {
    if (previous.data().actorUid !== who.uid || previous.data().materialId !== input.materialId || previous.data().action !== input.action || (previous.data().removeHistory === true) !== removeHistory) throw new Error("Identitas perubahan sudah digunakan dengan pilihan berbeda.");
    if (removeHistory) await purgeMaterialHistory(project, input.materialId);
    return;
  }
  const photoUrl = input.action === "edit" && input.photo ? await uploadPhoto(project, who.uid, input.operationId, input.photo) : null;
  await runTransaction(ctx.db, async tx => {
    const change = await tx.get(changeRef);
    if (change.exists()) {
      if (change.data().actorUid !== who.uid || change.data().materialId !== input.materialId || change.data().action !== input.action || (change.data().removeHistory === true) !== removeHistory) throw new Error("Identitas perubahan sudah digunakan dengan pilihan berbeda.");
      return;
    }
    const snap = await tx.get(materialRef);
    if (!snap.exists()) throw new Error("Material tidak ditemukan.");
    const current = snap.data() as Material;
    if (current.isDeleted && !removeHistory) throw new Error("Material sudah dihapus.");
    if (input.action === "edit" && unit !== current.unit && current.lastMovementId !== input.materialId) throw new Error("Satuan tidak dapat diubah setelah ada transaksi lanjutan. Gunakan material baru untuk satuan berbeda.");
    const before = { name: current.name, unit: current.unit, photoUrl: current.photoUrl, isDeleted: current.isDeleted === true };
    const after = input.action === "delete" ? { ...before, isDeleted: true } : { name, unit, photoUrl: photoUrl || current.photoUrl, isDeleted: false };
    tx.set(changeRef, { materialId: input.materialId, action: input.action, before, after, removeHistory, actorUid: who.uid, actorName: who.name, createdAt: serverTimestamp() });
    tx.update(materialRef, {
      ...after, updatedAt: serverTimestamp(), updatedBy: who.uid, lastAdminChangeId: changeRef.id,
      ...(input.action === "delete" ? { deletedAt: serverTimestamp(), deletedBy: who.uid } : {}),
      ...(removeHistory ? { historyDeleted: true, historyPurgePending: true } : {}),
    });
  });
  if (removeHistory) await purgeMaterialHistory(project, input.materialId);
}

async function purgeMaterialHistory(project: MaterialProject, materialId: string) {
  const ctx = context(project);
  try {
    for (const name of ["movements", "corrections"]) {
      const target = collection(ctx.db, "materialProjects", project, name);
      while (true) {
        const snap = await getDocs(query(target, where("materialId", "==", materialId), limit(200)));
        if (snap.empty) break;
        const batch = writeBatch(ctx.db);
        snap.docs.forEach(row => batch.delete(row.ref));
        await batch.commit();
      }
    }
    await runTransaction(ctx.db, async tx => {
      const ref = doc(ctx.materials, materialId);
      const snap = await tx.get(ref);
      if (snap.exists() && snap.data().historyDeleted && snap.data().historyPurgePending) tx.update(ref, { historyPurgePending: false, updatedAt: serverTimestamp() });
    });
  } catch {
    throw new Error("Material sudah dinonaktifkan, tetapi penghapusan riwayat belum selesai. Coba lagi atau gunakan Lanjutkan penghapusan di daftar stok.");
  }
}
