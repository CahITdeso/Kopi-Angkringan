import { query, generateId } from "../../../lib/db";

function normalizeMenuRow(row: any) {
  return {
    ...row,
    status: row.is_deleted ? "Tidak Tersedia" : "Tersedia",
  };
}

export async function GET() {
  try {
    const menu = await query(
      "SELECT id, nama_menu, kategori, harga, foto, is_deleted FROM menu WHERE is_deleted = 0 ORDER BY nama_menu ASC",
    );
    return Response.json(Array.isArray(menu) ? menu.map(normalizeMenuRow) : []);
  } catch (error) {
    console.error("Menu fetch error:", error);
    return Response.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (data.action === "create") {
      const menu = data.menu;
      const id = await generateId();
      await query(
        "INSERT INTO menu (id, nama_menu, kategori, harga, foto, is_deleted) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, menu.nama_menu, menu.kategori, menu.harga, menu.foto || "🍽️", 0],
      );
      return Response.json({
        success: true,
        menu: { ...menu, id, status: "Tersedia" },
      });
    }

    if (data.action === "update") {
      const { id, data: updateData } = data;
      const fields: string[] = [];
      const values: any[] = [];

      const updateFields: Record<string, any> = {};
      for (const key of ["nama_menu", "kategori", "harga", "foto"]) {
        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
          updateFields[key] = updateData[key];
        }
      }
      if (Object.prototype.hasOwnProperty.call(updateData, "status")) {
        updateFields.is_deleted =
          updateData.status === "Tidak Tersedia" ? 1 : 0;
      }

      const fieldKeys = Object.keys(updateFields);
      if (fieldKeys.length === 0) {
        return Response.json(
          { success: false, error: "No fields to update" },
          { status: 400 },
        );
      }

      const setClauses = fieldKeys
        .map((k, i) => `"${k}" = $${i + 1}`)
        .join(", ");
      const updateValues = Object.values(updateFields);
      updateValues.push(id);
      await query(
        `UPDATE menu SET ${setClauses} WHERE id = $${fieldKeys.length + 1}`,
        updateValues,
      );
      return Response.json({ success: true });
    }

    if (data.action === "delete") {
      await query("UPDATE menu SET is_deleted = 1 WHERE id = $1", [data.id]);
      return Response.json({ success: true, deleted: data.id });
    }

    return Response.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Menu error:", error);
    return Response.json(
      { error: "Failed to process menu request" },
      { status: 500 },
    );
  }
}
