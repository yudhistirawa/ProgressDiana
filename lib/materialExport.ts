import { MATERIAL_PROJECTS, MOVEMENT_LABELS, type Material, type MaterialMovement, type MaterialProject } from "./materialStock";

export async function exportMaterialWorkbook(project: MaterialProject, materials: Material[], movements: MaterialMovement[], start: string, end: string) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  book.creator = "Sistem Dokumentasi Proyek";
  book.created = new Date();
  const projectName = MATERIAL_PROJECTS.find(p => p.key === project)!.label;
  const stock = book.addWorksheet("Stok saat ini");
  stock.addRow([projectName, "Stok saat ekspor", new Date().toLocaleString("id-ID")]);
  stock.addRow(["Nama material", "Satuan", "Stok awal (setelah koreksi)", "Total masuk", "Total dipakai", "Sisa saat ini", "Foto stok terakhir", "Status material"]);
  materials.forEach(m => stock.addRow([m.name, m.unit, m.initialStock, m.receivedTotal, m.usedTotal, m.stock, { text: "Buka foto stok terakhir", hyperlink: m.photoUrl }, m.isDeleted ? "Dihapus" : "Aktif"]));
  const history = book.addWorksheet("Riwayat periode");
  history.addRow([projectName, "Periode pencatatan", start, end]);
  history.addRow(["Waktu", "Material", "Satuan", "Jenis", "Jumlah / jumlah pengganti", "Perubahan stok", "Stok sebelum", "Stok sesudah", "Petugas", "Tujuan / alasan", "Foto setelah transaksi", "ID transaksi asal koreksi", "ID transaksi"]);
  movements.forEach(m => history.addRow([
    m.createdAt ? new Date(m.createdAt.toMillis()).toLocaleString("id-ID") : "", m.materialName, m.unit,
    MOVEMENT_LABELS[m.type], m.quantity, m.delta, m.beforeStock, m.afterStock,
    m.actorName, m.purpose, { text: "Buka foto", hyperlink: m.photoUrl }, m.correctionOf || "", m.id,
  ]));
  for (const sheet of [stock, history]) {
    sheet.views = [{ state: "frozen", ySplit: 2 }];
    sheet.getRow(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };
    sheet.columns.forEach((column, i) => { column.width = i === 0 ? 30 : 24; });
    sheet.eachRow((row, index) => {
      if (index < 3) return;
      row.eachCell(cell => {
        cell.alignment = { vertical: "top", wrapText: true };
        if (cell.type === ExcelJS.ValueType.Hyperlink) cell.font = { color: { argb: "FF2563EB" }, underline: true };
        if (cell.type === ExcelJS.ValueType.Number) cell.numFmt = "#,##0.###";
      });
    });
    sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: Math.max(2, sheet.rowCount), column: sheet.columnCount } };
  }
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `rekap-material-${project}-${start}-${end}.xlsx`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
