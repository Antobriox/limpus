"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useTeamRegistrations, RegistrationForm } from "../hooks/useTeamRegistrations";

type Player = {
  id?: number;
  full_name: string;
  email: string;
  cedula: string;
  phone: string;
  career_id: number;
  semester: number;
  jersey_number: number;
  is_captain: boolean;
};

type RegistrationModalProps = {
  teamId: number;
  onClose: () => void;
};

export default function RegistrationModal({ teamId, onClose }: RegistrationModalProps) {
  const { forms, registrations, loadingForms, loadingRegistrations, createRegistration, isCreating } = useTeamRegistrations(teamId);
  const [selectedForm, setSelectedForm] = useState<RegistrationForm | null>(null);
  const [teamRegistrationId, setTeamRegistrationId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [careers, setCareers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      // Cargar jugadores existentes
      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("team_registration_id", existing.id)
        .order("full_name");

      if (playersData) {
        setPlayers(playersData.map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email || "",
          cedula: p.cedula || "",
          phone: p.phone || "",
          career_id: p.career_id,
          semester: p.semester || 1,
          jersey_number: p.jersey_number || null,
          is_captain: p.is_captain || false,
        })));
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
    } catch (error: any) {
      alert("Error al crear inscripción: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    if (!selectedForm) return;

    if (players.length >= selectedForm.max_players) {
      alert(`No puedes agregar más de ${selectedForm.max_players} jugadores`);
      return;
    }

    setPlayers([
      ...players,
      {
        full_name: "",
        email: "",
        cedula: "",
        phone: "",
        career_id: careers[0]?.id || 0,
        semester: 1,
        jersey_number: null,
        is_captain: false,
      },
    ]);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const updatePlayer = (index: number, field: keyof Player, value: any) => {
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

  const handleSavePlayers = async () => {
    if (!selectedForm || !teamRegistrationId) {
      alert("Primero debes crear la inscripción");
      return;
    }

    if (players.length < selectedForm.min_players) {
      alert(`Debes agregar al menos ${selectedForm.min_players} jugadores`);
      return;
    }

    if (players.length > selectedForm.max_players) {
      alert(`No puedes tener más de ${selectedForm.max_players} jugadores`);
      return;
    }

    // Validar que todos los campos requeridos estén llenos
    for (const player of players) {
      if (!player.full_name.trim()) {
        alert("Todos los jugadores deben tener un nombre");
        return;
      }
      if (!player.career_id) {
        alert("Todos los jugadores deben tener una carrera asignada");
        return;
      }
    }

    setSaving(true);

    try {
      // Eliminar jugadores existentes
      await supabase
        .from("players")
        .delete()
        .eq("team_registration_id", teamRegistrationId);

      // Insertar nuevos jugadores
      const playersToInsert = players.map((p) => ({
        full_name: p.full_name.trim(),
        email: p.email.trim() || null,
        cedula: p.cedula.trim() || null,
        phone: p.phone.trim() || null,
        career_id: p.career_id,
        semester: p.semester,
        jersey_number: p.jersey_number || null,
        is_captain: p.is_captain,
        team_registration_id: teamRegistrationId,
      }));

      const { error } = await supabase
        .from("players")
        .insert(playersToInsert);

      if (error) throw error;

      alert("Jugadores guardados exitosamente");
      onClose();
    } catch (error: any) {
      alert("Error al guardar jugadores: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inscripciones
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
                            value={player.email}
                            onChange={(e) => updatePlayer(index, "email", e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Cédula"
                            value={player.cedula}
                            onChange={(e) => updatePlayer(index, "cedula", e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Teléfono"
                            value={player.phone}
                            onChange={(e) => updatePlayer(index, "phone", e.target.value)}
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
                              value={player.semester}
                              onChange={(e) => updatePlayer(index, "semester", parseInt(e.target.value) || 1)}
                              min="1"
                              max="12"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          <input
                            type="number"
                            placeholder="Número de camiseta"
                            value={player.jersey_number || ""}
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
                        </div>
                      </div>
                    ))}
                  </div>

                  {players.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700">
                      <p className="text-gray-500 dark:text-gray-400">
                        No hay jugadores agregados. Haz clic en "Agregar Jugador" para comenzar.
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
