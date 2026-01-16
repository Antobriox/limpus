// Hook para manejar la lógica de brackets
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Team, Tournament } from "../types";
import { generateBracketsPDF } from "../utils/pdfGenerator";
import { useQueryClient } from "@tanstack/react-query";

export const useBrackets = (tournament: Tournament | null, sportId: number | null) => {
  const queryClient = useQueryClient();
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<Set<number>>(new Set());
  const [bombos, setBombos] = useState<Team[][]>([]);
  const [generating, setGenerating] = useState(false);
  const [savedDrawId, setSavedDrawId] = useState<number | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const loadTeams = async () => {
    try {
      // Cargar TODOS los equipos disponibles (sin filtrar por inscripciones)
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

      if (teamsError) {
        console.error("Error cargando equipos:", teamsError);
        return;
      }

      setAllTeams(teams || []);
      // Limpiar selección al cargar nuevos equipos
      setSelectedTeams(new Set());
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const loadSavedBrackets = async () => {
    if (!tournament || tournament.id === 0 || !sportId) {
      setLoadingSaved(false);
      return;
    }

    setLoadingSaved(true);
    try {
      // Obtener el nombre de la disciplina para filtrar por nombre del draw
      const { data: sportData, error: sportError } = await supabase
        .from("sports")
        .select("name")
        .eq("id", sportId)
        .single();

      if (sportError) {
        console.error("Error cargando deporte:", sportError);
        setLoadingSaved(false);
        setBombos([]);
        setSavedDrawId(null);
        return;
      }

      const sportName = sportData?.name || "";
      
      // Buscar todos los draws para este torneo
      const { data: draws, error: drawsError } = await supabase
        .from("draws")
        .select("id, name, created_at")
        .eq("tournament_id", tournament.id)
        .order("created_at", { ascending: false });

      if (drawsError) {
        console.error("Error cargando draws:", drawsError);
        setLoadingSaved(false);
        setBombos([]);
        setSavedDrawId(null);
        return;
      }

      // Filtrar manualmente por el nombre exacto del deporte en el formato esperado
      // El formato es: "Brackets - [Torneo] - [Deporte]"
      const filteredDraws = draws?.filter(draw => {
        const drawName = draw.name?.toLowerCase() || "";
        const sportNameLower = sportName.toLowerCase();
        // Buscar el nombre del deporte en el nombre del draw
        const matches = drawName.includes(sportNameLower);
        if (matches) {
          console.log(`Bracket encontrado para ${sportName}:`, draw.name);
        }
        return matches;
      }) || [];

      if (filteredDraws.length === 0) {
        console.log(`No se encontraron brackets guardados para ${sportName}. Total de draws: ${draws?.length || 0}`);
        setLoadingSaved(false);
        setBombos([]);
        setSavedDrawId(null);
        return;
      }

      const latestDraw = filteredDraws[0];

      // Cargar los resultados del draw
      const { data: drawResults, error: resultsError } = await supabase
        .from("draw_results")
        .select("team_id, result_order")
        .eq("draw_id", latestDraw.id)
        .order("result_order", { ascending: true });

      if (resultsError) {
        console.error("Error cargando resultados:", resultsError);
        setLoadingSaved(false);
        setBombos([]);
        setSavedDrawId(null);
        return;
      }

      if (!drawResults || drawResults.length === 0) {
        setLoadingSaved(false);
        setBombos([]);
        setSavedDrawId(null);
        return;
      }

      // Obtener los IDs de los equipos
      const teamIds = drawResults.map((dr) => dr.team_id);
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .in("id", teamIds);

      if (teamsError || !teams) {
        console.error("Error cargando equipos:", teamsError);
        setLoadingSaved(false);
        setBombos([]);
        setSavedDrawId(null);
        return;
      }

      // Crear un mapa de equipos por ID
      const teamsMap = new Map(teams.map((t) => [t.id, t]));

      // Agrupar equipos por result_order (bombo)
      const bombosMap = new Map<number, Team[]>();
      drawResults.forEach((dr) => {
        const team = teamsMap.get(dr.team_id);
        if (team) {
          const bomboIndex = dr.result_order || 1;
          if (!bombosMap.has(bomboIndex)) {
            bombosMap.set(bomboIndex, []);
          }
          bombosMap.get(bomboIndex)!.push(team);
        }
      });

      // Convertir el mapa a un array de arrays
      const sortedBombos: Team[][] = [];
      const sortedOrders = Array.from(bombosMap.keys()).sort((a, b) => a - b);
      sortedOrders.forEach((order) => {
        sortedBombos.push(bombosMap.get(order)!);
      });

      setBombos(sortedBombos);
      setSavedDrawId(latestDraw.id);
    } catch (error) {
      console.error("Error:", error);
      setBombos([]);
      setSavedDrawId(null);
    } finally {
      setLoadingSaved(false);
    }
  };

  const generateBombos = () => {
    // Usar solo los equipos seleccionados
    const teamsToUse = allTeams.filter(team => selectedTeams.has(team.id));
    
    if (teamsToUse.length === 0) {
      return;
      return;
    }

    const equiposPorBombo = 4;
    const totalEquipos = teamsToUse.length;
    const numBombos = Math.ceil(totalEquipos / equiposPorBombo);

    const shuffled = [...teamsToUse].sort(() => Math.random() - 0.5);
    const newBombos: Team[][] = [];

    for (let i = 0; i < numBombos; i++) {
      const startIndex = i * equiposPorBombo;
      const endIndex = startIndex + equiposPorBombo;
      const bombo = shuffled.slice(startIndex, endIndex);

      if (bombo.length > 0) {
        newBombos.push(bombo);
      }
    }

    setBombos(newBombos);
  };

  const saveBrackets = async (onSuccess?: () => void) => {
    if (bombos.length === 0) {
      return;
    }

    if (!tournament || tournament.id === 0) {
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Obtener el nombre de la disciplina
      const { data: sportData } = await supabase
        .from("sports")
        .select("name")
        .eq("id", sportId)
        .single();

      const sportName = sportData?.name || "Disciplina";

      const { data: draw, error: drawError } = await supabase
        .from("draws")
        .insert({
          name: `Brackets - ${tournament.name} - ${sportName}`,
          tournament_id: tournament.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (drawError || !draw) {
        console.error("Error creando draw:", drawError);
        return;
      }

      const drawResults = [];
      for (let bomboIndex = 0; bomboIndex < bombos.length; bomboIndex++) {
        for (let teamIndex = 0; teamIndex < bombos[bomboIndex].length; teamIndex++) {
          drawResults.push({
            draw_id: draw.id,
            team_id: bombos[bomboIndex][teamIndex].id,
            result_order: bomboIndex + 1,
          });
        }
      }

      const { error: resultsError } = await supabase
        .from("draw_results")
        .insert(drawResults);

      if (resultsError) {
        console.error("Error guardando resultados:", resultsError);
        return;
      }

      // Generar PDF (opcional - si falla no afecta el guardado)
      try {
        const pdfBlob = await generateBracketsPDF(bombos, tournament.name);
        const fileName = `brackets_${tournament.id}_${Date.now()}.pdf`;
        const filePath = `torneos/${tournament.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, pdfBlob, {
            contentType: "application/pdf",
            upsert: false,
          });

        if (uploadError) {
          console.warn("No se pudo guardar el PDF (esto no afecta los brackets):", uploadError);
        } else {
          console.log("PDF guardado correctamente");
        }
      } catch (pdfError) {
        console.warn("Error generando PDF (esto no afecta los brackets):", pdfError);
      }

      // Invalidar queries relacionadas para actualizar las vistas
      queryClient.invalidateQueries({ queryKey: ["standings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      // Brackets generados y guardados correctamente
      setSavedDrawId(draw.id);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setGenerating(false);
    }
  };

  const deleteSavedBrackets = async () => {
    if (!savedDrawId) {
      // Si no hay brackets guardados, solo limpiar el estado local
      setBombos([]);
      return;
    }

    try {
      // Eliminar los resultados del draw
      const { error: resultsError } = await supabase
        .from("draw_results")
        .delete()
        .eq("draw_id", savedDrawId);

      if (resultsError) {
        console.error("Error eliminando resultados:", resultsError);
        return;
      }

      // Eliminar el draw
      const { error: drawError } = await supabase
        .from("draws")
        .delete()
        .eq("id", savedDrawId);

      if (drawError) {
        console.error("Error eliminando draw:", drawError);
        return;
      }

      // Limpiar el estado local
      setBombos([]);
      setSavedDrawId(null);
      
      // Invalidar queries relacionadas para actualizar las vistas
      queryClient.invalidateQueries({ queryKey: ["standings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
    } catch (error: any) {
      console.error("Error:", error);
    }
  };

  const toggleTeamSelection = (teamId: number) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const selectAllTeams = () => {
    setSelectedTeams(new Set(allTeams.map(team => team.id)));
  };

  const deselectAllTeams = () => {
    setSelectedTeams(new Set());
  };

  return {
    allTeams,
    selectedTeams,
    bombos,
    generating,
    savedDrawId,
    loadingSaved,
    loadTeams,
    loadSavedBrackets,
    generateBombos,
    saveBrackets,
    deleteSavedBrackets,
    setBombos,
    toggleTeamSelection,
    selectAllTeams,
    deselectAllTeams,
  };
};

