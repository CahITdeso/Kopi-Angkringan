import { query, generateId } from "../../../lib/db";

function formatDateForDB(isoStr: string): string {
  return isoStr.replace("T", " ").split(".")[0];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "all";
    const dateStart = searchParams.get("date_start");
    const dateEnd = searchParams.get("date_end");
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    let sql = `
      SELECT 
        t.id,
        t.tanggal,
        t.total,
        t.diskon,
        t.pajak,
        t.metode_bayar,
        t.user_id,
        t.customer_name AS "customerName",
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.id,
              'transaksi_id', d.transaksi_id,
              'menu_id', d.menu_id,
              'nama_menu', d.nama_menu,
              'qty', d.qty,
              'harga', d.harga,
              'subtotal', d.subtotal
            ) ORDER BY d.id
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM transaksi t
      LEFT JOIN detail_transaksi d ON d.transaksi_id = t.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    // Date range filtering (priority over periode)
    if (dateStart) {
      conditions.push(`t.tanggal >= $${params.length + 1}::timestamp`);
      params.push(formatDateForDB(new Date(dateStart).toISOString()));
    }
    if (dateEnd) {
      conditions.push(`t.tanggal <= $${params.length + 1}::timestamp`);
      // Set to end of day
      const endDate = new Date(dateEnd);
      endDate.setHours(23, 59, 59, 999);
      params.push(formatDateForDB(endDate.toISOString()));
    }

    if (conditions.length === 0 && periode !== "all") {
      const now = new Date();
      let startDate: Date;
      if (periode === "harian") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (periode === "mingguan") {
        startDate = new Date(now.getTime() - 7 * 86400000);
      } else {
        startDate = new Date(now.getTime() - 30 * 86400000);
      }
      conditions.push(`t.tanggal >= $${params.length + 1}::timestamp`);
      params.push(formatDateForDB(startDate.toISOString()));
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " GROUP BY t.id ORDER BY t.tanggal DESC";

    if (limit > 0) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const transaksi: any = await query(sql, params);

    return Response.json(transaksi);
  } catch (error) {
    console.error("Transaksi fetch error:", error);
    return Response.json(
      { error: "Failed to fetch transaksi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (data.action === "soft_delete") {
      await query("DELETE FROM detail_transaksi WHERE transaksi_id = $1", [
        data.id,
      ]);
      await query("DELETE FROM transaksi WHERE id = $1", [data.id]);
      return Response.json({ success: true, deleted: data.id });
    }

    const id = await generateId();
    const tanggalDB = formatDateForDB(data.tanggal || new Date().toISOString());
    const customerName = data.customerName || data.customer_name || null;

    await query(
      "INSERT INTO transaksi (id, tanggal, total, diskon, pajak, metode_bayar, user_id, customer_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        id,
        tanggalDB,
        data.total,
        data.diskon || 0,
        data.pajak || 0,
        data.metode_bayar,
        data.user_id,
        customerName,
      ],
    );

    for (const item of data.items || []) {
      const detailId = await generateId();
      await query(
        "INSERT INTO detail_transaksi (id, transaksi_id, menu_id, nama_menu, qty, harga, subtotal, customer_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          detailId,
          id,
          item.menu_id,
          item.nama_menu,
          item.qty,
          item.harga,
          item.subtotal,
          customerName,
        ],
      );
    }

    return Response.json({ success: true, id });
  } catch (error) {
    console.error("Transaksi error:", error);
    return Response.json(
      { error: "Failed to save transaksi" },
      { status: 500 },
    );
  }
}
