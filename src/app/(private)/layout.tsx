"use client";

import AuthGuard from "@/components/AuthGuard";

export default function PrivateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthGuard>
      <main className="min-h-screen flex flex-col flex-1">{children}</main>
    </AuthGuard>
  );
}


