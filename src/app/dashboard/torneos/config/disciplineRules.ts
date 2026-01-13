// Configuración de reglas por disciplina
import { DisciplineRules } from "../types/standings";

export const DISCIPLINE_RULES: Record<string, DisciplineRules> = {
  futbol: {
    disciplineId: 1, // Ajustar según IDs reales en la BD
    disciplineName: "Fútbol",
    pointSystem: {
      // Sistema oficial FIFA: usado en todas las ligas profesionales
      win: 3, // Victoria: 3 puntos
      draw: 1, // Empate: 1 punto
      loss: 0, // Derrota: 0 puntos
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
      // Sistema estándar de básquet profesional (NBA, FIBA)
      // En básquet no hay empates, siempre hay un ganador
      win: 2, // Victoria: 2 puntos
      loss: 0, // Derrota: 0 puntos
      // Nota: Algunas ligas usan solo porcentaje de victorias, pero el sistema de puntos más común es 2-0
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
      // Sistema oficial FIVB: Partidos al mejor de 5 sets
      winBySets: {
        "3-0": 3, // Victoria 3-0: 3 puntos
        "3-1": 3, // Victoria 3-1: 3 puntos
        "3-2": 2, // Victoria 3-2: 2 puntos
      },
      lossBySets: {
        "2-3": 1, // Derrota 2-3: 1 punto (bonus por llegar al 5to set)
        "1-3": 0, // Derrota 1-3: 0 puntos
        "0-3": 0, // Derrota 0-3: 0 puntos
      },
      win: 3, // Valor por defecto para victorias no contempladas
      loss: 0, // Valor por defecto para derrotas no contempladas
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
      // Sistema estándar de pádel profesional (World Padel Tour, FIP)
      // Partidos al mejor de 3 sets, no hay empates
      win: 2, // Victoria: 2 puntos
      loss: 0, // Derrota: 0 puntos
      // Nota: En pádel los partidos se juegan al mejor de 3 sets
      // Una pareja gana un set al alcanzar 6 juegos con diferencia mínima de 2
    },
    tiebreakerOrder: [
      "points",
      "wins",
      "set_difference", // Diferencia de sets
    ],
    usesCards: false,
    usesSets: true, // Pádel usa sets (similar al tenis: juegos y sets)
    metricName: "sets", // Se mide por sets ganados
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

