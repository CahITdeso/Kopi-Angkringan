const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "db.mohtqykrgemqdnsmmtps.supabase.co",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "pkugombong21",
  database: process.env.DB_NAME || "postgres",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: {
    rejectUnauthorized: false,
  },
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
    await query(`UPDATE "${table}" SET deleted_at = NOW() WHERE id = $1`, [id]);
  } catch (error) {
    console.warn(`Soft delete ke ${table} gagal:`, error);
  }
}
