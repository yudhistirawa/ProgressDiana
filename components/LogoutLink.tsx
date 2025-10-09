"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuth } from "@/lib/authClient";
import { getAuth, signOut } from "firebase/auth";
import * as React from "react";

type Props = React.ComponentProps<typeof Link> & { href?: string };

export default function LogoutLink({ href = "/", onClick, ...rest }: Props) {
  const router = useRouter();
  return (
    <Link
      {...rest}
      href={href}
      onClick={(e) => {
        try {
          clearAuth(); try { const auth = getAuth(); signOut(auth).catch(() => {}); } catch {}
        } catch {}
        onClick?.(e as any);
        // Ensure hard redirect to clear state
        e.preventDefault();
        router.push(href);
      }}
    />
  );
}




