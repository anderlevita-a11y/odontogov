import React, { useState } from "react";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Sparkles,
  ArrowRight,
  UserCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Send,
  Filter,
  Edit2,
  Trash2,
  Save,
} from "lucide-react";
import type { MaintenanceTicket, User, TicketStatus, TicketPriority } from "../types";

interface MaintenanceViewProps {
  currentTechnician: User;
  tickets: MaintenanceTicket[];
  technicians: User[];
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus, relatorioTecnico?: string) => void;
  onAssignToMe: (ticketId: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onUpdateTicket?: (ticket: MaintenanceTicket) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  currentTechnician,
  tickets,
  technicians,
  onUpdateTicketStatus,
  onAssignToMe,
  onDeleteTicket,
  onUpdateTicket,
}) => {
  const [expandedAiIds, setExpandedAiIds] = useState<Set<string>>(new Set());
  const [selectedTicketForCompletion, setSelectedTicketForCompletion] = useState<MaintenanceTicket | null>(null);
  const [technicalReport, setTechnicalReport] = useState("");
  const [filterUbs, setFilterUbs] = useState<string>("all");

  // States for ticket editing and deletion
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [editEquipamento, setEditEquipamento] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editPrioridade, setEditPrioridade] = useState<TicketPriority>("Média");
  const [ticketToDelete, setTicketToDelete] = useState<MaintenanceTicket | null>(null);

  const handleStartEditTicket = (t: MaintenanceTicket) => {
    setEditingTicket(t);
    setEditEquipamento(t.equipamento);
    setEditDescricao(t.descricao);
    setEditPrioridade(t.nivelPrioridade);
  };

  const handleSaveTicketEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket || !onUpdateTicket) return;

    onUpdateTicket({
      ...editingTicket,
      equipamento: editEquipamento,
      descricao: editDescricao,
      nivelPrioridade: editPrioridade,
    });
    setEditingTicket(null);
  };

  const toggleExpandAi = (id: string) => {
    setExpandedAiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(
    (t) => filterUbs === "all" || t.ubsId === filterUbs
  );

  // Group by Kanban columns
  const openTickets = filteredTickets.filter((t) => t.status === "aberto");
  const inProgressTickets = filteredTickets.filter((t) => t.status === "em_atendimento");
  const completedTickets = filteredTickets.filter((t) => t.status === "concluido");

  // Handle finalize modal submit
  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForCompletion) return;

    onUpdateTicketStatus(
      selectedTicketForCompletion.id,
      "concluido",
      technicalReport.trim() || "Manutenção executada conforme especificações técnicas do fabricante e liberado para atendimento."
    );

    setSelectedTicketForCompletion(null);
    setTechnicalReport("");
  };

  const renderTicketCard = (ticket: MaintenanceTicket) => {
    const isHighPriority = ticket.nivelPrioridade === "Alta";
    const isAiExpanded = expandedAiIds.has(ticket.id);
    const isAssignedToMe = ticket.atribuidoA === currentTechnician.id;

    return (
      <div
        key={ticket.id}
        id={`kanban-ticket-${ticket.id}`}
        className={`bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 ${
          isHighPriority
            ? "border-rose-300 ring-1 ring-rose-200"
            : "border-slate-200"
        }`}
      >
        {/* Card Header */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                isHighPriority
                  ? "bg-rose-100 text-rose-700"
                  : ticket.nivelPrioridade === "Média"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {isHighPriority && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>}
              {ticket.nivelPrioridade} Prioridade
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(ticket.criadoEm).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              <button
                onClick={() => handleStartEditTicket(ticket)}
                className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors cursor-pointer"
                title="Editar chamado"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {onDeleteTicket && (
                <button
                  onClick={() => setTicketToDelete(ticket)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                  title="Excluir chamado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <h4 className="font-bold text-slate-900 text-sm mt-2 leading-tight">
            {ticket.equipamento}
          </h4>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ticket.ubsNome}</span>
          </div>
        </div>

        {/* Thumbnail & Description */}
        <div className="flex gap-2.5 items-start">
          {ticket.fotoUrl && (
            <img
              src={ticket.fotoUrl}
              alt={ticket.equipamento}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          )}
          <p className="text-xs text-slate-600 line-clamp-3 italic leading-relaxed">
            "{ticket.descricao}"
          </p>
        </div>

        {/* Gemini AI Triage Diagnostic Box */}
        {ticket.diagnosticoIA && (
          <div className="bg-sky-50/80 border border-sky-200 rounded-lg p-2.5 text-xs text-sky-950">
            <div
              onClick={() => toggleExpandAi(ticket.id)}
              className="flex items-center justify-between cursor-pointer select-none font-semibold text-[11px] text-sky-900"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Diagnóstico Gemini 3.8 Flash</span>
              </div>
              {isAiExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>

            {isAiExpanded && (
              <div className="mt-2 pt-2 border-t border-sky-200 space-y-1 text-[11px] leading-relaxed">
                <p>
                  <strong>Impacto:</strong> {ticket.diagnosticoIA.justificativaImpacto}
                </p>
                <p className="text-teal-900 font-medium bg-white/70 p-1.5 rounded border border-sky-100">
                  <strong>Sugestão Técnica:</strong> {ticket.diagnosticoIA.sugestaoDiagnostico}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Completed Report if finished */}
        {ticket.relatorioTecnico && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-900">
            <p className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Laudo Técnico:
            </p>
            <p className="mt-0.5 text-slate-700">{ticket.relatorioTecnico}</p>
          </div>
        )}

        {/* Footer info & technician assignment */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            Dentista: <strong>{ticket.solicitanteNome.split(" ")[0]}</strong>
          </span>

          {ticket.tecnicoNome ? (
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              {ticket.tecnicoNome.split(" ")[0]}
            </span>
          ) : (
            <button
              onClick={() => onAssignToMe(ticket.id)}
              className="text-sky-700 font-bold hover:underline"
            >
              + Assumir
            </button>
          )}
        </div>

        {/* Status Transition Action Buttons */}
        <div className="pt-2 flex items-center gap-1.5 border-t border-slate-100">
          {ticket.status === "aberto" && (
            <button
              onClick={() => onUpdateTicketStatus(ticket.id, "em_atendimento")}
              className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>Iniciar Atendimento</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {ticket.status === "em_atendimento" && (
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={() => onUpdateTicketStatus(ticket.id, "aberto")}
                className="py-1 px-2 text-slate-500 hover:bg-slate-100 rounded text-[11px]"
                title="Voltar para Aberto"
              >
                Voltar
              </button>
              <button
                onClick={() => setSelectedTicketForCompletion(ticket)}
                className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Concluir Reparo</span>
              </button>
            </div>
          )}

          {ticket.status === "concluido" && (
            <button
              onClick={() => onUpdateTicketStatus(ticket.id, "em_atendimento")}
              className="w-full py-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded text-[11px] font-medium"
            >
              Reabrir Chamado
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Wrench className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Kanban de Engenharia Clínica & Manutenção
              </h1>
              <p className="text-xs text-slate-500">
                Logado como Técnico: <strong>{currentTechnician.nome}</strong> ({currentTechnician.croOuRegistro})
              </p>
            </div>
          </div>
        </div>

        {/* UBS Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterUbs}
            onChange={(e) => setFilterUbs(e.target.value)}
            aria-label="Filtrar por UBS"
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todas as UBSs Municipais</option>
            <option value="UBS-01-CENTRO">UBS Central Dr. Paulo Silva</option>
            <option value="UBS-02-VILA-MARIANA">UBS Vila Mariana</option>
            <option value="UBS-03-JARDINS">UBS Jardins da Serra</option>
            <option value="UBS-04-SANTA-CECILIA">UBS Santa Cecília</option>
          </select>
        </div>
      </div>

      {/* KANBAN BOARD: 3 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: Aberto */}
        <div className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <h3 className="font-bold text-slate-800 text-sm">Aberto</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 font-bold text-xs border border-slate-200">
              {openTickets.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {openTickets.length === 0 ? (
              <div className="bg-white/60 border border-dashed border-slate-300 rounded-xl p-6 text-center text-slate-400 text-xs">
                Nenhum chamado aberto.
              </div>
            ) : (
              openTickets.map(renderTicketCard)
            )}
          </div>
        </div>

        {/* COLUMN 2: Em Atendimento */}
        <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h3 className="font-bold text-slate-800 text-sm">Em Atendimento</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-amber-800 font-bold text-xs border border-amber-200">
              {inProgressTickets.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {inProgressTickets.length === 0 ? (
              <div className="bg-white/60 border border-dashed border-amber-200 rounded-xl p-6 text-center text-slate-400 text-xs">
                Nenhum equipamento em bancada no momento.
              </div>
            ) : (
              inProgressTickets.map(renderTicketCard)
            )}
          </div>
        </div>

        {/* COLUMN 3: Concluído */}
        <div className="bg-emerald-50/40 rounded-2xl p-4 border border-emerald-200/80 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="font-bold text-slate-800 text-sm">Concluído</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 font-bold text-xs border border-emerald-200">
              {completedTickets.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
            {completedTickets.length === 0 ? (
              <div className="bg-white/60 border border-dashed border-emerald-200 rounded-xl p-6 text-center text-slate-400 text-xs">
                Nenhum chamado concluído recentemente.
              </div>
            ) : (
              completedTickets.map(renderTicketCard)
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Encerramento com Laudo Técnico */}
      {selectedTicketForCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Concluir Chamado & Registrar Laudo Técnico
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicketForCompletion(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-200">
                <p className="font-bold text-slate-900">{selectedTicketForCompletion.equipamento}</p>
                <p className="text-slate-600">{selectedTicketForCompletion.ubsNome}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Laudo Técnico / Peças Substituídas / Testes de Liberação:
                </label>
                <textarea
                  rows={4}
                  required
                  value={technicalReport}
                  onChange={(e) => setTechnicalReport(e.target.value)}
                  placeholder="Ex: Realizada troca da guarnição de silicone da porta da autoclave, calibrado termopar PT100 e rodado ciclo de validação biológico a 134°C com sucesso."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForCompletion(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Salvar Laudo & Finalizar Chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Detalhes do Chamado */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Editar Chamado #{editingTicket.id.slice(-4)}
                </h3>
              </div>
              <button
                onClick={() => setEditingTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicketEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipamento Odontológico *</label>
                <input
                  type="text"
                  required
                  value={editEquipamento}
                  onChange={(e) => setEditEquipamento(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prioridade Técnica *</label>
                <select
                  value={editPrioridade}
                  onChange={(e) => setEditPrioridade(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 bg-white font-bold"
                >
                  <option value="Alta">🚨 Alta Prioridade (Parada Total)</option>
                  <option value="Média">⚠️ Média Prioridade (Restrição Parcial)</option>
                  <option value="Baixa">🟢 Baixa Prioridade (Preventiva / Leve)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Sintomas *</label>
                <textarea
                  rows={3}
                  required
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-amber-500 bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
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
                Deseja realmente remover o chamado do equipamento <strong>{ticketToDelete.equipamento}</strong> ({ticketToDelete.ubsNome})? Esta ação não pode ser desfeita.
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
