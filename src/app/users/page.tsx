"use client";

import React, { useState, useEffect } from "react";
import { getAllUsers, addUser, updateUser, deleteUser } from "@/lib/data";
import { User } from "@/lib/types";

const ROLE_LIST = ["Admin", "Kasir"] as const;

export default function UsersPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    nama: "",
    username: "",
    password: "",
    role: "Kasir" as User["role"],
  });

  useEffect(() => {
    const loadUsers = async () => {
      const data = await getAllUsers();
      setUserList(data);
    };

    loadUsers();
  }, []);

  const filteredUsers = userList.filter(
    (u) =>
      u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const resetForm = () => {
    setForm({ nama: "", username: "", password: "", role: "Kasir" });
    setEditingUser(null);
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setForm({
      nama: user.nama,
      username: user.username,
      password: user.password,
      role: user.role,
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.username || !form.password) return;
    if (editingUser) {
      await updateUser(editingUser.id, form);
    } else {
      await addUser(form);
    }
    const data = await getAllUsers();
    setUserList(data);
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    const data = await getAllUsers();
    setUserList(data);
    setShowDelete(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-blue-600/20 text-blue-400 border border-blue-600/30";
      case "Kasir":
        return "bg-green-600/20 text-green-400 border border-green-600/30";
      default:
        return "badge";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">
            👥 Manajemen User
          </h1>
          <p className="text-angkringan-light/60 text-sm mt-1">
            Kelola akun pengguna sistem
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span> Tambah User
        </button>
      </div>

      <input
        type="text"
        placeholder="Cari user..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-field max-w-md"
      />

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-angkringan-light/60 border-b border-angkringan-primary/30">
                <th className="text-left p-3 font-medium">Nama</th>
                <th className="text-left p-3 font-medium">Username</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-right p-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-angkringan-primary/10 hover:bg-angkringan-primary/10 transition-all"
                >
                  <td className="p-3 text-angkringan-light font-medium">
                    {u.nama}
                  </td>
                  <td className="p-3 text-angkringan-light/60">{u.username}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getRoleColor(u.role)}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-600/30 hover:bg-blue-600/30 text-xs"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setShowDelete(u.id)}
                        className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg border border-red-600/30 hover:bg-red-600/30 text-xs"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
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
              {editingUser ? "✏️ Edit User" : "👤 Tambah User"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="input-field"
                  placeholder="Nama user"
                  required
                />
              </div>
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="input-field"
                  placeholder="Username login"
                  required
                />
              </div>
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input-field"
                  placeholder="Password"
                  required
                />
              </div>
              <div>
                <label className="block text-angkringan-light/80 text-sm mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as User["role"] })
                  }
                  className="input-field"
                >
                  {ROLE_LIST.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-angkringan-light/40 mt-1">
                  <strong>Admin</strong>: Dashboard, POS, Menu, Users, Laporan |{" "}
                  <strong>Kasir</strong>: POS saja
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? "Simpan" : "Tambah"}
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

      {/* Delete */}
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
              Hapus User?
            </h3>
            <p className="text-angkringan-light/60 text-sm mb-4">
              User yang dihapus tidak bisa dikembalikan
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(showDelete)}
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
