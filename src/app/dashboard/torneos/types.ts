// Tipos específicos del módulo de torneos

export type Tournament = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: string;
};

export type Team = {
  id: number;
  name: string;
  faculty?: string;
  captain?: string;
  status?: string;
  leaders?: string;
};

export type RecentResult = {
  id: number;
  sport: string;
  category: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  date: string;
  time: string;
};

export type Match = {
  id: number;
  team_a: number;
  team_b: number;
  scheduled_at: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  status: string | null;
  referee: string | null;
  assistant: string | null;
  teams?: { id: number; name: string };
  teams1?: { id: number; name: string };
  refereeName?: string | null;
  assistantName?: string | null;
  sportName?: string | null;
  field?: string | null;
};

export type Referee = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type ScheduleForm = {
  scheduled_at: string;
  referee: string;
  assistant: string;
  status: string;
  field?: string;
};

export type TournamentStats = {
  equiposInscritos: number;
  equiposNuevos: number;
  disciplinasActivas: number;
  partidosJugados: number;
  partidosTotales: number;
  progresoGeneral: number;
};

