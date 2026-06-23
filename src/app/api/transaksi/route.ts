import { query, generateId } from "../../../lib/db";

function formatDateForDB(isoStr: string): string {
  return isoStr.replace("T", " ").split(".")[0];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get("periode") || "all";

    let sql = "SELECT * FROM transaksi ORDER BY tanggal DESC";
    const params: any[] = [];

    if (periode !== "all") {
      const now = new Date();
      let startDate: Date;
      if (periode === "harian") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (periode === "mingguan") {
        startDate = new Date(now.getTime() - 7 * 86400000);
      } else {
        startDate = new Date(now.getTime() - 30 * 86400000);
      }
      sql = "SELECT * FROM transaksi WHERE tanggal >= $1 ORDER BY tanggal DESC";
      params.push(formatDateForDB(startDate.toISOString()));
    }

    const transaksi: any = await query(sql, params);

    for (let t of transaksi) {
      const details: any = await query(
        "SELECT * FROM detail_transaksi WHERE transaksi_id = $1 AND is_deleted = false",
        [t.id],
      );
      t.items = details;
      t.customerName = t.customer_name || t.customerName || null;
    }

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
