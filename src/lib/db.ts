const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "aws-1-ap-southeast-1.pooler.supabase.com",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres.mohtqykrgemqdnsmmtps",
  password: process.env.DB_PASSWORD || "pkugombong21",
  database: process.env.DB_NAME || "postgres",
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export default pool;

export async function query(sql: string, params?: any[]) {
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

export async function softDelete(table: string, id: string): Promise<void> {
  try {
    await query(`UPDATE "${table}" SET is_deleted = 1 WHERE id = $1`, [id]);
  } catch (error) {
    console.warn(`Soft delete ke ${table} gagal:`, error);
  }
}

export async function upsertToDB(
  table: string,
  data: Record<string, any>,
  idField: string = "id",
): Promise<void> {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const updates = keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ");

    await query(
      `INSERT INTO "${table}" (${keys.map((k) => `"${k}"`).join(", ")}) VALUES (${placeholders})
       ON CONFLICT ("${idField}") DO UPDATE SET ${updates}`,
      values,
    );
  } catch (error) {
    console.warn(`Upsert ke ${table} gagal:`, error);
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
