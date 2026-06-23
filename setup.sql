CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('Owner', 'Admin', 'Kasir') NOT NULL DEFAULT 'Kasir'
);

CREATE TABLE IF NOT EXISTS menu (
  id VARCHAR(36) PRIMARY KEY,
  nama_menu VARCHAR(100) NOT NULL,
  kategori ENUM('Nasi', 'Sate', 'Gorengan', 'Minuman', 'Kopi', 'Lauk') NOT NULL,
  harga INT NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  foto VARCHAR(10) DEFAULT '🍽️',
  status ENUM('Tersedia', 'Habis') NOT NULL DEFAULT 'Tersedia'
);

CREATE TABLE IF NOT EXISTS transaksi (
  id VARCHAR(36) PRIMARY KEY,
  tanggal DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total INT NOT NULL,
  diskon INT DEFAULT 0,
  pajak INT DEFAULT 0,
  metode_bayar ENUM('Tunai', 'QRIS', 'Transfer', 'E-wallet') NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  customer_name VARCHAR(100) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS detail_transaksi (
  id VARCHAR(36) PRIMARY KEY,
  transaksi_id VARCHAR(36) NOT NULL,
  menu_id VARCHAR(36) NOT NULL,
  nama_menu VARCHAR(100) NOT NULL,
  qty INT NOT NULL,
  harga INT NOT NULL,
  subtotal INT NOT NULL,
  FOREIGN KEY (transaksi_id) REFERENCES transaksi(id),
  FOREIGN KEY (menu_id) REFERENCES menu(id)
);

CREATE TABLE IF NOT EXISTS stok_log (
  id VARCHAR(36) PRIMARY KEY,
  menu_id VARCHAR(36) NOT NULL,
  nama_menu VARCHAR(100) NOT NULL,
  jenis ENUM('Masuk', 'Keluar') NOT NULL,
  qty INT NOT NULL,
  tanggal DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  keterangan TEXT,
  FOREIGN KEY (menu_id) REFERENCES menu(id)
);

INSERT IGNORE INTO users (id, nama, username, password, role) VALUES
('usr_owner', 'Pemilik Angkringan', 'owner', 'owner123', 'Owner'),
('usr_admin', 'Admin Warung', 'admin', 'admin123', 'Admin'),
('usr_kasir', 'Kasir Warung', 'kasir', 'kasir123', 'Kasir');

INSERT IGNORE INTO menu (id, nama_menu, kategori, harga, stok, foto, status) VALUES
('menu_001', 'Nasi Kucing', 'Nasi', 3000, 50, '🍚', 'Tersedia'),
('menu_002', 'Nasi Pecel', 'Nasi', 8000, 30, '🍛', 'Tersedia'),
('menu_003', 'Sate Usus', 'Sate', 2000, 40, '🍢', 'Tersedia'),
('menu_004', 'Sate Telur Puyuh', 'Sate', 2500, 35, '🥚', 'Tersedia'),
('menu_005', 'Tahu Goreng', 'Gorengan', 1000, 60, '🧈', 'Tersedia'),
('menu_006', 'Tempe Goreng', 'Gorengan', 1000, 60, '🫘', 'Tersedia'),
('menu_007', 'Pisang Goreng', 'Gorengan', 1500, 40, '🍌', 'Tersedia'),
('menu_008', 'Es Teh', 'Minuman', 3000, 50, '🧋', 'Tersedia'),
('menu_009', 'Es Jeruk', 'Minuman', 4000, 40, '🍊', 'Tersedia'),
('menu_010', 'Kopi Hitam', 'Kopi', 4000, 50, '☕', 'Tersedia'),
('menu_011', 'Kopi Susu', 'Kopi', 6000, 40, '🥛', 'Tersedia'),
('menu_012', 'Telur Dadar', 'Lauk', 3000, 30, '🍳', 'Tersedia'),
('menu_013', 'Ikan Asin', 'Lauk', 2000, 25, '🐟', 'Tersedia'),
('menu_014', 'Air Mineral', 'Minuman', 3000, 50, '💧', 'Tersedia'),
('menu_015', 'Soto', 'Nasi', 10000, 20, '🍜', 'Tersedia');