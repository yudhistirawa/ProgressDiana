import { redirect } from "next/navigation";

export const metadata = {
  title: "Riwayat Laporan - Sistem Dokumentasi Progres",
  description: "Riwayat laporan progres",
};

export default function NotifikasiRedirect() {
  redirect("/dashboard/riwayat-laporan");
}
