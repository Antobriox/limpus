// Tipos de base de datos según el esquema oficial

export type Role = {
  id: number;
  name: string;
};

export type Profile = {
  id: string; // uuid
  full_name: string | null;
  email: string | null;
  created_at: string | null;
};

export type Team = {
  id: number;
  name: string;
  created_by: string | null; // uuid -> profiles.id
  created_at: string | null;
};

export type TeamLeader = {
  user_id: string; // uuid -> profiles.id (pk)
  team_id: number; // -> teams.id
};

export type Career = {
  id: number;
  name: string;
  team_id: number; // -> teams.id
};

export type Player = {
  id: number;
  full_name: string;
  email: string | null;
  cedula: string | null;
  phone: string | null;
  career_id: number; // -> careers.id
  semester: number | null;
  jersey_number: number | null;
  is_captain: boolean;
  created_at: string | null;
};

export type RegistrationForm = {
  id: number;
  name: string;
  sport_id: number; // -> sports.id
  min_players: number;
  max_players: number;
  editable_until: string | null; // timestamp
  is_locked: boolean;
  created_by: string | null; // uuid -> profiles.id
  created_at: string | null;
};

export type TeamRegistration = {
  id: number;
  form_id: number; // -> registration_forms.id
  team_id: number; // -> teams.id
  submitted_by: string | null; // uuid -> profiles.id
  submitted_at: string | null;
  approved: boolean | null;
};

export type Sport = {
  id: number;
  name: string;
};

export type Tournament = {
  id: number;
  name: string;
  sport_id: number; // -> sports.id
  start_date: string | null; // date
  end_date: string | null; // date
  created_by: string | null; // uuid -> profiles.id
};

export type Match = {
  id: number;
  tournament_id: number; // -> tournaments.id
  team_a: number; // -> teams.id
  team_b: number; // -> teams.id
  scheduled_at: string | null; // timestamp
  started_at: string | null; // timestamp
  ended_at: string | null; // timestamp
  status: string | null;
  referee: string | null; // uuid -> profiles.id
  assistant: string | null; // uuid -> profiles.id
};

export type MatchEvent = {
  id: number;
  match_id: number; // -> matches.id
  event_type: string;
  team_id: number | null; // -> teams.id
  player_id: number | null; // -> players.id
  value: number | null;
  created_by: string | null; // uuid -> profiles.id
  created_at: string | null;
};

export type MatchResult = {
  match_id: number; // -> matches.id (pk)
  score_team_a: number | null;
  score_team_b: number | null;
  winner_team: number | null; // -> teams.id
  confirmed_by: string | null; // uuid -> profiles.id
  confirmed_at: string | null;
};

export type PlayerStat = {
  player_id: number; // -> players.id (pk)
  tournament_id: number; // -> tournaments.id (pk)
  goals: number | null;
  fouls: number | null;
  assists: number | null;
  points: number | null;
};

export type Draw = {
  id: number;
  name: string;
  tournament_id: number; // -> tournaments.id
  created_by: string | null; // uuid -> profiles.id
  created_at: string | null;
};

export type DrawResult = {
  draw_id: number; // -> draws.id (pk)
  team_id: number; // -> teams.id (pk)
  result_order: number | null;
};
