import React, { useState, useRef } from "react";
import {
  Calendar,
  Clock,
  Building2,
  RefreshCw,
  PlusCircle,
  UploadCloud,
  Sparkles,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Check,
  Stethoscope,
  X,
  FileText,
  Send,
  Loader2,
  Wrench,
  Info,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Schedule, MaintenanceTicket, User, AIDiagnosis, TicketPriority } from "../types";
import { SAMPLE_EQUIPMENT_PRESETS } from "../mockData";

interface DentistViewProps {
  currentDentist: User;
  schedules: Schedule[];
  colleagues: User[];
  myTickets: MaintenanceTicket[];
  onRequestTrade: (scheduleId: string, substitutoId: string, motivo: string) => void;
  onCreateTicket: (newTicket: {
    equipamento: string;
    descricao: string;
    nivelPrioridade: TicketPriority;
    fotoUrl?: string;
    diagnosticoIA?: AIDiagnosis;
  }) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onUpdateTicket?: (ticket: MaintenanceTicket) => void;
}

export const DentistView: React.FC<DentistViewProps> = ({
  currentDentist,
  schedules,
  colleagues,
  myTickets,
  onRequestTrade,
  onCreateTicket,
  onDeleteTicket,
  onUpdateTicket,
}) => {
  // Trade Modal state
  const [selectedScheduleForTrade, setSelectedScheduleForTrade] = useState<Schedule | null>(null);
  const [substituteId, setSubstituteId] = useState<string>("");
  const [tradeReason, setTradeReason] = useState<string>("");

  // New/Edit Ticket Form state
  const [isOpeningTicketModal, setIsOpeningTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<MaintenanceTicket | null>(null);

  const [equipamentoInput, setEquipamentoInput] = useState("");
  const [descricaoInput, setDescricaoInput] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<AIDiagnosis | null>(null);
  const [priorityOverride, setPriorityOverride] = useState<TicketPriority>("Média");
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartNewTicket = () => {
    setEditingTicket(null);
    setEquipamentoInput("");
    setDescricaoInput("");
    setPhotoPreview(null);
    setAiDiagnosis(null);
    setPriorityOverride("Média");
    setAiError(null);
    setIsOpeningTicketModal(true);
  };

  const handleStartEditTicket = (t: MaintenanceTicket) => {
    setEditingTicket(t);
    setEquipamentoInput(t.equipamento);
    setDescricaoInput(t.descricao);
    setPhotoPreview(t.fotoUrl || null);
    setAiDiagnosis(t.diagnosticoIA || null);
    setPriorityOverride(t.nivelPrioridade);
    setAiError(null);
    setIsOpeningTicketModal(true);
  };

  // Shifts of current dentist
  const dentistSchedules = schedules.filter((s) => s.userId === currentDentist.id);

  // Available colleague dentists for substitution (exclude self and non-dentists)
  const availableSubstitutes = colleagues.filter(
    (c) => c.id !== currentDentist.id && (c.cargo === "Dentista" || c.cargo === "ASB")
  );

  // Handle Photo Selection via File
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setAiDiagnosis(null);
        setAiError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load a quick test preset
  const handleApplyPreset = (preset: (typeof SAMPLE_EQUIPMENT_PRESETS)[0]) => {
    setEquipamentoInput(preset.nome);
    setDescricaoInput(preset.descricao);
    setPhotoPreview(preset.fotoUrl);
    setAiDiagnosis(null);
    setAiError(null);
  };

  // Trigger Gemini AI Triage via Server API (/api/triage)
  const handleRunAITriage = async () => {
    if (!descricaoInput.trim() && !equipamentoInput.trim()) {
      setAiError("Informe o nome do equipamento ou a descrição do defeito antes de rodar a IA.");
      return;
    }

    setIsAnalyzingAI(true);
    setAiError(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipamento: equipamentoInput,
          descricao: descricaoInput,
          photoBase64: photoPreview,
          mimeType: photoPreview?.startsWith("data:image/png") ? "image/png" : "image/jpeg",
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Falha na triagem da IA");
      }

      const result = await res.json();
      if (result.success && result.data) {
        setAiDiagnosis(result.data);
        setPriorityOverride(result.data.nivelUrgencia);
        if (result.data.equipamentoIdentificado && !equipamentoInput) {
          setEquipamentoInput(result.data.equipamentoIdentificado);
        }
      }
    } catch (err: any) {
      console.error("Erro na triagem:", err);
      setAiError(err.message || "Não foi possível conectar à IA do Gemini.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Handle Form Submission
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipamentoInput.trim() || !descricaoInput.trim()) {
      alert("Por favor, preencha o equipamento e a descrição do problema.");
      return;
    }

    if (editingTicket && onUpdateTicket) {
      onUpdateTicket({
        ...editingTicket,
        equipamento: aiDiagnosis?.equipamentoIdentificado || equipamentoInput,
        descricao: descricaoInput,
        nivelPrioridade: priorityOverride,
        fotoUrl: photoPreview || undefined,
        diagnosticoIA: aiDiagnosis || undefined,
      });
    } else {
      onCreateTicket({
        equipamento: aiDiagnosis?.equipamentoIdentificado || equipamentoInput,
        descricao: descricaoInput,
        nivelPrioridade: priorityOverride,
        fotoUrl: photoPreview || undefined,
        diagnosticoIA: aiDiagnosis || undefined,
      });
    }

    // Reset Form
    setIsOpeningTicketModal(false);
    setEditingTicket(null);
    setEquipamentoInput("");
    setDescricaoInput("");
    setPhotoPreview(null);
    setAiDiagnosis(null);
    setAiError(null);
  };

  // Submit Trade Request
  const handleConfirmTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleForTrade || !substituteId) {
      alert("Selecione o profissional substituto.");
      return;
    }

    onRequestTrade(selectedScheduleForTrade.id, substituteId, tradeReason);
    setSelectedScheduleForTrade(null);
    setSubstituteId("");
    setTradeReason("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Stethoscope className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Área Clínica do Cirurgião-Dentista
              </h1>
              <p className="text-xs text-slate-500">
                Logado como <strong>{currentDentist.nome}</strong> ({currentDentist.croOuRegistro}) • {currentDentist.ubsNome}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Open Maintenance Ticket */}
        <div className="flex items-center gap-3">
          <button
            id="btn-open-ticket-modal"
            onClick={handleStartNewTicket}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Abrir Chamado de Manutenção</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Calendário com os Turnos do Profissional */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Minha Agenda de Plantões na Semana
            </h2>
          </div>
          <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            {dentistSchedules.length} turnos alocados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dentistSchedules.length === 0 ? (
            <div className="col-span-full p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              Você não possui escalas programadas nesta semana.
            </div>
          ) : (
            dentistSchedules.map((sched) => {
              const isPending = sched.status === "pendente_troca";
              return (
                <div
                  key={sched.id}
                  id={`dentist-schedule-${sched.id}`}
                  className={`bg-white rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                    isPending
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200 hover:border-sky-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-900">
                        {new Date(sched.data + "T12:00:00Z").toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          sched.turno === "Manhã"
                            ? "bg-sky-100 text-sky-800"
                            : sched.turno === "Tarde"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {sched.turno} ({sched.horario})
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs">
                      <p className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {sched.ubsNome}
                      </p>
                      <p className="text-slate-500 pl-5">{sched.consultorio}</p>

                      {isPending ? (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-[11px] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>Permuta solicitada. Aguardando validação da coordenação.</span>
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-800 text-[11px] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Turno confirmado na escala municipal.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trade Button */}
                  <div className="pt-4 mt-3 border-t border-slate-100">
                    <button
                      id={`btn-request-trade-${sched.id}`}
                      disabled={isPending}
                      onClick={() => {
                        setSelectedScheduleForTrade(sched);
                        setSubstituteId(availableSubstitutes[0]?.id || "");
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isPending
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {isPending ? "Troca em Andamento" : "Solicitar Troca"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION 2: Meus Chamados de Manutenção Abertos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Chamados Abertos por Mim / Minha UBS
            </h2>
          </div>
          <span className="text-xs text-slate-500">{myTickets.length} chamados registrados</span>
        </div>

        {myTickets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Nenhum chamado de manutenção aberto para o seu usuário. Caso algum equipamento apresente defeito, clique em "Abrir Chamado de Manutenção" acima.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTickets.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        t.nivelPrioridade === "Alta"
                          ? "bg-rose-100 text-rose-700"
                          : t.nivelPrioridade === "Média"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      Prioridade {t.nivelPrioridade}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 capitalize">
                      {t.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">{t.equipamento}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 italic">"{t.descricao}"</p>

                  {t.diagnosticoIA && (
                    <div className="mt-2.5 p-2 rounded-lg bg-sky-50 text-sky-900 text-[11px] border border-sky-100 space-y-0.5">
                      <p className="font-semibold">Orientação Técnica IA:</p>
                      <p className="text-slate-600">{t.diagnosticoIA.sugestaoDiagnostico}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <div>
                    <span>{new Date(t.criadoEm).toLocaleDateString("pt-BR")}</span>
                    <span className="block text-[10px] text-slate-500">
                      {t.tecnicoNome ? `Técnico: ${t.tecnicoNome}` : "Aguardando técnico"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleStartEditTicket(t)}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar chamado"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteTicket && (
                      <button
                        onClick={() => setTicketToDelete(t)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir chamado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* MODAL 1: Solicitar Troca de Escala (FCM Trigger: onTradeRequested)        */}
      {/* ========================================================================= */}
      {selectedScheduleForTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">Solicitar Permuta de Escala</h3>
              </div>
              <button
                onClick={() => setSelectedScheduleForTrade(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmTrade} className="mt-4 space-y-4 text-xs">
              {/* Turno Details */}
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1">
                <p className="font-semibold text-sky-950 text-xs">Turno Selecionado:</p>
                <p className="text-slate-700">
                  Data:{" "}
                  <strong>
                    {new Date(selectedScheduleForTrade.data + "T12:00:00Z").toLocaleDateString(
                      "pt-BR",
                      { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }
                    )}
                  </strong>{" "}
                  • Turno: <strong>{selectedScheduleForTrade.turno} ({selectedScheduleForTrade.horario})</strong>
                </p>
                <p className="text-slate-600">Local: {selectedScheduleForTrade.ubsNome}</p>
              </div>

              {/* Colleague Substitute Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Selecione o Colega Cirurgião-Dentista Substituto:
                </label>
                <select
                  required
                  value={substituteId}
                  onChange={(e) => setSubstituteId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Selecione um colega disponível --</option>
                  {availableSubstitutes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.croOuRegistro || c.cargo}) - Lotação: {c.ubsNome}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  ℹ️ Ao confirmar, o substituto receberá instantaneamente um push FCM no dispositivo dele.
                </p>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo da Solicitação:
                </label>
                <textarea
                  rows={3}
                  required
                  value={tradeReason}
                  onChange={(e) => setTradeReason(e.target.value)}
                  placeholder="Ex: Comparecimento a curso de especialização / Imprevisto de saúde..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedScheduleForTrade(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar Solicitação via FCM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Formulário Simples com Foto & Triagem IA (Gemini 3.8 Flash)      */}
      {/* ========================================================================= */}
      {isOpeningTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTicket ? `Editar Chamado #${editingTicket.id.slice(-4)}` : "Abertura de Chamado de Manutenção Odontológica"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsOpeningTicketModal(false);
                  setEditingTicket(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Presets Quick Picker */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Carregar Exemplo Rápido para Testar a Triagem IA:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_EQUIPMENT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitTicket} className="mt-4 space-y-4 text-xs">
              {/* Equipment Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Equipamento Quebrado ou com Falha:
                </label>
                <input
                  type="text"
                  required
                  value={equipamentoInput}
                  onChange={(e) => setEquipamentoInput(e.target.value)}
                  placeholder="Ex: Autoclave Cristófoli, Cadeira Odontológica, Sugador..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Problem Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descrição do Problema / Sintomas:
                </label>
                <textarea
                  rows={3}
                  required
                  value={descricaoInput}
                  onChange={(e) => setDescricaoInput(e.target.value)}
                  placeholder="Descreva o que aconteceu: vazamento de água/ar, barulho anormal, erro no painel, fumaça..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto do Equipamento Quebrado:
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 w-full border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-sky-50/40"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="font-semibold text-slate-700">Clique para enviar ou tirar foto</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG ou foto direta da câmera</p>
                  </div>

                  {photoPreview && (
                    <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-slate-300 group">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setAiDiagnosis(null);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                        title="Remover foto"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Triage Button (Gemini 3.8 Flash via @google/genai) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      Triagem Inteligente com Google AI Studio (Gemini 3.8 Flash)
                    </span>
                  </div>

                  <button
                    type="button"
                    id="btn-run-ai-triage"
                    disabled={isAnalyzingAI}
                    onClick={handleRunAITriage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isAnalyzingAI ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analisando foto & texto...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Processar Triagem com IA</span>
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <p className="text-xs text-rose-600 mt-2 font-medium bg-rose-50 p-2 rounded border border-rose-200">
                    {aiError}
                  </p>
                )}

                {/* AI Triage Result Display */}
                {aiDiagnosis && (
                  <div className="mt-3 bg-white p-3 rounded-lg border border-teal-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-teal-900">
                        Equipamento Identificado: {aiDiagnosis.equipamentoIdentificado}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          aiDiagnosis.nivelUrgencia === "Alta"
                            ? "bg-rose-100 text-rose-800"
                            : aiDiagnosis.nivelUrgencia === "Média"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        Urgência Sugerida: {aiDiagnosis.nivelUrgencia}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">
                      <strong>Impacto na UBS:</strong> {aiDiagnosis.justificativaImpacto}
                    </p>

                    <p className="text-slate-800 bg-sky-50/70 p-2 rounded border border-sky-100 leading-relaxed">
                      <strong>Sugestão para o Técnico:</strong> {aiDiagnosis.sugestaoDiagnostico}
                    </p>
                  </div>
                )}
              </div>

              {/* Priority Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nível de Prioridade do Chamado:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Baixa", "Média", "Alta"] as TicketPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityOverride(p)}
                      className={`py-2 px-3 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                        priorityOverride === p
                          ? p === "Alta"
                            ? "bg-rose-600 text-white border-rose-600"
                            : p === "Média"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-slate-700 text-white border-slate-700"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p} {p === "Alta" && "🚨"}
                    </button>
                  ))}
                </div>
                {priorityOverride === "Alta" && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    ⚠️ Chamados de Alta Prioridade disparam notificação push FCM multicast para toda a equipe técnica!
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpeningTicketModal(false);
                    setEditingTicket(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-submit-ticket"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingTicket ? "Salvar Alterações do Chamado" : "Registrar Chamado no Firestore"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Excluir Chamado */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Excluir Chamado</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deseja realmente excluir o chamado de <strong>{ticketToDelete.equipamento}</strong> ({ticketToDelete.ubsNome})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (ticketToDelete && onDeleteTicket) {
                    onDeleteTicket(ticketToDelete.id);
                  }
                  setTicketToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
