// Hook para manejar la lógica de brackets
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Team, Tournament } from "../types";
import { generateBracketsPDF } from "../utils/pdfGenerator";

export const useBrackets = (tournament: Tournament | null) => {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [bombos, setBombos] = useState<Team[][]>([]);
  const [generating, setGenerating] = useState(false);

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
      setBombos([]);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar los equipos");
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
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return {
    allTeams,
    bombos,
    generating,
    loadTeams,
    generateBombos,
    saveBrackets,
    setBombos,
  };
};

