"use client";

import React, { useState, useEffect } from "react";
import {
  getTransaksi,
  getUsers,
  formatRupiah,
  formatTanggalShort,
} from "@/lib/data";
import { Transaksi, User } from "@/lib/types";

interface CashEntry {
  id: string;
  tanggal: string;
  jenis: "Pemasukan" | "Pengeluaran";
  keterangan: string;
  jumlah: number;
  sumber: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export default function LaporanPage() {
  const today = new Date().toISOString().split("T")[0];
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState(today);
  const [tempDateStart, setTempDateStart] = useState(today);
  const [tempDateEnd, setTempDateEnd] = useState(today);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<"penjualan" | "menu" | "kas">("penjualan");

  const [kasEntries, setKasEntries] = useState<CashEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [kasForm, setKasForm] = useState({
    jenis: "Pemasukan" as "Pemasukan" | "Pengeluaran",
    keterangan: "",
    jumlah: 0,
    tanggal: new Date().toISOString().split("T")[0],
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // State untuk detail transaksi
  const [detailTransaksi, setDetailTransaksi] = useState<Transaksi | null>(
    null,
  );

  useEffect(() => {
    loadData();
  }, [dateStart, dateEnd]);

  const loadData = async () => {
    try {
      const [dbTransaksi, dbUsers] = await Promise.all([
        fetch("/api/transaksi").then((res) => res.json()),
        getUsers(),
      ]);

      setUsers(dbUsers);

      const start = new Date(dateStart);
      start.setHours(0, 0, 0, 0);

      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);

      const filtered = (dbTransaksi as Transaksi[]).filter((t) => {
        const tgl = new Date(t.tanggal);
        return tgl >= start && tgl <= end;
      });

      setTransaksiList(
        filtered.sort(
          (a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
        ),
      );
    } catch (error) {
      console.error("Gagal mengambil data transaksi:", error);
      setTransaksiList([]);
      setUsers([]);
    }
  };

  const totalPenjualan = transaksiList.reduce((sum, t) => sum + t.total, 0);
  const totalTransaksi = transaksiList.length;

  const menuSales: Record<
    string,
    { nama: string; qty: number; total: number }
  > = {};
  transaksiList.forEach((t) => {
    t.items.forEach((item) => {
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
  const topMenu = Object.entries(menuSales).sort((a, b) => b[1].qty - a[1].qty);

  const paymentMethods: Record<string, number> = {};
  transaksiList.forEach((t) => {
    paymentMethods[t.metode_bayar] =
      (paymentMethods[t.metode_bayar] || 0) + t.total;
  });

  const totalPosIncome = transaksiList.reduce((sum, t) => sum + t.total, 0);
  let totalManualIncome = 0;
  let totalManualExpense = 0;

  kasEntries.forEach((e) => {
    const entryDate = new Date(e.tanggal);
    const start = new Date(dateStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateEnd);
    end.setHours(23, 59, 59, 999);
    const match = entryDate >= start && entryDate <= end;
    if (match) {
      if (e.jenis === "Pemasukan") totalManualIncome += e.jumlah;
      else totalManualExpense += e.jumlah;
    }
  });

  const totalKas = totalPosIncome + totalManualIncome - totalManualExpense;

  const allEntries: CashEntry[] = [
    ...transaksiList.map((t) => ({
      id: t.id,
      tanggal: t.tanggal,
      jenis: "Pemasukan" as const,
      keterangan: `Transaksi POS - ${t.items.map((i) => i.nama_menu).join(", ")}`,
      jumlah: t.total,
      sumber: "pos" as const,
    })),
    ...kasEntries.filter((e) => {
      const entryDate = new Date(e.tanggal);
      const start = new Date(dateStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      return entryDate >= start && entryDate <= end;
    }),
  ].sort(
    (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
  );

  const handleAddKas = () => {
    if (!kasForm.keterangan || kasForm.jumlah <= 0) return;
    const newEntry: CashEntry = {
      id: generateId(),
      tanggal: new Date(kasForm.tanggal).toISOString(),
      jenis: kasForm.jenis,
      keterangan: kasForm.keterangan,
      jumlah: kasForm.jumlah,
      sumber: "manual",
    };
    setKasEntries((prev) => [newEntry, ...prev]);
    setShowModal(false);
    setKasForm({
      jenis: "Pemasukan",
      keterangan: "",
      jumlah: 0,
      tanggal: new Date().toISOString().split("T")[0],
    });
  };

  const syncSoftDeleteTransaksi = async (id: string) => {
    try {
      await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "soft_delete", id }),
      });
    } catch (_) {}
  };

  const handleDeleteKas = (id: string) => {
    const entry = allEntries.find((e) => e.id === id);
    if (entry?.sumber === "manual") {
      setKasEntries((prev) => prev.filter((e) => e.id !== id));
    }
    if (entry?.sumber === "pos") {
      syncSoftDeleteTransaksi(id);
    }
    setDeleteConfirm(null);
  };

  const periodeLabel = `${dateStart} s/d ${dateEnd}`;

  const styles = `
    @page { margin: 15mm; }
    body { font-family: 'Courier New', monospace; padding: 0; margin: 0; color: #000; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { font-size: 20px; margin: 0; letter-spacing: 3px; }
    .header h2 { font-size: 14px; margin: 5px 0 0; font-weight: normal; }
    .header p { font-size: 11px; margin: 3px 0; color: #555; }
    .section { margin-bottom: 25px; }
    .section h3 { font-size: 14px; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { background: #333; color: #fff; padding: 8px; font-size: 11px; text-align: left; }
    td { padding: 6px; font-size: 11px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) { background: #f9f9f9; }
    .total-row td { font-weight: bold; border-top: 2px solid #000; font-size: 13px; }
    .footer { text-align: center; margin-top: 30px; border-top: 1px dashed #999; padding-top: 15px; font-size: 11px; color: #888; }
    @media print { .no-print { display: none; } }
  `;

  const headerHtml = (title: string) => `
    <div class="header">
      <h1>WARUNG ANGKRINGAN</h1>
      <h2>${title}</h2>
      <p>Periode: ${periodeLabel}</p>
      <p>Dicetak: ${new Date().toLocaleString("id-ID")}</p>
    </div>
  `;

  const footerHtml = `
    <div class="footer"><p>Terima Kasih - Selamat Menikmati 🍢</p><p>Laporan digenerate otomatis oleh POS Angkringan</p></div>
    <div style="text-align:center;margin-top:20px;" class="no-print">
      <button onclick="window.print()" style="padding:10px 30px;background:#8B4513;color:#fff;border:none;border-radius:5px;font-size:16px;cursor:pointer;">🖨️ Cetak Laporan</button>
      <button onclick="window.close()" style="padding:10px 30px;background:#666;color:#fff;border:none;border-radius:5px;font-size:16px;cursor:pointer;margin-left:10px;">Tutup</button>
    </div>
    <script>setTimeout(function() { window.print(); }, 500);</script>
  `;

  const itemsHtml = transaksiList
    .map(
      (t) => `
    <tr>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;">${formatTanggalShort(t.tanggal)}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;">${t.customerName || "-"}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;text-align:center;">${t.metode_bayar}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;text-align:right;">${formatRupiah(t.total)}</td>
    </tr>`,
    )
    .join("");

  const topMenuHtml = topMenu
    .map(
      ([id, data], idx) => `
    <tr>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;text-align:center;">${idx + 1}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;">${data.nama}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;text-align:center;">${data.qty}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;text-align:right;">${formatRupiah(data.total)}</td>
    </tr>`,
    )
    .join("");

  const kasHtml = allEntries
    .map(
      (entry) => `
    <tr>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;">${formatTanggalShort(entry.tanggal)}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;">${entry.keterangan.length > 50 ? entry.keterangan.substring(0, 50) + "..." : entry.keterangan}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;text-align:center;">${entry.jenis}</td>
      <td style="border:1px solid #ddd;padding:6px;font-size:11px;text-align:right;color:${entry.jenis === "Pemasukan" ? "green" : "red"}">${entry.jenis === "Pemasukan" ? "+" : "-"}${formatRupiah(entry.jumlah)}</td>
    </tr>`,
    )
    .join("");

  const paymentHtml = Object.entries(paymentMethods)
    .map(
      ([method, total]) => `
    <div style="margin:5px 0;font-size:12px;">
      <span style="font-weight:bold;">${method === "Tunai" ? "💰 Tunai" : "📱 QRIS"}:</span>
      <span style="float:right;">${formatRupiah(total)}</span>
    </div>`,
    )
    .join("");

  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    let title: string, body: string;
    if (tab === "menu") {
      title = "LAPORAN MENU TERLARIS";
      body = `<div class="section"><h3>🏆 RANKING MENU TERLARIS</h3>${topMenu.length === 0 ? "<p style='color:#999;'>Belum ada data</p>" : `<table><thead><tr><th>#</th><th>Menu</th><th>Terjual</th><th style="text-align:right;">Total</th></tr></thead><tbody>${topMenuHtml}<tr class="total-row"><td colspan="2" style="text-align:right;">TOTAL</td><td style="text-align:center;">${topMenu.reduce((s, [, d]) => s + d.qty, 0)}</td><td style="text-align:right;">${formatRupiah(topMenu.reduce((s, [, d]) => s + d.total, 0))}</td></tr></tbody></table>`}</div>`;
    } else if (tab === "kas") {
      title = "LAPORAN KAS";
      body = `<div class="section"><h3>💰 RINGKASAN KAS</h3><div style="display:flex;gap:10px;">${[
        ["Pemasukan", totalPosIncome + totalManualIncome, "#059669"],
        ["Pengeluaran", totalManualExpense, "#dc2626"],
        ["Saldo Bersih", totalKas, "#2563eb"],
      ]
        .map(
          ([l, v, c]) =>
            `<div style="flex:1;border:2px solid #333;padding:10px;text-align:center;"><div style="font-size:10px;color:#666;">${l}</div><div style="font-size:16px;font-weight:bold;color:${c};">${formatRupiah(v as number)}</div></div>`,
        )
        .join(
          "",
        )}</div></div>${allEntries.length > 0 ? `<div class="section"><h3>📋 RIWAYAT KAS</h3><table><thead><tr><th>Tanggal</th><th>Keterangan</th><th>Jenis</th><th style="text-align:right;">Jumlah</th></tr></thead><tbody>${kasHtml}</tbody></table></div>` : ""}`;
    } else {
      title = "LAPORAN PENJUALAN";
      body = `<div class="section"><h3>📊 RINGKASAN</h3><div style="display:flex;gap:10px;">${[
        ["Total Penjualan", totalPenjualan, "#059669"],
        ["Jumlah Transaksi", totalTransaksi, "#2563eb"],
        [
          "Rata-rata",
          totalTransaksi > 0 ? Math.round(totalPenjualan / totalTransaksi) : 0,
          "#d97706",
        ],
      ]
        .map(
          ([l, v, c]) =>
            `<div style="flex:1;border:2px solid #333;padding:10px;text-align:center;"><div style="font-size:10px;color:#666;">${l}</div><div style="font-size:16px;font-weight:bold;color:${c};">${typeof v === "number" ? formatRupiah(v) : v}</div></div>`,
        )
        .join(
          "",
        )}</div></div>${transaksiList.length > 0 ? `<div class="section"><h3>📋 TRANSAKSI</h3><table><thead><tr><th>Waktu</th><th>Pelanggan</th><th>Metode</th><th style="text-align:right;">Total</th></tr></thead><tbody>${itemsHtml}<tr class="total-row"><td colspan="3" style="text-align:right;">TOTAL</td><td style="text-align:right;">${formatRupiah(totalPenjualan)}</td></tr></tbody></table></div>` : ""}<div class="section"><h3>💳 METODE PEMBAYARAN</h3><div style="padding:10px;border:1px solid #ddd;">${paymentHtml || "<p style='color:#999;'>Belum ada data</p>"}<hr style="margin:8px 0;"><div style="font-size:13px;font-weight:bold;"><span>TOTAL</span><span style="float:right;">${formatRupiah(totalPenjualan)}</span></div></div></div>`;
    }
    printWindow.document.write(
      `<html><head><title>${title}</title><style>${styles}</style></head><body>${headerHtml(title)}${body}${footerHtml}</body></html>`,
    );
    printWindow.document.close();
  };

  const labelCetak =
    tab === "penjualan"
      ? "🖨️ Cetak Penjualan"
      : tab === "menu"
        ? "🖨️ Cetak Menu Terlaris"
        : "🖨️ Cetak Kas";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient">📈 Laporan</h1>
          <p className="text-angkringan-light/60">
            Analisis bisnis warung angkringan
          </p>
        </div>
        <button onClick={exportPDF} className="btn-primary">
          {labelCetak}
        </button>
      </div>

      {/* Date Range */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-angkringan-light/60 mb-1">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={tempDateStart}
            onChange={(e) => setTempDateStart(e.target.value)}
            className="input-field text-sm py-2 w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-angkringan-light/60 mb-1">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={tempDateEnd}
            onChange={(e) => setTempDateEnd(e.target.value)}
            className="input-field text-sm py-2 w-40"
          />
        </div>
        <button
          onClick={() => {
            setDateStart(tempDateStart);
            setDateEnd(tempDateEnd);
          }}
          className="btn-primary h-[42px]"
        >
          🔍 Search
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-700 to-green-900 border-none">
          <p className="text-sm text-white/70">Total Penjualan</p>
          <p className="text-2xl font-bold text-white mt-1">
            {formatRupiah(totalPenjualan)}
          </p>
        </div>
        <div className="card bg-gradient-to-br from-blue-700 to-blue-900 border-none">
          <p className="text-sm text-white/70">Jumlah Transaksi</p>
          <p className="text-2xl font-bold text-white mt-1">{totalTransaksi}</p>
        </div>
        <div className="card bg-gradient-to-br from-angkringan-primary to-angkringan-secondary border-none">
          <p className="text-sm text-white/70">Rata-rata Transaksi</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalTransaksi > 0
              ? formatRupiah(Math.round(totalPenjualan / totalTransaksi))
              : "Rp 0"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-angkringan-primary/30 pb-2">
        {(["penjualan", "menu", "kas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${tab === t ? "bg-angkringan-primary/30 text-angkringan-gold border-b-2 border-angkringan-accent" : "text-angkringan-light/60 hover:text-angkringan-light"}`}
          >
            {t === "penjualan"
              ? "📋 Penjualan"
              : t === "menu"
                ? "🏆 Menu Terlaris"
                : "💰 Kas"}
          </button>
        ))}
      </div>

      {/* ========== TAB PENJUALAN ========== */}
      {tab === "penjualan" && (
        <div className="card">
          <h2 className="text-lg font-semibold text-angkringan-gold mb-4">
            Daftar Transaksi
          </h2>
          {transaksiList.length === 0 ? (
            <p className="text-angkringan-light/50 text-center py-8">
              Belum ada transaksi
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-angkringan-light/60 border-b border-angkringan-primary/30">
                    <th className="text-left p-2">Waktu</th>
                    <th className="text-left p-2">Pelanggan</th>
                    <th className="text-left p-2">Kasir</th>
                    <th className="text-left p-2">Metode</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-center p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiList.map((t) => {
                    const kasir = users.find((u) => u.id === t.user_id);
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-angkringan-primary/10 hover:bg-angkringan-primary/10"
                      >
                        <td className="p-2 text-angkringan-light/80 text-xs whitespace-nowrap">
                          {formatTanggalShort(t.tanggal)}
                        </td>
                        <td className="p-2 text-xs text-angkringan-light/80">
                          {t.customerName || "-"}
                        </td>
                        <td className="p-2 text-xs text-angkringan-light/80">
                          {kasir ? kasir.nama : t.user_id}
                        </td>
                        <td className="p-2">
                          <span className="badge bg-angkringan-primary/30 text-angkringan-gold text-xs">
                            {t.metode_bayar}
                          </span>
                        </td>
                        <td className="p-2 text-right font-semibold text-angkringan-accent">
                          {formatRupiah(t.total)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => setDetailTransaksi(t)}
                            className="text-xs px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-600/30 hover:bg-blue-600/30"
                          >
                            📋 Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========== MODAL DETAIL TRANSAKSI ========== */}
      {detailTransaksi && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setDetailTransaksi(null)}
        >
          <div
            className="w-full max-w-md card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-angkringan-gold">
                🧾 Detail Transaksi
              </h2>
              <button
                onClick={() => setDetailTransaksi(null)}
                className="text-angkringan-light/60 hover:text-angkringan-light text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-angkringan-primary/10 pb-2">
                <span className="text-angkringan-light/60">Waktu</span>
                <span className="text-angkringan-light">
                  {formatTanggalShort(detailTransaksi.tanggal)}
                </span>
              </div>
              <div className="flex justify-between border-b border-angkringan-primary/10 pb-2">
                <span className="text-angkringan-light/60">Pelanggan</span>
                <span className="text-angkringan-light">
                  {detailTransaksi.customerName || "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-angkringan-primary/10 pb-2">
                <span className="text-angkringan-light/60">Kasir</span>
                <span className="text-angkringan-light">
                  {users.find((u) => u.id === detailTransaksi.user_id)?.nama ||
                    detailTransaksi.user_id}
                </span>
              </div>
              <div className="flex justify-between border-b border-angkringan-primary/10 pb-2">
                <span className="text-angkringan-light/60">Metode Bayar</span>
                <span className="badge bg-angkringan-primary/30 text-angkringan-gold text-xs">
                  {detailTransaksi.metode_bayar}
                </span>
              </div>
            </div>
            <h3 className="text-md font-semibold text-angkringan-gold mt-4 mb-2">
              🛒 Items Pesanan
            </h3>
            <div className="space-y-1">
              {detailTransaksi.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 bg-angkringan-dark rounded-lg"
                >
                  <div>
                    <p className="text-sm text-angkringan-light">
                      {item.nama_menu}
                    </p>
                    <p className="text-xs text-angkringan-light/60">
                      {formatRupiah(item.harga)} x {item.qty}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-angkringan-accent">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            {detailTransaksi.diskon > 0 && (
              <div className="flex justify-between text-sm mt-2 text-red-400">
                <span>Diskon ({detailTransaksi.diskon}%)</span>
                <span>
                  -
                  {formatRupiah(
                    Math.round(
                      (detailTransaksi.items.reduce(
                        (s, i) => s + i.subtotal,
                        0,
                      ) *
                        detailTransaksi.diskon) /
                        100,
                    ),
                  )}
                </span>
              </div>
            )}
            {detailTransaksi.pajak > 0 && (
              <div className="flex justify-between text-sm mt-1 text-angkringan-light/60">
                <span>Pajak PPN ({detailTransaksi.pajak}%)</span>
                <span>
                  +
                  {formatRupiah(
                    Math.round(
                      ((detailTransaksi.items.reduce(
                        (s, i) => s + i.subtotal,
                        0,
                      ) -
                        (detailTransaksi.items.reduce(
                          (s, i) => s + i.subtotal,
                          0,
                        ) *
                          detailTransaksi.diskon) /
                          100) *
                        detailTransaksi.pajak) /
                        100,
                    ),
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-angkringan-gold border-t border-angkringan-primary/30 pt-3 mt-3">
              <span>TOTAL</span>
              <span>{formatRupiah(detailTransaksi.total)}</span>
            </div>
            <button
              onClick={() => setDetailTransaksi(null)}
              className="btn-primary w-full mt-4 bg-gray-600/50 hover:bg-gray-600/70"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ========== TAB MENU ========== */}
      {tab === "menu" && (
        <div className="card">
          <h2 className="text-lg font-semibold text-angkringan-gold mb-4">
            🏆 Menu Terlaris
          </h2>
          {topMenu.length === 0 ? (
            <p className="text-angkringan-light/50 text-center py-8">
              Belum ada data penjualan
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-angkringan-light/60 border-b border-angkringan-primary/30">
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">Menu</th>
                    <th className="text-right p-2">Terjual</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topMenu.map(([id, data], idx) => (
                    <tr
                      key={id}
                      className="border-b border-angkringan-primary/10 hover:bg-angkringan-primary/10"
                    >
                      <td className="p-2 text-angkringan-gold font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 text-angkringan-light">{data.nama}</td>
                      <td className="p-2 text-right text-angkringan-accent font-semibold">
                        {data.qty}
                      </td>
                      <td className="p-2 text-right text-angkringan-accent">
                        {formatRupiah(data.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========== TAB KAS ========== */}
      {tab === "kas" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-emerald-700 to-emerald-900 border-none">
              <p className="text-sm text-white/70">Total Pemasukan</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatRupiah(totalPosIncome + totalManualIncome)}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-red-700 to-red-900 border-none">
              <p className="text-sm text-white/70">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatRupiah(totalManualExpense)}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-blue-700 to-blue-900 border-none">
              <p className="text-sm text-white/70">Saldo Kas Bersih</p>
              <p
                className={`text-2xl font-bold text-white mt-1 ${totalKas >= 0 ? "" : "text-red-300"}`}
              >
                {formatRupiah(totalKas)}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-angkringan-gold mb-4">
              💳 Metode Pembayaran
            </h2>
            {Object.keys(paymentMethods).length === 0 ? (
              <p className="text-angkringan-light/50 text-center py-4">
                Belum ada transaksi
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(paymentMethods).map(([method, total]) => (
                  <div
                    key={method}
                    className="text-center p-4 bg-angkringan-dark/50 rounded-xl border border-angkringan-primary/10"
                  >
                    <p className="text-angkringan-light/60 text-sm">
                      {method === "Tunai" ? "💰 Tunai" : "📱 QRIS"}
                    </p>
                    <p className="text-angkringan-accent font-bold mt-1">
                      {formatRupiah(total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <span>+</span> Tambah Pemasukan/Pengeluaran
            </button>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-angkringan-gold mb-4">
              📋 Riwayat Kas
            </h2>
            {allEntries.length === 0 ? (
              <p className="text-angkringan-light/50 text-center py-8">
                Belum ada data kas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-angkringan-light/60 border-b border-angkringan-primary/30">
                      <th className="text-left p-2">Tanggal</th>
                      <th className="text-left p-2">Keterangan</th>
                      <th className="text-left p-2">Jenis</th>
                      <th className="text-right p-2">Jumlah</th>
                      <th className="text-center p-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-angkringan-primary/10 hover:bg-angkringan-primary/10"
                      >
                        <td className="p-2 text-xs text-angkringan-light/80 whitespace-nowrap">
                          {formatTanggalShort(entry.tanggal)}
                        </td>
                        <td className="p-2 text-angkringan-light text-xs">
                          {entry.keterangan.length > 40
                            ? entry.keterangan.substring(0, 40) + "..."
                            : entry.keterangan}
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${entry.jenis === "Pemasukan" ? "bg-green-600/20 text-green-400 border border-green-600/30" : "bg-red-600/20 text-red-400 border border-red-600/30"}`}
                          >
                            {entry.jenis === "Pemasukan"
                              ? "📈 Masuk"
                              : "📉 Keluar"}
                          </span>
                          {entry.sumber === "pos" && (
                            <span className="ml-1 text-[9px] text-angkringan-light/30">
                              POS
                            </span>
                          )}
                        </td>
                        <td
                          className={`p-2 text-right font-bold ${entry.jenis === "Pemasukan" ? "text-green-400" : "text-red-400"}`}
                        >
                          {entry.jenis === "Pemasukan" ? "+" : "-"}
                          {formatRupiah(entry.jumlah)}
                        </td>
                        <td className="p-2 text-center">
                          {entry.sumber === "pos" && (
                            <button
                              onClick={() => {
                                const t = transaksiList.find(
                                  (x) => x.id === entry.id,
                                );
                                if (t) setDetailTransaksi(t);
                              }}
                              className="text-angkringan-accent hover:text-angkringan-gold text-xs px-2 py-1 rounded hover:bg-angkringan-accent/20"
                              title="Lihat detail"
                            >
                              📋
                            </button>
                          )}
                          {entry.sumber === "manual" && (
                            <button
                              onClick={() => setDeleteConfirm(entry.id)}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/30"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Tambah Kas */}
          {showModal && (
            <div
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            >
              <div
                className="w-full max-w-md card p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-angkringan-gold mb-4">
                  💰 Tambah Pemasukan/Pengeluaran
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-angkringan-light/80 text-sm mb-1">
                      Jenis
                    </label>
                    <div className="flex gap-2">
                      {(["Pemasukan", "Pengeluaran"] as const).map((j) => (
                        <button
                          key={j}
                          onClick={() => setKasForm({ ...kasForm, jenis: j })}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${kasForm.jenis === j ? (j === "Pemasukan" ? "bg-green-600 text-white" : "bg-red-600 text-white") : "bg-angkringan-dark text-angkringan-light/60"}`}
                        >
                          {j === "Pemasukan"
                            ? "📈 Pemasukan"
                            : "📉 Pengeluaran"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-angkringan-light/80 text-sm mb-1">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      value={kasForm.keterangan}
                      onChange={(e) =>
                        setKasForm({ ...kasForm, keterangan: e.target.value })
                      }
                      className="input-field"
                      placeholder="Misal: Belanja bahan baku, bayar listrik, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-angkringan-light/80 text-sm mb-1">
                      Jumlah (Rp)
                    </label>
                    <input
                      type="number"
                      value={kasForm.jumlah || ""}
                      onChange={(e) =>
                        setKasForm({
                          ...kasForm,
                          jumlah: Number(e.target.value),
                        })
                      }
                      className="input-field"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-angkringan-light/80 text-sm mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={kasForm.tanggal}
                      onChange={(e) =>
                        setKasForm({ ...kasForm, tanggal: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddKas}
                      className="btn-primary flex-1"
                    >
                      Simpan
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="btn-primary flex-1 bg-gray-600/50 hover:bg-gray-600/70"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Konfirmasi Hapus Kas */}
          {deleteConfirm && (
            <div
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            >
              <div
                className="w-full max-w-sm card p-6 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-5xl block mb-3">⚠️</span>
                <h3 className="text-lg font-bold text-angkringan-gold mb-2">
                  Hapus Data Kas?
                </h3>
                <p className="text-angkringan-light/60 text-sm mb-4">
                  Data yang dihapus tidak bisa dikembalikan
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteKas(deleteConfirm)}
                    className="btn-danger flex-1"
                  >
                    Hapus
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="btn-primary flex-1 bg-gray-600/50 hover:bg-gray-600/70"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
