import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function PUT(req: Request) {
  try {
    const { user_id, full_name, role_id } = await req.json();

    if (!user_id || !full_name || !role_id) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // 1️⃣ Actualizar profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name,
        id_rol: role_id,
      })
      .eq("id", user_id);

    if (profileError) {
      console.error(profileError);
      return NextResponse.json(
        { error: "Error actualizando perfil" },
        { status: 500 }
      );
    }

    // 2️⃣ Actualizar rol (upsert)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id,
        role_id,
      });

    if (roleError) {
      console.error(roleError);
      return NextResponse.json(
        { error: "Error actualizando rol" },
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
