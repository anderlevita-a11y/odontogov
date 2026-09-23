import React, { useState } from "react";
import {
  ShieldCheck,
  Stethoscope,
  Wrench,
  Activity,
  Bell,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Info,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { AdminDashboard } from "./components/AdminDashboard";
import { DentistView } from "./components/DentistView";
import { MaintenanceView } from "./components/MaintenanceView";
import { BackendDocsModal } from "./components/BackendDocsModal";
import { PrintReportModal } from "./components/PrintReportModal";
import { RegistrationManagerModal, type RegistrationTab } from "./components/RegistrationManagerModal";
import {
  INITIAL_USERS,
  INITIAL_SCHEDULES,
  INITIAL_TICKETS,
  INITIAL_TRADES,
  INITIAL_UBSS,
} from "./mockData";
import type {
  User,
  Schedule,
  MaintenanceTicket,
  ScheduleTrade,
  FCMNotification,
  TicketStatus,
  TicketPriority,
  AIDiagnosis,
  UBS,
} from "./types";

export default function App() {
  // Application State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // Default: Dra. Silvana (Admin)
  const [activeTab, setActiveTab] = useState<"admin" | "dentist" | "maintenance">("admin");
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(INITIAL_TICKETS);
  const [trades, setTrades] = useState<ScheduleTrade[]>(INITIAL_TRADES);
  const [ubss, setUbss] = useState<UBS[]>(INITIAL_UBSS);

  // FCM Notifications State
  const [notifications, setNotifications] = useState<FCMNotification[]>([
    {
      id: "notif_01",
      title: "🚨 Chamado Crítico Aberto - Manutenção UBS",
      body: "Equipamento: Autoclave Hospitalar na UBS Central Dr. Paulo Silva. Atendimento urgente requerido!",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      type: "CRITICAL_TICKET",
      read: false,
    },
    {
      id: "notif_02",
      title: "🔄 Proposta de Troca de Escala",
      body: "Dr. Lucas Mendes solicitou troca de turno (2026-09-22 - Tarde) com Dra. Camila Nogueira.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: "TRADE_REQUESTED",
      read: false,
    },
  ]);

  // Toast alert
  const [activeToast, setActiveToast] = useState<{ title: string; message: string; type: "success" | "alert" | "info" } | null>(null);

  // Docs modal
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Print Report modal
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Registration modal
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [registrationDefaultTab, setRegistrationDefaultTab] = useState<RegistrationTab>("ubs");

  // Detail modal for ticket viewing
  const [viewingTicket, setViewingTicket] = useState<MaintenanceTicket | null>(null);

  // Helper to push toast and FCM message
  const triggerNotification = (
    title: string,
    body: string,
    type: "TRADE_REQUESTED" | "TRADE_APPROVED" | "CRITICAL_TICKET" | "TICKET_UPDATED"
  ) => {
    const newNotif: FCMNotification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      timestamp: new Date().toISOString(),
      type,
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast({
      title,
      message: body,
      type: type === "CRITICAL_TICKET" ? "alert" : type === "TRADE_APPROVED" ? "success" : "info",
    });

    setTimeout(() => {
      setActiveToast((curr) => (curr?.title === title ? null : curr));
    }, 5000);
  };

  // UBS Management handlers
  const handleAddUBS = (newUbs: UBS) => {
    setUbss((prev) => [...prev, newUbs]);
    triggerNotification(
      "🏥 Nova UBS Cadastrada",
      `${newUbs.nome} (${newUbs.bairro}) foi cadastrada e integrada à rede municipal.`,
      "TICKET_UPDATED"
    );
  };

  const handleUpdateUBS = (updatedUbs: UBS) => {
    setUbss((prev) => prev.map((u) => (u.id === updatedUbs.id ? updatedUbs : u)));
    triggerNotification(
      "🏥 UBS Atualizada",
      `Os dados de ${updatedUbs.nome} foram atualizados no sistema.`,
      "TICKET_UPDATED"
    );
  };

  const handleDeleteUBS = (ubsId: string) => {
    setUbss((prev) => prev.filter((u) => u.id !== ubsId));
  };

  // User Management handlers (Dentists, ASBs, Technicians)
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    triggerNotification(
      `👤 Novo(a) ${newUser.cargo} Cadastrado(a)`,
      `${newUser.nome} foi registrado(a) com sucesso na rede municipal.`,
      "TICKET_UPDATED"
    );
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    triggerNotification(
      `👤 Cadastro Atualizado`,
      `Os dados de ${updatedUser.nome} foram atualizados.`,
      "TICKET_UPDATED"
    );
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Administrative Ticket Creation handler
  const handleAdminCreateTicket = (ticketData: {
    ubsId: string;
    ubsNome: string;
    equipamento: string;
    nivelPrioridade: TicketPriority;
    descricao: string;
    solicitanteNome: string;
    atribuidoA: string | null;
    fotoUrl?: string;
    diagnosticoIA?: AIDiagnosis;
  }) => {
    const assignedTech = users.find((u) => u.id === ticketData.atribuidoA);
    const newTicket: MaintenanceTicket = {
      id: `chamado_${Date.now()}`,
      ubsId: ticketData.ubsId,
      ubsNome: ticketData.ubsNome,
      equipamento: ticketData.equipamento,
      nivelPrioridade: ticketData.nivelPrioridade,
      descricao: ticketData.descricao,
      fotoUrl: ticketData.fotoUrl,
      status: ticketData.atribuidoA ? "em_atendimento" : "aberto",
      criadoEm: new Date().toISOString(),
      criadoPor: currentUser.id,
      solicitanteNome: ticketData.solicitanteNome,
      atribuidoA: ticketData.atribuidoA,
      tecnicoNome: assignedTech?.nome || null,
      diagnosticoIA: ticketData.diagnosticoIA,
    };

    setTickets((prev) => [newTicket, ...prev]);

    triggerNotification(
      ticketData.nivelPrioridade === "Alta" ? "🚨 Chamado Crítico Aberto" : "🛠️ Novo Chamado de Manutenção",
      `Equipamento: ${ticketData.equipamento} na ${ticketData.ubsNome}. ${assignedTech ? `Atribuído a ${assignedTech.nome}.` : "Aguardando atendimento."}`,
      ticketData.nivelPrioridade === "Alta" ? "CRITICAL_TICKET" : "TICKET_UPDATED"
    );
  };

  // Delete and Update Ticket Handlers
  const handleDeleteTicket = (ticketId: string) => {
    const ticket = tickets.find((t) => t.id === ticketId);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    triggerNotification(
      "🗑️ Chamado Excluído",
      `O chamado #${ticketId.slice(-4)} (${ticket?.equipamento || "Equipamento"}) foi removido do sistema.`,
      "TICKET_UPDATED"
    );
  };

  const handleUpdateTicket = (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    triggerNotification(
      "✏️ Chamado Atualizado",
      `O chamado #${updatedTicket.id.slice(-4)} (${updatedTicket.equipamento}) foi atualizado com sucesso.`,
      "TICKET_UPDATED"
    );
  };

  // Delete and Update Schedule Handlers
  const handleDeleteSchedule = (scheduleId: string) => {
    const sched = schedules.find((s) => s.id === scheduleId);
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    triggerNotification(
      "🗑️ Escala Removida",
      `A alocação de ${sched?.userNome || "profissional"} em ${sched?.data || ""} foi removida.`,
      "TICKET_UPDATED"
    );
  };

  const handleUpdateSchedule = (updatedSchedule: Schedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s)));
    triggerNotification(
      "✏️ Escala Atualizada",
      `Escala de ${updatedSchedule.userNome} em ${updatedSchedule.data} (${updatedSchedule.turno}) foi salva.`,
      "TICKET_UPDATED"
    );
  };

  // Switch persona handler
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    if (user.cargo === "Admin") setActiveTab("admin");
    else if (user.cargo === "Dentista" || user.cargo === "ASB") setActiveTab("dentist");
    else if (user.cargo === "Técnico") setActiveTab("maintenance");
  };

  // =========================================================================
  // Cloud Function 1 Logic: onTradeRequested
  // =========================================================================
  const handleRequestTrade = (scheduleId: string, substitutoId: string, motivo: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    const substituto = users.find((u) => u.id === substitutoId);

    if (!schedule || !substituto) return;

    // 1. Mark schedule as pendente_troca
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, status: "pendente_troca" } : s))
    );

    // 2. Create trade record
    const newTrade: ScheduleTrade = {
      id: `trd_${Date.now()}`,
      solicitanteId: currentUser.id,
      solicitanteNome: currentUser.nome,
      substitutoId: substituto.id,
      substitutoNome: substituto.nome,
      scheduleId: schedule.id,
      dataEscala: schedule.data,
      turnoEscala: schedule.turno,
      ubsId: schedule.ubsId,
      ubsNome: schedule.ubsNome || "UBS Municipal",
      motivo,
      status: "aguardando_aprovacao_admin",
      criadoEm: new Date().toISOString(),
    };

    setTrades((prev) => [newTrade, ...prev]);

    // 3. Dispatch FCM Notification (Trigger: onTradeRequested)
    triggerNotification(
      "🔄 Proposta de Troca de Escala",
      `Dr(a). ${currentUser.nome} solicitou troca de turno com ${substituto.nome} (${schedule.data} - ${schedule.turno}).`,
      "TRADE_REQUESTED"
    );
  };

  // =========================================================================
  // Cloud Function 2 Logic: onTradeApprovedByAdmin
  // =========================================================================
  const handleApproveTrade = (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    // Update trade status to aprovado
    setTrades((prev) =>
      prev.map((t) =>
        t.id === tradeId
          ? { ...t, status: "aprovado", aprovadoPorAdminEm: new Date().toISOString() }
          : t
      )
    );

    // Update schedule document: transfer userId to substituto and reset status to confirmado
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === trade.scheduleId) {
          return {
            ...s,
            userId: trade.substitutoId,
            userNome: trade.substitutoNome,
            titularOriginalId: trade.solicitanteId,
            status: "confirmado",
          };
        }
        return s;
      })
    );

    // Trigger FCM confirmations to both professionals
    triggerNotification(
      "✅ Troca de Escala Aprovada",
      `A permuta entre Dr(a). ${trade.solicitanteNome} e Dr(a). ${trade.substitutoNome} foi homologada pela coordenação.`,
      "TRADE_APPROVED"
    );
  };

  const handleRejectTrade = (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) return;

    setTrades((prev) =>
      prev.map((t) => (t.id === tradeId ? { ...t, status: "recusado" } : t))
    );

    // Reset schedule status to confirmado
    setSchedules((prev) =>
      prev.map((s) => (s.id === trade.scheduleId ? { ...s, status: "confirmado" } : s))
    );

    triggerNotification(
      "Permuta Recusada pela Gestão",
      `A solicitação de troca na escala ${trade.dataEscala} não pôde ser autorizada pela coordenação.`,
      "TRADE_REQUESTED"
    );
  };

  // =========================================================================
  // Cloud Function 3 Logic: onTicketCreated (Gemini AI + High Priority Alert)
  // =========================================================================
  const handleCreateTicket = (newTicketData: {
    equipamento: string;
    descricao: string;
    nivelPrioridade: TicketPriority;
    fotoUrl?: string;
    diagnosticoIA?: AIDiagnosis;
  }) => {
    const ubs = ubss.find((u) => u.id === currentUser.UBS_id) || ubss[0];

    const ticket: MaintenanceTicket = {
      id: `tkt_${Date.now()}`,
      ubsId: ubs.id,
      ubsNome: ubs.nome,
      equipamento: newTicketData.equipamento,
      nivelPrioridade: newTicketData.nivelPrioridade,
      descricao: newTicketData.descricao,
      fotoUrl: newTicketData.fotoUrl,
      status: "aberto",
      criadoEm: new Date().toISOString(),
      criadoPor: currentUser.id,
      solicitanteNome: currentUser.nome,
      atribuidoA: null,
      diagnosticoIA: newTicketData.diagnosticoIA,
    };

    setTickets((prev) => [ticket, ...prev]);

    // If High Priority, send Multicast FCM notification to technicians
    if (newTicketData.nivelPrioridade === "Alta") {
      triggerNotification(
        "🚨 Chamado Crítico Aberto - Manutenção UBS",
        `Equipamento: ${ticket.equipamento} na ${ubs.nome}. Atendimento urgente requerido!`,
        "CRITICAL_TICKET"
      );
    } else {
      triggerNotification(
        "Novo Chamado de Manutenção Registrado",
        `${ticket.equipamento} na ${ubs.nome} registrado com prioridade ${ticket.nivelPrioridade}.`,
        "TICKET_UPDATED"
      );
    }
  };

  // Assign technician to ticket
  const handleAssignTechnician = (ticketId: string, technicianId: string) => {
    const tech = users.find((u) => u.id === technicianId);
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              atribuidoA: technicianId || null,
              tecnicoNome: tech ? tech.nome : null,
              status: t.status === "aberto" && technicianId ? "em_atendimento" : t.status,
            }
          : t
      )
    );

    if (tech) {
      triggerNotification(
        "Técnico Atribuído ao Chamado",
        `${tech.nome} foi designado para a manutenção do equipamento.`,
        "TICKET_UPDATED"
      );
    }
  };

  // Maintenance Kanban Status update
  const handleUpdateTicketStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    relatorioTecnico?: string
  ) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            relatorioTecnico: relatorioTecnico || t.relatorioTecnico,
            concluidoEm: newStatus === "concluido" ? new Date().toISOString() : t.concluidoEm,
          };
        }
        return t;
      })
    );

    if (newStatus === "concluido") {
      triggerNotification(
        "✅ Manutenção Concluída",
        "O equipamento foi reparado, testado e liberado para atendimento no consultório.",
        "TRADE_APPROVED"
      );
    }
  };

  const technicians = users.filter((u) => u.cargo === "Técnico");

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar with SUS Branding & Persona Switcher */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        availableUsers={users}
        notifications={notifications}
        onMarkNotificationRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        onClearNotifications={() => setNotifications([])}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Primary Role Navigation Tabs */}
      <nav aria-label="Abas de visualização do sistema" className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto py-2">
            <button
              id="tab-admin"
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "admin"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>1. AdminDashboard</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
                Coordenação
              </span>
            </button>

            <button
              id="tab-dentist"
              onClick={() => setActiveTab("dentist")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "dentist"
                  ? "bg-sky-50 text-sky-800 border border-sky-300 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span>2. DentistView</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700">
                Escalas & Chamados
              </span>
            </button>

            <button
              id="tab-maintenance"
              onClick={() => setActiveTab("maintenance")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "maintenance"
                  ? "bg-amber-50 text-amber-800 border border-amber-300 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>3. MaintenanceView</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700">
                Kanban Técnico
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "admin" && (
          <AdminDashboard
            schedules={schedules}
            tickets={tickets}
            trades={trades}
            ubss={ubss}
            allUsers={users}
            technicians={technicians}
            onApproveTrade={handleApproveTrade}
            onRejectTrade={handleRejectTrade}
            onAssignTechnician={handleAssignTechnician}
            onViewTicket={(ticket) => setViewingTicket(ticket)}
            onDeleteTicket={handleDeleteTicket}
            onUpdateTicket={handleUpdateTicket}
            onDeleteSchedule={handleDeleteSchedule}
            onUpdateSchedule={handleUpdateSchedule}
            onGenerateReport={() => setIsPrintReportOpen(true)}
            onOpenRegistration={(tab) => {
              setRegistrationDefaultTab(tab || "ubs");
              setIsRegistrationModalOpen(true);
            }}
          />
        )}

        {activeTab === "dentist" && (
          <DentistView
            currentDentist={
              currentUser.cargo === "Dentista" || currentUser.cargo === "ASB"
                ? currentUser
                : users.find((u) => u.cargo === "Dentista") || users[1]
            }
            schedules={schedules}
            colleagues={users}
            myTickets={tickets.filter(
              (t) =>
                t.criadoPor === currentUser.id ||
                t.ubsId === currentUser.UBS_id
            )}
            onRequestTrade={handleRequestTrade}
            onCreateTicket={handleCreateTicket}
            onDeleteTicket={handleDeleteTicket}
            onUpdateTicket={handleUpdateTicket}
          />
        )}

        {activeTab === "maintenance" && (
          <MaintenanceView
            currentTechnician={
              currentUser.cargo === "Técnico"
                ? currentUser
                : users.find((u) => u.cargo === "Técnico") || users[6]
            }
            tickets={tickets}
            technicians={technicians}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onAssignToMe={(ticketId) => handleAssignTechnician(ticketId, currentUser.id)}
            onDeleteTicket={handleDeleteTicket}
            onUpdateTicket={handleUpdateTicket}
          />
        )}
      </main>

      {/* Floating Push Notification Toast */}
      {activeToast && (
        <div
          id="fcm-toast-notification"
          className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          <div className="flex items-start gap-3">
            {activeToast.type === "alert" ? (
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
            ) : activeToast.type === "success" ? (
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{activeToast.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  FCM Push
                </span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">{activeToast.message}</p>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Ticket Details View Modal */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase ${
                  viewingTicket.nivelPrioridade === "Alta"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {viewingTicket.nivelPrioridade} Prioridade
              </span>
              <button
                onClick={() => setViewingTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <h3 className="font-bold text-base text-slate-900">{viewingTicket.equipamento}</h3>
              <p className="text-slate-500">{viewingTicket.ubsNome} • Aberto por {viewingTicket.solicitanteNome}</p>

              {viewingTicket.fotoUrl && (
                <img
                  src={viewingTicket.fotoUrl}
                  alt={viewingTicket.equipamento}
                  referrerPolicy="no-referrer"
                  className="w-full h-48 object-cover rounded-xl border border-slate-200"
                />
              )}

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-semibold text-slate-700">Relato do Dentista:</p>
                <p className="text-slate-600 italic">"{viewingTicket.descricao}"</p>
              </div>

              {viewingTicket.diagnosticoIA && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 space-y-1 text-sky-950">
                  <p className="font-bold text-sky-900">🤖 Análise do Gemini 3.8 Flash:</p>
                  <p><strong>Impacto:</strong> {viewingTicket.diagnosticoIA.justificativaImpacto}</p>
                  <p><strong>Diretriz:</strong> {viewingTicket.diagnosticoIA.sugestaoDiagnostico}</p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingTicket(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backend Specs & Firestore Rules Code Viewer Modal */}
      <BackendDocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />

      {/* Print Report Modal (Tabela Consolidada com @media print) */}
      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        schedules={schedules}
        tickets={tickets}
        ubss={ubss}
      />

      {/* Central de Cadastros e Gestão da Rede (UBS, Dentistas, ASB, Técnicos, Chamados) */}
      <RegistrationManagerModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        defaultTab={registrationDefaultTab}
        ubss={ubss}
        users={users}
        tickets={tickets}
        onAddUBS={handleAddUBS}
        onUpdateUBS={handleUpdateUBS}
        onDeleteUBS={handleDeleteUBS}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onCreateTicket={handleAdminCreateTicket}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">OdontoGov</span>
            <span>•</span>
            <span>Sistema Municipal de Saúde Bucal Integrado</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDocsOpen(true)}
              className="hidden"
            >
              Visualizar firestore.rules & Cloud Functions
            </button>
            <span>Google Gen AI SDK v2.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
