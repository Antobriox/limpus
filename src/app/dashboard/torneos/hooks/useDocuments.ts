// Hook para manejar la lógica de documentos
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Tournament } from "../types";

export const useDocuments = (tournament: Tournament | null) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);

  const loadDocuments = async () => {
    if (!tournament || tournament.id === 0) return;

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .list(`torneos/${tournament.id}`, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        console.error("Error cargando documentos:", error);
        return;
      }

      if (data && data.length > 0) {
        const files = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = supabase.storage
              .from("documents")
              .getPublicUrl(`torneos/${tournament.id}/${file.name}`);

            return {
              name: file.name,
              url: urlData.publicUrl,
            };
          })
        );
        setUploadedFiles(files);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF");
      return false;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `torneos/${tournament?.id || "general"}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Error subiendo archivo:", error);
        alert(`Error al subir el archivo: ${error.message}`);
        return false;
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, url: urlData.publicUrl },
      ]);
      alert("PDF subido correctamente");
      return true;
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    uploadedFiles,
    loadDocuments,
    uploadFile,
  };
};

