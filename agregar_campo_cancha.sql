-- Script para agregar el campo "field" (cancha) a la tabla matches
-- Ejecuta este script en el SQL Editor de Supabase

-- PASO 1: Agregar la columna "field" a la tabla matches
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS field VARCHAR(255);

-- PASO 2: (Opcional) Agregar un comentario a la columna para documentación
COMMENT ON COLUMN matches.field IS 'Nombre o identificador de la cancha donde se juega el partido';

-- PASO 3: Verificar que la columna se creó correctamente
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'matches' 
  AND column_name = 'field';

