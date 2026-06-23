import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import AppLayoutClient from "@/components/AppLayoutClient";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <title>POS Angkringan - Warung Digital</title>
        <meta name="description" content="Sistem POS untuk Warung Angkringan" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <AppLayoutClient>{children}</AppLayoutClient>
        </AuthProvider>
      </body>
    </html>
  );
}
