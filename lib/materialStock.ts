export type StockCategory = "material" | "alat";
export type MaterialProject = "diana" | "bungtomo" | "bisma" | "sampoerna";
export type MovementType = "initial" | "incoming" | "usage" | "correction";
export type StockTotals = { initialStock: number; receivedTotal: number; usedTotal: number; stock: number };
export type Material = StockTotals & {
  id: string; name: string; unit: string; photoUrl: string; lastMovementId: string;
  isDeleted?: boolean;
  historyDeleted?: boolean;
  historyPurgePending?: boolean;
};
export type MaterialMovement = {
  id: string; materialId: string; materialName: string; unit: string; type: MovementType;
  quantity: number; delta: number; beforeStock: number; afterStock: number;
  purpose: string; photoUrl: string; actorUid: string; actorName: string;
  createdAt: { toMillis: () => number } | null;
  correctionOf: string | null; replacementQuantity: number | null;
};

export const MATERIAL_PROJECTS: { key: MaterialProject; label: string }[] = [
  { key: "diana", label: "Proyek Diana" }, { key: "bungtomo", label: "Proyek Bung Tomo" }, { key: "bisma", label: "Proyek Bisma" },
  { key: "sampoerna", label: "Proyek MR Sampoerna Medan" },
];
export const MOVEMENT_LABELS: Record<MovementType, string> = {
  initial: "Stok awal", incoming: "Stok masuk", usage: "Pemakaian", correction: "Koreksi",
};

// Millesimal precision supports kg/m³ without accumulating binary float errors.
export function stockNumber(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > 1_000_000_000) throw new Error("Jumlah di luar batas yang didukung.");
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - value) > 0.0000001) throw new Error("Jumlah maksimal 3 angka di belakang koma.");
  return rounded;
}

export function applyStockMovement(current: StockTotals, type: "incoming" | "usage" | "correction", quantity: number,
  original?: Pick<MaterialMovement, "type" | "quantity">): StockTotals & { delta: number } {
  quantity = stockNumber(quantity);
  if (quantity < 0 || (type !== "correction" && quantity === 0)) throw new Error("Jumlah harus lebih dari nol.");
  const next = { ...current };
  if (type === "incoming") next.receivedTotal = stockNumber(current.receivedTotal + quantity);
  if (type === "usage") next.usedTotal = stockNumber(current.usedTotal + quantity);
  if (type === "correction") {
    if (!original || original.type === "correction") throw new Error("Pilih transaksi awal, stok masuk, atau pemakaian yang akan dikoreksi.");
    const difference = stockNumber(quantity - original.quantity);
    const field = original.type === "initial" ? "initialStock" : original.type === "incoming" ? "receivedTotal" : "usedTotal";
    next[field] = stockNumber(current[field] + difference);
  }
  next.stock = stockNumber(next.initialStock + next.receivedTotal - next.usedTotal);
  if (next.stock < 0) throw new Error("Stok tidak mencukupi. Muat ulang stok dan periksa jumlahnya.");
  return { ...next, delta: stockNumber(next.stock - current.stock) };
}

export function materialDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function validateMaterialPeriod(start: string, end: string) {
  const from = new Date(`${start}T00:00:00`);
  const through = new Date(`${end}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    Number.isNaN(from.getTime()) || Number.isNaN(through.getTime()) || materialDate(from) !== start || materialDate(through) !== end || from > through) {
    throw new Error("Rentang tanggal tidak valid.");
  }
  if (through.getTime() - from.getTime() > 366 * 86400000) throw new Error("Pilih rentang maksimal satu tahun.");
  through.setDate(through.getDate() + 1);
  return { from, until: through };
}
