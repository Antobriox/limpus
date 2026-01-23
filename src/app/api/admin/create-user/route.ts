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

    // ⚠️ Si ya existe, obtenemos el usuario usando listUsers (Supabase v2)
    let user = authData?.user || null;
    
    if (!user) {
      // listUsers no soporta filtros, así que obtenemos usuarios y filtramos por email
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Obtener suficientes usuarios para buscar
      });

      if (listError) {
        console.error("Error obteniendo usuario existente:", listError);
        return NextResponse.json(
          { error: "Error obteniendo usuario existente" },
          { status: 500 }
        );
      }

      // Filtrar por email en JavaScript
      const foundUser = usersData?.users?.find((u) => u.email === email);
      user = foundUser || null;
    }

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

    // 3️⃣ Eliminar todos los roles existentes del usuario (si tiene)
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error eliminando roles anteriores:", deleteError);
      // Continuar de todas formas, puede que no tenga roles previos
    }

    // 4️⃣ Insertar solo el rol especificado
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
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
