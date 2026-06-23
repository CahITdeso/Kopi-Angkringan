"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  initializeData,
  getMenu,
  addTransaksi,
  getKategoriAktif,
  formatRupiah,
} from "@/lib/data";
import { Menu, Transaksi } from "@/lib/types";

interface CartItem {
  menu_id: string;
  nama_menu: string;
  harga: number;
  qty: number;
  subtotal: number;
}

export default function KasirPage() {
  const { user } = useAuth();
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [diskon, setDiskon] = useState(0);
  const [pajak, setPajak] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState<"Tunai" | "QRIS">("Tunai");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<Transaksi | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const loadData = async () => {
      initializeData();
      const data = await getMenu();
      setMenuList(data);
    };

    loadData();
  }, []);

  const kategoriAktif = getKategoriAktif();
  const categories = useMemo(
    () => ["Semua", ...kategoriAktif],
    [kategoriAktif],
  );

  const filteredMenu = useMemo(
    () =>
      menuList.filter((m) => {
        const matchCategory =
          selectedCategory === "Semua" || m.kategori === selectedCategory;
        const matchSearch = m.nama_menu
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchStatus = m.status === "Tersedia";
        const matchKategoriAktif = kategoriAktif.includes(m.kategori);
        return (
          matchCategory && matchSearch && matchStatus && matchKategoriAktif
        );
      }),
    [menuList, selectedCategory, searchTerm, kategoriAktif],
  );

  const addToCart = (menu: Menu) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menu_id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.menu_id === menu.id
            ? {
                ...item,
                qty: item.qty + 1,
                subtotal: (item.qty + 1) * item.harga,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          menu_id: menu.id,
          nama_menu: menu.nama_menu,
          harga: menu.harga,
          qty: 1,
          subtotal: menu.harga,
        },
      ];
    });
  };

  const updateQty = (menuId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.menu_id !== menuId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.menu_id === menuId
          ? { ...item, qty, subtotal: qty * item.harga }
          : item,
      ),
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const diskonAmount = (subtotal * diskon) / 100;
  const pajakAmount = (subtotal - diskonAmount) * (pajak / 100);
  const total = subtotal - diskonAmount + pajakAmount;

  const handleBayar = async () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }

    if (!user) {
      alert("Silakan login terlebih dahulu!");
      return;
    }

    const transaksi: Omit<Transaksi, "id"> = {
      tanggal: new Date().toISOString(),
      total: Math.round(total),
      diskon,
      pajak,
      metode_bayar: metodeBayar,
      user_id: user.id,
      customerName: customerName || undefined,
      items: cart.map((item) => ({
        id: "",
        transaksi_id: "",
        menu_id: item.menu_id,
        nama_menu: item.nama_menu,
        qty: item.qty,
        harga: item.harga,
        subtotal: item.subtotal,
      })),
    };

    try {
      const saved = await addTransaksi(transaksi);
      setLastTransaction(saved);
      setShowReceipt(true);
      setCart([]);
      setDiskon(0);
      setPajak(0);
      setCustomerName("");
    } catch (error) {
      console.error("Gagal menyimpan transaksi:", error);
      alert("Gagal menyimpan transaksi, silakan coba lagi.");
    }
  };

  const printReceipt = () => {
    if (!lastTransaction) return;
    window.print();
  };

  if (showReceipt && lastTransaction) {
    const date = new Date(lastTransaction.tanggal);
    return (
      <div className="max-w-sm mx-auto">
        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-bold text-angkringan-gold mb-2">
            Pembayaran Berhasil!
          </h2>
          <p className="text-angkringan-light/60 text-sm mb-4">
            Transaksi tersimpan
          </p>
          <div
            id="receipt"
            className="bg-white text-black"
            style={{
              width: "58mm",
              margin: "0 auto",
              padding: "3mm",
              fontFamily: "monospace",
              fontSize: "11px",
              lineHeight: "1.3",
            }}
          >
            {/* HEADER */}
            <div className="text-center">
              <div style={{ fontWeight: "900", fontSize: "16px" }}>
                WARUNG ANGKRINGAN
              </div>
              <div>Jl. Yos Sudarso, Gombong</div>
              <div>Kebumen, Jawa Tengah</div>
              <div>Telp. 08xxxxxxxxxx</div>
            </div>
            <hr className="border-0 border-t-2 border-gray-500 my-2" />
            <div>
              <div>
                {date.toLocaleDateString("id-ID")}{" "}
                {date
                  .toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                  .replace(".", ":")}
              </div>
              {lastTransaction.customerName && (
                <div>Pelanggan : {lastTransaction.customerName}</div>
              )}
            </div>
            <hr className="border-0 border-t-2 border-gray-500 my-2" />

            <div className="border-b-2 border-gray-500 pb-2 mb-2">
              {lastTransaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs mb-1">
                  <span>
                    {item.nama_menu} x{item.qty}
                  </span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold mb-1">
              <span>TOTAL</span>
              <span>{formatRupiah(lastTransaction.total)}</span>
            </div>
            <div className="text-center mt-3 pt-2 border-t-2 border-gray-500 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {formatRupiah(
                    lastTransaction.items.reduce(
                      (sum, item) => sum + item.subtotal,
                      0,
                    ),
                  )}
                </span>
              </div>

              {lastTransaction.diskon > 0 && (
                <div className="flex justify-between">
                  <span>Diskon ({lastTransaction.diskon}%)</span>
                  <span>
                    -{" "}
                    {formatRupiah(
                      (lastTransaction.items.reduce(
                        (sum, item) => sum + item.subtotal,
                        0,
                      ) *
                        lastTransaction.diskon) /
                        100,
                    )}
                  </span>
                </div>
              )}

              {lastTransaction.pajak > 0 && (
                <div className="flex justify-between">
                  <span>Pajak ({lastTransaction.pajak}%)</span>
                  <span>
                    +{" "}
                    {formatRupiah(
                      ((lastTransaction.items.reduce(
                        (sum, item) => sum + item.subtotal,
                        0,
                      ) *
                        (100 - lastTransaction.diskon)) /
                        100) *
                        (lastTransaction.pajak / 100),
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-xs">
              <span>Metode Bayar</span>
              <span>{lastTransaction.metode_bayar}</span>
            </div>
            <div className="text-center mt-3 pt-2 border-t-2 border-gray-500 text-xs">
              <p>Terima Kasih!</p>
              <p>Selamat Menikmati 🍢</p>
              <div>Kasir : {user?.nama}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 no-print">
            <button onClick={printReceipt} className="btn-primary flex-1">
              🖨️ Cetak Struk
            </button>
            <button
              onClick={() => setShowReceipt(false)}
              className="btn-primary flex-1 bg-angkringan-secondary"
            >
              Transaksi Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <div className="flex flex-col">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-angkringan-gold">
            💳 POS Kasir
          </h1>
          <p className="text-angkringan-light/60 text-sm">
            Pilih menu untuk menambah transaksi
          </p>
        </div>
        <input
          type="text"
          placeholder="Cari menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field mb-2"
        />
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-angkringan-primary text-white"
                  : "bg-angkringan-warm text-angkringan-light/70 hover:bg-angkringan-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filteredMenu.map((menu) => (
            <button
              key={menu.id}
              onClick={() => addToCart(menu)}
              className="card-hover text-center p-3"
            >
              <span className="text-3xl block mb-1">{menu.foto}</span>
              <p className="text-sm font-medium text-angkringan-light truncate">
                {menu.nama_menu}
              </p>
              <p className="text-angkringan-accent font-semibold text-sm">
                {formatRupiah(menu.harga)}
              </p>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col bg-angkringan-warm border border-angkringan-primary/30 rounded-xl h-[calc(100vh-140px)]">
        <div className="p-3 border-b border-angkringan-primary/30">
          <h2 className="font-semibold text-angkringan-gold">
            🛒 Keranjang ({cart.length} item)
          </h2>
        </div>
        <div className="px-3 pt-2">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input-field text-sm py-2"
            placeholder="Nama pelanggan..."
          />
        </div>
        <div className="flex-1 px-3">
          {cart.length === 0 ? (
            <p className="text-center text-angkringan-light/40 py-8">
              Belum ada menu dipilih
            </p>
          ) : (
            <div className="space-y-2 py-2">
              {cart.map((item) => (
                <div
                  key={item.menu_id}
                  className="flex items-center gap-2 p-2 bg-angkringan-dark rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-angkringan-light truncate">
                      {item.nama_menu}
                    </p>
                    <p className="text-xs text-angkringan-accent">
                      {formatRupiah(item.harga)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.menu_id, item.qty - 1)}
                      className="w-6 h-6 flex items-center justify-center bg-angkringan-primary/30 rounded text-angkringan-gold text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-angkringan-light text-sm">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.menu_id, item.qty + 1)}
                      className="w-6 h-6 flex items-center justify-center bg-angkringan-primary/30 rounded text-angkringan-gold text-sm"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-angkringan-accent w-20 text-right">
                    {formatRupiah(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-angkringan-primary/30 space-y-3 bg-angkringan-dark">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-angkringan-light/60">
                Diskon (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={diskon === 0 ? "" : diskon}
                onChange={(e) => setDiskon(Number(e.target.value) || 0)}
                className="input-field text-sm py-1"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-angkringan-light/60">
                Pajak (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={pajak === 0 ? "" : pajak}
                onChange={(e) => setPajak(Number(e.target.value) || 0)}
                className="input-field text-sm py-1"
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {(["Tunai", "QRIS"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetodeBayar(m)}
                className={`px-2 py-1.5 text-xs rounded-lg transition-all ${metodeBayar === m ? "bg-angkringan-primary text-white" : "bg-angkringan-warm text-angkringan-light/60 hover:bg-angkringan-primary/30"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-angkringan-light/60">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {diskon > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Diskon {diskon}%</span>
                <span>-{formatRupiah(diskonAmount)}</span>
              </div>
            )}
            {pajak > 0 && (
              <div className="flex justify-between text-angkringan-light/60">
                <span>Pajak {pajak}%</span>
                <span>+{formatRupiah(pajakAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-angkringan-gold border-t border-angkringan-primary/30 pt-2">
              <span>Total</span>
              <span>{formatRupiah(Math.round(total))}</span>
            </div>
          </div>
          <button
            onClick={handleBayar}
            disabled={cart.length === 0}
            className="btn-primary w-full py-3 text-lg"
          >
            💳 Bayar {formatRupiah(Math.round(total))}
          </button>
        </div>
      </div>
    </div>
  );
}
