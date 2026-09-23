import React, { useState, useRef } from "react";
import {
  Building2,
  Stethoscope,
  Users,
  Wrench,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  Search,
  Sparkles,
  Camera,
  Loader2,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  HelpCircle,
  Clock,
} from "lucide-react";
import type { UBS, User, MaintenanceTicket, TicketPriority, AIDiagnosis } from "../types";
import { SAMPLE_EQUIPMENT_PRESETS } from "../mockData";

export type RegistrationTab = "ubs" | "dentist" | "asb" | "technician" | "ticket";

interface RegistrationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: RegistrationTab;
  ubss: UBS[];
  users: User[];
  tickets: MaintenanceTicket[];
  onAddUBS: (ubs: UBS) => void;
  onUpdateUBS: (ubs: UBS) => void;
  onDeleteUBS: (ubsId: string) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCreateTicket: (ticket: {
    ubsId: string;
    ubsNome: string;
    equipamento: string;
    nivelPrioridade: TicketPriority;
    descricao: string;
    solicitanteNome: string;
    atribuidoA: string | null;
    fotoUrl?: string;
    diagnosticoIA?: AIDiagnosis;
  }) => void;
  onUpdateTicket?: (ticket: MaintenanceTicket) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

export const RegistrationManagerModal: React.FC<RegistrationManagerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "ubs",
  ubss,
  users,
  tickets,
  onAddUBS,
  onUpdateUBS,
  onDeleteUBS,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onCreateTicket,
  onUpdateTicket,
  onDeleteTicket,
}) => {
  const [activeTab, setActiveTab] = useState<RegistrationTab>(defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form reference for auto-scroll on edit
  const formRef = useRef<HTMLDivElement>(null);

  // Modal custom confirmation for safe deletion without relying on window.confirm
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "ubs" | "dentist" | "asb" | "technician" | "ticket";
    id: string;
    name: string;
  } | null>(null);

  // Forms states
  // 1. UBS Form
  const [editingUbsId, setEditingUbsId] = useState<string | null>(null);
  const [ubsNome, setUbsNome] = useState("");
  const [ubsBairro, setUbsBairro] = useState("");
  const [ubsEndereco, setUbsEndereco] = useState("");
  const [ubsCadeiras, setUbsCadeiras] = useState(2);
  const [ubsTelefone, setUbsTelefone] = useState("");
  const [ubsResponsavel, setUbsResponsavel] = useState("");

  // 2. Dentista Form
  const [editingDentistId, setEditingDentistId] = useState<string | null>(null);
  const [dentistNome, setDentistNome] = useState("");
  const [dentistEmail, setDentistEmail] = useState("");
  const [dentistCro, setDentistCro] = useState("");
  const [dentistEspecialidade, setDentistEspecialidade] = useState("Clínica Geral");
  const [dentistTelefone, setDentistTelefone] = useState("");
  const [dentistUbsId, setDentistUbsId] = useState(ubss[0]?.id || "");

  // 3. ASB Form
  const [editingAsbId, setEditingAsbId] = useState<string | null>(null);
  const [asbNome, setAsbNome] = useState("");
  const [asbEmail, setAsbEmail] = useState("");
  const [asbRegistro, setAsbRegistro] = useState("");
  const [asbTelefone, setAsbTelefone] = useState("");
  const [asbUbsId, setAsbUbsId] = useState(ubss[0]?.id || "");

  // 4. Técnico Form
  const [editingTecId, setEditingTecId] = useState<string | null>(null);
  const [tecNome, setTecNome] = useState("");
  const [tecEmail, setTecEmail] = useState("");
  const [tecCft, setTecCft] = useState("");
  const [tecEspecialidade, setTecEspecialidade] = useState("Equipamentos Odontológicos");
  const [tecTelefone, setTecTelefone] = useState("");
  const [tecUbsId, setTecUbsId] = useState(ubss[0]?.id || "");

  // 5. Chamado Form
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [ticketUbsId, setTicketUbsId] = useState(ubss[0]?.id || "");
  const [ticketSolicitanteNome, setTicketSolicitanteNome] = useState("");
  const [ticketEquipamento, setTicketEquipamento] = useState("");
  const [ticketPrioridade, setTicketPrioridade] = useState<TicketPriority>("Média");
  const [ticketDescricao, setTicketDescricao] = useState("");
  const [ticketTecnicoId, setTicketTecnicoId] = useState<string>("");
  const [ticketFoto, setTicketFoto] = useState<string | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<AIDiagnosis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to form when editing
  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Success flash feedback
  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (!isOpen) return null;

  // Filtered lists
  const dentists = users.filter((u) => u.cargo === "Dentista");
  const asbs = users.filter((u) => u.cargo === "ASB");
  const technicians = users.filter((u) => u.cargo === "Técnico");

  // Handle Safe Deletion execution
  const handleExecuteDelete = () => {
    if (!deleteConfirmation) return;
    const { type, id, name } = deleteConfirmation;

    if (type === "ubs") {
      onDeleteUBS(id);
      if (editingUbsId === id) {
        setEditingUbsId(null);
        setUbsNome("");
        setUbsBairro("");
        setUbsEndereco("");
        setUbsTelefone("");
        setUbsResponsavel("");
      }
      showFeedback(`UBS "${name}" removida com sucesso.`);
    } else if (type === "dentist") {
      onDeleteUser(id);
      if (editingDentistId === id) {
        setEditingDentistId(null);
        setDentistNome("");
        setDentistEmail("");
        setDentistCro("");
        setDentistTelefone("");
      }
      showFeedback(`Dentista ${name} excluído(a) com sucesso.`);
    } else if (type === "asb") {
      onDeleteUser(id);
      if (editingAsbId === id) {
        setEditingAsbId(null);
        setAsbNome("");
        setAsbEmail("");
        setAsbRegistro("");
        setAsbTelefone("");
      }
      showFeedback(`Auxiliar ASB ${name} excluída.`);
    } else if (type === "technician") {
      onDeleteUser(id);
      if (editingTecId === id) {
        setEditingTecId(null);
        setTecNome("");
        setTecEmail("");
        setTecCft("");
        setTecTelefone("");
      }
      showFeedback(`Técnico ${name} excluído.`);
    } else if (type === "ticket") {
      onDeleteTicket?.(id);
      if (editingTicketId === id) {
        setEditingTicketId(null);
        setTicketEquipamento("");
        setTicketDescricao("");
        setTicketFoto(null);
        setAiDiagnosis(null);
        setTicketTecnicoId("");
        setTicketPrioridade("Média");
      }
      showFeedback(`Chamado "${name}" removido com sucesso.`);
    }

    setDeleteConfirmation(null);
  };

  // Handle UBS Submit
  const handleSubmitUBS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ubsNome.trim() || !ubsBairro.trim()) {
      showFeedback("Por favor, preencha o nome e o bairro da UBS.");
      return;
    }

    if (editingUbsId) {
      const updated: UBS = {
        id: editingUbsId,
        nome: ubsNome,
        bairro: ubsBairro,
        endereco: ubsEndereco,
        cadeirasOdontologicas: Number(ubsCadeiras) || 1,
        telefone: ubsTelefone || "(11) 3200-0000",
        responsavel: ubsResponsavel,
        status: "ativa",
      };
      onUpdateUBS(updated);
      showFeedback(`UBS "${ubsNome}" atualizada com sucesso!`);
      setEditingUbsId(null);
    } else {
      const newUbs: UBS = {
        id: `UBS-${String(Date.now()).slice(-4)}`,
        nome: ubsNome,
        bairro: ubsBairro,
        endereco: ubsEndereco,
        cadeirasOdontologicas: Number(ubsCadeiras) || 1,
        telefone: ubsTelefone || "(11) 3200-0000",
        responsavel: ubsResponsavel,
        status: "ativa",
      };
      onAddUBS(newUbs);
      showFeedback(`Nova UBS "${ubsNome}" cadastrada com sucesso!`);
    }

    setUbsNome("");
    setUbsBairro("");
    setUbsEndereco("");
    setUbsCadeiras(2);
    setUbsTelefone("");
    setUbsResponsavel("");
  };

  const handleEditUBS = (ubs: UBS) => {
    setEditingUbsId(ubs.id);
    setUbsNome(ubs.nome);
    setUbsBairro(ubs.bairro);
    setUbsEndereco(ubs.endereco || "");
    setUbsCadeiras(ubs.cadeirasOdontologicas);
    setUbsTelefone(ubs.telefone);
    setUbsResponsavel(ubs.responsavel || "");
    scrollToForm();
  };

  // Handle Dentist Submit
  const handleSubmitDentist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dentistNome.trim() || !dentistCro.trim()) {
      showFeedback("Por favor, preencha o nome e o número de registro CRO do dentista.");
      return;
    }

    const ubsObj = ubss.find((u) => u.id === dentistUbsId);

    if (editingDentistId) {
      const updated: User = {
        id: editingDentistId,
        nome: dentistNome,
        cargo: "Dentista",
        UBS_id: dentistUbsId,
        ubsNome: ubsObj?.nome || "UBS Municipal",
        email: dentistEmail || `${dentistNome.toLowerCase().replace(/\s+/g, ".")}@saude.gov.br`,
        croOuRegistro: dentistCro.startsWith("CRO") ? dentistCro : `CRO-SP ${dentistCro}`,
        especialidade: dentistEspecialidade,
        telefone: dentistTelefone,
        statusAtivo: true,
      };
      onUpdateUser(updated);
      showFeedback(`Dentista ${dentistNome} atualizado(a) com sucesso!`);
      setEditingDentistId(null);
    } else {
      const newUser: User = {
        id: `usr_dent_${Date.now()}`,
        nome: dentistNome,
        cargo: "Dentista",
        UBS_id: dentistUbsId,
        ubsNome: ubsObj?.nome || "UBS Municipal",
        email: dentistEmail || `${dentistNome.toLowerCase().replace(/\s+/g, ".")}@saude.gov.br`,
        croOuRegistro: dentistCro.startsWith("CRO") ? dentistCro : `CRO-SP ${dentistCro}`,
        especialidade: dentistEspecialidade,
        telefone: dentistTelefone,
        statusAtivo: true,
      };
      onAddUser(newUser);
      showFeedback(`Cirurgião-Dentista ${dentistNome} cadastrado(a) com sucesso!`);
    }

    setDentistNome("");
    setDentistEmail("");
    setDentistCro("");
    setDentistTelefone("");
  };

  const handleEditDentist = (d: User) => {
    setEditingDentistId(d.id);
    setDentistNome(d.nome);
    setDentistEmail(d.email);
    setDentistCro(d.croOuRegistro || "");
    setDentistEspecialidade(d.especialidade || "Clínica Geral");
    setDentistUbsId(d.UBS_id);
    setDentistTelefone(d.telefone || "");
    scrollToForm();
  };

  // Handle ASB Submit
  const handleSubmitASB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asbNome.trim() || !asbRegistro.trim()) {
      showFeedback("Por favor, preencha o nome e o registro da Auxiliar ASB.");
      return;
    }

    const ubsObj = ubss.find((u) => u.id === asbUbsId);

    if (editingAsbId) {
      const updated: User = {
        id: editingAsbId,
        nome: asbNome,
        cargo: "ASB",
        UBS_id: asbUbsId,
        ubsNome: ubsObj?.nome || "UBS Municipal",
        email: asbEmail || `${asbNome.toLowerCase().replace(/\s+/g, ".")}@saude.gov.br`,
        croOuRegistro: asbRegistro.startsWith("ASB") ? asbRegistro : `ASB-SP ${asbRegistro}`,
        telefone: asbTelefone,
        statusAtivo: true,
      };
      onUpdateUser(updated);
      showFeedback(`Auxiliar ASB ${asbNome} atualizada com sucesso!`);
      setEditingAsbId(null);
    } else {
      const newUser: User = {
        id: `usr_asb_${Date.now()}`,
        nome: asbNome,
        cargo: "ASB",
        UBS_id: asbUbsId,
        ubsNome: ubsObj?.nome || "UBS Municipal",
        email: asbEmail || `${asbNome.toLowerCase().replace(/\s+/g, ".")}@saude.gov.br`,
        croOuRegistro: asbRegistro.startsWith("ASB") ? asbRegistro : `ASB-SP ${asbRegistro}`,
        telefone: asbTelefone,
        statusAtivo: true,
      };
      onAddUser(newUser);
      showFeedback(`Auxiliar de Saúde Bucal (ASB) ${asbNome} cadastrada!`);
    }

    setAsbNome("");
    setAsbEmail("");
    setAsbRegistro("");
    setAsbTelefone("");
  };

  const handleEditASB = (a: User) => {
    setEditingAsbId(a.id);
    setAsbNome(a.nome);
    setAsbEmail(a.email);
    setAsbRegistro(a.croOuRegistro || "");
    setAsbUbsId(a.UBS_id);
    setAsbTelefone(a.telefone || "");
    scrollToForm();
  };

  // Handle Technician Submit
  const handleSubmitTechnician = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tecNome.trim() || !tecCft.trim()) {
      showFeedback("Por favor, preencha o nome e o registro CFT/CREA do técnico.");
      return;
    }

    const ubsObj = ubss.find((u) => u.id === tecUbsId);

    if (editingTecId) {
      const updated: User = {
        id: editingTecId,
        nome: tecNome,
        cargo: "Técnico",
        UBS_id: tecUbsId,
        ubsNome: ubsObj?.nome || "Oficina de Engenharia Clínica",
        email: tecEmail || `${tecNome.toLowerCase().replace(/\s+/g, ".")}@saude.gov.br`,
        croOuRegistro: tecCft.startsWith("CFT") || tecCft.startsWith("CREA") ? tecCft : `CFT-SP ${tecCft}`,
        especialidade: tecEspecialidade,
        telefone: tecTelefone,
        statusAtivo: true,
      };
      onUpdateUser(updated);
      showFeedback(`Técnico ${tecNome} atualizado com sucesso!`);
      setEditingTecId(null);
    } else {
      const newUser: User = {
        id: `usr_tec_${Date.now()}`,
        nome: tecNome,
        cargo: "Técnico",
        UBS_id: tecUbsId,
        ubsNome: ubsObj?.nome || "Oficina de Engenharia Clínica",
        email: tecEmail || `${tecNome.toLowerCase().replace(/\s+/g, ".")}@saude.gov.br`,
        croOuRegistro: tecCft.startsWith("CFT") || tecCft.startsWith("CREA") ? tecCft : `CFT-SP ${tecCft}`,
        especialidade: tecEspecialidade,
        telefone: tecTelefone,
        statusAtivo: true,
      };
      onAddUser(newUser);
      showFeedback(`Técnico de Manutenção ${tecNome} cadastrado!`);
    }

    setTecNome("");
    setTecEmail("");
    setTecCft("");
    setTecTelefone("");
  };

  const handleEditTechnician = (t: User) => {
    setEditingTecId(t.id);
    setTecNome(t.nome);
    setTecEmail(t.email);
    setTecCft(t.croOuRegistro || "");
    setTecEspecialidade(t.especialidade || "Equipamentos Odontológicos");
    setTecUbsId(t.UBS_id);
    setTecTelefone(t.telefone || "");
    scrollToForm();
  };

  // Handle Ticket Photo Upload
  const handleTicketPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketFoto(reader.result as string);
        setAiDiagnosis(null);
        setAiError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Triage for Maintenance Ticket Form
  const handleRunAITriage = async () => {
    if (!ticketDescricao.trim() && !ticketEquipamento.trim()) {
      setAiError("Informe o nome do equipamento ou a descrição do problema antes de rodar a IA.");
      return;
    }

    setIsAnalyzingAI(true);
    setAiError(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipamento: ticketEquipamento,
          descricao: ticketDescricao,
          photoBase64: ticketFoto,
          mimeType: ticketFoto?.startsWith("data:image/png") ? "image/png" : "image/jpeg",
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error || "Falha na triagem da IA");
      }

      const result = await res.json();
      if (result.success && result.data) {
        setAiDiagnosis(result.data);
        setTicketPrioridade(result.data.nivelUrgencia);
        if (result.data.equipamentoIdentificado && !ticketEquipamento) {
          setTicketEquipamento(result.data.equipamentoIdentificado);
        }
        showFeedback("Triagem clínica concluída pela IA Gemini!");
      }
    } catch (err: any) {
      console.error("Erro na triagem:", err);
      setAiError(err.message || "Não foi possível conectar à IA do Gemini.");
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Handle Ticket Submission (Create or Edit)
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEquipamento.trim() || !ticketDescricao.trim()) {
      showFeedback("Por favor, preencha o equipamento e a descrição do problema.");
      return;
    }

    const ubsObj = ubss.find((u) => u.id === ticketUbsId);
    const solicitante = ticketSolicitanteNome.trim() || "Coordenação Municipal";
    const assignedTech = users.find((u) => u.id === ticketTecnicoId);

    if (editingTicketId && onUpdateTicket) {
      const existing = tickets.find((t) => t.id === editingTicketId);
      const updated: MaintenanceTicket = {
        id: editingTicketId,
        ubsId: ticketUbsId,
        ubsNome: ubsObj?.nome || existing?.ubsNome || "UBS Central",
        equipamento: ticketEquipamento,
        nivelPrioridade: ticketPrioridade,
        descricao: ticketDescricao,
        fotoUrl: ticketFoto || undefined,
        status: existing?.status || (ticketTecnicoId ? "em_atendimento" : "aberto"),
        criadoEm: existing?.criadoEm || new Date().toISOString(),
        criadoPor: existing?.criadoPor || "admin",
        solicitanteNome: solicitante,
        atribuidoA: ticketTecnicoId || null,
        tecnicoNome: assignedTech?.nome || null,
        diagnosticoIA: aiDiagnosis || existing?.diagnosticoIA,
        relatorioTecnico: existing?.relatorioTecnico,
        concluidoEm: existing?.concluidoEm,
      };
      onUpdateTicket(updated);
      showFeedback(`Chamado "${ticketEquipamento}" atualizado com sucesso!`);
      setEditingTicketId(null);
    } else {
      onCreateTicket({
        ubsId: ticketUbsId,
        ubsNome: ubsObj?.nome || "UBS Central",
        equipamento: ticketEquipamento,
        nivelPrioridade: ticketPrioridade,
        descricao: ticketDescricao,
        solicitanteNome: solicitante,
        atribuidoA: ticketTecnicoId || null,
        fotoUrl: ticketFoto || undefined,
        diagnosticoIA: aiDiagnosis || undefined,
      });
      showFeedback(`Chamado para "${ticketEquipamento}" registrado com sucesso na rede!`);
    }

    // Reset ticket form
    setTicketEquipamento("");
    setTicketDescricao("");
    setTicketFoto(null);
    setAiDiagnosis(null);
    setTicketTecnicoId("");
    setTicketPrioridade("Média");
    setTicketSolicitanteNome("");
  };

  const handleEditTicket = (t: MaintenanceTicket) => {
    setEditingTicketId(t.id);
    setTicketUbsId(t.ubsId);
    setTicketSolicitanteNome(t.solicitanteNome);
    setTicketEquipamento(t.equipamento);
    setTicketPrioridade(t.nivelPrioridade);
    setTicketDescricao(t.descricao);
    setTicketTecnicoId(t.atribuidoA || "");
    setTicketFoto(t.fotoUrl || null);
    setAiDiagnosis(t.diagnosticoIA || null);
    scrollToForm();
  };

  const cancelEditTicket = () => {
    setEditingTicketId(null);
    setTicketEquipamento("");
    setTicketDescricao("");
    setTicketFoto(null);
    setAiDiagnosis(null);
    setTicketTecnicoId("");
    setTicketPrioridade("Média");
    setTicketSolicitanteNome("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-600 text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Central de Cadastros & Gestão da Rede Odontológica
              </h3>
              <p className="text-xs text-slate-500">
                Gerencie Unidades Básicas de Saúde, Cirurgiões-Dentistas, Auxiliares ASB, Técnicos e Chamados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex gap-2 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("ubs"); setSearchTerm(""); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "ubs"
                ? "border-teal-600 text-teal-700 bg-teal-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>UBSs ({ubss.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("dentist"); setSearchTerm(""); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "dentist"
                ? "border-teal-600 text-teal-700 bg-teal-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Dentistas ({dentists.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("asb"); setSearchTerm(""); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "asb"
                ? "border-teal-600 text-teal-700 bg-teal-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Auxiliares ASB ({asbs.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("technician"); setSearchTerm(""); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "technician"
                ? "border-teal-600 text-teal-700 bg-teal-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Técnicos ({technicians.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab("ticket"); setSearchTerm(""); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "ticket"
                ? "border-rose-600 text-rose-700 bg-rose-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Novo Chamado ({tickets.filter(t => t.status !== "concluido").length} abertos)</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">

          {/* TAB 1: UBS */}
          {activeTab === "ubs" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
                  <span>{editingUbsId ? "Editar UBS" : "Cadastrar Nova UBS"}</span>
                  {editingUbsId && (
                    <button
                      type="button"
                      onClick={() => { setEditingUbsId(null); setUbsNome(""); setUbsBairro(""); setUbsEndereco(""); setUbsTelefone(""); setUbsResponsavel(""); }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </h4>

                <form onSubmit={handleSubmitUBS} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome da UBS *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: UBS Central Dr. Paulo Silva"
                      value={ubsNome}
                      onChange={(e) => setUbsNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bairro / Região *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Centro"
                        value={ubsBairro}
                        onChange={(e) => setUbsBairro(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Cadeiras Odonto *</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={ubsCadeiras}
                        onChange={(e) => setUbsCadeiras(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      placeholder="Ex: Rua São Bento, 450 - Centro"
                      value={ubsEndereco}
                      onChange={(e) => setUbsEndereco(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Telefone / Ramal</label>
                      <input
                        type="text"
                        placeholder="(11) 3241-1000"
                        value={ubsTelefone}
                        onChange={(e) => setUbsTelefone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Responsável / Gerente</label>
                      <input
                        type="text"
                        placeholder="Ex: Dra. Marta Vieira"
                        value={ubsResponsavel}
                        onChange={(e) => setUbsResponsavel(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingUbsId ? "Salvar Alterações da UBS" : "Cadastrar UBS na Rede"}</span>
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-800 text-xs">
                    Unidades Básicas de Saúde Cadastradas ({ubss.length})
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {ubss.map((u) => (
                    <div
                      key={u.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{u.nome}</h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {u.bairro}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <span>{u.cadeirasOdontologicas} gabinetes odontológicos</span>
                          <span>•</span>
                          <span>Tel: {u.telefone}</span>
                        </p>
                        {u.endereco && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {u.endereco}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditUBS(u)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar dados da UBS"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation({ type: "ubs", id: u.id, name: u.nome })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir UBS"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DENTISTAS */}
          {activeTab === "dentist" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
                  <span>{editingDentistId ? "Editar Cirurgião-Dentista" : "Cadastrar Cirurgião-Dentista"}</span>
                  {editingDentistId && (
                    <button
                      type="button"
                      onClick={() => { setEditingDentistId(null); setDentistNome(""); setDentistEmail(""); setDentistCro(""); setDentistTelefone(""); }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </h4>

                <form onSubmit={handleSubmitDentist} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dr. Marcelo Pires"
                      value={dentistNome}
                      onChange={(e) => setDentistNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Registro CRO *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: CRO-SP 98.412"
                        value={dentistCro}
                        onChange={(e) => setDentistCro(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Especialidade</label>
                      <select
                        value={dentistEspecialidade}
                        onChange={(e) => setDentistEspecialidade(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        <option value="Clínica Geral">Clínica Geral</option>
                        <option value="Endodontia">Endodontia</option>
                        <option value="Odontopediatria">Odontopediatria</option>
                        <option value="Periodontia">Periodontia</option>
                        <option value="Cirurgia Bucomaxilofacial">Cirurgia Bucomaxilofacial</option>
                        <option value="Prótese Dentária">Prótese Dentária</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UBS de Lotação Principal *</label>
                    <select
                      value={dentistUbsId}
                      onChange={(e) => setDentistUbsId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      {ubss.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome} ({u.bairro})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">E-mail Institucional</label>
                      <input
                        type="email"
                        placeholder="marcelo.pires@saude.gov.br"
                        value={dentistEmail}
                        onChange={(e) => setDentistEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="(11) 98765-4321"
                        value={dentistTelefone}
                        onChange={(e) => setDentistTelefone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingDentistId ? "Salvar Alterações" : "Cadastrar Dentista"}</span>
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-800 text-xs">
                    Quadro de Cirurgiões-Dentistas ({dentists.length})
                  </h4>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar dentista..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  {dentists
                    .filter((d) => d.nome.toLowerCase().includes(searchTerm.toLowerCase()) || d.croOuRegistro?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((d) => (
                      <div
                        key={d.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 text-sm">{d.nome}</h5>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                              {d.croOuRegistro || "CRO Ativo"}
                            </span>
                            {d.especialidade && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                {d.especialidade}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600">
                            <strong>Lotação:</strong> {d.ubsNome || ubss.find(u => u.id === d.UBS_id)?.nome || "UBS Municipal"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {d.email} {d.telefone ? `• ${d.telefone}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditDentist(d)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation({ type: "dentist", id: d.id, name: d.nome })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASB */}
          {activeTab === "asb" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
                  <span>{editingAsbId ? "Editar Auxiliar ASB" : "Cadastrar Auxiliar de Saúde Bucal (ASB)"}</span>
                  {editingAsbId && (
                    <button
                      type="button"
                      onClick={() => { setEditingAsbId(null); setAsbNome(""); setAsbEmail(""); setAsbRegistro(""); setAsbTelefone(""); }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </h4>

                <form onSubmit={handleSubmitASB} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Beatriz Lima"
                      value={asbNome}
                      onChange={(e) => setAsbNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Registro CRO-ASB *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: ASB-SP 43.120"
                        value={asbRegistro}
                        onChange={(e) => setAsbRegistro(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">UBS de Lotação *</label>
                      <select
                        value={asbUbsId}
                        onChange={(e) => setAsbUbsId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        {ubss.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">E-mail Institucional</label>
                      <input
                        type="email"
                        placeholder="beatriz.lima@saude.gov.br"
                        value={asbEmail}
                        onChange={(e) => setAsbEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Telefone</label>
                      <input
                        type="text"
                        placeholder="(11) 97654-3210"
                        value={asbTelefone}
                        onChange={(e) => setAsbTelefone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingAsbId ? "Salvar Alterações" : "Cadastrar Auxiliar ASB"}</span>
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">
                  Auxiliares de Saúde Bucal (ASB) Cadastradas ({asbs.length})
                </h4>

                <div className="space-y-2.5">
                  {asbs.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{a.nome}</h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            {a.croOuRegistro || "ASB Registrada"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Lotação:</strong> {a.ubsNome || ubss.find(u => u.id === a.UBS_id)?.nome || "UBS Municipal"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {a.email} {a.telefone ? `• ${a.telefone}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditASB(a)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation({ type: "asb", id: a.id, name: a.nome })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TÉCNICOS */}
          {activeTab === "technician" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
                  <span>{editingTecId ? "Editar Técnico" : "Cadastrar Técnico de Engenharia Clínica"}</span>
                  {editingTecId && (
                    <button
                      type="button"
                      onClick={() => { setEditingTecId(null); setTecNome(""); setTecEmail(""); setTecCft(""); setTecTelefone(""); }}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </h4>

                <form onSubmit={handleSubmitTechnician} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Marcos Rocha"
                      value={tecNome}
                      onChange={(e) => setTecNome(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Registro CFT / CREA *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: CFT-SP 55.409"
                        value={tecCft}
                        onChange={(e) => setTecCft(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Especialidade</label>
                      <select
                        value={tecEspecialidade}
                        onChange={(e) => setTecEspecialidade(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        <option value="Equipamentos Odontológicos">Equipamentos Odontológicos</option>
                        <option value="Compressores e Ar Comprimido">Compressores e Ar Comprimido</option>
                        <option value="Autoclaves e Esterilização">Autoclaves e Esterilização</option>
                        <option value="Raio-X e Imagem">Raio-X e Imagem</option>
                        <option value="Hidráulica e Vácuo">Hidráulica e Vácuo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Base de Operação</label>
                    <select
                      value={tecUbsId}
                      onChange={(e) => setTecUbsId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      {ubss.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome} ({u.bairro})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">E-mail Institucional</label>
                      <input
                        type="email"
                        placeholder="marcos.rocha@saude.gov.br"
                        value={tecEmail}
                        onChange={(e) => setTecEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Telefone de Plantão</label>
                      <input
                        type="text"
                        placeholder="(11) 98888-7777"
                        value={tecTelefone}
                        onChange={(e) => setTecTelefone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingTecId ? "Salvar Alterações" : "Cadastrar Técnico"}</span>
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-7 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">
                  Equipe Técnica de Manutenção ({technicians.length})
                </h4>

                <div className="space-y-2.5">
                  {technicians.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-900 text-sm">{t.nome}</h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {t.croOuRegistro || "CFT Ativo"}
                          </span>
                          {t.especialidade && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              {t.especialidade}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Base:</strong> {t.ubsNome || "Oficina Central de Engenharia Clínica"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {t.email} {t.telefone ? `• ${t.telefone}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditTechnician(t)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation({ type: "technician", id: t.id, name: t.nome })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CADASTRO E GESTÃO DE CHAMADOS DE MANUTENÇÃO */}
          {activeTab === "ticket" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Column */}
              <div ref={formRef} className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{editingTicketId ? "Editar Chamado Técnico" : "Novo Chamado de Manutenção"}</span>
                    </h4>
                    {editingTicketId && (
                      <button
                        type="button"
                        onClick={cancelEditTicket}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        Cancelar Edição
                      </button>
                    )}
                  </div>

                  {editingTicketId && (
                    <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                      <span>Alterando chamado <strong>#{editingTicketId.slice(-4)}</strong></span>
                      <span className="text-[10px] font-mono bg-amber-200/60 px-1.5 py-0.5 rounded">Edição Ativa</span>
                    </div>
                  )}

                  {/* Quick Preset Buttons */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                      Casos Frequentes da Rede (Preenchimento Rápido):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_EQUIPMENT_PRESETS.slice(0, 3).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTicketEquipamento(preset.nome);
                            setTicketDescricao(preset.descricao);
                            setTicketFoto(preset.fotoUrl);
                            setAiDiagnosis(null);
                            setAiError(null);
                          }}
                          className="px-2 py-0.5 text-[11px] rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                        >
                          ⚡ {preset.nome.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">UBS *</label>
                        <select
                          value={ticketUbsId}
                          onChange={(e) => setTicketUbsId(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                        >
                          {ubss.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Solicitante</label>
                        <input
                          type="text"
                          placeholder="Ex: Coordenação / Dra. Camila"
                          value={ticketSolicitanteNome}
                          onChange={(e) => setTicketSolicitanteNome(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Equipamento *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Cadeira Odontológica"
                          value={ticketEquipamento}
                          onChange={(e) => setTicketEquipamento(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Prioridade *</label>
                        <select
                          value={ticketPrioridade}
                          onChange={(e) => setTicketPrioridade(e.target.value as TicketPriority)}
                          className={`w-full px-2.5 py-2 rounded-lg border font-bold ${
                            ticketPrioridade === "Alta"
                              ? "border-rose-300 bg-rose-50 text-rose-800"
                              : ticketPrioridade === "Média"
                              ? "border-amber-300 bg-amber-50 text-amber-800"
                              : "border-slate-300 bg-slate-50 text-slate-800"
                          }`}
                        >
                          <option value="Alta">🚨 Alta (Parada Crítica)</option>
                          <option value="Média">⚠️ Média (Restrição Parcial)</option>
                          <option value="Baixa">🟢 Baixa (Preventiva/Ajuste)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Descrição do Defeito *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Relato detalhado dos sintomas..."
                        value={ticketDescricao}
                        onChange={(e) => setTicketDescricao(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      />
                    </div>

                    {/* Photo and AI Triage */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700">Foto & Triagem IA</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleTicketPhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>{ticketFoto ? "Trocar" : "Foto"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRunAITriage}
                            disabled={isAnalyzingAI}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50 shadow-2xs cursor-pointer"
                          >
                            {isAnalyzingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            <span>{isAnalyzingAI ? "Triando..." : "IA Gemini"}</span>
                          </button>
                        </div>
                      </div>

                      {ticketFoto && (
                        <div className="flex items-center gap-2 pt-1">
                          <img src={ticketFoto} alt="Preview" className="w-12 h-12 object-cover rounded border border-slate-300" />
                          <button
                            type="button"
                            onClick={() => setTicketFoto(null)}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      )}

                      {aiDiagnosis && (
                        <div className="p-2 rounded bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-950">
                          <span className="font-bold text-indigo-900 block">IA: {aiDiagnosis.sugestaoDiagnostico}</span>
                        </div>
                      )}
                    </div>

                    {/* Technician assign */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Designar Técnico</label>
                      <select
                        value={ticketTecnicoId}
                        onChange={(e) => setTicketTecnicoId(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 bg-white"
                      >
                        <option value="">Aguardando técnico (no Kanban)</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome} ({t.croOuRegistro})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      {editingTicketId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingTicketId ? "Salvar Alterações do Chamado" : "Cadastrar Chamado na Rede"}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* List Column */}
              <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Chamados Registrados no Sistema ({tickets.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Gerencie, edite parâmetros ou remova ocorrências de manutenção da rede.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por equipamento, UBS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 w-full sm:w-56"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[520px] space-y-3 pr-1">
                  {tickets
                    .filter(
                      (t) =>
                        t.equipamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.ubsNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.descricao.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((t) => (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          editingTicketId === t.id
                            ? "border-amber-400 bg-amber-50/50 ring-2 ring-amber-200"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        }`}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{t.equipamento}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.nivelPrioridade === "Alta"
                                  ? "bg-rose-100 text-rose-700"
                                  : t.nivelPrioridade === "Média"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {t.nivelPrioridade}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                t.status === "concluido"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : t.status === "em_atendimento"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {t.status === "concluido" ? "Concluído" : t.status === "em_atendimento" ? "Em Atendimento" : "Aberto"}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 font-medium">{t.ubsNome}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 italic">"{t.descricao}"</p>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                            <span>Solicitante: {t.solicitanteNome}</span>
                            <span>•</span>
                            <span>Técnico: {t.tecnicoNome || "Aguardando"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditTicket(t)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar chamado"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation({ type: "ticket", id: t.id, name: t.equipamento })}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir chamado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {tickets.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum chamado de manutenção registrado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Cadastros integrados à base municipal e sincronizados com o painel da coordenação e visão dos técnicos.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {/* Safe In-Modal Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Confirmar Exclusão</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Deseja realmente remover <strong>{deleteConfirmation.name}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
