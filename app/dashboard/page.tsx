import DashboardClient from "./DashboardClient";
import { dashboardProjectOrUndefined, isDashboardProjectLocked } from "@/lib/serverProjectAccess";

export const metadata = {
  title: "Dashboard - Sistem Dokumentasi Progres",
  description: "Akses fitur sistem: Laporan Progres dan Riwayat Laporan",
};

export default function DashboardPage({ searchParams }: { searchParams?: { project?: string } }) {
  const projectParam = dashboardProjectOrUndefined(searchParams?.project);
  return <DashboardClient initialProject={projectParam} lockedToSampoerna={isDashboardProjectLocked()} />;
}
