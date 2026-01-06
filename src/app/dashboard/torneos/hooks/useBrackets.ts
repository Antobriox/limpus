// Hook para manejar la lógica de brackets
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Team, Tournament } from "../types";
import { generateBracketsPDF } from "../utils/pdfGenerator";

export const useBrackets = (tournament: Tournament | null) => {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [bombos, setBombos] = useState<Team[][]>([]);
  const [generating, setGenerating] = useState(false);
  const [savedDrawId, setSavedDrawId] = useState<number | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const loadTeams = async () => {
    try {
      const { data: teams, error } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error cargando equipos:", error);
        alert("Error al cargar los equipos");
        return;
      }

      setAllTeams(teams || []);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar los equipos");
    }
  };

  const loadSavedBrackets = async () => {
    if (!tournament || tournament.id === 0) {
      return;
    }

    setLoadingSaved(true);
    try {
      // Buscar el draw más reciente para este torneo
      const { data: draws, error: drawsError } = await supabase
        .from("draws")
        .select("id, name, created_at")
        .eq("tournament_id", tournament.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (drawsError) {
        console.error("Error cargando draws:", drawsError);
        setLoadingSaved(false);
        return;
      }

      if (!draws || draws.length === 0) {
        setLoadingSaved(false);
        return;
      }

      const latestDraw = draws[0];
      setSavedDrawId(latestDraw.id);

      // Cargar los resultados del draw
      const { data: drawResults, error: resultsError } = await supabase
        .from("draw_results")
        .select("team_id, result_order")
        .eq("draw_id", latestDraw.id)
        .order("result_order", { ascending: true });

      if (resultsError) {
        console.error("Error cargando resultados:", resultsError);
        setLoadingSaved(false);
        return;
      }

      if (!drawResults || drawResults.length === 0) {
        setLoadingSaved(false);
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
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const generateBombos = () => {
    if (allTeams.length === 0) {
      alert("No hay equipos disponibles");
      return;
    }

    const equiposPorBombo = 4;
    const totalEquipos = allTeams.length;
    const numBombos = Math.ceil(totalEquipos / equiposPorBombo);

    const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
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
      alert("Primero debes generar los brackets");
      return;
    }

    if (!tournament || tournament.id === 0) {
      alert("No hay un torneo activo");
      return;
    }

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Debes estar autenticado para generar brackets");
        return;
      }

      const { data: draw, error: drawError } = await supabase
        .from("draws")
        .insert({
          name: `Brackets - ${tournament.name}`,
          tournament_id: tournament.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (drawError || !draw) {
        console.error("Error creando draw:", drawError);
        alert("Error al crear el sorteo");
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
        alert("Error al guardar los resultados del sorteo");
        return;
      }

      // Generar PDF
      try {
        const pdfBlob = await generateBracketsPDF(bombos, tournament.name);
        const fileName = `brackets_${tournament.id}_${Date.now()}.pdf`;
        const filePath = `torneos/${tournament.id}/${fileName}`;

        await supabase.storage
          .from("documents")
          .upload(filePath, pdfBlob, {
            contentType: "application/pdf",
            upsert: false,
          });
      } catch (pdfError) {
        console.error("Error generando PDF:", pdfError);
      }

      alert("Brackets generados y guardados correctamente");
      setSavedDrawId(draw.id);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
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
        alert("Error al eliminar los resultados");
        return;
      }

      // Eliminar el draw
      const { error: drawError } = await supabase
        .from("draws")
        .delete()
        .eq("id", savedDrawId);

      if (drawError) {
        console.error("Error eliminando draw:", drawError);
        alert("Error al eliminar el sorteo");
        return;
      }

      // Limpiar el estado local
      setBombos([]);
      setSavedDrawId(null);
      alert("Brackets eliminados correctamente");
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return {
    allTeams,
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
  };
};

