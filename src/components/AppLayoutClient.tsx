"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-angkringan-dark">
          <div className="text-center">
            <span className="text-6xl animate-bounce block mb-4">🏮</span>
            <p className="text-angkringan-gold text-lg">Memuat...</p>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-0">
        <header className="lg:hidden bg-angkringan-dark border-b border-angkringan-primary/30 p-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-angkringan-gold text-2xl"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🏮</span>
            <span className="text-angkringan-gold font-semibold">
              POS Angkringan
            </span>
          </div>
          <div />
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
