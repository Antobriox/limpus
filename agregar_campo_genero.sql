-- Script para agregar el campo "genero" (género) a la tabla matches
-- Ejecuta este script en el SQL Editor de Supabase

-- PASO 1: Agregar la columna "genero" a la tabla matches
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS genero VARCHAR(20);

-- PASO 2: (Opcional) Agregar un comentario a la columna para documentación
COMMENT ON COLUMN matches.genero IS 'Género del partido: masculino o femenino';

-- PASO 3: (Opcional) Agregar un constraint para validar los valores permitidos
-- Primero eliminamos el constraint si existe, luego lo creamos
ALTER TABLE matches 
DROP CONSTRAINT IF EXISTS matches_genero_check;

ALTER TABLE matches 
ADD CONSTRAINT matches_genero_check 
CHECK (genero IS NULL OR genero IN ('masculino', 'femenino'));

-- PASO 4: Verificar que la columna se creó correctamente
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'matches' 
  AND column_name = 'genero';
