-- ============================================================
-- CONSULTAS PARA VER EL CONSTRAINT ACTUAL
-- ============================================================

-- Opción 1: Ver la definición del constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'matches_status_check';

-- Opción 2: Ver todos los constraints de la tabla matches
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'matches'::regclass;

-- Opción 3: Ver valores únicos de status en la tabla matches
SELECT DISTINCT status, COUNT(*) as count
FROM matches
WHERE status IS NOT NULL
GROUP BY status
ORDER BY status;

-- ============================================================
-- MODIFICAR EL CONSTRAINT PARA AGREGAR MÁS ESTADOS
-- ============================================================

-- PASO 1: Eliminar el constraint actual
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_status_check;

-- PASO 2: Crear el nuevo constraint con todos los estados que necesites
-- Ejemplo con los estados más comunes:
ALTER TABLE matches 
ADD CONSTRAINT matches_status_check 
CHECK (status IS NULL OR status IN (
    'pending',      -- Pendiente
    'scheduled',    -- Programado
    'in_progress',  -- En curso
    'finished',     -- Finalizado
    'cancelled',    -- Cancelado
    'postponed',    -- Aplazado (ejemplo de nuevo estado)
    'suspended'     -- Suspendido (ejemplo de nuevo estado)
));

-- ============================================================
-- VERIFICAR QUE EL CONSTRAINT SE CREÓ CORRECTAMENTE
-- ============================================================

-- Verificar el nuevo constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'matches_status_check';

