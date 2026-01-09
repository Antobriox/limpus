// Hook para calcular y cargar tablas de posiciones
import { useState, useCallback } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { generateStandings, MatchData, TeamMap } from "../utils/calculateStandings";
import { getDisciplineRulesByName, getDisciplineRules } from "../config/disciplineRules";
import { TeamStanding, DisciplineRules, BomboStandings } from "../types/standings";

export const useStandings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga y calcula la tabla de posiciones para una disciplina
   */
  const loadStandings = useCallback(async (
    sportId: number,
    sportName: string,
    tournamentId?: number
  ): Promise<BomboStandings[]> => {
    setLoading(true);
    setError(null);

    try {
      // Obtener reglas de la disciplina
      const rules = getDisciplineRules(sportId) || getDisciplineRulesByName(sportName);
      
      if (!rules) {
        throw new Error(`No se encontraron reglas para la disciplina: ${sportName}`);
      }

      // Construir query para partidos finalizados
      let matchesQuery = supabase
        .from("matches")
        .select(`
          id,
          team_a,
          team_b,
          tournament_id,
          status,
          tournaments!inner (
            sport_id
          )
        `)
        .eq("status", "finished")
        .eq("tournaments.sport_id", sportId);
      
      console.log(`🔍 Buscando partidos finalizados para ${sportName} (ID: ${sportId})`);

      // Filtrar por torneo si se especifica
      if (tournamentId) {
        matchesQuery = matchesQuery.eq("tournament_id", tournamentId);
      }

      const { data: matches, error: matchesError } = await matchesQuery;

      if (matchesError) {
        throw matchesError;
      }

      console.log(`📊 Partidos finalizados encontrados: ${matches?.length || 0}`);
      if (matches && matches.length > 0) {
        matches.forEach((m: any) => {
          console.log(`  - Partido ${m.id}: Equipo ${m.team_a} vs Equipo ${m.team_b}, Status: ${m.status}`);
        });
      }

      // Obtener el nombre del deporte para buscar brackets (usar el parámetro sportName si está disponible)
      let disciplineName = sportName;
      if (!disciplineName) {
        const { data: sportData } = await supabase
          .from("sports")
          .select("name")
          .eq("id", sportId)
          .single();
        disciplineName = sportData?.name || "";
      }
      console.log(`🔍 Buscando brackets para disciplina: "${disciplineName}" (ID: ${sportId})`);

      // Buscar brackets guardados para esta disciplina
      // Buscar en TODOS los torneos (no filtrar por sport_id)
      let allTeamIds = new Set<number>();
      
      // Obtener TODOS los torneos
      const { data: tournaments } = await supabase
        .from("tournaments")
        .select("id")
        .order("id", { ascending: false });

      if (tournaments && tournaments.length > 0) {
        const tournamentIds = tournaments.map(t => t.id);
        console.log(`📁 Total de torneos encontrados: ${tournamentIds.length}`);
        
        // Buscar todos los draws de TODOS los torneos
        const { data: draws } = await supabase
          .from("draws")
          .select("id, name, tournament_id")
          .in("tournament_id", tournamentIds)
          .order("created_at", { ascending: false });

        console.log(`📦 Total de draws encontrados: ${draws?.length || 0}`, draws?.map(d => d.name));
        if (draws && draws.length > 0) {
          // Filtrar por nombre que incluya el nombre de la disciplina
          // Normalizar nombres para mejor coincidencia
          const sportNameLower = disciplineName.toLowerCase();
          
          // Crear un mapeo más flexible que incluya el nombre original
          const normalizedNames: Record<string, string[]> = {
            "fútbol": ["futbol", "football", "fútbol"],
            "básquet": ["basket", "basketball", "básquet", "basquet"],
            "vóley": ["voley", "volleyball", "voleibol", "vóley", "voleib"],
            "pádel": ["padel", "paddle", "pádel"],
            "basketball": ["basket", "basketball", "básquet", "basquet"],
            "futbol": ["futbol", "football", "fútbol"],
            "volleyball": ["voley", "volleyball", "voleibol", "vóley"],
          };

          // Usar el mapeo o el nombre original como fallback
          const searchTerms = normalizedNames[sportNameLower] || [sportNameLower];
          
          console.log(`🔎 Buscando con términos: [${searchTerms.join(", ")}]`);
          
          const filteredDraws = draws.filter(draw => {
            const drawName = (draw.name?.toLowerCase() || "")
              .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remover tildes/acentos
            
            // Buscar si el nombre del draw contiene alguno de los términos de búsqueda
            return searchTerms.some(term => {
              const normalizedTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return drawName.includes(normalizedTerm);
            });
          });

          if (filteredDraws.length > 0) {
            // Tomar el draw más reciente
            const latestDraw = filteredDraws[0];
            console.log(`✅ Brackets encontrados para ${disciplineName}: "${latestDraw.name}"`);
            const { data: drawResults } = await supabase
              .from("draw_results")
              .select("team_id, result_order")
              .eq("draw_id", latestDraw.id);

            if (drawResults && drawResults.length > 0) {
              console.log(`✅ ${drawResults.length} equipos encontrados en brackets`);
              
              // Agrupar por bombos (result_order)
              const bomboMap = new Map<number, Set<number>>();
              drawResults.forEach((dr: any) => {
                const bombo = dr.result_order || 1;
                if (!bomboMap.has(bombo)) {
                  bomboMap.set(bombo, new Set());
                }
                bomboMap.get(bombo)!.add(dr.team_id);
                allTeamIds.add(dr.team_id);
              });
              
              // Guardar información de bombos para uso posterior
              (allTeamIds as any).bomboMap = bomboMap;
            }
          } else {
            console.log(`❌ No se encontraron brackets para ${disciplineName}. Draws disponibles:`, draws?.map(d => d.name));
          }
        }
      }

      // Si no hay brackets guardados, retornar array vacío
      // El usuario debe generar brackets primero para ver las posiciones
      if (allTeamIds.size === 0) {
        console.log(`❌ No se encontraron equipos para ${disciplineName}. Ve a "Generar Brackets" para crear brackets de esta disciplina.`);
        return [];
      }

      console.log(`✅ ${allTeamIds.size} equipos encontrados en brackets para ${disciplineName}`);

      // Cargar nombres de todos los equipos
      const { data: allTeams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .in("id", Array.from(allTeamIds));

      if (teamsError) {
        throw teamsError;
      }

      const teamMap: TeamMap = new Map(
        allTeams?.map((t: any) => [t.id, t.name]) || []
      );

      // Obtener información de bombos si está disponible
      const bomboMap = (allTeamIds as any).bomboMap as Map<number, Set<number>> | undefined;

      // Si no hay partidos finalizados, retornar todos los equipos con estadísticas en 0
      if (!matches || matches.length === 0) {
        console.log(`📊 No hay partidos finalizados para ${disciplineName}. Creando tabla con ${allTeamIds.size} equipos en 0 puntos.`);
        
        // Si hay información de bombos, crear tablas separadas
        if (bomboMap && bomboMap.size > 0) {
          const bomboStandings: BomboStandings[] = [];
          
          // Ordenar bombos por número
          const sortedBombos = Array.from(bomboMap.keys()).sort((a, b) => a - b);
          
          sortedBombos.forEach(bomboNumber => {
            const teamIds = bomboMap.get(bomboNumber)!;
            const standings: TeamStanding[] = Array.from(teamIds).map((teamId, index) => {
              const teamName = teamMap.get(teamId) || `Equipo ${teamId}`;
              return {
                teamId,
                teamName,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                pointsFor: 0,
                pointsAgainst: 0,
                pointDifference: 0,
                setsWon: 0,
                setsLost: 0,
                setDifference: 0,
                fairPlayPoints: 0,
                position: index + 1,
              };
            });
            
            bomboStandings.push({
              bomboNumber,
              bomboName: `Bombo ${bomboNumber}`,
              standings,
            });
          });
          
          console.log(`✅ ${bomboStandings.length} bombos generados con equipos en 0 puntos`);
          return bomboStandings;
        }
        
        // Si no hay bombos, crear una sola tabla
        const emptyStandings: TeamStanding[] = Array.from(allTeamIds).map((teamId, index) => {
          const teamName = teamMap.get(teamId) || `Equipo ${teamId}`;
          return {
            teamId,
            teamName,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            pointDifference: 0,
            setsWon: 0,
            setsLost: 0,
            setDifference: 0,
            fairPlayPoints: 0,
            position: index + 1,
          };
        });

        console.log(`✅ Tabla generada con ${emptyStandings.length} equipos:`, emptyStandings.map(s => s.teamName));
        return [{
          bomboNumber: 1,
          bomboName: "Tabla General",
          standings: emptyStandings,
        }];
      }

      const matchIds = matches.map((m: any) => m.id);

      // Cargar resultados de partidos
      // Solo intentar obtener sets si la disciplina los usa
      const selectFields = rules.usesSets
        ? "match_id, score_team_a, score_team_b, winner_team"
        : "match_id, score_team_a, score_team_b, winner_team";
      
      const { data: results, error: resultsError } = await supabase
        .from("match_results")
        .select(selectFields)
        .in("match_id", matchIds);

      if (resultsError) {
        throw resultsError;
      }

      // Cargar eventos (tarjetas, sets si aplica)
      const { data: events, error: eventsError } = await supabase
        .from("match_events")
        .select("match_id, event_type, team_id, value")
        .in("match_id", matchIds);

      if (eventsError) {
        throw eventsError;
      }

      // Ya tenemos teamMap y allTeamIds cargados arriba

      // Combinar datos de partidos con resultados y eventos
      const matchesData: MatchData[] = matches.map((match: any) => {
        const result = results?.find((r: any) => r.match_id === match.id);
        const matchEvents = events?.filter((e: any) => e.match_id === match.id) || [];

        // Contar tarjetas por equipo
        let yellowCardsA = 0;
        let redCardsA = 0;
        let yellowCardsB = 0;
        let redCardsB = 0;

        // Para vóley, contar sets (asumiendo que se guardan como eventos o en otra tabla)
        // Por ahora, si no hay sets en los eventos, usaremos los scores como sets
        let setsA: number | null = null;
        let setsB: number | null = null;

        matchEvents.forEach((event: any) => {
          if (event.team_id === match.team_a) {
            if (event.event_type === "yellow_card") yellowCardsA++;
            if (event.event_type === "red_card") redCardsA++;
            // Para vóley, podríamos tener eventos de sets
            if (event.event_type === "set" && rules.usesSets) {
              setsA = (setsA || 0) + 1;
            }
          } else if (event.team_id === match.team_b) {
            if (event.event_type === "yellow_card") yellowCardsB++;
            if (event.event_type === "red_card") redCardsB++;
            if (event.event_type === "set" && rules.usesSets) {
              setsB = (setsB || 0) + 1;
            }
          }
        });

        // Para vóley, usar scores como sets (los sets se guardan en score_team_a/b para vóley)
        if (rules.usesSets && setsA === null && result) {
          setsA = result.score_team_a;
          setsB = result.score_team_b;
        }

        const matchData = {
          id: match.id,
          team_a: match.team_a,
          team_b: match.team_b,
          score_team_a: result?.score_team_a ?? null,
          score_team_b: result?.score_team_b ?? null,
          winner_team: result?.winner_team || null,
          sets_team_a: setsA,
          sets_team_b: setsB,
          yellow_cards_team_a: yellowCardsA,
          yellow_cards_team_b: yellowCardsB,
          red_cards_team_a: redCardsA,
          red_cards_team_b: redCardsB,
        };
        
        // Log para empates
        if (matchData.score_team_a !== null && matchData.score_team_b !== null && 
            matchData.score_team_a === matchData.score_team_b) {
          console.log(`⚽ Empate detectado en partido ${match.id}: ${matchData.score_team_a}-${matchData.score_team_b}`);
        }
        
        return matchData;
      });

      // Generar tabla de posiciones
      console.log(`📊 Generando tabla para ${disciplineName} con ${matchesData.length} partidos y ${allTeamIds.size} equipos totales`);
      
      // Si hay información de bombos, crear tablas separadas
      if (bomboMap && bomboMap.size > 0) {
        const bomboStandings: BomboStandings[] = [];
        
        // Ordenar bombos por número
        const sortedBombos = Array.from(bomboMap.keys()).sort((a, b) => a - b);
        
        sortedBombos.forEach(bomboNumber => {
          const bomboTeamIds = bomboMap.get(bomboNumber)!;
          const standings = generateStandings(
            sportId,
            sportName,
            matchesData,
            teamMap,
            rules,
            bomboTeamIds
          );
          
          bomboStandings.push({
            bomboNumber,
            bomboName: `Bombo ${bomboNumber}`,
            standings,
          });
        });
        
        console.log(`✅ ${bomboStandings.length} bombos generados con partidos finalizados`);
        return bomboStandings;
      }
      
      // Si no hay bombos, crear una sola tabla
      const standings = generateStandings(
        sportId,
        sportName,
        matchesData,
        teamMap,
        rules,
        allTeamIds
      );

      console.log(`✅ Tabla generada con ${standings.length} equipos:`, standings.map(s => `${s.teamName} (${s.points} pts)`));
      return [{
        bomboNumber: 1,
        bomboName: "Tabla General",
        standings,
      }];
    
    } catch (err: any) {
      setError(err.message || "Error al cargar tabla de posiciones");
      console.error("Error en loadStandings:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loadStandings,
    loading,
    error,
  };
};

