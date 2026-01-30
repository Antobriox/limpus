-- ================================================
-- HABILITAR REALTIME EN TODAS LAS TABLAS
-- ================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para activar actualizaciones en tiempo real

-- NOTA: Si una tabla ya está habilitada, verás un error. ¡Está bien! Significa que ya está activa.
-- Solo continúa con las demás tablas.

-- 1. Habilitar Realtime para PARTIDOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 2. Habilitar Realtime para RESULTADOS (goles, tarjetas, etc) - YA ESTÁ
-- ALTER PUBLICATION supabase_realtime ADD TABLE match_results; -- ✅ YA HABILITADA

-- 3. Habilitar Realtime para EQUIPOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 4. Habilitar Realtime para TORNEOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 5. Habilitar Realtime para EDICIONES DE TORNEOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournament_editions;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 6. Habilitar Realtime para INSCRIPCIONES
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE team_registrations;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 7. Habilitar Realtime para FORMULARIOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE registration_forms;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 8. Habilitar Realtime para BRACKETS/SORTEOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE draws;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 9. Habilitar Realtime para PERFILES DE USUARIOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 10. Habilitar Realtime para ROLES DE USUARIOS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 11. Habilitar Realtime para LÍDERES DE EQUIPO
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE team_leaders;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- 12. Habilitar Realtime para DEPORTES
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE sports;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Verificar que todas las tablas estén habilitadas
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ✅ Si ves todas las tablas listadas arriba, ¡está listo!
-- 🔥 Ahora tu app funcionará en TIEMPO REAL
