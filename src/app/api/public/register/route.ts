import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { full_name, email, password } = await req.json();

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
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

    if (authError) {
      console.error("AUTH ERROR:", authError);
      
      // Si el usuario ya existe
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Este correo electrónico ya está registrado" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Error creando usuario en Auth" },
        { status: 500 }
      );
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: "No se pudo obtener el usuario" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 2️⃣ UPSERT profile (NO FALLA SI YA EXISTE)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name,
        email,
        id_rol: 4, // Siempre viewers para registro público
      });

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);
      
      // Si falla el profile, intentar eliminar el usuario de Auth
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: `Error guardando perfil: ${profileError.message}` },
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

    // 4️⃣ Insertar solo el rol "viewers" (role_id: 4)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userId,
        role_id: 4, // Siempre viewers para registro público
      });

    if (roleError) {
      console.error("ROLE ERROR:", roleError);
      
      // Si falla el rol, intentar limpiar
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: `Error asignando rol: ${roleError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Usuario creado exitosamente" 
    });
  } catch (err: any) {
    console.error("SERVER ERROR in public/register:", err);
    return NextResponse.json(
      { error: `Error interno del servidor: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}
