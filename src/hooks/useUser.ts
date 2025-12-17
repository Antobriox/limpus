import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useUser() {
  const [user, setUser] = useState<any>(null);
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

      if (!error && data) {
        const roleNames = data
          .map((row: any) => row.roles?.name)
          .filter(Boolean);

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
