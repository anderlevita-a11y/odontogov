# Arquitetura NoSQL do Cloud Firestore - OdontoGov Municipal

Sistema Municipal de Gestão Odontológica e Manutenção Preventiva/Corretiva de UBSs.

---

## 1. Estrutura de Coleções e Documentos

### 1.1. Coleção: `users`
Armazena os perfis de profissionais de saúde bucal, auxiliares, administradores e equipe de manutenção.

```typescript
// Caminho: users/{userId}
interface UserDocument {
  id: string;                      // UID do Firebase Auth (ex: "usr_dent_01")
  nome: string;                    // Nome completo (ex: "Dra. Camila Nogueira")
  cargo: "Dentista" | "ASB" | "Admin" | "Técnico";
  UBS_id: string;                  // Referência da UBS de lotação principal (ex: "UBS-01-CENTRO")
  fcmToken?: string;               // Token de dispositivo para push notifications via Firebase Cloud Messaging
  email: string;                   // E-mail institucional (ex: "camila.nogueira@saude.gov.br")
  croOuRegistro?: string;          // Registro profissional CRO/SP ou CREA/CFT (ex: "CRO-SP 109432")
  telefone?: string;               // Contato de plantão (ex: "(11) 98765-4321")
  ativo: boolean;                  // Status de vínculo funcional ativo
  criadoEm: FirebaseFirestore.Timestamp;
}
```

---

### 1.2. Coleção: `schedules`
Gerencia a alocação de turnos de trabalho dos profissionais nas UBSs municipais.

```typescript
// Caminho: schedules/{scheduleId}
interface ScheduleDocument {
  id: string;                      // Identificador único da escala (ex: "sch_2026_09_22_m")
  userId: string;                  // UID do profissional escalado no momento
  ubsId: string;                   // Identificador da Unidade Básica de Saúde (ex: "UBS-01-CENTRO")
  ubsNome?: string;                // Nome amigável (ex: "UBS Vila Esperança")
  data: string;                    // Data do plantão no formato ISO "YYYY-MM-DD" (ex: "2026-09-22")
  turno: "Manhã" | "Tarde" | "Noite" | "Integral"; // Janela horária do atendimento
  horario?: string;                // Ex: "07:00 às 13:00"
  consultorio?: string;            // Ex: "Gabinete Odontológico 02"
  status: "confirmado" | "pendente_troca"; // Status da escala
  titularOriginalId?: string;      // Histórico se a escala foi cedida por troca
  criadoEm: FirebaseFirestore.Timestamp;
  atualizadoEm?: FirebaseFirestore.Timestamp;
}
```

---

### 1.3. Coleção: `tickets_manutencao`
Registros de chamados de falhas ou paradas em equipamentos odontológicos com triagem por Inteligência Artificial (Google Gemini).

```typescript
// Caminho: tickets_manutencao/{ticketId}
interface TicketManutencaoDocument {
  id: string;                      // ID único do chamado (ex: "tkt_2026_autoclave_01")
  ubsId: string;                   // Identificador da UBS de origem (ex: "UBS-03-JARDINS")
  ubsNome?: string;                // Ex: "UBS Central Dr. Paulo Silva"
  equipamento: string;             // Nome ou identificação inicial (ex: "Autoclave Cristófoli 21L")
  nivelPrioridade: "Alta" | "Média" | "Baixa"; // Definido ou sugerido pelo Gemini 3.8 Flash
  descricao: string;               // Relato do dentista sobre o problema
  fotoUrl?: string;                // URL da foto ou data base64 do equipamento quebrado
  status: "aberto" | "em_atendimento" | "concluido"; // Estados do Kanban
  criadoEm: FirebaseFirestore.Timestamp;
  criadoPor: string;               // UID do dentista ou funcionário que abriu o chamado
  solicitanteNome?: string;        // Nome amigável do dentista solicitante
  atribuidoA: string | null;       // UID do técnico de manutenção responsável
  tecnicoNome?: string;            // Nome do técnico designado
  
  // Metadados enriquecidos pela IA (Google Gen AI - Gemini 3.8 Flash)
  diagnosticoIA?: {
    equipamentoIdentificado: string; // Ex: "Autoclave Hospitalar a Vapor"
    nivelUrgencia: "Alta" | "Média" | "Baixa";
    justificativaImpacto: string;    // Impacto no atendimento da UBS
    sugestaoDiagnostico: string;    // Instrução técnica para o técnico
  };
  
  relatorioTecnico?: string;       // Observações de encerramento pelo técnico
  concluidoEm?: FirebaseFirestore.Timestamp;
}
```

---

### 1.4. Coleção: `trocas_escala`
Controla o fluxo de substituições voluntárias entre profissionais e sua respectiva chancela administrativa.

```typescript
// Caminho: trocas_escala/{tradeId}
interface TrocaEscalaDocument {
  id: string;                      // ID da solicitação de permuta
  solicitanteId: string;           // UID do dentista que precisa de substituição
  solicitanteNome?: string;        // Nome do dentista requerente
  substitutoId: string;            // UID do dentista proposto como substituto
  substitutoNome?: string;         // Nome do colega substituto
  scheduleId: string;              // Referência do documento em 'schedules'
  dataEscala?: string;             // Data do turno sendo transferido
  turnoEscala?: string;            // Turno da escala
  ubsId?: string;                  // UBS onde o plantão ocorrerá
  motivo?: string;                 // Justificativa apresentada
  status: "aguardando_aprovacao_admin" | "aprovado" | "recusado";
  criadoEm: FirebaseFirestore.Timestamp;
  aprovadoPorAdminEm?: FirebaseFirestore.Timestamp;
  aprovadoPorAdminId?: string;     // UID do coordenador que aprovou
  motivoRecusa?: string;
}
```

---

## 2. Índices Compostos Recomendados

1. `schedules`:
   - `userId` (ASC) + `data` (ASC)
   - `ubsId` (ASC) + `data` (ASC) + `turno` (ASC)
2. `tickets_manutencao`:
   - `status` (ASC) + `nivelPrioridade` (DESC) + `criadoEm` (DESC)
   - `ubsId` (ASC) + `criadoEm` (DESC)
   - `atribuidoA` (ASC) + `status` (ASC)
3. `trocas_escala`:
   - `solicitanteId` (ASC) + `status` (ASC)
   - `substitutoId` (ASC) + `status` (ASC)
   - `status` (ASC) + `criadoEm` (DESC)
