import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "25mb" }));

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "OdontoGov Municipal API", timestamp: new Date().toISOString() });
  });

  // Triagem Inteligente de Manutenção com Gemini 3.8 Flash
  app.post("/api/triage", async (req, res) => {
    try {
      const { photoBase64, mimeType, descricao, equipamento } = req.body;

      if (!descricao && !equipamento) {
        return res.status(400).json({ error: "Descrição do problema ou equipamento é obrigatória." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = `
Você é um Engenheiro Clínico e Especialista em Equipamentos Odontológicos da Rede Municipal de Saúde (SUS).
Sua tarefa é analisar o chamado de manutenção aberto por um dentista de uma Unidade Básica de Saúde (UBS).

Dados informados pelo solicitante:
- Equipamento citado: "${equipamento || "Não especificado"}"
- Relato do defeito/problema: "${descricao || "Sem relato adicional"}"

Diretrizes de Avaliação:
1. "equipamentoIdentificado": Identifique com precisão o equipamento odontológico (Ex: Autoclave Hospitalar, Cadeira Odontológica / Equipo, Sugador Cirúrgico / Bomba de Vácuo, Aparelho de Raio-X Periapical, Compressor Odontológico, Fotopolimerizador, Caneta de Alta Rotação / Turbina, Contra-ângulo).
2. "nivelUrgencia": Avalie estritamente entre "Alta", "Média" ou "Baixa".
   - Alta: impede totalmente atendimentos de urgência ou esterilização da UBS (ex: Autoclave parou, falta de ar no compressor, cadeira sem energia, vazamento grave).
   - Média: afeta procedimentos específicos com possibilidade de remanejamento temporário (ex: fotopolimerizador, ponta de sucção com baixa pressão, refletor piscando).
   - Baixa: problema estético, regulagem leve ou manutenção preventiva que não paralisa o atendimento clínico.
3. "justificativaImpacto": Explique objetivamente como essa falha impacta o fluxo de pacientes e biossegurança da UBS.
4. "sugestaoDiagnostico": Forneça uma breve orientação técnica, objetiva e prática para o técnico de manutenção biomédico verificar (fusíveis, válvulas, mangueiras, pressostato, selagem, placa eletrônica, etc).

Retorne exclusivamente o JSON especificado.
`;

        const contents: any[] = [];
        const parts: any[] = [];

        if (photoBase64) {
          // Clean base64 string if data URL prefix exists
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
                equipamentoIdentificado: {
                  type: Type.STRING,
                  description: "Nome padronizado do equipamento odontológico identificado",
                },
                nivelUrgencia: {
                  type: Type.STRING,
                  enum: ["Alta", "Média", "Baixa"],
                  description: "Nível de urgência baseado no impacto no atendimento da UBS",
                },
                justificativaImpacto: {
                  type: Type.STRING,
                  description: "Justificativa do impacto no fluxo e biossegurança da UBS",
                },
                sugestaoDiagnostico: {
                  type: Type.STRING,
                  description: "Breve orientação técnica para o técnico de manutenção",
                },
              },
              required: ["equipamentoIdentificado", "nivelUrgencia", "sugestaoDiagnostico"],
            },
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({
            success: true,
            data: parsed,
            modelUsed: "gemini-3.8-flash",
          });
        }
      }

      // Intelligent clinical fallback if no API key is set
      const descLower = (descricao || "").toLowerCase();
      const equipLower = (equipamento || "").toLowerCase();

      let detectedEquip = "Cadeira Odontológica";
      let urgency: "Alta" | "Média" | "Baixa" = "Média";
      let impact = "Possível redução na capacidade de atendimento clínico na UBS.";
      let diagnosis = "Verificar alimentação elétrica geral e conexões hidráulicas.";

      if (descLower.includes("autoclave") || equipLower.includes("autoclave") || descLower.includes("pressão") || descLower.includes("esteriliza")) {
        detectedEquip = "Autoclave Hospitalar";
        urgency = "Alta";
        impact = "Interrupção crítica do ciclo de esterilização; risco de cancelamento de todas as consultas da UBS.";
        diagnosis = "Testar vedação da borracha da porta, sensor de pressão e válvula solenoide de despressurização.";
      } else if (descLower.includes("compressor") || equipLower.includes("compressor") || descLower.includes("ar comprimido")) {
        detectedEquip = "Compressor Odontológico de Ar";
        urgency = "Alta";
        impact = "Sem ar comprimido na bancada, nenhuma turbina ou seringa tríplice funciona nos consultórios.";
        diagnosis = "Verificar pressostato, dreno de condensado e corrente do relé térmico do motor.";
      } else if (descLower.includes("sugador") || equipLower.includes("sugador") || descLower.includes("vácuo") || descLower.includes("sucção")) {
        detectedEquip = "Bomba de Vácuo / Sugador Cirúrgico";
        urgency = "Alta";
        impact = "Impede cirurgias e procedimentos invasivos com controle de aerossóis na UBS.";
        diagnosis = "Limpar filtro coletor de detritos da bomba de sucção e testar motor/válvula de retenção.";
      } else if (descLower.includes("raio-x") || descLower.includes("raiox") || equipLower.includes("raio")) {
        detectedEquip = "Aparelho de Raio-X Periapical";
        urgency = "Média";
        impact = "Impossibilita diagnósticos endodônticos e cirúrgicos imediatos, exigindo encaminhamento ao CEO.";
        diagnosis = "Checar cabo disparador espiralado, cabeçote colimador e circuito do temporizador eletrônico.";
      } else if (descLower.includes("fotopolimerizador") || equipLower.includes("foto")) {
        detectedEquip = "Fotopolimerizador LED Odontológico";
        urgency = "Média";
        impact = "Impede restaurações diretas em resina composta; atendimentos restauradores suspensos.";
        diagnosis = "Testar intensidade com radiômetro, bateria recarregável e ponteira de fibra óptica por trincas.";
      }

      return res.json({
        success: true,
        data: {
          equipamentoIdentificado: detectedEquip,
          nivelUrgencia: urgency,
          justificativaImpacto: impact,
          sugestaoDiagnostico: diagnosis,
        },
        modelUsed: "clinical-expert-fallback",
      });
    } catch (err: any) {
      console.error("Erro na triagem Gemini:", err);
      return res.status(500).json({
        error: "Falha ao processar triagem com IA: " + (err.message || String(err)),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OdontoGov Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
