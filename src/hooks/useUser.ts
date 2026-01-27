import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // 1️⃣ Obtener sesión
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        // Si hay un error de refresh token, limpiar la sesión
        if (sessionError) {
          console.warn("Error al obtener sesión:", sessionError.message);
          // Si es un error de refresh token inválido, limpiar la sesión
          if (sessionError.message.includes("Refresh Token") || sessionError.message.includes("refresh_token")) {
            await supabase.auth.signOut();
          }
          setLoading(false);
          return;
        }

        if (!sessionData.session) {
          setLoading(false);
          return;
        }

        const authUser = sessionData.session.user;
        setUser(authUser);

        // 2️⃣ CONSULTAR user_roles CON EL ID
        const { data, error } = await supabase
          .from("user_roles")
          .select("roles(name)")
          .eq("user_id", authUser.id);

        type UserRoleRow = {
          roles: {
            name: string;
          } | Array<{
            name: string;
          }> | null;
        };
        if (!error && data) {
          const roleNames = (data as UserRoleRow[])
            .map((row: UserRoleRow) => {
              if (!row.roles) return null;
              const rolesData = Array.isArray(row.roles) ? row.roles[0] : row.roles;
              return rolesData?.name;
            })
            .filter((name): name is string => Boolean(name));

          setRoles(roleNames);
        } else {
          setRoles([]);
        }
      } catch (error) {
        console.error("Error inesperado al cargar usuario:", error);
        // Limpiar sesión en caso de error inesperado
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    };

    load();

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (session) {
          setUser(session.user);
          // Recargar roles cuando la sesión cambia
          const { data, error } = await supabase
            .from("user_roles")
            .select("roles(name)")
            .eq("user_id", session.user.id);

          if (!error && data) {
            type UserRoleRow = {
              roles: {
                name: string;
              } | Array<{
                name: string;
              }> | null;
            };
            const roleNames = (data as UserRoleRow[])
              .map((row: UserRoleRow) => {
                if (!row.roles) return null;
                const rolesData = Array.isArray(row.roles) ? row.roles[0] : row.roles;
                return rolesData?.name;
              })
              .filter((name): name is string => Boolean(name));
            setRoles(roleNames);
          }
        } else {
          setUser(null);
          setRoles([]);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, roles, loading };
}
