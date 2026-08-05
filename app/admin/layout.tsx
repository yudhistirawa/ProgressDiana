import { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin"]} loginHref="/admin" publicPaths={["/admin"]}>
      {children}
    </AuthGuard>
  );
}
