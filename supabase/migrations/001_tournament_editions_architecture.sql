-- =============================================================================
-- MIGRACIÓN: Arquitectura basada en tournament_editions
-- =============================================================================
-- Reglas: no borrar datos, no usar name+fechas para lógica, todo por edition_id.
-- Ejecutar en Supabase SQL Editor BLOQUE POR BLOQUE en el orden indicado.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- PASO 1: Crear tabla tournament_editions
-- -----------------------------------------------------------------------------
-- Entidad principal. Una edición = un torneo en el tiempo (nombre + fechas).
-- status define si es la edición activa ('active') o historial ('closed').
-- El torneo activo se define SOLO por status = 'active', no por ID ni por name/fechas.

CREATE TABLE IF NOT EXISTS tournament_editions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tournament_editions IS 'Edición de torneo. Una edición agrupa varias disciplinas (tournaments). El torneo activo es status=active.';
COMMENT ON COLUMN tournament_editions.status IS 'active = torneo actual; closed = historial.';

CREATE INDEX IF NOT EXISTS idx_tournament_editions_status ON tournament_editions(status);


-- -----------------------------------------------------------------------------
-- PASO 2: Añadir edition_id a tournaments (nullable)
-- -----------------------------------------------------------------------------
-- tournaments pasa a depender de una edición. Cada fila = una disciplina de esa edición.

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS edition_id BIGINT REFERENCES tournament_editions(id);

CREATE INDEX IF NOT EXISTS idx_tournaments_edition_id ON tournaments(edition_id);


-- -----------------------------------------------------------------------------
-- PASO 3: Poblar tournament_editions desde datos actuales
-- -----------------------------------------------------------------------------
-- Una edición = un grupo de filas de tournaments con mismo (name, start_date, end_date).
-- Insertamos UNA fila por grupo, todas con status = 'closed'.
-- created_by se toma de cualquier tournament del grupo.

INSERT INTO tournament_editions (name, start_date, end_date, created_by, status, created_at)
SELECT
  t.name,
  t.start_date,
  t.end_date,
  (SELECT created_by FROM tournaments t2
   WHERE t2.name = t.name AND t2.start_date IS NOT DISTINCT FROM t.start_date AND t2.end_date IS NOT DISTINCT FROM t.end_date
   LIMIT 1),
  'closed',
  NOW()
FROM tournaments t
GROUP BY t.name, t.start_date, t.end_date;


-- -----------------------------------------------------------------------------
-- PASO 4: Rellenar tournaments.edition_id (backfill)
-- -----------------------------------------------------------------------------
-- Cada fila de tournaments se asigna a la edición con su mismo name y fechas.

UPDATE tournaments tr
SET edition_id = te.id
FROM tournament_editions te
WHERE te.name = tr.name
  AND te.start_date IS NOT DISTINCT FROM tr.start_date
  AND te.end_date IS NOT DISTINCT FROM tr.end_date;


-- -----------------------------------------------------------------------------
-- PASO 5: Marcar la edición activa
-- -----------------------------------------------------------------------------
-- La edición activa es la que contiene el tournament con id máximo (comportamiento actual).
-- Todas las demás quedan 'closed'. Solo hay UNA con status = 'active'.

UPDATE tournament_editions
SET status = 'closed';

UPDATE tournament_editions te
SET status = 'active'
WHERE te.id = (
  SELECT edition_id FROM tournaments WHERE id = (SELECT MAX(id) FROM tournaments) LIMIT 1
);


-- -----------------------------------------------------------------------------
-- PASO 6: Añadir edition_id a teams
-- -----------------------------------------------------------------------------
-- Cada equipo pertenece a una edición.
-- Backfill: la edición del partido más reciente donde participó el equipo (por tournament.id).
-- Si el equipo no aparece en ningún partido, se asigna a la edición activa.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS edition_id BIGINT REFERENCES tournament_editions(id);

CREATE INDEX IF NOT EXISTS idx_teams_edition_id ON teams(edition_id);

UPDATE teams tm
SET edition_id = (
  SELECT te.id
  FROM matches m
  JOIN tournaments t ON t.id = m.tournament_id
  JOIN tournament_editions te ON te.id = t.edition_id
  WHERE m.team_a = tm.id OR m.team_b = tm.id
  ORDER BY t.id DESC
  LIMIT 1
)
WHERE EXISTS (SELECT 1 FROM matches m WHERE m.team_a = tm.id OR m.team_b = tm.id);

UPDATE teams tm
SET edition_id = (SELECT id FROM tournament_editions WHERE status = 'active' LIMIT 1)
WHERE tm.edition_id IS NULL;


-- -----------------------------------------------------------------------------
-- PASO 7: Añadir edition_id a team_leaders
-- -----------------------------------------------------------------------------
-- Se deriva del equipo: team_leaders.edition_id = teams.edition_id.

ALTER TABLE team_leaders
  ADD COLUMN IF NOT EXISTS edition_id BIGINT REFERENCES tournament_editions(id);

CREATE INDEX IF NOT EXISTS idx_team_leaders_edition_id ON team_leaders(edition_id);

UPDATE team_leaders tl
SET edition_id = t.edition_id
FROM teams t
WHERE t.id = tl.team_id;

UPDATE team_leaders tl
SET edition_id = (SELECT id FROM tournament_editions WHERE status = 'active' LIMIT 1)
WHERE tl.edition_id IS NULL;


-- -----------------------------------------------------------------------------
-- PASO 8: Añadir edition_id a registration_forms
-- -----------------------------------------------------------------------------
-- Formularios existentes no tienen vínculo por edición; se asignan a la edición activa.

ALTER TABLE registration_forms
  ADD COLUMN IF NOT EXISTS edition_id BIGINT REFERENCES tournament_editions(id);

CREATE INDEX IF NOT EXISTS idx_registration_forms_edition_id ON registration_forms(edition_id);

UPDATE registration_forms
SET edition_id = (SELECT id FROM tournament_editions WHERE status = 'active' LIMIT 1)
WHERE edition_id IS NULL;


-- -----------------------------------------------------------------------------
-- PASO 9: Añadir edition_id a team_registrations
-- -----------------------------------------------------------------------------
-- Se deriva del formulario: team_registrations.edition_id = registration_forms.edition_id.

ALTER TABLE team_registrations
  ADD COLUMN IF NOT EXISTS edition_id BIGINT REFERENCES tournament_editions(id);

CREATE INDEX IF NOT EXISTS idx_team_registrations_edition_id ON team_registrations(edition_id);

UPDATE team_registrations tr
SET edition_id = rf.edition_id
FROM registration_forms rf
WHERE rf.id = tr.form_id;

UPDATE team_registrations
SET edition_id = (SELECT id FROM tournament_editions WHERE status = 'active' LIMIT 1)
WHERE edition_id IS NULL;


-- -----------------------------------------------------------------------------
-- PASO 10: Añadir edition_id a players
-- -----------------------------------------------------------------------------
-- Se deriva de team_registrations; si no tiene, de la edición activa.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS edition_id BIGINT REFERENCES tournament_editions(id);

CREATE INDEX IF NOT EXISTS idx_players_edition_id ON players(edition_id);

UPDATE players p
SET edition_id = tr.edition_id
FROM team_registrations tr
WHERE tr.id = p.team_registration_id AND p.edition_id IS NULL;

UPDATE players p
SET edition_id = (SELECT id FROM tournament_editions WHERE status = 'active' LIMIT 1)
WHERE p.edition_id IS NULL;


-- -----------------------------------------------------------------------------
-- OPCIONAL: Garantizar una sola edición activa (solo una fila con status='active')
-- -----------------------------------------------------------------------------
-- CREATE UNIQUE INDEX idx_tournament_editions_single_active
-- ON tournament_editions ((true)) WHERE status = 'active';


-- -----------------------------------------------------------------------------
-- RESUMEN
-- -----------------------------------------------------------------------------
-- 1. tournament_editions creada; poblada por (name, start_date, end_date).
-- 2. tournaments.edition_id añadido y rellenado.
-- 3. Edición activa = la del tournament con MAX(id); resto 'closed'.
-- 4. teams, team_leaders, registration_forms, team_registrations, players
--    tienen edition_id; backfill según reglas arriba.
-- 5. Torneo activo en app: WHERE status = 'active'.
-- 6. Historial: WHERE status = 'closed'.
-- 7. Todo filtro debe usar edition_id; no name ni fechas.
