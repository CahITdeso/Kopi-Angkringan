"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { getTransaksi, getMenu, formatRupiah } from "@/lib/data";

export default function DashboardPage() {
  const { user } = useAuth();
  const [transaksi, setTransaksi] = React.useState<any[]>([]);
  const [menu, setMenu] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      const [transaksiData, menuData] = await Promise.all([
        getTransaksi(),
        getMenu(),
      ]);
      setTransaksi(transaksiData);
      setMenu(menuData);
    };

    loadData();
  }, []);

  // Data hari ini
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const transaksiHarian = transaksi.filter((t) => new Date(t.tanggal) >= today);
  const totalPenjualan = transaksiHarian.reduce((sum, t) => sum + t.total, 0);
  const jumlahTransaksi = transaksiHarian.length;

  // Data 7 hari terakhir untuk grafik
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const total = transaksi
      .filter((t) => {
        const tgl = new Date(t.tanggal);
        return tgl >= d && tgl < next;
      })
      .reduce((sum, t) => sum + t.total, 0);
    const count = transaksi.filter((t) => {
      const tgl = new Date(t.tanggal);
      return tgl >= d && tgl < next;
    }).length;
    return {
      label: d.toLocaleDateString("id-ID", { weekday: "short" }),
      total,
      count,
      date: d,
    };
  });
  const maxTotal = Math.max(...last7Days.map((d) => d.total), 1);

  // Menu terlaris
  const menuSales: Record<
    string,
    { nama: string; qty: number; total: number }
  > = {};
  transaksi.forEach((t) => {
    t.items?.forEach((item: any) => {
      if (menuSales[item.menu_id]) {
        menuSales[item.menu_id].qty += item.qty;
        menuSales[item.menu_id].total += item.subtotal;
      } else {
        menuSales[item.menu_id] = {
          nama: item.nama_menu,
          qty: item.qty,
          total: item.subtotal,
        };
      }
    });
  });
  const topMenu = Object.values(menuSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const maxQty = Math.max(...topMenu.map((m) => m.qty), 1);

  // Metode pembayaran
  const paymentMethods: Record<string, number> = {};
  transaksiHarian.forEach((t) => {
    paymentMethods[t.metode_bayar] =
      (paymentMethods[t.metode_bayar] || 0) + t.total;
  });

  const totalMetode = Object.values(paymentMethods).reduce(
    (sum, v) => sum + v,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Dashboard</h1>
          <p className="text-angkringan-light/60 text-sm mt-1">
            Selamat datang,{" "}
            <span className="text-angkringan-gold font-semibold">
              {user?.nama}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-angkringan-warm/50 px-4 py-2 rounded-xl border border-angkringan-primary/20">
          <span className="text-sm text-angkringan-light/60">📅</span>
          <span className="text-angkringan-gold font-bold text-sm">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Penjualan Hari Ini",
            value: formatRupiah(totalPenjualan),
            icon: "💰",
            color: "from-emerald-600 to-emerald-900",
            change: "+" + totalPenjualan,
          },
          {
            title: "Transaksi",
            value: jumlahTransaksi.toString(),
            icon: "🧾",
            color: "from-blue-600 to-blue-900",
            change: "transaksi",
          },
          {
            title: "Menu Tersedia",
            value: menu
              .filter((m: any) => m.status === "Tersedia")
              .length.toString(),
            icon: "🍽️",
            color: "from-amber-600 to-amber-900",
            change: "menu",
          },
          {
            title: "Total Menu",
            value: menu.length.toString(),
            icon: "📋",
            color: "from-purple-600 to-purple-900",
            change: "item",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 border border-white/10 shadow-xl relative overflow-hidden group`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/60 font-medium">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-white/40 mt-1">{card.change}</p>
                </div>
                <span className="text-3xl drop-shadow-lg">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Penjualan 7 Hari */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📈</span>
            <h2 className="text-lg font-bold text-angkringan-gold">
              Grafik Penjualan 7 Hari
            </h2>
          </div>
          <div className="flex items-end gap-2 h-40">
            {last7Days.map((day, idx) => {
              const height = maxTotal > 0 ? (day.total / maxTotal) * 100 : 0;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                >
                  <span className="text-[10px] text-angkringan-accent font-bold">
                    {formatRupiah(day.total).replace("Rp", "")}
                  </span>
                  <div
                    className="w-full rounded-t-lg relative hover:opacity-80 transition-all"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      background: `linear-gradient(to top, #D2691E, #FF8C00)`,
                      minHeight: "8px",
                    }}
                  ></div>
                  <span className="text-[10px] text-angkringan-light/60 mt-1">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metode Pembayaran (Donut Chart) */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💳</span>
            <h2 className="text-lg font-bold text-angkringan-gold">
              Metode Pembayaran
            </h2>
          </div>
          {totalMetode === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl mb-2 block">🛒</span>
              <p className="text-angkringan-light/40">
                Belum ada transaksi hari ini
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Visual bars */}
              <div className="space-y-3">
                {Object.entries(paymentMethods).map(([method, total]) => {
                  const pct = (total / totalMetode) * 100;
                  const colors: Record<string, string> = {
                    Tunai: "from-green-500 to-emerald-600",
                    QRIS: "from-blue-500 to-indigo-600",
                  };
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-angkringan-light font-medium">
                          {method === "Tunai" ? "💰 Tunai" : "📱 QRIS"}
                        </span>
                        <span className="text-angkringan-accent font-bold">
                          {formatRupiah(total)}
                        </span>
                      </div>
                      <div className="w-full bg-angkringan-dark rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${colors[method] || "from-angkringan-primary to-angkringan-secondary"} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-angkringan-light/40 text-right mt-0.5">
                        {pct.toFixed(0)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Terlaris dengan Bar */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🏆</span>
            <h2 className="text-lg font-bold text-angkringan-gold">
              Menu Terlaris
            </h2>
          </div>
          {topMenu.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl mb-2 block">📊</span>
              <p className="text-angkringan-light/40">
                Belum ada data penjualan
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topMenu.map((item, idx) => {
                const barWidth = (item.qty / maxQty) * 100;
                const medals = ["🥇", "🥈", "🥉"];
                const rank = idx < 3 ? medals[idx] : `#${idx + 1}`;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{rank}</span>
                        <span className="text-angkringan-light text-sm font-medium">
                          {item.nama}
                        </span>
                      </div>
                      <span className="text-angkringan-accent font-bold text-sm">
                        {item.qty}×
                      </span>
                    </div>
                    <div className="w-full bg-angkringan-dark rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barWidth}%`,
                          background:
                            idx === 0
                              ? "linear-gradient(to right, #FFD700, #FFA500)"
                              : idx === 1
                                ? "linear-gradient(to right, #C0C0C0, #A8A8A8)"
                                : idx === 2
                                  ? "linear-gradient(to right, #CD7F32, #B8860B)"
                                  : "linear-gradient(to right, #8B4513, #D2691E)",
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ringkasan */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-bold text-angkringan-gold">
              Ringkasan Bisnis
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Total Pendapatan",
                value: formatRupiah(transaksi.reduce((s, t) => s + t.total, 0)),
                icon: "💰",
                color: "text-emerald-400",
              },
              {
                label: "Total Transaksi",
                value: transaksi.length.toString(),
                icon: "🧾",
                color: "text-blue-400",
              },
              {
                label: "Rata-rata per Transaksi",
                value:
                  transaksi.length > 0
                    ? formatRupiah(
                        Math.round(
                          transaksi.reduce((s, t) => s + t.total, 0) /
                            transaksi.length,
                        ),
                      )
                    : "Rp 0",
                icon: "📊",
                color: "text-purple-400",
              },
              {
                label: "Menu Terlaris",
                value: topMenu[0]?.nama || "-",
                icon: "🏆",
                color: "text-yellow-400",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-angkringan-dark/50 rounded-xl border border-angkringan-primary/10 group hover:border-angkringan-accent/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-xs text-angkringan-light/60">
                      {item.label}
                    </p>
                    <p className={`text-sm font-bold ${item.color}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📋</span>
          <h2 className="text-lg font-bold text-angkringan-gold">
            Transaksi Terbaru
          </h2>
          {transaksiHarian.length > 0 && (
            <span className="badge bg-angkringan-accent/20 text-angkringan-accent border border-angkringan-accent/30 ml-auto text-xs">
              {jumlahTransaksi} hari ini
            </span>
          )}
        </div>
        {transaksi.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-4xl mb-2 block">🛒</span>
            <p className="text-angkringan-light/40">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-angkringan-light/40 border-b border-angkringan-primary/20">
                  <th className="text-left p-3 font-medium">Waktu</th>
                  <th className="text-left p-3 font-medium">Items</th>
                  <th className="text-left p-3 font-medium">Metode</th>
                  <th className="text-right p-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.slice(0, 10).map((t: any) => (
                  <tr
                    key={t.id}
                    className="border-b border-angkringan-primary/10 hover:bg-angkringan-primary/10 transition-all"
                  >
                    <td className="p-3 text-angkringan-light/60 text-xs whitespace-nowrap">
                      {new Date(t.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      {new Date(t.tanggal).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {t.items?.slice(0, 3).map((i: any, idx: number) => (
                          <span
                            key={idx}
                            className="bg-angkringan-primary/20 text-angkringan-gold text-[10px] px-2 py-0.5 rounded-full"
                          >
                            {i.nama_menu} x{i.qty}
                          </span>
                        ))}
                        {t.items?.length > 3 && (
                          <span className="text-angkringan-light/40 text-[10px]">
                            +{t.items.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          t.metode_bayar === "Tunai"
                            ? "bg-green-600/20 text-green-400"
                            : "bg-blue-600/20 text-blue-400"
                        }`}
                      >
                        {t.metode_bayar}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-angkringan-accent">
                      {formatRupiah(t.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
