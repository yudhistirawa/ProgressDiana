"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { clearAuth, getRole, type Role } from "@/lib/authClient";
import { getFirebaseClient } from "@/lib/firebaseClient";

type AuthGuardProps = {
  allowedRoles: Role[];
  loginHref?: string;
  publicPaths?: string[];
  children: ReactNode;
};

type GuardState = "checking" | "allowed" | "blocked";

async function resolveUserRole(uid: string, email: string | null | undefined): Promise<Role | null> {
  const fb = getFirebaseClient();
  if (!fb) return null;

  const byId = await getDoc(doc(fb.db, "users", uid));
  if (byId.exists()) {
    const role = (byId.data() as { role?: string }).role;
    if (role === "admin" || role === "pelaksana" || role === "viewer") return role;
  }

  if (!email) return null;

  const byEmail = await getDocs(
    query(collection(fb.db, "users"), where("email", "==", email), limit(1))
  );
  if (byEmail.empty) return null;

  const role = (byEmail.docs[0].data() as { role?: string }).role;
  if (role === "admin" || role === "pelaksana" || role === "viewer") return role;
  return null;
}

export default function AuthGuard({
  allowedRoles,
  loginHref = "/",
  publicPaths = [],
  children,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    if (pathname && publicPaths.includes(pathname)) {
      setState("allowed");
      return;
    }

    let active = true;

    const run = async () => {
      const fb = getFirebaseClient();
      if (!fb) {
        if (!active) return;
        clearAuth();
        setState("blocked");
        router.replace(loginHref);
        return;
      }

      const auth = getAuth(fb.app);
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!active) return;

        if (!user) {
          clearAuth();
          setState("blocked");
          router.replace(loginHref);
          return;
        }

        const actualRole = await resolveUserRole(user.uid, user.email);
        if (!active) return;

        const storedRole = getRole();
        const roleAllowed = actualRole ? allowedRoles.includes(actualRole) : false;
        const storedRoleAllowed = storedRole ? allowedRoles.includes(storedRole) : false;

        if (!roleAllowed || !storedRoleAllowed || storedRole !== actualRole) {
          clearAuth();
          try {
            await signOut(auth);
          } catch {}
          setState("blocked");
          router.replace(loginHref);
          return;
        }

        setState("allowed");
      });

      return unsubscribe;
    };

    let cleanup: (() => void) | undefined;
    run().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, [allowedRoles, loginHref, pathname, publicPaths, router]);

  if (state !== "allowed") {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-5 shadow-sm text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-r-transparent" />
          <p className="mt-3 text-sm text-neutral-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
