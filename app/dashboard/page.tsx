import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard - Sistem Dokumentasi Progres",
  description: "Akses fitur sistem: Laporan Progres dan Riwayat Laporan",
};

export default function DashboardPage({ searchParams }: { searchParams?: { project?: string } }) {
  const projectParam = searchParams?.project === "bungtomo" ? "bungtomo" : searchParams?.project === "diana" ? "diana" : undefined;
  return <DashboardClient initialProject={projectParam} />;
}
