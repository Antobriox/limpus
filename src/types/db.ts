export type Team = {
  id: number;
  name: string;
};

export type Career = {
  id: number;
  name: string;
  team_id: number;
};

export type Player = {
  id: number;
  full_name: string;
  career_id: number;
  jersey_number?: number;
  is_captain: boolean;
};
