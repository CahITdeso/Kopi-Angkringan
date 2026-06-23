export interface User {
  id: string;
  nama: string;
  username: string;
  password: string;
  role: "Admin" | "Kasir";
}

export interface Menu {
  id: string;
  nama_menu: string;
  kategori: string;
  harga: number;
  foto: string;
  status: "Tersedia" | "Tidak Tersedia";
}

export interface Transaksi {
  id: string;
  tanggal: string;
  total: number;
  diskon: number;
  pajak: number;
  metode_bayar: "Tunai" | "QRIS";
  user_id: string;
  customerName?: string;
  items: DetailTransaksi[];
}

export interface DetailTransaksi {
  id: string;
  transaksi_id: string;
  menu_id: string;
  nama_menu: string;
  qty: number;
  harga: number;
  subtotal: number;
}

export type PeriodeLaporan = "harian" | "mingguan" | "bulanan";
