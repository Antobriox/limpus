-- Agregar columna team_registration_id a la tabla players
-- Esta columna relaciona los jugadores con las inscripciones de equipos

-- Primero, verificar si la columna ya existe y eliminarla si es necesario (para evitar errores)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'players' 
        AND column_name = 'team_registration_id'
    ) THEN
        -- Si existe, eliminar la foreign key constraint si existe
        ALTER TABLE players DROP CONSTRAINT IF EXISTS players_team_registration_id_fkey;
        -- Eliminar la columna
        ALTER TABLE players DROP COLUMN team_registration_id;
    END IF;
END $$;

-- Agregar la columna team_registration_id
ALTER TABLE players 
ADD COLUMN team_registration_id INTEGER;

-- Agregar foreign key constraint
ALTER TABLE players 
ADD CONSTRAINT players_team_registration_id_fkey 
FOREIGN KEY (team_registration_id) 
REFERENCES team_registrations(id) 
ON DELETE CASCADE;

-- Agregar comentario a la columna
COMMENT ON COLUMN players.team_registration_id IS 'ID de la inscripción del equipo a la que pertenece el jugador';
