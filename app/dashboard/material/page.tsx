import MaterialModule from "@/components/MaterialModule";
import { isDashboardProjectLocked } from "@/lib/serverProjectAccess";

export const metadata = { title: "Stok Material dan Alat - Petugas" };

export default function MaterialPage() { return <MaterialModule lockedToSampoerna={isDashboardProjectLocked()} />; }
