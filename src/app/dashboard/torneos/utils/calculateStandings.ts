// Utilidad para calcular tablas de posiciones por disciplina
import { DisciplineRules, TeamStanding, TiebreakerCriteria } from "../types/standings";

export type MatchData = {
  id: number;
  team_a: number;
  team_b: number;
  score_team_a: number | null;
  score_team_b: number | null;
  winner_team: number | null;
  sets_team_a?: number | null; // Para vóley
  sets_team_b?: number | null; // Para vóley
  yellow_cards_team_a?: number;
  yellow_cards_team_b?: number;
  red_cards_team_a?: number;
  red_cards_team_b?: number;
};

export type TeamMap = Map<number, string>;

/**
 * Calcula los puntos de Fair Play para un equipo
 */
const calculateFairPlayPoints = (
  yellowCards: number,
  redCards: number
): number => {
  return yellowCards * 1 + redCards * 4;
};

/**
 * Calcula los puntos según el sistema de puntos de la disciplina
 */
const calculateMatchPoints = (
  rules: DisciplineRules,
  isWinner: boolean,
  isDraw: boolean,
  setsWon?: number,
  setsLost?: number
): number => {
  const { pointSystem } = rules;

  if (isDraw && pointSystem.draw !== undefined) {
    return pointSystem.draw;
  }

  if (isWinner) {
    // Para vóley, los puntos dependen de los sets
    if (rules.usesSets && setsWon !== undefined && setsLost !== undefined) {
      const setResult = `${setsWon}-${setsLost}`;
      if (pointSystem.winBySets) {
        return pointSystem.winBySets[setResult as keyof typeof pointSystem.winBySets] || 0;
      }
    }
    return pointSystem.win || 0;
  }

  // Derrota
  if (rules.usesSets && setsWon !== undefined && setsLost !== undefined) {
    const setResult = `${setsLost}-${setsWon}`;
    if (pointSystem.lossBySets) {
      return pointSystem.lossBySets[setResult as keyof typeof pointSystem.lossBySets] || 0;
    }
  }
  return pointSystem.loss || 0;
};

/**
 * Calcula las estadísticas de un equipo
 */
const calculateTeamStats = (
  teamId: number,
  matches: MatchData[],
  rules: DisciplineRules
): TeamStanding => {
  let played = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let points = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let setsWon = 0;
  let setsLost = 0;
  let yellowCards = 0;
  let redCards = 0;

  matches.forEach((match) => {
    const isTeamA = match.team_a === teamId;
    const isTeamB = match.team_b === teamId;

    if (!isTeamA && !isTeamB) return;
    if (match.score_team_a === null || match.score_team_b === null) return;

    played++;

    const scoreA = match.score_team_a;
    const scoreB = match.score_team_b;
    // Asegurar que los scores sean números
    const myScore = Number(isTeamA ? scoreA : scoreB) || 0;
    const opponentScore = Number(isTeamA ? scoreB : scoreA) || 0;

    // Para vóley, usar sets si están disponibles
    if (rules.usesSets && match.sets_team_a !== null && match.sets_team_b !== null) {
      const mySets = isTeamA ? match.sets_team_a : match.sets_team_b;
      const opponentSets = isTeamA ? match.sets_team_b : match.sets_team_a;

      setsWon += mySets || 0;
      setsLost += opponentSets || 0;

      if (mySets! > opponentSets!) {
        wins++;
        points += calculateMatchPoints(rules, true, false, mySets, opponentSets);
      } else {
        losses++;
        points += calculateMatchPoints(rules, false, false, mySets, opponentSets);
      }
    } else {
      // Fútbol, Básquet, Pádel
      if (myScore > opponentScore) {
        wins++;
        points += calculateMatchPoints(rules, true, false);
      } else if (myScore < opponentScore) {
        losses++;
        points += calculateMatchPoints(rules, false, false);
      } else {
        // Empate
        draws++;
        const drawPoints = calculateMatchPoints(rules, false, true);
        points += drawPoints;
        console.log(`⚽ Empate detectado para equipo ${teamId}: ${myScore}-${opponentScore}, puntos sumados: ${drawPoints}`);
      }
    }

    // Métricas
    goalsFor += myScore;
    goalsAgainst += opponentScore;
    pointsFor += myScore;
    pointsAgainst += opponentScore;

    // Fair Play (solo fútbol)
    if (rules.usesCards) {
      if (isTeamA) {
        yellowCards += match.yellow_cards_team_a || 0;
        redCards += match.red_cards_team_a || 0;
      } else {
        yellowCards += match.yellow_cards_team_b || 0;
        redCards += match.red_cards_team_b || 0;
      }
    }
  });

  const goalDifference = goalsFor - goalsAgainst;
  const pointDifference = pointsFor - pointsAgainst;
  const setDifference = setsWon - setsLost;
  const fairPlayPoints = calculateFairPlayPoints(yellowCards, redCards);

  return {
    teamId,
    teamName: "", // Se llenará después
    played,
    wins,
    draws,
    losses,
    points,
    goalsFor,
    goalsAgainst,
    goalDifference,
    pointsFor,
    pointsAgainst,
    pointDifference,
    setsWon,
    setsLost,
    setDifference,
    fairPlayPoints,
    position: 0, // Se calculará después
  };
};

/**
 * Compara dos equipos según los criterios de desempate
 */
const compareTeams = (
  a: TeamStanding,
  b: TeamStanding,
  tiebreakerOrder: TiebreakerCriteria[]
): number => {
  for (const criterion of tiebreakerOrder) {
    let comparison = 0;

    switch (criterion) {
      case "points":
        comparison = b.points - a.points; // Mayor es mejor
        break;
      case "goal_difference":
        comparison = b.goalDifference - a.goalDifference;
        break;
      case "goals_for":
        comparison = b.goalsFor - a.goalsFor;
        break;
      case "fair_play":
        comparison = a.fairPlayPoints - b.fairPlayPoints; // Menor es mejor
        break;
      case "point_difference":
        comparison = b.pointDifference - a.pointDifference;
        break;
      case "points_for":
        comparison = b.pointsFor - a.pointsFor;
        break;
      case "set_difference":
        comparison = b.setDifference - a.setDifference;
        break;
      case "wins":
        comparison = b.wins - a.wins;
        break;
    }

    if (comparison !== 0) {
      return comparison;
    }
  }

  return 0; // Empate total
};

/**
 * Genera la tabla de posiciones para una disciplina
 */
export const generateStandings = (
  disciplineId: number,
  disciplineName: string,
  matches: MatchData[],
  teamMap: TeamMap,
  rules: DisciplineRules,
  allTeamIds?: Set<number> // Equipos que deben aparecer incluso sin partidos
): TeamStanding[] => {
  // Obtener todos los equipos únicos de los partidos
  const teamIdsFromMatches = new Set<number>();
  matches.forEach((match) => {
    if (match.score_team_a !== null && match.score_team_b !== null) {
      teamIdsFromMatches.add(match.team_a);
      teamIdsFromMatches.add(match.team_b);
    }
  });

  // Usar allTeamIds si se proporciona, sino usar solo los de los partidos
  const finalTeamIds = allTeamIds && allTeamIds.size > 0 
    ? allTeamIds 
    : teamIdsFromMatches;

  // Calcular estadísticas para cada equipo
  const standings: TeamStanding[] = Array.from(finalTeamIds).map((teamId) => {
    const stats = calculateTeamStats(teamId, matches, rules);
    stats.teamName = teamMap.get(teamId) || `Equipo ${teamId}`;
    return stats;
  });

  // Ordenar según criterios de desempate
  standings.sort((a, b) => compareTeams(a, b, rules.tiebreakerOrder));

  // Asignar posiciones
  standings.forEach((standing, index) => {
    standing.position = index + 1;
  });

  return standings;
};

