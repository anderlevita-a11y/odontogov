import React, { useState } from "react";
import {
  X,
  Code2,
  Copy,
  Check,
  Shield,
  Sparkles,
  Bell,
  Database,
} from "lucide-react";

interface BackendDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendDocsModal: React.FC<BackendDocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"rules" | "gemini" | "functions" | "schema">("rules");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const firestoreRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funções Auxiliares de Autenticação e RBAC
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isAuthenticated() && getUserData().cargo == 'Admin';
    }

    function isTecnico() {
      return isAuthenticated() && getUserData().cargo == 'Técnico';
    }

    function isDentistaOuASB() {
      return isAuthenticated() && (getUserData().cargo == 'Dentista' || getUserData().cargo == 'ASB');
    }

    // 1. Coleção: users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (isAuthenticated() && request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['cargo', 'UBS_id']));
    }

    // 2. Coleção: tickets_manutencao
    // Requisito: Técnicos veem chamados de manutenção. Dentistas abrem e veem da sua UBS. Admins veem tudo.
    match /tickets_manutencao/{ticketId} {
      allow read: if isAdmin() || isTecnico() || (
        isDentistaOuASB() && (
          resource.data.criadoPor == request.auth.uid ||
          resource.data.ubsId == getUserData().UBS_id
        )
      );

      allow create: if isAuthenticated() && (
        isAdmin() ||
        (isDentistaOuASB() && request.resource.data.criadoPor == request.auth.uid)
      );

      allow update: if isAdmin() || (
        isTecnico() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'atribuidoA', 'relatorioTecnico', 'atualizadoEm'])
      );

      allow delete: if isAdmin();
    }

    // 3. Coleção: schedules (Escalas de Trabalho)
    // Requisito: Dentistas veem apenas suas escalas. Admins veem tudo.
    match /schedules/{scheduleId} {
      allow read: if isAdmin() || (
        isDentistaOuASB() && (
          resource.data.userId == request.auth.uid ||
          resource.data.ubsId == getUserData().UBS_id
        )
      );

      allow write: if isAdmin();
    }

    // 4. Coleção: trocas_escala
    // Requisito: Dentistas veem apenas suas trocas. Admins veem tudo.
    match /trocas_escala/{tradeId} {
      allow read: if isAdmin() || (
        isDentistaOuASB() && (
          resource.data.solicitanteId == request.auth.uid ||
          resource.data.substitutoId == request.auth.uid
        )
      );

      allow create: if isAuthenticated() && (
        isAdmin() ||
        (isDentistaOuASB() && request.resource.data.solicitanteId == request.auth.uid && request.resource.data.status == 'aguardando_aprovacao_admin')
      );

      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}`;

  const geminiIntegrationCode = `/**
 * Prompt 2: Integração Google AI Studio com SDK @google/genai (Gemini 3.8 Flash)
 * Arquivo: functions/src/triage.js
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenAI, Type } = require("@google/genai");

exports.triageMaintenanceTicket = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Requer autenticação.");
  }

  const { photoBase64, mimeType, descricao, equipamento } = request.data;
  const apiKey = process.env.GEMINI_API_KEY;

  const ai = new GoogleGenAI({ apiKey });

  const promptText = \`
Você é um Engenheiro Clínico e Perito em Equipamentos Odontológicos da Rede Municipal de Saúde (SUS).
Um profissional da Unidade Básica de Saúde (UBS) enviou um chamado de manutenção.

Informações fornecidas:
- Equipamento mencionado: "\${equipamento || "Não informado"}"
- Descrição do defeito: "\${descricao || "Sem detalhes adicionais"}"

Diretrizes de resposta obrigatórias em JSON:
1. equipamentoIdentificado: Identifique com precisão o equipamento odontológico.
2. nivelUrgencia: Classifique estritamente como "Alta", "Média" ou "Baixa", justificando detalhadamente o impacto no atendimento da UBS.
3. justificativaImpacto: Explicação clínica e sanitária clara sobre o impacto na unidade.
4. sugestaoDiagnostico: Orientação técnica e prática direcionada ao técnico de manutenção.
\`;

  const parts = [];
  if (photoBase64) {
    const cleanBase64 = photoBase64.replace(/^data:image\\/[a-z]+;base64,/, "");
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType || "image/jpeg",
      },
    });
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          equipamentoIdentificado: { type: Type.STRING },
          nivelUrgencia: { type: Type.STRING, enum: ["Alta", "Média", "Baixa"] },
          justificativaImpacto: { type: Type.STRING },
          sugestaoDiagnostico: { type: Type.STRING },
        },
        required: ["equipamentoIdentificado", "nivelUrgencia", "sugestaoDiagnostico"],
      },
    },
  });

  return {
    success: true,
    data: JSON.parse(response.text || "{}"),
  };
});`;

  const cloudFunctionsCode = `/**
 * Prompt 3: Lógica de Negócio e Notificações Push FCM (Cloud Functions v2)
 * Arquivo: functions/index.js
 */
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// 1. onTradeRequested: Notificação push via FCM para o substituto
exports.onTradeRequested = onDocumentCreated("trocas_escala/{tradeId}", async (event) => {
  const { solicitanteId, substitutoId, scheduleId, motivo } = event.data.data();

  const [solicitanteDoc, substitutoDoc, scheduleDoc] = await Promise.all([
    db.collection("users").doc(solicitanteId).get(),
    db.collection("users").doc(substitutoId).get(),
    db.collection("schedules").doc(scheduleId).get(),
  ]);

  const substituto = substitutoDoc.data();
  const solicitante = solicitanteDoc.data();
  const schedule = scheduleDoc.data();

  if (!substituto?.fcmToken) return;

  await messaging.send({
    token: substituto.fcmToken,
    notification: {
      title: "🔄 Proposta de Troca de Escala",
      body: \`Dr(a). \${solicitante.nome} solicitou troca de turno (\${schedule.data} - \${schedule.turno}).\`,
    },
    data: { tradeId: event.params.tradeId, type: "TRADE_REQUESTED" },
  });
});

// 2. onTradeApprovedByAdmin: Atualiza escalas no Firestore e notifica ambos
exports.onTradeApprovedByAdmin = onDocumentUpdated("trocas_escala/{tradeId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status !== "aprovado" && after.status === "aprovado") {
    const { scheduleId, solicitanteId, substitutoId } = after;

    // Transação Firestore para atualização da escala
    await db.runTransaction(async (transaction) => {
      const scheduleRef = db.collection("schedules").doc(scheduleId);
      transaction.update(scheduleRef, {
        userId: substitutoId,
        titularOriginalId: solicitanteId,
        status: "confirmado",
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Envia confirmação via FCM para solicitante e substituto
    const [solDoc, subDoc] = await Promise.all([
      db.collection("users").doc(solicitanteId).get(),
      db.collection("users").doc(substitutoId).get(),
    ]);

    const solToken = solDoc.data()?.fcmToken;
    const subToken = subDoc.data()?.fcmToken;

    if (solToken) {
      await messaging.send({
        token: solToken,
        notification: {
          title: "✅ Troca de Escala Aprovada",
          body: "Sua solicitação de permuta foi chancelada pela Coordenação de Saúde Bucal.",
        },
      });
    }

    if (subToken) {
      await messaging.send({
        token: subToken,
        notification: {
          title: "📅 Nova Escala Confirmada",
          body: "A troca de escala foi aprovada. Novo turno atribuído à sua agenda.",
        },
      });
    }
  }
});

// 3. onTicketCreated: Alerta FCM Multicast para Técnicos em chamados de Alta Prioridade
exports.onTicketCreated = onDocumentCreated("tickets_manutencao/{ticketId}", async (event) => {
  const ticket = event.data.data();

  if (ticket.nivelPrioridade === "Alta") {
    const tecnicosSnapshot = await db
      .collection("users")
      .where("cargo", "==", "Técnico")
      .get();

    const tokens = [];
    tecnicosSnapshot.forEach((doc) => {
      if (doc.data().fcmToken) tokens.push(doc.data().fcmToken);
    });

    if (tokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: "🚨 Chamado Crítico Aberto - Manutenção UBS",
          body: \`Equipamento: \${ticket.equipamento} na UBS \${ticket.ubsId}. Atendimento urgente!\`,
        },
        data: { ticketId: event.params.ticketId, prioridade: "Alta" },
      });
    }
  }
});`;

  const schemaMarkdown = `# Modelagem NoSQL do Cloud Firestore

1. Coleção 'users'
   - id: string (Auth UID)
   - nome: string
   - cargo: "Dentista" | "ASB" | "Admin" | "Técnico"
   - UBS_id: string
   - fcmToken: string
   - email: string
   - ativo: boolean

2. Coleção 'schedules'
   - id: string
   - userId: string
   - ubsId: string
   - data: string (YYYY-MM-DD)
   - turno: "Manhã" | "Tarde" | "Noite" | "Integral"
   - status: "confirmado" | "pendente_troca"
   - titularOriginalId: string (opcional)

3. Coleção 'tickets_manutencao'
   - id: string
   - ubsId: string
   - equipamento: string
   - nivelPrioridade: "Alta" | "Média" | "Baixa"
   - descricao: string
   - fotoUrl: string
   - status: "aberto" | "em_atendimento" | "concluido"
   - criadoEm: Timestamp
   - criadoPor: string
   - atribuidoA: string | null
   - diagnosticoIA: {
       equipamentoIdentificado: string;
       nivelUrgencia: "Alta" | "Média" | "Baixa";
       justificativaImpacto: string;
       sugestaoDiagnostico: string;
     }

4. Coleção 'trocas_escala'
   - id: string
   - solicitanteId: string
   - substitutoId: string
   - scheduleId: string
   - status: "aguardando_aprovacao_admin" | "aprovado" | "recusado"
   - motivo: string
   - criadoEm: Timestamp`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-600 text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Especificação Técnica, Firestore Rules & Cloud Functions
              </h3>
              <p className="text-xs text-slate-500">
                Arquivos gerados conforme os 4 prompts da arquitetura municipal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "rules"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>1. firestore.rules (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab("gemini")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "gemini"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>2. Gemini AI Triage (@google/genai)</span>
          </button>

          <button
            onClick={() => setActiveTab("functions")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "functions"
                ? "border-sky-600 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>3. Cloud Functions (FCM & Transações)</span>
          </button>

          <button
            onClick={() => setActiveTab("schema")}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "schema"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>4. Modelo NoSQL (4 Coleções)</span>
          </button>
        </div>

        {/* Content Box with Code and Copy */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-900 text-slate-100 font-mono text-xs relative">
          <div className="absolute top-8 right-8 z-10">
            {activeTab === "rules" && (
              <button
                onClick={() => copyToClipboard(firestoreRulesCode, "rules")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
              >
                {copiedTab === "rules" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === "rules" ? "Copiado!" : "Copiar firestore.rules"}</span>
              </button>
            )}

            {activeTab === "gemini" && (
              <button
                onClick={() => copyToClipboard(geminiIntegrationCode, "gemini")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
              >
                {copiedTab === "gemini" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === "gemini" ? "Copiado!" : "Copiar Código Gemini"}</span>
              </button>
            )}

            {activeTab === "functions" && (
              <button
                onClick={() => copyToClipboard(cloudFunctionsCode, "functions")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
              >
                {copiedTab === "functions" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === "functions" ? "Copiado!" : "Copiar Cloud Functions"}</span>
              </button>
            )}

            {activeTab === "schema" && (
              <button
                onClick={() => copyToClipboard(schemaMarkdown, "schema")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
              >
                {copiedTab === "schema" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === "schema" ? "Copiado!" : "Copiar Schema"}</span>
              </button>
            )}
          </div>

          <pre className="whitespace-pre-wrap leading-relaxed pr-24">
            {activeTab === "rules" && firestoreRulesCode}
            {activeTab === "gemini" && geminiIntegrationCode}
            {activeTab === "functions" && cloudFunctionsCode}
            {activeTab === "schema" && schemaMarkdown}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>Arquivos salvos no projeto: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">/firestore.rules</code> e <code className="font-mono bg-white px-1.5 py-0.5 rounded border">/functions/index.js</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
