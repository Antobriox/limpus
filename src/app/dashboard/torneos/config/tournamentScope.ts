/**
 * Regla de alcance por tournament ID (lógica de negocio):
 *
 * - Al crear un nuevo torneo se genera un nuevo ID (o varios si la edición tiene varias disciplinas).
 * - Ese ID "posee" todos los datos creados en ese torneo:
 *   - Equipos que participan en partidos de ese torneo
 *   - Líderes de equipo asignados a esos equipos / árbitros asignados a partidos de ese torneo
 *   - Partidos, brackets, fases de grupo, tablas, inscripciones asociadas, etc.
 * - Al ver el torneo actual (nuevo ID): NO se muestran datos del torneo anterior (otro ID).
 * - El torneo viejo (ID anterior) queda en Historial; al abrirlo desde Historial se ven solo los datos de ese ID.
 *
 * En resumen: cada torneo (ID) tiene sus datos; la vista del torneo X solo muestra datos que pertenecen al ID X.
 */

export const TOURNAMENT_SCOPE_DESCRIPTION =
  "Cada torneo (ID) posee sus datos. Vista torneo X = solo datos de ese ID. Torneo nuevo = ID nuevo; datos del ID viejo en Historial.";
