import React, { useState } from "react";
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  Filter,
  Wrench,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Eye,
  ChevronRight,
  Printer,
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
} from "lucide-react";
import type { Schedule, MaintenanceTicket, ScheduleTrade, UBS, User, ShiftType } from "../types";
import { MonthlyReportModal } from "./MonthlyReportModal";
import type { RegistrationTab } from "./RegistrationManagerModal";

interface AdminDashboardProps {
  schedules: Schedule[];
  tickets: MaintenanceTicket[];
  trades: ScheduleTrade[];
  ubss: UBS[];
  technicians: User[];
  allUsers?: User[];
  onApproveTrade: (tradeId: string) => void;
  onRejectTrade: (tradeId: string) => void;
  onAssignTechnician: (ticketId: string, technicianId: string) => void;
  onViewTicket: (ticket: MaintenanceTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onUpdateTicket?: (ticket: MaintenanceTicket) => void;
  onDeleteSchedule?: (scheduleId: string) => void;
  onUpdateSchedule?: (schedule: Schedule) => void;
  onGenerateReport?: () => void;
  onOpenRegistration?: (tab?: RegistrationTab) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  schedules,
  tickets,
  trades,
  ubss,
  technicians,
  allUsers = [],
  onApproveTrade,
  onRejectTrade,
  onAssignTechnician,
  onViewTicket,
  onDeleteTicket,
  onUpdateTicket,
  onDeleteSchedule,
  onUpdateSchedule,
  onGenerateReport,
  onOpenRegistration,
}) => {
  const [selectedUbs, setSelectedUbs] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // States for Schedule Editing and Safe Deletion
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<MaintenanceTicket | null>(null);

  // Form states for schedule editing
  const [editSchedUserId, setEditSchedUserId] = useState<string>("");
  const [editSchedUbsId, setEditSchedUbsId] = useState<string>("");
  const [editSchedData, setEditSchedData] = useState<string>("");
  const [editSchedTurno, setEditSchedTurno] = useState<ShiftType>("Manhã");
  const [editSchedHorario, setEditSchedHorario] = useState<string>("");
  const [editSchedConsultorio, setEditSchedConsultorio] = useState<string>("");

  const handleOpenEditSchedule = (sched: Schedule) => {
    setEditingSchedule(sched);
    setEditSchedUserId(sched.userId);
    setEditSchedUbsId(sched.ubsId);
    setEditSchedData(sched.data);
    setEditSchedTurno(sched.turno);
    setEditSchedHorario(sched.horario);
    setEditSchedConsultorio(sched.consultorio);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule || !onUpdateSchedule) return;

    const userObj = allUsers.find((u) => u.id === editSchedUserId);
    const ubsObj = ubss.find((u) => u.id === editSchedUbsId);

    const updated: Schedule = {
      ...editingSchedule,
      userId: editSchedUserId,
      userNome: userObj?.nome || editingSchedule.userNome,
      ubsId: editSchedUbsId,
      ubsNome: ubsObj?.nome || editingSchedule.ubsNome,
      data: editSchedData,
      turno: editSchedTurno,
      horario: editSchedHorario || (editSchedTurno === "Manhã" ? "07:00 - 11:30" : "12:30 - 17:00"),
      consultorio: editSchedConsultorio,
    };

    onUpdateSchedule(updated);
    setEditingSchedule(null);
  };

  // Filtered schedules
  const filteredSchedules = schedules.filter((s) => {
    const matchUbs = selectedUbs === "all" || s.ubsId === selectedUbs;
    const matchDay = selectedDay === "all" || s.data === selectedDay;
    return matchUbs && matchDay;
  });

  // Critical open maintenance tickets (Alta prioridade e status aberto)
  const criticalTickets = tickets.filter(
    (t) => t.nivelPrioridade === "Alta" && t.status !== "concluido"
  );

  // Pending trades awaiting admin approval
  const pendingTrades = trades.filter(
    (t) => t.status === "aguardando_aprovacao_admin"
  );

  // Unique dates in schedules
  const uniqueDates = Array.from(new Set(schedules.map((s) => s.data))).sort();

  const dentistsCount = allUsers.filter((u) => u.cargo === "Dentista").length;
  const asbsCount = allUsers.filter((u) => u.cargo === "ASB").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header section with Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
              Painel de Gestão & Coordenação Municipal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Secretaria Municipal de Saúde • Divisão de Saúde Bucal & Engenharia Clínica
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-cadastros-rede"
              onClick={() => onOpenRegistration?.("ubs")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Gerenciar cadastros de UBS, Dentistas, Auxiliares ASB e Técnicos"
            >
              <Users className="w-4 h-4 text-teal-400" />
              <span>Cadastros Municipais</span>
            </button>

            <button
              id="btn-novo-chamado-admin"
              onClick={() => onOpenRegistration?.("ticket")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Abrir novo chamado de manutenção odontológica com triagem de IA"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>+ Novo Chamado</span>
            </button>

            <button
              id="btn-gerar-relatorio-gestao"
              onClick={onGenerateReport || (() => setIsReportModalOpen(true))}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              title="Gerar relatório de gestão com escalas ativas e chamados em aberto para impressão"
            >
              <Printer className="w-4 h-4" />
              <span>Gerar Relatório de Gestão</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div
            onClick={() => onOpenRegistration?.("ubs")}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer"
            title="Clique para cadastrar e gerenciar UBSs"
          >
            <div className="w-12 h-12 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">UBSs Monitoradas</p>
              <p className="text-2xl font-bold text-slate-900">{ubss.length}</p>
              <p className="text-[11px] text-sky-600 font-medium">Cadastros & Gabinetes →</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Escalas da Semana</p>
              <p className="text-2xl font-bold text-slate-900">{schedules.length}</p>
              <p className="text-[11px] text-teal-600 font-medium">Turnos preenchidos</p>
            </div>
          </div>

          <div
            onClick={() => onOpenRegistration?.("ticket")}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer"
            title="Clique para cadastrar novo chamado de manutenção"
          >
            <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Chamados Críticos</p>
              <p className="text-2xl font-bold text-rose-600">{criticalTickets.length}</p>
              <p className="text-[11px] text-rose-600 font-medium">Abrir / Gerenciar →</p>
            </div>
          </div>

          <div
            onClick={() => onOpenRegistration?.("technician")}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
            title="Clique para gerenciar equipe de manutenção técnica"
          >
            <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Equipe Técnica</p>
              <p className="text-2xl font-bold text-slate-900">{technicians.length}</p>
              <p className="text-[11px] text-amber-600 font-medium">Engenharia Clínica →</p>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts Ribbon */}
        <div className="mt-4 bg-slate-900 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-400">Atalhos de Cadastro:</span>
            <span className="text-slate-300">Acesse rapidamente o módulo de gestão cadastral</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenRegistration?.("ubs")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span>+ UBS ({ubss.length})</span>
            </button>

            <button
              onClick={() => onOpenRegistration?.("dentist")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              <span>+ Dentista ({dentistsCount})</span>
            </button>

            <button
              onClick={() => onOpenRegistration?.("asb")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ ASB ({asbsCount})</span>
            </button>

            <button
              onClick={() => onOpenRegistration?.("technician")}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Técnico ({technicians.length})</span>
            </button>

            <button
              onClick={() => onOpenRegistration?.("ticket")}
              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ Chamado IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: Critical Open Tickets Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Chamados Críticos em Aberto (Alta Prioridade)
              </h2>
              <p className="text-xs text-slate-500">
                Equipamentos odontológicos com risco iminente de paralisação no atendimento clínico
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
            {criticalTickets.length} chamados urgentes
          </span>
        </div>

        {criticalTickets.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center text-emerald-800">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-sm">Nenhum chamado crítico pendente no momento!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Todos os consultórios odontológicos municipais operam dentro dos padrões sanitários.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalTickets.map((ticket) => (
              <div
                key={ticket.id}
                id={`critical-card-${ticket.id}`}
                className="bg-white rounded-xl border border-rose-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header of card */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                        Urgência Alta
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-2 leading-tight">
                        {ticket.equipamento}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.ubsNome}
                      </p>
                    </div>

                    {ticket.fotoUrl && (
                      <img
                        src={ticket.fotoUrl}
                        alt={ticket.equipamento}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    )}
                  </div>
                </div>

                {/* Body & AI diagnosis preview */}
                <div className="p-4 space-y-3 bg-slate-50/50 text-xs">
                  <p className="text-slate-700 line-clamp-2 italic">
                    "{ticket.descricao}"
                  </p>

                  {ticket.diagnosticoIA && (
                    <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-sky-900">
                        <span>🤖 Triagem Gemini 3.8 Flash</span>
                        <span className="text-emerald-700 font-mono">IA Concluída</span>
                      </div>
                      <p className="text-[11px] text-sky-800 leading-snug">
                        <strong>Impacto:</strong> {ticket.diagnosticoIA.justificativaImpacto}
                      </p>
                      <p className="text-[11px] text-sky-700 leading-snug">
                        <strong>Diretriz Técnica:</strong> {ticket.diagnosticoIA.sugestaoDiagnostico}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200">
                    <span>Aberto por: {ticket.solicitanteNome}</span>
                    <span className="capitalize font-medium text-amber-700">
                      Status: {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Footer Action: Assign Technician */}
                <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label htmlFor={`assign-tech-${ticket.id}`} className="sr-only">
                      Atribuir Técnico
                    </label>
                    <select
                      id={`assign-tech-${ticket.id}`}
                      value={ticket.atribuidoA || ""}
                      onChange={(e) => onAssignTechnician(ticket.id, e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2 text-slate-700 focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">-- Designar Técnico --</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.nome} ({tech.croOuRegistro || "Técnico"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onViewTicket(ticket)}
                      className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                      title="Ver detalhes do chamado"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenRegistration?.("ticket")}
                      className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                      title="Gerenciar na Central de Chamados"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onDeleteTicket && (
                      <button
                        onClick={() => setTicketToDelete(ticket)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Excluir chamado crítico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Pending Scale Trades Approvals (Cloud Function Trigger onTradeApprovedByAdmin) */}
      {pendingTrades.length > 0 && (
        <section className="space-y-3 bg-amber-50/70 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              <h2 className="text-base font-bold text-amber-950">
                Solicitações de Troca de Escala Pendentes de Aprovação
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
              {pendingTrades.length} aguardando você
            </span>
          </div>
          <p className="text-xs text-amber-800">
            Aprovar a permuta aciona a Cloud Function que atualiza instantaneamente a titularidade do documento em <code className="font-mono bg-amber-100 px-1 rounded">schedules</code> e envia confirmação push aos dois profissionais.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {pendingTrades.map((trade) => (
              <div
                key={trade.id}
                id={`trade-card-${trade.id}`}
                className="bg-white rounded-lg border border-amber-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span className="font-medium text-slate-700">{trade.ubsNome}</span>
                    <span className="font-mono">{trade.dataEscala} ({trade.turnoEscala})</span>
                  </div>

                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1">
                      <p className="text-[11px] text-slate-400 font-medium">Solicitante</p>
                      <p className="text-xs font-bold text-slate-900">{trade.solicitanteNome}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1 text-right">
                      <p className="text-[11px] text-slate-400 font-medium">Substituto Aceito</p>
                      <p className="text-xs font-bold text-slate-900">{trade.substitutoNome}</p>
                    </div>
                  </div>

                  {trade.motivo && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      "{trade.motivo}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-100">
                  <button
                    onClick={() => onRejectTrade(trade.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Recusar
                  </button>
                  <button
                    onClick={() => onApproveTrade(trade.id)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprovar & Atualizar Escala
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: Tabela de Escalas da Semana por UBS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Escalas da Semana por UBS
              </h2>
              <p className="text-xs text-slate-500">
                Alocação semanal de dentistas e ASBs na rede municipal
              </p>
            </div>
          </div>

          {/* Filters for UBS and Day */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filtrar por UBS"
                value={selectedUbs}
                onChange={(e) => setSelectedUbs(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">Todas as UBSs</option>
                {ubss.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filtrar por Data"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-transparent text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="all">Todos os Dias</option>
                {uniqueDates.map((d) => (
                  <option key={d} value={d}>
                    {new Date(d + "T12:00:00Z").toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* The Schedules Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">UBS Municipal</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Turno & Horário</th>
                  <th className="py-3 px-4">Profissional Escalado</th>
                  <th className="py-3 px-4">Consultório</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Nenhuma escala cadastrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => {
                    const isPendingTrade = schedule.status === "pendente_troca";
                    return (
                      <tr
                        key={schedule.id}
                        id={`schedule-row-${schedule.id}`}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isPendingTrade ? "bg-amber-50/30" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{schedule.ubsNome}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-slate-900 font-medium">
                            {new Date(schedule.data + "T12:00:00Z").toLocaleDateString(
                              "pt-BR",
                              {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                              }
                            )}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                                schedule.turno === "Manhã"
                                  ? "bg-sky-100 text-sky-800"
                                  : schedule.turno === "Tarde"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-indigo-100 text-indigo-800"
                              }`}
                            >
                              {schedule.turno}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {schedule.horario}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                            <div>
                              <span className="font-semibold text-slate-900">
                                {schedule.userNome}
                              </span>
                              {schedule.titularOriginalId && (
                                <span className="block text-[10px] text-teal-600 font-medium">
                                  ✓ Permuta chancelada
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {schedule.consultorio}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isPendingTrade ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3" />
                              Pendente Troca
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              Confirmado
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditSchedule(schedule)}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar plantão na escala"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteSchedule && (
                              <button
                                onClick={() => setScheduleToDelete(schedule)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir plantão da escala"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal: Editar Escala Municipal */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Editar Escala de Plantão</h3>
              </div>
              <button
                onClick={() => setEditingSchedule(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profissional Escalado *</label>
                <select
                  value={editSchedUserId}
                  onChange={(e) => setEditSchedUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  {allUsers
                    .filter((u) => u.cargo === "Dentista" || u.cargo === "ASB")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome} ({u.cargo} - {u.croOuRegistro})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UBS Municipal *</label>
                <select
                  value={editSchedUbsId}
                  onChange={(e) => setEditSchedUbsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  {ubss.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={editSchedData}
                    onChange={(e) => setEditSchedData(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Turno *</label>
                  <select
                    value={editSchedTurno}
                    onChange={(e) => setEditSchedTurno(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    <option value="Manhã">Manhã (07:00 - 11:30)</option>
                    <option value="Tarde">Tarde (12:30 - 17:00)</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário</label>
                  <input
                    type="text"
                    placeholder="Ex: 07:00 - 11:30"
                    value={editSchedHorario}
                    onChange={(e) => setEditSchedHorario(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Consultório</label>
                  <input
                    type="text"
                    placeholder="Ex: Consultório 01"
                    value={editSchedConsultorio}
                    onChange={(e) => setEditSchedConsultorio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Excluir Escala */}
      {scheduleToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Remover Plantão da Escala</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deseja realmente excluir a alocação de <strong>{scheduleToDelete.userNome}</strong> na{" "}
                <strong>{scheduleToDelete.ubsNome}</strong> em{" "}
                <strong>{scheduleToDelete.data} ({scheduleToDelete.turno})</strong>?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleToDelete(null)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (scheduleToDelete && onDeleteSchedule) {
                    onDeleteSchedule(scheduleToDelete.id);
                  }
                  setScheduleToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation: Excluir Chamado Crítico */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Excluir Chamado Crítico</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deseja realmente excluir o chamado do equipamento{" "}
                <strong>{ticketToDelete.equipamento}</strong> ({ticketToDelete.ubsNome})? Esta ação não pode ser desfeita.
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

      {/* Modal de Exportação do Relatório Mensal */}
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        schedules={schedules}
        tickets={tickets}
        ubss={ubss}
      />
    </div>
  );
};
