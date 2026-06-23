"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (user) {
      if (user.role === "Kasir") {
        router.push("/kasir");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = await login(username, password);
    if (!success) {
      setError("Username atau password salah!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0a0502] via-[#1a0e05] to-[#120a05]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-9xl">🏮</div>
        <div className="absolute bottom-10 right-10 text-9xl">�</div>
        <div className="absolute top-1/2 right-20 text-6xl">☕</div>
        <div className="absolute bottom-1/3 left-20 text-5xl">🍜</div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-gradient-to-br from-[#2C1810]/95 to-[#1a0e05]/95 backdrop-blur-xl border-2 border-angkringan-primary/30 rounded-3xl p-8 shadow-2xl shadow-black/60">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-angkringan-primary to-angkringan-secondary rounded-3xl shadow-lg mb-4">
              <span className="text-5xl">🏮</span>
            </div>
            <h1 className="text-3xl font-bold text-gradient mb-1">
              POS Angkringan
            </h1>
            <p className="text-angkringan-light/60 text-sm">
              Warung Digital Angkringan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-angkringan-light/80 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  👤
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Masukkan username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-angkringan-light/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                  🔒
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Masukkan password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-xl text-sm text-center font-medium">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full text-lg flex items-center justify-center gap-2 py-4"
            >
              <span>🔑</span>
              Masuk
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
