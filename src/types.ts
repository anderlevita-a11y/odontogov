export type UserRole = "Dentista" | "ASB" | "Admin" | "Técnico";

export interface User {
  id: string;
  nome: string;
  cargo: UserRole;
  UBS_id: string;
  ubsNome?: string;
  fcmToken?: string;
  email: string;
  croOuRegistro?: string;
  avatarUrl?: string;
  telefone?: string;
  especialidade?: string;
  statusAtivo?: boolean;
}

export type ShiftType = "Manhã" | "Tarde" | "Noite" | "Integral";
export type ScheduleStatus = "confirmado" | "pendente_troca";

export interface Schedule {
  id: string;
  userId: string;
  userNome?: string;
  userCargo?: UserRole;
  ubsId: string;
  ubsNome?: string;
  data: string; // YYYY-MM-DD
  turno: ShiftType;
  horario: string;
  consultorio: string;
  status: ScheduleStatus;
  titularOriginalId?: string;
}

export type TicketPriority = "Alta" | "Média" | "Baixa";
export type TicketStatus = "aberto" | "em_atendimento" | "concluido";

export interface AIDiagnosis {
  equipamentoIdentificado: string;
  nivelUrgencia: TicketPriority;
  justificativaImpacto: string;
  sugestaoDiagnostico: string;
}

export interface MaintenanceTicket {
  id: string;
  ubsId: string;
  ubsNome: string;
  equipamento: string;
  nivelPrioridade: TicketPriority;
  descricao: string;
  fotoUrl?: string;
  status: TicketStatus;
  criadoEm: string; // ISO String
  criadoPor: string;
  solicitanteNome: string;
  atribuidoA: string | null;
  tecnicoNome?: string | null;
  diagnosticoIA?: AIDiagnosis;
  relatorioTecnico?: string;
  concluidoEm?: string;
}

export type TradeStatus = "aguardando_aprovacao_admin" | "aprovado" | "recusado";

export interface ScheduleTrade {
  id: string;
  solicitanteId: string;
  solicitanteNome: string;
  substitutoId: string;
  substitutoNome: string;
  scheduleId: string;
  dataEscala: string;
  turnoEscala: ShiftType;
  ubsId: string;
  ubsNome: string;
  motivo: string;
  status: TradeStatus;
  criadoEm: string;
  aprovadoPorAdminEm?: string;
}

export interface UBS {
  id: string;
  nome: string;
  bairro: string;
  cadeirasOdontologicas: number;
  telefone: string;
  endereco?: string;
  responsavel?: string;
  email?: string;
  status?: "ativa" | "reforma" | "inativa";
}

export interface FCMNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: "TRADE_REQUESTED" | "TRADE_APPROVED" | "CRITICAL_TICKET" | "TICKET_UPDATED";
  read: boolean;
  recipientRole?: UserRole;
}
