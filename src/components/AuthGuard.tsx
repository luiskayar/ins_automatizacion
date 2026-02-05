"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated && !isLoginRoute) {
      router.push("/login");
    }
  }, [isAuthenticated, isHydrating, isLoginRoute, router]);

  if (isHydrating) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-sm text-neutral-500">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated && !isLoginRoute) {
    return null;
  }

  return <>{children}</>;
}


