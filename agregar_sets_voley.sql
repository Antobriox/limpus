-- Script para agregar campos de sets para vóley en match_results
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas para sets (vóley)
ALTER TABLE match_results
ADD COLUMN IF NOT EXISTS sets_team_a INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sets_team_b INTEGER DEFAULT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN match_results.sets_team_a IS 'Sets ganados por equipo A (solo para vóley)';
COMMENT ON COLUMN match_results.sets_team_b IS 'Sets ganados por equipo B (solo para vóley)';

