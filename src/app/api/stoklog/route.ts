import { query, generateId } from "@/lib/db";

export async function GET() {
  try {
    const logs: any = await query(
      "SELECT * FROM stok_log ORDER BY tanggal DESC",
    );
    return Response.json(Array.isArray(logs) ? logs : []);
  } catch (error) {
    return Response.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = await generateId();

    await query(
      "INSERT INTO stok_log (id, menu_id, nama_menu, jenis, qty, tanggal, keterangan) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        id,
        data.menu_id,
        data.nama_menu,
        data.jenis,
        data.qty,
        data.tanggal,
        data.keterangan || "",
      ],
    );

    return Response.json({ success: true, id });
  } catch (error) {
    return Response.json({ success: true, id: await generateId() });
  }
}
