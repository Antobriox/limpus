"use client";

import { useState, useEffect } from "react";

// Tipos para datos de Supabase
type SupabasePlayer = {
  id: number;
  full_name: string;
  email: string | null;
  cedula: string | null;
  phone: string | null;
  career_id: number;
  semester: number | null;
  jersey_number: number | null;
  is_captain: boolean;
  team_registration_id: number | null;
  cedula_photo_url?: string | null;
};
import { supabase } from "../../../../lib/supabaseClient";
import { X, Plus, Trash2, CheckCircle2, AlertCircle, Upload, Image as ImageIcon } from "lucide-react";
import { useTeamRegistrations, RegistrationForm } from "../hooks/useTeamRegistrations";

type Player = {
  id?: number;
  full_name: string;
  email: string | null;
  cedula: string | null;
  phone: string | null;
  career_id: number;
  semester: number | null;
  jersey_number: number | null;
  is_captain: boolean;
  cedula_photo_url?: string | null;
};

type RegistrationModalProps = {
  teamId: number;
  onClose: () => void;
};

export default function RegistrationModal({ teamId, onClose }: RegistrationModalProps) {
  const { forms, registrations, loadingForms, createRegistration, isCreating } = useTeamRegistrations(teamId);
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
  const [teamRegistrationId, setTeamRegistrationId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [careers, setCareers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState<{ [key: number]: boolean }>({});

  // Cargar carreras del equipo
  useEffect(() => {
    const loadCareers = async () => {
      const { data } = await supabase
        .from("careers")
        .select("id, name")
        .eq("team_id", teamId);

      if (data) {
        setCareers(data);
      }
    };

    if (teamId) {
      loadCareers();
    }
  }, [teamId]);

  // Verificar si ya existe una inscripción para este formulario
  const getExistingRegistration = (formId: number) => {
    return registrations.find((r) => r.form_id === formId);
  };

  const handleSelectForm = async (form: RegistrationForm) => {
    setSelectedForm(form);
    
    // Verificar si ya existe una inscripción
    const existing = getExistingRegistration(form.id);
    if (existing) {
      setTeamRegistrationId(existing.id);
      // Cargar jugadores existentes SOLO de esta inscripción específica
      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("team_registration_id", existing.id)
        .order("full_name");

      if (playersError) {
        console.error("Error cargando jugadores:", playersError);
      }

      if (playersData) {
        console.log(`Cargando jugadores para inscripción ID: ${existing.id}, Form ID: ${form.id}, Deporte: ${form.sport_name}, Género: ${form.genero}`);
        console.log(`Jugadores encontrados: ${playersData.length}`);
        
        // Filtrar solo los jugadores que pertenecen a esta inscripción específica
        const filteredPlayers = (playersData as SupabasePlayer[]).filter((p: SupabasePlayer) => p.team_registration_id === existing.id);
        
        setPlayers(filteredPlayers.map((p: SupabasePlayer) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          cedula: p.cedula,
          phone: p.phone,
          career_id: p.career_id,
          semester: p.semester,
          jersey_number: p.jersey_number,
          is_captain: p.is_captain || false,
          cedula_photo_url: p.cedula_photo_url || null,
        })));
      } else {
        setPlayers([]);
      }
    } else {
      setTeamRegistrationId(null);
      setPlayers([]);
    }
  };

  const handleCreateRegistration = async () => {
    if (!selectedForm) return;

    try {
      setLoading(true);
      const registrationId = await createRegistration({
        formId: selectedForm.id,
        teamId,
      });
      setTeamRegistrationId(registrationId.id);
    } catch {
      // alert eliminada"Error al crear inscripción: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    if (!selectedForm) return;

    if (players.length >= selectedForm.max_players) {
      // alert eliminada`No puedes agregar más de ${selectedForm.max_players} jugadores`);
      return;
    }

    setPlayers([
      ...players,
      {
        full_name: "",
        email: null,
        cedula: null,
        phone: null,
        career_id: careers[0]?.id || 0,
        semester: null,
        jersey_number: null,
        is_captain: false,
        cedula_photo_url: null,
      },
    ]);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: keyof Player, value: string | number | boolean | null) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    
    // Si se marca como capitán, desmarcar los demás
    if (field === "is_captain" && value === true) {
      updated.forEach((p, i) => {
        if (i !== index) p.is_captain = false;
      });
    }
    
    setPlayers(updated);
  };

  const handleUploadCedulaPhoto = async (playerIndex: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona un archivo de imagen válido");
      return;
    }

    const player = players[playerIndex];
    if (!player) return;

    setUploadingPhotos((prev) => ({ ...prev, [playerIndex]: true }));

    try {
      // Crear un nombre único para el archivo
      const fileExt = file.name.split(".").pop();
      const fileName = `cedula_${teamId}_${playerIndex}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `players/cedulas/${fileName}`;

      // Subir la imagen a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Error subiendo foto de cédula:", uploadError);
        alert("Error al subir la foto de cédula. Por favor, intenta nuevamente.");
        return;
      }

      // Obtener la URL pública de la imagen
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        console.log(`Foto de cédula subida para jugador ${playerIndex}:`, urlData.publicUrl);
        updatePlayer(playerIndex, "cedula_photo_url", urlData.publicUrl);
      } else {
        console.error("No se pudo obtener la URL pública de la imagen");
        alert("Error al obtener la URL de la imagen. Por favor, intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error al procesar la foto de cédula:", error);
      alert("Error al procesar la foto de cédula. Por favor, intenta nuevamente.");
    } finally {
      setUploadingPhotos((prev) => ({ ...prev, [playerIndex]: false }));
    }
  };

  const handleSavePlayers = async () => {
    if (!selectedForm || !teamRegistrationId) {
      // alert eliminada"Primero debes crear la inscripción");
      return;
    }

    if (players.length < selectedForm.min_players) {
      // alert eliminada`Debes agregar al menos ${selectedForm.min_players} jugadores`);
      return;
    }

    if (players.length > selectedForm.max_players) {
      // alert eliminada`No puedes tener más de ${selectedForm.max_players} jugadores`);
      return;
    }

    // Validar que todos los campos requeridos estén llenos
    for (const player of players) {
      if (!player.full_name.trim()) {
        // alert eliminada"Todos los jugadores deben tener un nombre");
        return;
      }
      if (!player.career_id) {
        // alert eliminada"Todos los jugadores deben tener una carrera asignada");
        return;
      }
    }

    setSaving(true);

    try {
      console.log(`Guardando jugadores para inscripción ID: ${teamRegistrationId}, Form ID: ${selectedForm.id}, Deporte: ${selectedForm.sport_name}, Género: ${selectedForm.genero}`);
      
      // Validar que teamRegistrationId existe y corresponde al formulario seleccionado
      if (!teamRegistrationId) {
        throw new Error("No se pudo obtener el ID de la inscripción");
      }

      // Verificar que la inscripción existe y corresponde al formulario
      const { data: registrationCheck } = await supabase
        .from("team_registrations")
        .select("id, form_id")
        .eq("id", teamRegistrationId)
        .eq("form_id", selectedForm.id)
        .single();

      if (!registrationCheck) {
        throw new Error("La inscripción no corresponde al formulario seleccionado");
      }

      // Obtener jugadores existentes de esta inscripción con todos sus datos
      const { data: existingPlayers } = await supabase
        .from("players")
        .select("*")
        .eq("team_registration_id", teamRegistrationId);

      const existingPlayerIds = new Set((existingPlayers || []).map((p) => p.id));
      const currentPlayerIds = new Set(players.filter((p) => p.id).map((p) => p.id!));

      // Separar jugadores en existentes (con ID) y nuevos (sin ID)
      const playersToUpdate: Array<Player & { id: number }> = [];
      const playersToInsert: Array<Omit<Player, "id">> = [];

      for (const player of players) {
        if (player.id && existingPlayerIds.has(player.id)) {
          // Verificar si realmente hay cambios antes de actualizar
          const existingPlayer = (existingPlayers || []).find((ep) => ep.id === player.id);
          if (existingPlayer) {
            const hasChanges = 
              existingPlayer.full_name !== player.full_name.trim() ||
              existingPlayer.email !== (player.email ? player.email.trim() : null) ||
              existingPlayer.cedula !== (player.cedula ? player.cedula.trim() : null) ||
              existingPlayer.phone !== (player.phone ? player.phone.trim() : null) ||
              existingPlayer.career_id !== player.career_id ||
              existingPlayer.semester !== player.semester ||
              existingPlayer.jersey_number !== player.jersey_number ||
              existingPlayer.is_captain !== player.is_captain ||
              existingPlayer.cedula_photo_url !== (player.cedula_photo_url || null);

            if (hasChanges) {
              // Solo agregar a actualizar si hay cambios reales
              playersToUpdate.push({
                ...player,
                id: player.id,
              });
            }
          }
        } else {
          // Jugador nuevo: insertar
          playersToInsert.push({
            full_name: player.full_name.trim(),
            email: player.email ? player.email.trim() : null,
            cedula: player.cedula ? player.cedula.trim() : null,
            phone: player.phone ? player.phone.trim() : null,
            career_id: player.career_id,
            semester: player.semester,
            jersey_number: player.jersey_number,
            is_captain: player.is_captain,
            cedula_photo_url: player.cedula_photo_url || null,
          });
        }
      }

      // Actualizar jugadores existentes solo si hay cambios
      for (const player of playersToUpdate) {
        const { error: updateError } = await supabase
          .from("players")
          .update({
            full_name: player.full_name.trim(),
            email: player.email ? player.email.trim() : null,
            cedula: player.cedula ? player.cedula.trim() : null,
            phone: player.phone ? player.phone.trim() : null,
            career_id: player.career_id,
            semester: player.semester,
            jersey_number: player.jersey_number,
            is_captain: player.is_captain,
            cedula_photo_url: player.cedula_photo_url || null,
            team_registration_id: teamRegistrationId,
          })
          .eq("id", player.id);

        if (updateError) {
          console.error(`Error actualizando jugador ${player.id}:`, updateError);
          throw new Error(`Error al actualizar jugador: ${updateError.message}`);
        }
      }

      // Insertar nuevos jugadores
      if (playersToInsert.length > 0) {
        const playersToInsertWithRegistration = playersToInsert.map((p) => ({
          ...p,
          team_registration_id: teamRegistrationId,
        }));

        const { error: insertError } = await supabase
          .from("players")
          .insert(playersToInsertWithRegistration);

        if (insertError) {
          console.error("Error insertando jugadores:", insertError);
          throw new Error(`Error al guardar jugadores: ${insertError.message}`);
        }
      }

      // Eliminar jugadores que ya no están en la lista
      // PERO solo si no tienen eventos de partidos asociados
      const playersToDelete = Array.from(existingPlayerIds).filter((id) => !currentPlayerIds.has(id));

      for (const playerId of playersToDelete) {
        // Verificar si el jugador tiene eventos asociados
        const { data: eventsData } = await supabase
          .from("match_events")
          .select("id")
          .eq("player_id", playerId)
          .limit(1);

        // Solo eliminar si no tiene eventos asociados
        if (!eventsData || eventsData.length === 0) {
          const { error: deleteError } = await supabase
            .from("players")
            .delete()
            .eq("id", playerId);

          if (deleteError) {
            console.warn(`No se pudo eliminar jugador ${playerId}:`, deleteError.message);
            // No lanzar error, solo registrar advertencia
          }
        } else {
          console.log(`Jugador ${playerId} no se eliminó porque tiene eventos de partidos asociados`);
        }
      }

      console.log(`Jugadores guardados: ${playersToUpdate.length} actualizados, ${playersToInsert.length} insertados`);
      // alert eliminada"Jugadores guardados exitosamente");
      onClose();
    } catch (error: unknown) {
      console.error("Error al guardar jugadores:", error);
      // alert eliminada"Error al guardar jugadores: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-2 sm:my-4 mx-2 sm:mx-0">
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white pr-2">
            Inscripciones
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {!selectedForm ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Formularios Disponibles
                </h3>
                {loadingForms ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : forms.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-neutral-900 rounded-lg p-8 text-center border border-gray-200 dark:border-neutral-700">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay formularios de inscripción disponibles
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {forms.map((form) => {
                      const existing = getExistingRegistration(form.id);
                      return (
                        <div
                          key={form.id}
                          onClick={() => handleSelectForm(form)}
                          className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {form.name}
                            </h4>
                            {existing && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {form.sport_name}
                          </p>
                          {form.genero && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                              {form.genero === "masculino" ? "Masculino" : form.genero === "femenino" ? "Femenino" : form.genero}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {form.min_players} - {form.max_players} jugadores
                          </p>
                          {existing && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                              {existing.players_count} jugadores inscritos
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedForm.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedForm.sport_name} - {selectedForm.min_players} a {selectedForm.max_players} jugadores
                  </p>
                </div>
                <button
                  onClick={() => setSelectedForm(null)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Volver
                </button>
              </div>

              {!teamRegistrationId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        Crea una inscripción para este formulario
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Podrás agregar jugadores después de crear la inscripción
                      </p>
                    </div>
                    <button
                      onClick={handleCreateRegistration}
                      disabled={loading || isCreating}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loading || isCreating ? "Creando..." : "Crear Inscripción"}
                    </button>
                  </div>
                </div>
              )}

              {teamRegistrationId && (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Jugadores ({players.length}/{selectedForm.max_players})
                    </h4>
                    <button
                      onClick={addPlayer}
                      disabled={players.length >= selectedForm.max_players}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Jugador
                    </button>
                  </div>

                  {players.length < selectedForm.min_players && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Mínimo {selectedForm.min_players} jugadores requeridos
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {players.map((player, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Jugador {index + 1}
                          </span>
                          <button
                            onClick={() => removePlayer(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nombre completo *"
                            value={player.full_name}
                            onChange={(e) => updatePlayer(index, "full_name", e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                            required
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={player.email ?? ""}
                            onChange={(e) => updatePlayer(index, "email", e.target.value || null)}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Cédula"
                            value={player.cedula ?? ""}
                            onChange={(e) => updatePlayer(index, "cedula", e.target.value || null)}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Teléfono"
                            value={player.phone ?? ""}
                            onChange={(e) => updatePlayer(index, "phone", e.target.value || null)}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                          />
                          <select
                            value={player.career_id}
                            onChange={(e) => updatePlayer(index, "career_id", parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                            required
                          >
                            {careers.map((career) => (
                              <option key={career.id} value={career.id}>
                                {career.name}
                              </option>
                            ))}
                          </select>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Semestre</label>
                            <input
                              type="number"
                              placeholder="Ej: 1, 2, 3..."
                              value={player.semester ?? ""}
                              onChange={(e) => updatePlayer(index, "semester", e.target.value ? parseInt(e.target.value) : null)}
                              min="1"
                              max="12"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          <input
                            type="number"
                            placeholder="Número de camiseta"
                            value={player.jersey_number ?? ""}
                            onChange={(e) => updatePlayer(index, "jersey_number", e.target.value ? parseInt(e.target.value) : null)}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                          />
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={player.is_captain}
                              onChange={(e) => updatePlayer(index, "is_captain", e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Capitán</span>
                          </label>
                          <div className="md:col-span-2">
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Foto de Cédula
                            </label>
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`cedula-photo-${index}`}
                                className={`flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg cursor-pointer transition ${
                                  uploadingPhotos[index]
                                    ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-neutral-700"
                                    : "bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700"
                                }`}
                              >
                                <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {uploadingPhotos[index]
                                    ? "Subiendo..."
                                    : player.cedula_photo_url
                                    ? "Cambiar foto"
                                    : "Subir foto"}
                                </span>
                              </label>
                              <input
                                type="file"
                                id={`cedula-photo-${index}`}
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleUploadCedulaPhoto(index, file);
                                  }
                                }}
                                disabled={uploadingPhotos[index]}
                              />
                              {player.cedula_photo_url && (
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <a
                                    href={player.cedula_photo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    Ver foto
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {players.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700">
                      <p className="text-gray-500 dark:text-gray-400">
                        No hay jugadores agregados. Haz clic en &quot;Agregar Jugador&quot; para comenzar.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePlayers}
                      disabled={saving || players.length < selectedForm.min_players}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Guardando..." : "Guardar Jugadores"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
