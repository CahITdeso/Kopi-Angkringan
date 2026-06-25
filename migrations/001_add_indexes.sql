-- Optimasi: Tambah index untuk query transaksi
-- Index pada kolom tanggal untuk filtering berdasarkan periode
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal ON transaksi(tanggal);

-- Index pada transaksi_id di detail_transaksi untuk JOIN yang cepat
CREATE INDEX IF NOT EXISTS idx_detail_transaksi_transaksi_id ON detail_transaksi(transaksi_id);

-- Index untuk user_id jika sering difilter
CREATE INDEX IF NOT EXISTS idx_transaksi_user_id ON transaksi(user_id);

-- Index untuk metode_bayar jika sering difilter
CREATE INDEX IF NOT EXISTS idx_transaksi_metode_bayar ON transaksi(metode_bayar);

-- Composite index untuk query yang sering: filter tanggal + order by tanggal DESC
CREATE INDEX IF NOT EXISTS idx_transaksi_tanggal_desc ON transaksi(tanggal DESC);

-- Index pada menu_id di detail_transaksi untuk JOIN dengan tabel menu
CREATE INDEX IF NOT EXISTS idx_detail_transaksi_menu_id ON detail_transaksi(menu_id);