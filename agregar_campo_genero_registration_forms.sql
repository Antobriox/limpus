-- Script para agregar el campo "genero" (género) a la tabla registration_forms
-- Ejecuta este script en el SQL Editor de Supabase

-- PASO 1: Agregar la columna "genero" a la tabla registration_forms
ALTER TABLE registration_forms 
ADD COLUMN IF NOT EXISTS genero VARCHAR(20);

-- PASO 2: (Opcional) Agregar un comentario a la columna para documentación
COMMENT ON COLUMN registration_forms.genero IS 'Género de la inscripción: masculino o femenino';

-- PASO 3: Agregar un constraint para validar los valores permitidos
-- Primero eliminamos el constraint si existe, luego lo creamos
ALTER TABLE registration_forms 
DROP CONSTRAINT IF EXISTS registration_forms_genero_check;

ALTER TABLE registration_forms 
ADD CONSTRAINT registration_forms_genero_check 
CHECK (genero IS NULL OR genero IN ('masculino', 'femenino'));

-- PASO 4: Verificar que la columna se creó correctamente
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'registration_forms' 
  AND column_name = 'genero';
