// Utilidades para generar PDFs
import jsPDF from "jspdf";
import { Team } from "../types";

/**
 * Genera un PDF con las fases de grupo (brackets)
 */
export const generateBracketsPDF = async (
  bombosData: Team[][],
  tournamentName: string
): Promise<Blob> => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text("Fases de Grupo - Brackets", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Torneo: ${tournamentName || "Sin nombre"}`, 105, 30, { align: "center" });
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 105, 37, { align: "center" });

  let yPos = 50;
  const pageHeight = doc.internal.pageSize.height;
  const bomboHeight = 40;

  bombosData.forEach((bombo, bomboIndex) => {
    // Verificar si necesitamos una nueva página
    if (yPos + bomboHeight > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
    }

    // Título del bombo
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Bombo ${bomboIndex + 1}`, 20, yPos);

    // Equipos del bombo
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    bombo.forEach((team, teamIndex) => {
      doc.text(`${teamIndex + 1}. ${team.name}`, 30, yPos + 10 + (teamIndex * 7));
    });

    yPos += bomboHeight;
  });

  // Convertir a blob
  const pdfBlob = doc.output("blob");
  return pdfBlob;
};

