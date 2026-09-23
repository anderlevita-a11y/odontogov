import React, { useEffect, useState } from "react";
import { Printer, X, FileText, CheckCircle, AlertTriangle, Calendar, Wrench, RefreshCw } from "lucide-react";
import type { Schedule, MaintenanceTicket, UBS } from "../types";

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  tickets: MaintenanceTicket[];
  ubss: UBS[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  schedules,
  tickets,
  ubss,
}) => {
  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "success">("idle");

  const handlePrint = () => {
    setPrintStatus("printing");

    const triggerDirectPrint = () => {
      try {
        window.focus();
        window.print();
        setPrintStatus("success");
        setTimeout(() => setPrintStatus("idle"), 2500);
        return true;
      } catch (err) {
        console.warn("Direct window.print() failed:", err);
        setPrintStatus("idle");
        return false;
      }
    };

    const triggerIframePrint = () => {
      try {
        const reportElement = document.getElementById("printable-report");
        if (!reportElement) return false;

        let printIframe = document.getElementById("report-print-iframe") as HTMLIFrameElement | null;
        if (!printIframe) {
          printIframe = document.createElement("iframe");
          printIframe.id = "report-print-iframe";
          printIframe.setAttribute(
            "style",
            "position:fixed; top:-9999px; left:-9999px; width:0; height:0; border:0; visibility:hidden;"
          );
          document.body.appendChild(printIframe);
        }

        const frameDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
        if (!frameDoc) return false;

        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Relatório de Gestão - Saúde Bucal</title>
            <style>
              @page { size: A4 portrait; margin: 10mm 12mm; }
              * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 12px; color: #0f172a; background: #fff; font-size: 11px; }
              table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 12px; }
              th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 11px; }
              th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
              tr { page-break-inside: avoid; }
              .bg-slate-50 { background-color: #f8fafc; }
              .bg-slate-100 { background-color: #f1f5f9; }
              .bg-teal-50 { background-color: #f0fdfa; }
              .bg-teal-600 { background-color: #0d9488; color: white; }
              .bg-emerald-50 { background-color: #ecfdf5; }
              .bg-emerald-100 { background-color: #d1fae5; }
              .bg-rose-50 { background-color: #fff1f2; }
              .bg-rose-100 { background-color: #ffe4e6; }
              .bg-amber-50 { background-color: #fffbeb; }
              .text-teal-700 { color: #0f766e; }
              .text-teal-800 { color: #115e59; }
              .text-emerald-700 { color: #047857; }
              .text-emerald-800 { color: #065f46; }
              .text-rose-600 { color: #e11d48; }
              .text-rose-700 { color: #be123c; }
              .text-rose-800 { color: #9f1239; }
              .text-amber-700 { color: #b45309; }
              .text-slate-500 { color: #64748b; }
              .text-slate-600 { color: #475569; }
              .text-slate-700 { color: #334155; }
              .text-slate-900 { color: #0f172a; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .font-mono { font-family: monospace; }
              .grid { display: grid; }
              .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
              .gap-3 { gap: 0.75rem; }
              .gap-4 { gap: 1rem; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .border { border: 1px solid #e2e8f0; }
              .rounded-xl { border-radius: 0.75rem; }
              .rounded-lg { border-radius: 0.5rem; }
              .p-4 { padding: 1rem; }
              .p-6 { padding: 1.5rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .print\\:hidden { display: none !important; }
            </style>
          </head>
          <body>
            ${reportElement.innerHTML}
          </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          try {
            printIframe?.contentWindow?.focus();
            printIframe?.contentWindow?.print();
            setPrintStatus("success");
          } catch (e) {
            console.warn("Iframe print error:", e);
            triggerDirectPrint();
          } finally {
            setTimeout(() => setPrintStatus("idle"), 2500);
          }
        }, 200);

        return true;
      } catch (err) {
        console.error("Iframe print failed:", err);
        return false;
      }
    };

    try {
      const isInsideIframe = window.self !== window.top;
      if (isInsideIframe) {
        const success = triggerIframePrint();
        if (!success) triggerDirectPrint();
      } else {
        triggerDirectPrint();
      }
    } catch {
      triggerDirectPrint();
    }
  };

  // Safely trigger window.print() when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeSchedules = schedules.filter((s) => s.status === "confirmado");
  const openTickets = tickets.filter((t) => t.status !== "concluido");
  const criticalTickets = tickets.filter((t) => t.nivelPrioridade === "Alta" && t.status !== "concluido");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Top Action Bar (Hidden on print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-600 text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Relatório de Gestão Consolidado (Impressão)
              </h3>
              <p className="text-xs text-slate-500">
                Visualização formatada para impressão direta e exportação em PDF via navegador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-acionar-impressao"
              onClick={handlePrint}
              disabled={printStatus === "printing"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-75"
              title="Disparar janela de impressão ou salvar como PDF"
            >
              {printStatus === "printing" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando para Impressora...</span>
                </>
              ) : printStatus === "success" ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>Impressão Disparada!</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable container for preview */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:m-0">
          {/* Printable Report Container with id="printable-report" for @media print styles */}
          <div
            id="printable-report"
            className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-xs border border-slate-200 print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-900"
          >
            {/* Institutional Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 print:border-slate-400 print:text-slate-800">
                      SUS • Sistema Único de Saúde
                    </span>
                    <span className="text-xs text-slate-500">• Rede Municipal Odontológica</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    RELATÓRIO DE GESTÃO: ESCALAS ATIVAS E CHAMADOS EM ABERTO
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Secretaria Municipal de Saúde • Coordenação de Saúde Bucal & Engenharia Clínica
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500 shrink-0">
                  <p className="font-semibold text-slate-900">Emissão Oficial</p>
                  <p className="mt-0.5">Data: {new Date().toLocaleDateString("pt-BR")}</p>
                  <p className="text-[11px] text-slate-400">
                    Hora: {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick KPI Indicators */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center print:bg-white print:border-slate-300">
                <span className="text-xs text-slate-500 font-medium block">Escalas Ativas</span>
                <span className="text-xl font-bold text-slate-900">{activeSchedules.length}</span>
                <span className="text-[10px] text-slate-500 block">Turnos confirmados</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center print:bg-white print:border-slate-300">
                <span className="text-xs text-slate-500 font-medium block">Chamados em Aberto</span>
                <span className="text-xl font-bold text-amber-600">{openTickets.length}</span>
                <span className="text-[10px] text-slate-500 block">Pendente / Em atendimento</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center print:bg-white print:border-slate-300">
                <span className="text-xs text-rose-700 font-medium block">Chamados Críticos</span>
                <span className="text-xl font-bold text-rose-600">{criticalTickets.length}</span>
                <span className="text-[10px] text-rose-600 block">Prioridade Alta (Parada)</span>
              </div>
            </div>

            {/* Tabela Consolidada 1: Escalas Ativas */}
            <div className="mb-8">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-700 print:text-black" />
                  1. Escalas Ativas de Atendimento Clínico ({activeSchedules.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 print:bg-slate-200 print:text-black">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-200">Data</th>
                      <th className="py-2 px-3 border-r border-slate-200">Turno & Horário</th>
                      <th className="py-2 px-3 border-r border-slate-200">UBS</th>
                      <th className="py-2 px-3 border-r border-slate-200">Profissional Escalado</th>
                      <th className="py-2 px-3 border-r border-slate-200">Consultório</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeSchedules.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                        <td className="py-2 px-3 font-mono font-medium whitespace-nowrap border-r border-slate-200">
                          {new Date(s.data + "T12:00:00Z").toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            weekday: "short",
                          })}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap border-r border-slate-200">
                          <span className="font-semibold">{s.turno}</span>{" "}
                          <span className="text-slate-500 text-[11px]">({s.horario})</span>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-800">
                          {s.ubsNome}
                        </td>
                        <td className="py-2 px-3 font-semibold border-r border-slate-200">
                          {s.userNome}
                          {s.titularOriginalId && (
                            <span className="block text-[10px] text-teal-700 font-normal">
                              ✓ Permuta chancelada
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                          {s.consultorio}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 print:border-none">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela Consolidada 2: Chamados em Aberto */}
            <div className="mb-8">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-teal-700 print:text-black" />
                  2. Chamados de Manutenção em Aberto ({openTickets.length})
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 print:bg-slate-200 print:text-black">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-200">Abertura</th>
                      <th className="py-2 px-3 border-r border-slate-200">Equipamento</th>
                      <th className="py-2 px-3 border-r border-slate-200">UBS</th>
                      <th className="py-2 px-3 border-r border-slate-200">Prioridade</th>
                      <th className="py-2 px-3 border-r border-slate-200">Técnico Designado</th>
                      <th className="py-2 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {openTickets.map((t) => (
                      <React.Fragment key={t.id}>
                        <tr className="hover:bg-slate-50 print:hover:bg-transparent font-medium">
                          <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap border-r border-slate-200">
                            {new Date(t.criadoEm).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                            {t.equipamento}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                            {t.ubsNome}
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.nivelPrioridade === "Alta"
                                  ? "bg-rose-100 text-rose-800"
                                  : t.nivelPrioridade === "Média"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
                            >
                              {t.nivelPrioridade}
                            </span>
                          </td>
                          <td className="py-2 px-3 border-r border-slate-200 text-slate-700">
                            {t.tecnicoNome || "Não atribuído"}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.status === "em_atendimento"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                        <tr className="bg-slate-50/70 text-[11px] text-slate-600 print:bg-transparent">
                          <td colSpan={6} className="px-3 py-2 border-b border-slate-200 space-y-1">
                            <p>
                              <strong className="text-slate-700">Relato do Solicitante ({t.solicitanteNome}):</strong>{" "}
                              <span className="italic">"{t.descricao}"</span>
                            </p>
                            {t.diagnosticoIA && (
                              <p className="text-slate-700">
                                <strong>Triagem IA (Gemini):</strong> {t.diagnosticoIA.justificativaImpacto} —{" "}
                                <span className="text-teal-900 font-semibold">{t.diagnosticoIA.sugestaoDiagnostico}</span>
                              </p>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                <p className="font-bold text-slate-900">Dra. Silvana Rocha</p>
                <p className="text-[11px] text-slate-500">Coordenadora Municipal de Saúde Bucal</p>
                <p className="text-[10px] text-slate-400">CRO-SP 72.109 / SMS-SP</p>
              </div>

              <div>
                <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                <p className="font-bold text-slate-900">Marcos Rocha</p>
                <p className="text-[11px] text-slate-500">Responsável Técnico de Engenharia Clínica</p>
                <p className="text-[10px] text-slate-400">CFT-SP 55.409 / Manutenção</p>
              </div>
            </div>

            {/* Document Footer */}
            <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center">
              OdontoGov Municipal • Relatório gerado eletronicamente em conformidade com as diretrizes do SUS.
            </div>

          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
          <span className="text-slate-500">
            Formato configurado para papel A4 e saída PDF com estilos <code>@media print</code>.
          </span>
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
