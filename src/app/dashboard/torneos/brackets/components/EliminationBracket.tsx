"use client";

import { Team } from "../../types";
import { Trophy } from "lucide-react";

type EliminationBracketProps = {
  teams: Team[];
  savedDrawId: number | null;
};

type BracketMatch = {
  id: string;
  teamA: Team | null;
  teamB: Team | null;
};

type BracketRound = {
  matches: BracketMatch[];
};

export default function EliminationBracket({ teams }: EliminationBracketProps) {
  // Calcular el número de rondas necesarias
  const calculateRounds = (numTeams: number): number => {
    if (numTeams <= 1) return 0;
    return Math.ceil(Math.log2(numTeams));
  };

  const numRounds = calculateRounds(teams.length);
  
  // Crear la estructura del bracket
  const createBracket = (teams: Team[]): BracketRound[] => {
    const rounds: BracketRound[] = [];
    
    // Primera ronda: todos los equipos
    const firstRound: BracketRound = {
      matches: [],
    };
    
    // Distribuir equipos en partidos
    for (let i = 0; i < teams.length; i += 2) {
      firstRound.matches.push({
        id: `match-${i / 2}`,
        teamA: teams[i] || null,
        teamB: teams[i + 1] || null,
      });
    }
    
    rounds.push(firstRound);
    
    // Generar rondas siguientes
    let currentRoundTeams = Math.ceil(teams.length / 2);
    for (let round = 1; round < numRounds; round++) {
      const roundMatches: BracketRound = {
        matches: [],
      };
      
      const numMatches = Math.ceil(currentRoundTeams / 2);
      for (let i = 0; i < numMatches; i++) {
        roundMatches.matches.push({
          id: `round-${round}-match-${i}`,
          teamA: null,
          teamB: null,
        });
      }
      
      rounds.push(roundMatches);
      currentRoundTeams = numMatches;
    }
    
    return rounds;
  };

  const bracketRounds = createBracket(teams);

  // Calcular la altura necesaria para cada ronda
  const getRoundHeight = (roundIndex: number): number => {
    const baseHeight = 100; // altura base por match (2 equipos)
    const gap = 0; // sin gap entre matches (pegados)
    const matchesInRound = bracketRounds[roundIndex].matches.length;
    return matchesInRound * baseHeight + (matchesInRound - 1) * gap;
  };

  // Calcular la posición vertical de cada match para las líneas conectivas
  const getMatchTop = (roundIndex: number, matchIndex: number): number => {
    const baseHeight = 100;
    const gap = 0;
    return matchIndex * (baseHeight + gap);
  };

  return (
    <div className="w-full overflow-x-auto pb-8 bg-white dark:bg-neutral-900">
      {/* Título del bracket */}
      <div className="mb-6 px-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Bracket de Eliminación Directa
        </h2>
      </div>

      <div className="flex items-start gap-12 min-w-max px-8 py-4">
        {bracketRounds.map((round, roundIndex) => {
          const roundHeight = getRoundHeight(roundIndex);
          
          return (
            <div
              key={roundIndex}
              className="flex flex-col justify-start relative"
              style={{ minHeight: `${roundHeight}px` }}
            >
              {/* Título de la ronda */}
              <div className="text-center mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {roundIndex === bracketRounds.length - 1
                    ? "Final"
                    : roundIndex === bracketRounds.length - 2
                    ? "Semifinales"
                    : roundIndex === bracketRounds.length - 3
                    ? "Cuartos de Final"
                    : `Ronda ${roundIndex + 1}`}
                </h3>
              </div>

              {/* Partidos de la ronda */}
              <div className="flex flex-col gap-0 relative">
                {round.matches.map((match, matchIndex) => {
                  const matchHeight = 100;
                  
                  // Calcular posiciones de los matches anteriores que conectan
                  let prevMatch1Center = 0;
                  let prevMatch2Center = 0;
                  if (roundIndex > 0) {
                    const prevRound = bracketRounds[roundIndex - 1];
                    const prevMatchIndex1 = matchIndex * 2;
                    const prevMatchIndex2 = matchIndex * 2 + 1;
                    prevMatch1Center = getMatchTop(roundIndex - 1, prevMatchIndex1) + matchHeight / 2;
                    if (prevMatchIndex2 < prevRound.matches.length) {
                      prevMatch2Center = getMatchTop(roundIndex - 1, prevMatchIndex2) + matchHeight / 2;
                    } else {
                      prevMatch2Center = prevMatch1Center;
                    }
                  }

                  return (
                    <div
                      key={match.id}
                      className="relative"
                      style={{ marginTop: matchIndex === 0 ? 0 : undefined }}
                    >
                      {/* Líneas conectivas desde la ronda anterior */}
                      {roundIndex > 0 && (
                        <>
                          {/* Línea horizontal desde la izquierda hacia el match */}
                          <div
                            className="absolute -left-12 top-1/2 w-12 h-0.5 bg-gray-400 dark:bg-neutral-600"
                            style={{ transform: "translateY(-50%)" }}
                          />
                          
                          {/* Línea vertical que conecta los dos matches anteriores */}
                          {roundIndex > 0 && bracketRounds[roundIndex - 1] && (
                            <div
                              className="absolute -left-12 w-0.5 bg-gray-400 dark:bg-neutral-600"
                              style={{
                                top: `${prevMatch1Center}px`,
                                height: `${Math.max(prevMatch2Center - prevMatch1Center, 100)}px`,
                              }}
                            />
                          )}
                        </>
                      )}

                      {/* Caja del partido */}
                      <div className="relative bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded min-w-[200px] overflow-hidden">
                        <div className="p-0">
                          {/* Equipo A */}
                          <div
                            className={`py-3 px-4 ${
                              match.teamA
                                ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white border-b border-gray-300 dark:border-neutral-700"
                                : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-neutral-700"
                            }`}
                          >
                            <p className="text-sm font-medium">
                              {match.teamA?.name || "Por definir"}
                            </p>
                          </div>

                          {/* Equipo B */}
                          <div
                            className={`py-3 px-4 ${
                              match.teamB
                                ? "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white"
                                : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            <p className="text-sm font-medium">
                              {match.teamB?.name || "Por definir"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Línea conectiva hacia la siguiente ronda (excepto en la última) */}
                      {roundIndex < bracketRounds.length - 1 && (
                        <div
                          className="absolute -right-12 top-1/2 w-12 h-0.5 bg-gray-400 dark:bg-neutral-600"
                          style={{ transform: "translateY(-50%)" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Trofeo en la final */}
        {bracketRounds.length > 0 && (
          <div className="flex flex-col items-center justify-center ml-12">
            <div className="bg-yellow-500 dark:bg-yellow-600 rounded-full p-4 shadow-lg">
              <Trophy className="w-10 h-10 text-yellow-900 dark:text-yellow-100" fill="currentColor" />
            </div>
            <p className="mt-2 text-sm font-bold text-gray-900 dark:text-white uppercase">
              Campeón
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
