// Tipos para el sistema de clasificación por disciplina

export type PointSystem = {
  win: number;
  draw?: number; // Opcional porque no todas las disciplinas tienen empates
  loss: number;
  // Para vóley: puntos especiales según sets
  winBySets?: {
    "3-0": number;
    "3-1": number;
    "3-2": number;
  };
  lossBySets?: {
    "2-3": number;
    "1-3": number;
    "0-3": number;
  };
};

export type TiebreakerCriteria = 
  | "points"
  | "goal_difference" // Fútbol: diferencia de goles
  | "goals_for" // Fútbol: goles a favor
  | "fair_play" // Fútbol: puntos de sanción (menor es mejor)
  | "point_difference" // Básquet/Vóley: diferencia de puntos
  | "points_for" // Básquet/Vóley: puntos a favor
  | "set_difference" // Vóley: diferencia de sets
  | "wins"; // Pádel: partidos ganados

export type DisciplineRules = {
  disciplineId: number;
  disciplineName: string;
  pointSystem: PointSystem;
  tiebreakerOrder: TiebreakerCriteria[];
  usesCards?: boolean; // Para Fair Play (Fútbol)
  usesSets?: boolean; // Para Vóley
  metricName: "goles" | "puntos" | "sets"; // Nombre de la métrica principal
};

export type TeamStanding = {
  teamId: number;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  // Métricas según disciplina
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  pointsFor: number; // Para básquet/vóley
  pointsAgainst: number;
  pointDifference: number;
  setsWon: number; // Para vóley
  setsLost: number;
  setDifference: number;
  fairPlayPoints: number; // Puntos de sanción (menor es mejor)
  position: number;
};

export type StandingsData = {
  disciplineId: number;
  disciplineName: string;
  standings: TeamStanding[];
  lastUpdated: string;
};

export type BomboStandings = {
  bomboNumber: number;
  bomboName: string;
  standings: TeamStanding[];
};

