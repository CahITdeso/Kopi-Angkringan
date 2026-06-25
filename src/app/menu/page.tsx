"use client";

import React, { useState, useEffect } from "react";
import {
  getMenu,
  addMenu,
  updateMenu,
  deleteMenu,
  getKategori,
  addKategori,
  updateKategori,
  deleteKategori,
  toggleStatusKategori,
  getKategoriAktif,
  formatRupiah,
  KategoriItem,
} from "@/lib/data";
import { Menu } from "@/lib/types";

const EMOJIS =
  "🍚 🍛 🍜 🍢 🥚 🧈 🫘 🍌 🧋 🍊 ☕ 🥛 🍳 🐟 💧 🍽️ 🥟 🍗 🥩 🌭 🍔 🍟 🍕 🥪 🥤 🍰 🧁 🍩 🍫 🍮 🥥 🌽 🍠".split(
    " ",
  );

export default function MenuPage() {
  const [menuList, setMenuList] = useState<Menu[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showKatModal, setShowKatModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newKatName, setNewKatName] = useState("");
  const [form, setForm] = useState({
    nama_menu: "",
    kategori: "",
    harga: 0,
    foto: "🍽️",
    status: "Tersedia" as Menu["status"],
  });

  // Inline edit state (inside kategori modal)
  const [editingKatId, setEditingKatId] = useState<string | null>(null);
  const [editingKatNama, setEditingKatNama] = useState("");
  // Inline confirm delete (inside kategori modal)
  const [confirmDeleteKatId, setConfirmDeleteKatId] = useState<string | null>(
    null,
  );

  const reload = async () => {
    const menuData = await getMenu();
    setMenuList(menuData);
    setKategoriList(getKategori());
  };

  useEffect(() => {
    reload();
  }, []);

  const kategoriAktif = getKategoriAktif();
  const filteredMenu = menuList.filter(
    (m) =>
      m.nama_menu.toLowerCase().includes(searchTerm.toLowerCase()) &&
      kategoriAktif.includes(m.kategori),
  );

  const resetForm = () => {
    setForm({
      nama_menu: "",
      kategori: getKategoriAktif()[0] || "Nasi",
      harga: 0,
      foto: "🍽️",
      status: "Tersedia",
    });
    setEditingMenu(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };
  const openEdit = (menu: Menu) => {
    setForm({
      nama_menu: menu.nama_menu,
      kategori: menu.kategori,
      harga: menu.harga,
      foto: menu.foto,
      status: menu.status,
    });
    setEditingMenu(menu);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_menu || form.harga <= 0) return;
    if (editingMenu) await updateMenu(editingMenu.id, form);
    else await addMenu(form);
    await reload();
    setShowModal(false);
    resetForm();
  };

  const handleDeleteMenu = async (id: string) => {
    await deleteMenu(id);
    await reload();
    setShowDelete(null);
  };

  // KATEGORI: All functions inside the main modal
  const handleAddKat = () => {
    const name = newKatName.trim();
    if (!name) return;
    addKategori(name);
    reload();
    setNewKatName("");
  };

  const startEditKat = (k: KategoriItem) => {
    setEditingKatId(k.id);
    setEditingKatNama(k.nama);
  };

  const saveEditKat = (id: string) => {
    if (!editingKatNama.trim()) return;
    updateKategori(id, { nama: editingKatNama.trim() });
    reload();
    setEditingKatId(null);
  };

  const cancelEditKat = () => {
    setEditingKatId(null);
  };

  const handleToggleKat = (id: string) => {
    toggleStatusKategori(id);
    reload();
  };

  const confirmDeleteKat = (id: string) => {
    setConfirmDeleteKatId(id);
  };

  const executeDeleteKat = (id: string) => {
    deleteKategori(id);
    reload();
    setConfirmDeleteKatId(null);
  };

  const cancelDeleteKat = () => {
    setConfirmDeleteKatId(null);
  };

  const toggleStatus = async (menu: Menu) => {
    const newStatus: Menu["status"] =
      menu.status === "Tersedia" ? "Tidak Tersedia" : "Tersedia";
    await updateMenu(menu.id, { status: newStatus });
    await reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-angkringan-gold">
            🍽️ Manajemen Menu
          </h1>
          <p className="text-angkringan-light/60 text-sm mt-1">
            Kelola menu makanan & minuman
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowKatModal(true)}
            className="btn-primary bg-angkringan-secondary/80"
          >
            🏷️ Kelola Kategori
          </button>
          <button onClick={openAdd} className="btn-primary">
            <span>+</span> Tambah Menu
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Cari menu..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-field max-w-md"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMenu.map((menu) => (
          <div key={menu.id} className="card">
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{menu.foto}</span>
              <span
                className={`badge ${menu.status === "Tersedia" ? "badge-success" : "badge-danger"}`}
              >
                {menu.status}
              </span>
            </div>
            <h3 className="font-bold text-angkringan-light">
              {menu.nama_menu}
            </h3>
            <p className="text-angkringan-gold text-sm">{menu.kategori}</p>
            <span className="text-angkringan-accent font-bold text-lg">
              {formatRupiah(menu.harga)}
            </span>
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => openEdit(menu)}
                className="flex-1 py-2 text-xs rounded-xl font-bold bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setShowDelete(menu.id)}
                className="px-3 py-2 bg-red-600/20 text-red-400 rounded-xl border border-red-600/30 hover:bg-red-600/30"
              >
                🗑️
              </button>
              <button
                onClick={() => toggleStatus(menu)}
                className={`px-3 py-2 text-xs rounded-xl font-bold ${menu.status === "Tersedia" ? "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30" : "bg-green-600/20 text-green-400 border border-green-600/30"}`}
              >
                {menu.status === "Tersedia" ? "⛔" : "✅"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah/Edit Menu */}
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
              {editingMenu ? "✏️ Edit Menu" : "➕ Tambah Menu"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Nama Menu
                </label>
                <input
                  type="text"
                  value={form.nama_menu}
                  onChange={(e) =>
                    setForm({ ...form, nama_menu: e.target.value })
                  }
                  className="input-field"
                  placeholder="Nama menu"
                  required
                />
              </div>
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Kategori
                </label>
                <select
                  value={form.kategori}
                  onChange={(e) =>
                    setForm({ ...form, kategori: e.target.value })
                  }
                  className="input-field"
                >
                  {getKategoriAktif().map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  value={form.harga === 0 ? "" : form.harga}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      harga: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  className="input-field"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Foto
                </label>
                <div className="flex gap-1 flex-wrap">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, foto: emoji })}
                      className={`text-2xl p-1.5 rounded-lg ${form.foto === emoji ? "bg-angkringan-accent ring-2 ring-angkringan-accent" : "hover:bg-angkringan-primary/30"}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingMenu ? "Simpan" : "Tambah"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-primary flex-1 bg-gray-600/50 hover:bg-gray-600/70"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL KELOLA KATEGORI (SEMUA FITUR DI SINI) ===== */}
      {showKatModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => {
            setShowKatModal(false);
            setEditingKatId(null);
            setConfirmDeleteKatId(null);
          }}
        >
          <div
            className="w-full max-w-sm card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-angkringan-gold mb-4">
              🏷️ Kelola Kategori
            </h2>

            {/* Input tambah kategori */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newKatName}
                onChange={(e) => setNewKatName(e.target.value)}
                className="input-field flex-1"
                placeholder="Nama kategori baru..."
                onKeyDown={(e) => e.key === "Enter" && handleAddKat()}
              />
              <button onClick={handleAddKat} className="btn-primary px-4">
                ➕ Tambah
              </button>
            </div>

            {/* Daftar kategori */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {kategoriList.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-2 bg-angkringan-dark rounded-lg"
                >
                  {/* Kiri: nama + badge */}
                  {editingKatId === k.id ? (
                    // MODE EDIT INLINE
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editingKatNama}
                        autoFocus
                        onChange={(e) => setEditingKatNama(e.target.value)}
                        className="input-field text-sm py-1 flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditKat(k.id);
                          if (e.key === "Escape") cancelEditKat();
                        }}
                      />
                      <button
                        onClick={() => saveEditKat(k.id)}
                        className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30"
                      >
                        💾
                      </button>
                      <button
                        onClick={cancelEditKat}
                        className="text-xs px-2 py-1 bg-gray-600/20 text-gray-400 rounded hover:bg-gray-600/30"
                      >
                        ✕
                      </button>
                    </div>
                  ) : confirmDeleteKatId === k.id ? (
                    // MODE KONFIRMASI HAPUS INLINE
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-xs text-red-400">
                        Hapus {'"'}
                        {k.nama}
                        {'"'}?
                      </span>
                      <button
                        onClick={() => executeDeleteKat(k.id)}
                        className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                      >
                        ✔️ Ya
                      </button>
                      <button
                        onClick={cancelDeleteKat}
                        className="text-xs px-2 py-1 bg-gray-600/20 text-gray-400 rounded hover:bg-gray-600/30"
                      >
                        ✕ Tidak
                      </button>
                    </div>
                  ) : (
                    // MODE NORMAL (TAMPILAN)
                    <>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${k.status === "Aktif" ? "text-angkringan-light" : "text-angkringan-light/40 line-through"}`}
                        >
                          {k.nama}
                        </span>
                        <span
                          className={`badge ${k.status === "Aktif" ? "badge-success" : "badge-danger"} text-[9px]`}
                        >
                          {k.status}
                        </span>
                      </div>

                      {/* Kanan: tombol aksi */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleKat(k.id)}
                          className="text-xs px-2 py-1 rounded hover:bg-angkringan-primary/30"
                          title={
                            k.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"
                          }
                        >
                          {k.status === "Aktif" ? "⛔" : "✅"}
                        </button>
                        <button
                          onClick={() => startEditKat(k)}
                          className="text-xs px-2 py-1 text-blue-400 hover:bg-blue-600/20 rounded"
                          title="Edit nama"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => confirmDeleteKat(k.id)}
                          className="text-xs px-2 py-1 text-red-400 hover:bg-red-600/20 rounded"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowKatModal(false);
                setEditingKatId(null);
                setConfirmDeleteKatId(null);
              }}
              className="btn-primary w-full mt-4 bg-gray-600/50 hover:bg-gray-600/70"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Konfirmasi Hapus Menu */}
      {showDelete && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDelete(null)}
        >
          <div
            className="w-full max-w-sm card p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-5xl block mb-3">⚠️</span>
            <h3 className="text-lg font-bold text-angkringan-gold mb-2">
              Hapus Menu?
            </h3>
            <p className="text-angkringan-light/60 text-sm mb-4">
              Menu yang dihapus tidak bisa dikembalikan
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteMenu(showDelete)}
                className="btn-danger flex-1"
              >
                Hapus
              </button>
              <button
                onClick={() => setShowDelete(null)}
                className="btn-primary flex-1 bg-gray-600/50 hover:bg-gray-600/70"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
