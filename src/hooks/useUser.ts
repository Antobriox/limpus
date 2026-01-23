import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // 1️⃣ Obtener sesión
      const { data: sessionData } = await supabase.auth.getSession();

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

      setLoading(false);
    };

    load();
  }, []);

  return { user, roles, loading };
}
