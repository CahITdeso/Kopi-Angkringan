"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === "Kasir") {
          router.push("/kasir");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-angkringan-dark">
      <div className="text-center">
        <span className="text-6xl animate-bounce block mb-4">🏮</span>
        <p className="text-angkringan-gold text-lg">Mengalihkan...</p>
      </div>
    </div>
  );
}
