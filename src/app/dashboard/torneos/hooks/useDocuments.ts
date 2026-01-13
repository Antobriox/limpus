// Hook para manejar la lógica de documentos
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { Tournament } from "../types";

export const useDocuments = (tournament: Tournament | null) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; path: string }[]>([]);

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
        // No mostrar alerta si el bucket no existe, solo loguear
        if (!error.message?.includes("Bucket not found") && !error.message?.includes("not found")) {
          console.warn("No se pudieron cargar los documentos. Verifica que el bucket 'documents' exista en Supabase Storage.");
        }
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
              path: `torneos/${tournament.id}/${file.name}`,
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
        
        // Manejar error específico de bucket no encontrado
        if (error.message?.includes("Bucket not found") || error.message?.includes("not found")) {
          alert(
            "El bucket de almacenamiento 'documents' no existe.\n\n" +
            "Por favor, crea el bucket en Supabase:\n" +
            "1. Ve a tu proyecto en Supabase\n" +
            "2. Storage > Create bucket\n" +
            "3. Nombre: 'documents'\n" +
            "4. Public: Sí (para acceso público)\n" +
            "5. File size limit: 50MB (o el que prefieras)\n" +
            "6. Allowed MIME types: application/pdf\n\n" +
            "Después de crear el bucket, intenta subir el archivo nuevamente."
          );
        } else if (error.message?.includes("row-level security") || error.message?.includes("RLS")) {
          alert(
            "Error de permisos: Las políticas de seguridad (RLS) no están configuradas.\n\n" +
            "Por favor, ejecuta el SQL en Supabase:\n" +
            "1. Ve a SQL Editor en Supabase\n" +
            "2. Copia y pega el contenido del archivo 'configurar_politicas_storage.sql'\n" +
            "3. Ejecuta el SQL\n\n" +
            "O configura las políticas manualmente en Storage > Policies del bucket 'documents'."
          );
        } else {
          alert(`Error al subir el archivo: ${error.message}`);
        }
        return false;
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, url: urlData.publicUrl, path: filePath },
      ]);
      alert("PDF subido correctamente");
      await loadDocuments(); // Recargar lista
      return true;
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const updateFile = async (filePath: string, newFile: File) => {
    if (newFile.type !== "application/pdf") {
      alert("Solo se permiten archivos PDF");
      return false;
    }

    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from("documents")
        .update(filePath, newFile, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) {
        console.error("Error actualizando archivo:", error);
        alert(`Error al actualizar el archivo: ${error.message}`);
        return false;
      }

      alert("PDF actualizado correctamente");
      await loadDocuments(); // Recargar lista
      return true;
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (filePath: string, fileName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${fileName}"?`)) {
      return false;
    }

    try {
      const { error } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (error) {
        console.error("Error eliminando archivo:", error);
        alert(`Error al eliminar el archivo: ${error.message}`);
        return false;
      }

      alert("Archivo eliminado correctamente");
      await loadDocuments(); // Recargar lista
      return true;
    } catch (error: any) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      return false;
    }
  };

  return {
    uploading,
    uploadedFiles,
    loadDocuments,
    uploadFile,
    updateFile,
    deleteFile,
  };
};

