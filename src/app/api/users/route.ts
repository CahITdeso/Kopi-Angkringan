import { query, generateId } from "../../../lib/db";

export async function GET() {
  try {
    const users = await query(
      "SELECT id, nama, username, password, role FROM users ORDER BY nama ASC",
    );
    return Response.json(users);
  } catch (error) {
    console.error("Users fetch error:", error);
    return Response.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (data.action === "create") {
      const user = data.user;
      const id = await generateId();
      await query(
        "INSERT INTO users (id, nama, username, password, role) VALUES (?, ?, ?, ?, ?)",
        [id, user.nama, user.username, user.password, user.role || "Kasir"],
      );
      return Response.json({ success: true, user: { ...user, id } });
    }

    if (data.action === "update") {
      const { id, data: updateData } = data;
      const fields: string[] = [];
      const values: any[] = [];

      for (const key of ["nama", "username", "password", "role"]) {
        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }

      if (fields.length === 0) {
        return Response.json(
          { success: false, error: "No fields to update" },
          { status: 400 },
        );
      }

      values.push(id);
      await query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
      return Response.json({ success: true });
    }

    if (data.action === "delete") {
      await query("DELETE FROM users WHERE id = ?", [data.id]);
      return Response.json({ success: true, deleted: data.id });
    }

    return Response.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Users error:", error);
    return Response.json(
      { error: "Failed to process users request" },
      { status: 500 },
    );
  }
}
