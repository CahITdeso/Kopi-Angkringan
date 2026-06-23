"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "📊",
    roles: ["Admin"],
  },
  {
    href: "/kasir",
    label: "POS Kasir",
    icon: "💳",
    roles: ["Admin", "Kasir"],
  },
  { href: "/menu", label: "Menu", icon: "🍽️", roles: ["Admin"] },
  { href: "/laporan", label: "Laporan", icon: "📈", roles: ["Admin"] },
  { href: "/users", label: "Users", icon: "👥", roles: ["Admin"] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filteredMenu = menuItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 z-50 h-full w-64
        bg-gradient-to-b from-angkringan-dark to-angkringan-warm
        border-r border-angkringan-primary/30
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col
      `}
      >
        {/* Logo */}
        <div className="p-4 border-b border-angkringan-primary/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏮</span>
            <div>
              <h1 className="text-lg font-bold text-angkringan-gold">
                POS Angkringan
              </h1>
              <p className="text-xs text-angkringan-secondary">
                Warung Digital
              </p>
            </div>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-3 border-b border-angkringan-primary/20 bg-angkringan-primary/10 flex-shrink-0">
            <p className="text-sm font-medium text-angkringan-gold">
              {user.nama}
            </p>
            <p className="text-xs text-angkringan-secondary">
              Role:{" "}
              <span className="text-angkringan-accent font-semibold">
                {user.role}
              </span>
            </p>
          </div>
        )}

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-angkringan-primary/30 text-angkringan-gold border border-angkringan-primary/50"
                      : "text-angkringan-light/70 hover:bg-angkringan-primary/20 hover:text-angkringan-light"
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {isActive && <span className="ml-auto text-xs">●</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions - fixed at bottom */}
        <div className="p-3 border-t border-angkringan-primary/30 flex-shrink-0">
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200"
          >
            <span className="text-lg">🚪</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
