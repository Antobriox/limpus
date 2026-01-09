// Configuración de reglas por disciplina
import { DisciplineRules } from "../types/standings";

export const DISCIPLINE_RULES: Record<string, DisciplineRules> = {
  futbol: {
    disciplineId: 1, // Ajustar según IDs reales en la BD
    disciplineName: "Fútbol",
    pointSystem: {
      win: 3,
      draw: 1,
      loss: 0,
    },
    tiebreakerOrder: [
      "points",
      "goal_difference",
      "goals_for",
      "fair_play",
    ],
    usesCards: true,
    usesSets: false,
    metricName: "goles",
  },
  basket: {
    disciplineId: 2, // Ajustar según IDs reales en la BD
    disciplineName: "Básquet",
    pointSystem: {
      win: 2,
      loss: 1,
      // No hay empates
    },
    tiebreakerOrder: [
      "points",
      "point_difference",
      "points_for",
    ],
    usesCards: false,
    usesSets: false,
    metricName: "puntos",
  },
  voley: {
    disciplineId: 3, // Ajustar según IDs reales en la BD
    disciplineName: "Vóley",
    pointSystem: {
      winBySets: {
        "3-0": 3,
        "3-1": 3,
        "3-2": 2,
      },
      lossBySets: {
        "2-3": 1,
        "1-3": 0,
        "0-3": 0,
      },
      loss: 0,
    },
    tiebreakerOrder: [
      "points",
      "set_difference",
      "point_difference",
    ],
    usesCards: false,
    usesSets: true,
    metricName: "sets",
  },
  padel: {
    disciplineId: 4, // Ajustar según IDs reales en la BD
    disciplineName: "Pádel",
    pointSystem: {
      win: 2,
      loss: 0,
      // No hay empates
    },
    tiebreakerOrder: [
      "points",
      "wins",
    ],
    usesCards: false,
    usesSets: false,
    metricName: "puntos",
  },
};

// Función para obtener reglas por ID de deporte
export const getDisciplineRules = (sportId: number): DisciplineRules | null => {
  // Mapear IDs de deportes a las reglas
  // Esto debería venir de la base de datos, pero por ahora usamos un mapeo
  const sportIdMap: Record<number, string> = {
    1: "futbol",
    2: "basket",
    3: "voley",
    4: "padel",
  };

  const disciplineKey = sportIdMap[sportId];
  return disciplineKey ? DISCIPLINE_RULES[disciplineKey] || null : null;
};

// Función para obtener reglas por nombre de deporte
export const getDisciplineRulesByName = (sportName: string): DisciplineRules | null => {
  const normalizedName = sportName.toLowerCase().trim();
  
  // Mapeo de nombres comunes
  const nameMap: Record<string, string> = {
    "fútbol": "futbol",
    "futbol": "futbol",
    "football": "futbol",
    "básquet": "basket",
    "basket": "basket",
    "basketball": "basket",
    "vóley": "voley",
    "voley": "voley",
    "volleyball": "voley",
    "pádel": "padel",
    "padel": "padel",
  };

  const disciplineKey = nameMap[normalizedName] || normalizedName;
  return DISCIPLINE_RULES[disciplineKey] || null;
};

