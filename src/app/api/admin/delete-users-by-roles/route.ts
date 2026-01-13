import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { role_ids } = await req.json();

    if (!role_ids || !Array.isArray(role_ids) || role_ids.length === 0) {
      return NextResponse.json(
        { error: "Se requieren IDs de roles" },
        { status: 400 }
      );
    }

    // 1. Obtener todos los usuarios con los roles especificados
    const { data: userRoles, error: userRolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role_id", role_ids);

    if (userRolesError) {
      console.error("Error obteniendo usuarios:", userRolesError);
      return NextResponse.json(
        { error: "Error obteniendo usuarios" },
        { status: 500 }
      );
    }

    if (!userRoles || userRoles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        deleted: 0,
        message: "No hay usuarios con esos roles para eliminar"
      });
    }

    const userIds = [...new Set(userRoles.map((ur: any) => ur.user_id))];
    console.log(`Eliminando ${userIds.length} usuarios con roles: ${role_ids.join(", ")}`);

    // 2. Eliminar user_roles
    const { error: deleteRolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .in("user_id", userIds);

    if (deleteRolesError) {
      console.error("Error eliminando roles:", deleteRolesError);
      return NextResponse.json(
        { error: "Error eliminando roles de usuarios" },
        { status: 500 }
      );
    }

    // 3. Eliminar profiles
    const { error: deleteProfilesError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .in("id", userIds);

    if (deleteProfilesError) {
      console.error("Error eliminando perfiles:", deleteProfilesError);
      return NextResponse.json(
        { error: "Error eliminando perfiles" },
        { status: 500 }
      );
    }

    // 4. Eliminar usuarios de Auth
    let deletedCount = 0;
    let errors: string[] = [];

    for (const userId of userIds) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error(`Error eliminando usuario Auth ${userId}:`, authError);
        errors.push(`Usuario ${userId}: ${authError.message}`);
      } else {
        deletedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount,
      total: userIds.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
