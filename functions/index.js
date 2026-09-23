/**
 * @file Firebase Cloud Functions (v2) - OdontoGov Municipal
 * Arquitetura completa com Node.js, @google/genai e Firebase Cloud Messaging (FCM)
 */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const { GoogleGenAI, Type } = require("@google/genai");

// Inicializa Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// Configuração padrão de região
setGlobalOptions({ region: "southamerica-east1", maxInstances: 10 });

// ============================================================================
// 1. INTEGRAÇÃO GOOGLE AI STUDIO (GEMINI 3.8 FLASH): TRIAGEM INTELIGENTE
// ============================================================================
/**
 * Cloud Function Callable: triageMaintenanceTicket
 * Recebe: { photoBase64, mimeType, descricao, equipamento }
 * Retorna: JSON { equipamentoIdentificado, nivelUrgencia, justificativaImpacto, sugestaoDiagnostico }
 */
exports.triageMaintenanceTicket = onCall({ cors: true }, async (request) => {
  // Autenticação obrigatória
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "O usuário precisa estar autenticado.");
  }

  const { photoBase64, mimeType, descricao, equipamento } = request.data;

  if (!descricao && !equipamento && !photoBase64) {
    throw new HttpsError("invalid-argument", "Informe ao menos a descrição ou uma foto do defeito.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "A variável GEMINI_API_KEY não está configurada.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
Você é um Engenheiro Clínico e Perito em Manutenção de Equipamentos Odontológicos da Rede Municipal de Saúde (SUS).
Um profissional da Unidade Básica de Saúde (UBS) enviou um chamado de manutenção.

Informações fornecidas:
- Equipamento mencionado: "${equipamento || "Não informado pelo dentista"}"
- Descrição do defeito: "${descricao || "Sem detalhes adicionais"}"

Diretrizes de resposta obrigatórias:
1. equipamentoIdentificado: Identifique com exatidão o equipamento (Ex: Autoclave Hospitalar, Cadeira Odontológica / Equipo, Sugador Cirúrgico, Aparelho de Raio-X Periapical, Compressor Odontológico, Fotopolimerizador, Turbina de Alta Rotação).
2. nivelUrgencia: Classifique estritamente como "Alta", "Média" ou "Baixa", justificando detalhadamente o impacto no atendimento da UBS.
   - Alta: Paralisa atendimento de urgência ou esterilização de materiais na UBS.
   - Média: Interrompe procedimentos específicos com possibilidade de remanejamento temporário.
   - Baixa: Problema secundário ou estético que permite atendimento normal.
3. justificativaImpacto: Explicação clínica e sanitária clara sobre o impacto na unidade.
4. sugestaoDiagnostico: Orientação técnica e prática direcionada ao técnico de manutenção (peças, fiações, válvulas, vedações ou testes preventivos).
`;

    const contents = [];
    const parts = [];

    if (photoBase64) {
      const cleanBase64 = photoBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    parts.push({ text: promptText });
    contents.push({ role: "user", parts });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
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

    const parsedResult = JSON.parse(response.text || "{}");
    return {
      success: true,
      data: parsedResult,
    };
  } catch (error) {
    console.error("Erro na chamada Gemini AI:", error);
    throw new HttpsError("internal", "Erro ao processar triagem no Google Gen AI: " + error.message);
  }
});

// ============================================================================
// 2. onTradeRequested: Notificação Push via FCM ao Dentista Substituto
// ============================================================================
/**
 * Trigger Firestore: disparado quando uma nova solicitação de troca é criada
 * Envia notificação FCM personalizada ao substituto indicado.
 */
exports.onTradeRequested = onDocumentCreated("trocas_escala/{tradeId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const tradeData = snapshot.data();
  const { solicitanteId, substitutoId, scheduleId, motivo } = tradeData;

  try {
    // 1. Busca dados do solicitante e do substituto em paralelo
    const [solicitanteDoc, substitutoDoc, scheduleDoc] = await Promise.all([
      db.collection("users").doc(solicitanteId).get(),
      db.collection("users").doc(substitutoId).get(),
      db.collection("schedules").doc(scheduleId).get(),
    ]);

    if (!substitutoDoc.exists) {
      console.warn(`Substituto ${substitutoId} não encontrado.`);
      return;
    }

    const substituto = substitutoDoc.data();
    const solicitante = solicitanteDoc.data() || { nome: "Colega Dentista" };
    const schedule = scheduleDoc.data() || { data: "Data informada", turno: "Turno" };

    const fcmToken = substituto.fcmToken;
    if (!fcmToken) {
      console.log(`Substituto ${substituto.nome} não possui fcmToken registrado.`);
      return;
    }

    // 2. Envia notificação push via FCM
    const message = {
      token: fcmToken,
      notification: {
        title: "🔄 Proposta de Troca de Escala",
        body: `Dr(a). ${solicitante.nome} solicitou troca de turno (${schedule.data} - ${schedule.turno}).`,
      },
      data: {
        tradeId: event.params.tradeId,
        scheduleId: scheduleId,
        solicitanteId: solicitanteId,
        type: "TRADE_REQUESTED",
        motivo: motivo || "",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "escalas_urgentes",
          color: "#0284c7",
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`FCM enviado com sucesso para ${substituto.nome}:`, response);
  } catch (error) {
    console.error("Erro ao executar onTradeRequested:", error);
  }
});

// ============================================================================
// 3. onTradeApprovedByAdmin: Atualiza Escalas no Firestore e Notifica Ambos
// ============================================================================
/**
 * Trigger Firestore: disparado quando o documento de troca é atualizado
 * Se status mudou para 'aprovado', executa transação Firestore para atualizar
 * o documento de escala e envia notificação de confirmação a ambos.
 */
exports.onTradeApprovedByAdmin = onDocumentUpdated("trocas_escala/{tradeId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Executa apenas quando a troca foi aprovada pelo administrador
  if (before.status !== "aprovado" && after.status === "aprovado") {
    const { scheduleId, solicitanteId, substitutoId } = after;

    try {
      // 1. Transação no Firestore para garantir consistência da escala
      await db.runTransaction(async (transaction) => {
        const scheduleRef = db.collection("schedules").doc(scheduleId);
        const scheduleSnap = await transaction.get(scheduleRef);

        if (!scheduleSnap.exists) {
          throw new Error(`Escala ${scheduleId} não encontrada na transação.`);
        }

        // Atualiza a escala com o novo titular e reseta status para 'confirmado'
        transaction.update(scheduleRef, {
          userId: substitutoId,
          titularOriginalId: solicitanteId,
          status: "confirmado",
          atualizadoPorTrocaId: event.params.tradeId,
          atualizadoEm: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log(`Escala ${scheduleId} transferida com sucesso para o substituto ${substitutoId}`);

      // 2. Busca tokens dos dois profissionais para confirmação
      const [solicitanteDoc, substitutoDoc] = await Promise.all([
        db.collection("users").doc(solicitanteId).get(),
        db.collection("users").doc(substitutoId).get(),
      ]);

      const solicitante = solicitanteDoc.data();
      const substituto = substitutoDoc.data();

      const notificationPromises = [];

      if (solicitante?.fcmToken) {
        notificationPromises.push(
          messaging.send({
            token: solicitante.fcmToken,
            notification: {
              title: "✅ Troca de Escala Aprovada",
              body: `Sua solicitação de troca com Dr(a). ${substituto?.nome || "Colega"} foi confirmada pela coordenação.`,
            },
            data: { type: "TRADE_APPROVED", tradeId: event.params.tradeId },
          })
        );
      }

      if (substituto?.fcmToken) {
        notificationPromises.push(
          messaging.send({
            token: substituto.fcmToken,
            notification: {
              title: "📅 Nova Escala Confirmada",
              body: `A troca de escala com Dr(a). ${solicitante?.nome || "Colega"} foi aprovada. Verifique sua nova escala.`,
            },
            data: { type: "TRADE_CONFIRMED_SUBSTITUTE", tradeId: event.params.tradeId },
          })
        );
      }

      await Promise.allSettled(notificationPromises);
      console.log("Notificações de confirmação enviadas com sucesso.");
    } catch (error) {
      console.error("Erro na execução de onTradeApprovedByAdmin:", error);
    }
  }
});

// ============================================================================
// 4. onTicketCreated: Alerta FCM Multicast para Técnicos em Chamados Críticos
// ============================================================================
/**
 * Trigger Firestore: disparado quando um novo ticket de manutenção é registrado
 * Se prioridade for 'Alta', notifica todos os técnicos cadastrados via FCM.
 */
exports.onTicketCreated = onDocumentCreated("tickets_manutencao/{ticketId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const ticket = snapshot.data();
  const { nivelPrioridade, equipamento, ubsId, descricao } = ticket;

  // Filtra apenas chamados de Alta prioridade
  if (nivelPrioridade === "Alta") {
    try {
      // 1. Busca todos os usuários com cargo 'Técnico' que possuam fcmToken
      const tecnicosSnapshot = await db
        .collection("users")
        .where("cargo", "==", "Técnico")
        .get();

      const tokens = [];
      tecnicosSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      });

      if (tokens.length === 0) {
        console.log("Nenhum técnico com fcmToken registrado para receber o alerta.");
        return;
      }

      // 2. Envio Multicast de Alta Prioridade
      const multicastMessage = {
        tokens,
        notification: {
          title: "🚨 Chamado Crítico Aberto - Manutenção UBS",
          body: `Equipamento: ${equipamento || "Equipamento Odontológico"} na ${ubsId}. Atendimento urgente requerido!`,
        },
        data: {
          ticketId: event.params.ticketId,
          ubsId: ubsId || "",
          prioridade: "Alta",
          tipo: "CRITICAL_TICKET_ALERT",
        },
        android: {
          priority: "high",
          notification: {
            channelId: "manutencao_critica",
            sound: "emergency_alert",
            color: "#dc2626", // Vermelho de emergência
          },
        },
      };

      const response = await messaging.sendEachForMulticast(multicastMessage);
      console.log(`FCM Multicast enviado: ${response.successCount} sucessos, ${response.failureCount} falhas.`);
    } catch (error) {
      console.error("Erro ao enviar alertas FCM em onTicketCreated:", error);
    }
  }
});
