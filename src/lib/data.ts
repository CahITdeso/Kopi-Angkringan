import { User, Menu, Transaksi } from "./types";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Request failed for ${url}: ${response.status} ${response.statusText} ${errorBody}`,
    );
  }

  return response.json() as Promise<T>;
}

// ==================== KATEGORI ====================
export interface KategoriItem {
  id: string;
  nama: string;
  status: "Aktif" | "Nonaktif";
}

const DEFAULT_KATEGORI: KategoriItem[] = [
  { id: "kat_nasi", nama: "Nasi", status: "Aktif" },
  { id: "kat_sate", nama: "Sate", status: "Aktif" },
  { id: "kat_gorengan", nama: "Gorengan", status: "Aktif" },
  { id: "kat_minuman", nama: "Minuman", status: "Aktif" },
  { id: "kat_kopi", nama: "Kopi", status: "Aktif" },
  { id: "kat_lauk", nama: "Lauk", status: "Aktif" },
];

let kategoriCache: KategoriItem[] = [...DEFAULT_KATEGORI];

export function getKategori(): KategoriItem[] {
  return kategoriCache;
}

export function getKategoriAktif(): string[] {
  return kategoriCache.filter((k) => k.status === "Aktif").map((k) => k.nama);
}

export function addKategori(nama: string): boolean {
  if (kategoriCache.some((k) => k.nama.toLowerCase() === nama.toLowerCase())) {
    return false;
  }

  kategoriCache = [
    ...kategoriCache,
    {
      id: `kat_${Date.now().toString(36)}`,
      nama,
      status: "Aktif",
    },
  ];

  return true;
}

export function updateKategori(id: string, data: Partial<KategoriItem>): void {
  kategoriCache = kategoriCache.map((k) =>
    k.id === id ? { ...k, ...data } : k,
  );
}

export function deleteKategori(id: string): void {
  kategoriCache = kategoriCache.filter((k) => k.id !== id);
}

export function toggleStatusKategori(id: string): void {
  kategoriCache = kategoriCache.map((k) =>
    k.id === id
      ? {
          ...k,
          status: k.status === "Aktif" ? "Nonaktif" : "Aktif",
        }
      : k,
  );
}

// ==================== USERS ====================
export async function getUsers(): Promise<User[]> {
  try {
    const users = await fetchJson<User[]>("/api/users");
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

export async function seedUsers(): Promise<void> {
  return;
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<User | null> {
  try {
    const result = await fetchJson<{ success: boolean; user?: User }>(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    );

    return result.success && result.user ? result.user : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(_user: User): void {
  return;
}

export function getCurrentUser(): User | null {
  return null;
}

export function logout(): void {
  return;
}

export async function getAllUsers(): Promise<User[]> {
  return getUsers();
}

export async function addUser(user: Omit<User, "id">): Promise<User> {
  const response = await fetchJson<{ success: boolean; user?: User }>(
    "/api/users",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", user }),
    },
  );

  if (response.success && response.user) {
    return response.user;
  }

  return { ...user, id: "" };
}

export async function updateUser(
  id: string,
  data: Partial<User>,
): Promise<void> {
  await fetchJson("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update", id, data }),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await fetchJson("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", id }),
  });
}

// ==================== MENU ====================
export async function getMenu(): Promise<Menu[]> {
  try {
    const menu = await fetchJson<Menu[]>("/api/menu");
    return Array.isArray(menu) ? menu : [];
  } catch {
    return [];
  }
}

export async function seedMenu(): Promise<void> {
  return;
}

export async function addMenu(menu: Omit<Menu, "id">): Promise<Menu> {
  const response = await fetchJson<{ success: boolean; menu?: Menu }>(
    "/api/menu",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", menu }),
    },
  );

  if (response.success && response.menu) {
    return response.menu;
  }

  throw new Error("Gagal menambah menu");
}

export async function updateMenu(
  id: string,
  data: Partial<Menu>,
): Promise<void> {
  await fetchJson("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "update", id, data }),
  });
}

export async function deleteMenu(id: string): Promise<void> {
  await fetchJson("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete", id }),
  });
}

// ==================== TRANSAKSI ====================
export async function getTransaksi(): Promise<Transaksi[]> {
  try {
    const transaksi = await fetchJson<Transaksi[]>("/api/transaksi");
    return Array.isArray(transaksi) ? transaksi : [];
  } catch {
    return [];
  }
}

export async function getTransaksiByPeriode(
  periode: string,
): Promise<Transaksi[]> {
  const all = await getTransaksi();
  const now = new Date();
  let startDate: Date;

  switch (periode) {
    case "harian":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "mingguan":
      startDate = new Date(now.getTime() - 7 * 86400000);
      break;
    case "bulanan":
      startDate = new Date(now.getTime() - 30 * 86400000);
      break;
    default:
      return all;
  }

  return all.filter((t) => new Date(t.tanggal) >= startDate);
}

export async function addTransaksi(
  transaksi: Omit<Transaksi, "id">,
): Promise<Transaksi> {
  const response = await fetchJson<{ success: boolean; id?: string }>(
    "/api/transaksi",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaksi),
    },
  );

  if (response.success && response.id) {
    return { ...transaksi, id: response.id };
  }

  throw new Error("Gagal menyimpan transaksi");
}

export function initializeData(): void {
  return;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTanggalShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
