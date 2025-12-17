import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function DELETE(req: Request) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    // 1️⃣ Eliminar roles
    await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", user_id);

    // 2️⃣ Eliminar profile
    await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user_id);

    // 3️⃣ Eliminar usuario Auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authError) {
      console.error(authError);
      return NextResponse.json(
        { error: "Error eliminando usuario Auth" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
