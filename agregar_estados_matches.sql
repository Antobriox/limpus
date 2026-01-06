-- ============================================================
-- SCRIPT PARA AGREGAR MÁS ESTADOS AL CONSTRAINT matches_status_check
-- ============================================================
-- 
-- INSTRUCCIONES:
-- 1. Ve a Supabase Dashboard → SQL Editor
-- 2. Copia y pega este script
-- 3. Modifica la lista de estados según tus necesidades
-- 4. Ejecuta el script
--
-- ============================================================

-- PASO 1: Ver el constraint actual (para referencia)
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'matches_status_check';

-- PASO 2: Eliminar el constraint actual
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_status_check;

-- PASO 3: Crear el nuevo constraint con todos los estados
-- ⚠️ IMPORTANTE: Modifica esta lista según los estados que necesites
ALTER TABLE matches 
ADD CONSTRAINT matches_status_check 
CHECK (status IS NULL OR status IN (
    'pending',      -- Pendiente: Partido creado pero no programado
    'scheduled',    -- Programado: Partido con fecha y hora asignada
    'in_progress',  -- En curso: Partido en desarrollo
    'finished',     -- Finalizado: Partido terminado
    'cancelled',    -- Cancelado: Partido cancelado
    'postponed',    -- Aplazado: Partido pospuesto para otra fecha
    'suspended'     -- Suspendido: Partido suspendido temporalmente
    -- Agrega más estados aquí si los necesitas
    -- Ejemplo: 'abandoned', 'forfeited', etc.
));

-- PASO 4: Verificar que el constraint se creó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'matches_status_check';

-- ============================================================
-- NOTAS:
-- ============================================================
-- - Los valores deben estar en minúsculas y usar guiones bajos
-- - El constraint permite NULL (partidos sin estado)
-- - Si necesitas agregar más estados después, repite los pasos 2 y 3
-- - Asegúrate de actualizar el código de la aplicación para usar estos valores

