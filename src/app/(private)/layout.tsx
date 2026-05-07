"use client";

import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-neutral-900">
        <header className="w-full border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-white tracking-wide">
                Delphos
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/40">
                Panel
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-white">
                    {user.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs text-white/50">Usuario</span>
                    <span className="font-medium">{user}</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-neutral-800/80 hover:bg-neutral-700 border border-white/10 hover:border-white/30 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12H3m0 0l4-4m-4 4l4 4m4-10h6a2 2 0 012 2v8a2 2 0 01-2 2h-6"
                  />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </div>
    </AuthGuard>
  );
}


