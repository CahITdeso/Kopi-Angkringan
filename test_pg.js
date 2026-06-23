const { Pool } = require("pg");

const pool = new Pool({
  host: "aws-1-ap-southeast-1.pooler.supabase.com",
  port: 5432,
  user: "postgres.mohtqykrgemqdnsmmtps",
  password: "pkugombong21",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const r = await pool.query("SELECT NOW() as waktu");
    console.log("KONEKSI BERHASIL:", r.rows[0].waktu);

    const t = await pool.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'",
    );
    console.log(
      "TABEL:",
      t.rows.map((r) => r.tablename),
    );

    await pool.end();
  } catch (e) {
    console.log("GAGAL:", e.message);
  }
})();
