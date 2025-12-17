import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { full_name, email, password, role_id } = await req.json();

    if (!full_name || !email || !password || !role_id) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // 1️⃣ Crear usuario en Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError && authError.message !== "User already registered") {
      console.error("AUTH ERROR:", authError);
      return NextResponse.json(
        { error: "Error creando usuario en Auth" },
        { status: 500 }
      );
    }

    // ⚠️ Si ya existe, obtenemos el usuario
    const user =
      authData?.user ??
      (
        await supabaseAdmin.auth.admin.getUserByEmail(email)
      ).data.user;

    if (!user) {
      return NextResponse.json(
        { error: "No se pudo obtener el usuario" },
        { status: 500 }
      );
    }

    const userId = user.id;

    // 2️⃣ UPSERT profile (NO FALLA SI YA EXISTE)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name,
        email,
        id_rol: role_id,
      });

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
      return NextResponse.json(
        { error: "Error guardando perfil" },
        { status: 500 }
      );
    }

    // 3️⃣ UPSERT user_roles
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        role_id,
      });

    if (roleError) {
      console.error("ROLE ERROR:", roleError);
      return NextResponse.json(
        { error: "Error asignando rol" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
