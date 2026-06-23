const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Mahmudd",
  database: process.env.DB_NAME || "pos_angkringan",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

export async function query(sql: string, params?: any[]) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

// Soft delete ke database MySQL (tidak menghapus data, hanya menandai deleted_at)
export async function softDelete(table: string, id: string): Promise<void> {
  try {
    await query(`UPDATE ?? SET deleted_at = NOW() WHERE id = ?`, [table, id]);
  } catch (error) {
    console.warn(
      `Soft delete ke ${table} gagal (DB mungkin tidak aktif):`,
      error,
    );
  }
}

// Insert atau Update data ke database MySQL
export async function upsertToDB(
  table: string,
  data: Record<string, any>,
  idField: string = "id",
): Promise<void> {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");
    const updates = keys.map((k) => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");

    await query(
      `INSERT INTO \`${table}\` (${keys.map((k) => "`" + k + "`").join(", ")}) VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updates}`,
      values,
    );
  } catch (error) {
    console.warn(`Upsert ke ${table} gagal (DB mungkin tidak aktif):`, error);
  }
}

export async function generateId(): Promise<string> {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTanggalShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
