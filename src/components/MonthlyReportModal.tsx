import React, { useState, useMemo } from "react";
import {
  Printer,
  X,
  FileText,
  Copy,
  Check,
  Building2,
  Calendar,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
} from "lucide-react";
import type { Schedule, MaintenanceTicket, UBS } from "../types";

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  tickets: MaintenanceTicket[];
  ubss: UBS[];
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  schedules,
  tickets,
  ubss,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [selectedUbs, setSelectedUbs] = useState<string>("all");
  const [includeSchedules, setIncludeSchedules] = useState<boolean>(true);
  const [includeTickets, setIncludeTickets] = useState<boolean>(true);
  const [onlyActiveAndOpen, setOnlyActiveAndOpen] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Filter schedules by month, UBS, and active status
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((s) => {
        const matchMonth = s.data.startsWith(selectedMonth);
        const matchUbs = selectedUbs === "all" || s.ubsId === selectedUbs;
        const matchActive = !onlyActiveAndOpen || s.status === "confirmado";
        return matchMonth && matchUbs && matchActive;
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [schedules, selectedMonth, selectedUbs, onlyActiveAndOpen]);

  // Filter tickets by month, UBS, and open status
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        const matchMonth = t.criadoEm.startsWith(selectedMonth);
        const matchUbs = selectedUbs === "all" || t.ubsId === selectedUbs;
        const matchOpen = !onlyActiveAndOpen || t.status !== "concluido";
        return matchMonth && matchUbs && matchOpen;
      })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [tickets, selectedMonth, selectedUbs, onlyActiveAndOpen]);

  // Month label
  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [selectedMonth]);

  if (!isOpen) return null;

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Copy plain text report
  const handleCopyText = () => {
    let report = `==========================================================\n`;
    report += `SECRETARIA MUNICIPAL DE SAÚDE - DIVISÃO DE SAÚDE BUCAL\n`;
    report += `RELATÓRIO MENSAL DE ESCALAS E MANUTENÇÃO\n`;
    report += `Mês de Referência: ${monthLabel.toUpperCase()}\n`;
    report += `Filtro de UBS: ${selectedUbs === "all" ? "Todas as UBSs" : ubss.find(u => u.id === selectedUbs)?.nome || selectedUbs}\n`;
    report += `Data de Emissão: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}\n`;
    report += `==========================================================\n\n`;

    if (includeSchedules) {
      report += `--- 1. ESCALAS DE TRABALHO ODONTOLÓGICO (${filteredSchedules.length} turnos) ---\n`;
      filteredSchedules.forEach((s, idx) => {
        report += `${idx + 1}. [${s.data}] ${s.turno} (${s.horario}) | ${s.ubsNome}\n`;
        report += `   Profissional: ${s.userNome} (${s.userCargo || "Dentista"}) | Consultório: ${s.consultorio} | Status: ${s.status}\n`;
      });
      report += `\n`;
    }

    if (includeTickets) {
      report += `--- 2. CHAMADOS DE MANUTENÇÃO ODONTOLÓGICA (${filteredTickets.length} chamados) ---\n`;
      filteredTickets.forEach((t, idx) => {
        report += `${idx + 1}. [${new Date(t.criadoEm).toLocaleDateString("pt-BR")}] ${t.equipamento} - Prioridade: ${t.nivelPrioridade} | Status: ${t.status}\n`;
        report += `   UBS: ${t.ubsNome} | Solicitante: ${t.solicitanteNome} | Técnico: ${t.tecnicoNome || "Não atribuído"}\n`;
        report += `   Defeito: ${t.descricao}\n`;
        if (t.diagnosticoIA) {
          report += `   Triagem IA (Gemini): ${t.diagnosticoIA.sugestaoDiagnostico}\n`;
        }
        if (t.relatorioTecnico) {
          report += `   Laudo Técnico: ${t.relatorioTecnico}\n`;
        }
      });
    }

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const highPriorityTicketsCount = filteredTickets.filter(t => t.nivelPrioridade === "Alta").length;
  const completedTicketsCount = filteredTickets.filter(t => t.status === "concluido").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Relatório de Gestão: Escalas Ativas e Chamados em Aberto
              </h3>
              <p className="text-xs text-slate-500">
                Visualização simplificada das escalas ativas e chamados em aberto, configurada para impressão com estilo @media print
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Copiar lista de escalas e chamados em texto puro"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? "Copiado!" : "Copiar Texto"}</span>
            </button>

            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (Hidden on Print) */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Mês:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* UBS filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Unidade:</span>
              <select
                value={selectedUbs}
                onChange={(e) => setSelectedUbs(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">Todas as UBSs ({ubss.length})</option>
                {ubss.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Active / Open Toggle */}
            <label className="flex items-center gap-1.5 text-teal-900 cursor-pointer font-semibold select-none bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              <input
                type="checkbox"
                checked={onlyActiveAndOpen}
                onChange={(e) => setOnlyActiveAndOpen(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Apenas Escalas Ativas & Chamados em Aberto</span>
            </label>
          </div>

          {/* Section toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={includeSchedules}
                onChange={(e) => setIncludeSchedules(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Escalas Ativas ({filteredSchedules.length})</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={includeTickets}
                onChange={(e) => setIncludeTickets(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Chamados em Aberto ({filteredTickets.length})</span>
            </label>
          </div>
        </div>

        {/* Printable Document Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 print:bg-white print:p-0 print:m-0">
          <div
            id="printable-report"
            className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-xs border border-slate-200 print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-900"
          >
            {/* Document Institutional Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 print:border-slate-400 print:text-slate-800">
                      SUS • Sistema Único de Saúde
                    </span>
                    <span className="text-xs text-slate-500">• Município de São Paulo</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    RELATÓRIO DE GESTÃO: ESCALAS ATIVAS E CHAMADOS EM ABERTO
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Secretaria Municipal de Saúde • Divisão de Saúde Bucal & Engenharia Clínica
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500 shrink-0">
                  <p className="font-semibold text-slate-900 capitalize text-sm">{monthLabel}</p>
                  <p className="mt-0.5">Emissão: {new Date().toLocaleDateString("pt-BR")}</p>
                  <p className="text-[11px] text-slate-400">Hora: {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>

              {/* Filter scope indicator */}
              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <span>
                  <strong>Escopo do Relatório:</strong>{" "}
                  {selectedUbs === "all" ? "Todas as Unidades Básicas de Saúde (Rede Geral)" : ubss.find(u => u.id === selectedUbs)?.nome || selectedUbs}
                </span>
                <span>
                  <strong>Classificação:</strong> Documento Oficial Administrativo
                </span>
              </div>
            </div>

            {/* Executive Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center print:bg-white print:border-slate-300">
                <span className="text-xs text-slate-500 font-medium block">Total de Plantões</span>
                <span className="text-xl font-bold text-slate-900">{filteredSchedules.length}</span>
                <span className="text-[10px] text-slate-500 block">Turnos no período</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center print:bg-white print:border-slate-300">
                <span className="text-xs text-slate-500 font-medium block">Chamados Abertos</span>
                <span className="text-xl font-bold text-slate-900">{filteredTickets.length}</span>
                <span className="text-[10px] text-slate-500 block">Manutenções registradas</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center print:bg-white print:border-slate-300">
                <span className="text-xs text-rose-700 font-medium block">Chamados Críticos</span>
                <span className="text-xl font-bold text-rose-600">{highPriorityTicketsCount}</span>
                <span className="text-[10px] text-rose-600 block">Urgência Alta (Parada)</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center print:bg-white print:border-slate-300">
                <span className="text-xs text-emerald-700 font-medium block">Concluídos / Liberados</span>
                <span className="text-xl font-bold text-emerald-600">{completedTicketsCount}</span>
                <span className="text-[10px] text-emerald-600 block">Com laudo técnico</span>
              </div>
            </div>

            {/* SECTION 1: Escalas de Trabalho do Mês */}
            {includeSchedules && (
              <div className="mb-8">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-700 print:text-black" />
                    1. Escala de Plantões & Atendimento Clínico ({filteredSchedules.length})
                  </h2>
                  <span className="text-xs text-slate-500">Mês de {monthLabel}</span>
                </div>

                {filteredSchedules.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Nenhuma escala registrada no período e unidade selecionados.
                  </p>
                ) : (
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
                        {filteredSchedules.map((s) => (
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
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  s.status === "confirmado"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 print:border-none"
                                    : "bg-amber-50 text-amber-800 border border-amber-200 print:border-none"
                                }`}
                              >
                                {s.status.replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: Chamados de Manutenção & Engenharia Clínica */}
            {includeTickets && (
              <div className="mb-8">
                <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-teal-700 print:text-black" />
                    2. Chamados de Manutenção & Triagem Clínica ({filteredTickets.length})
                  </h2>
                  <span className="text-xs text-slate-500">Mês de {monthLabel}</span>
                </div>

                {filteredTickets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Nenhum chamado de manutenção registrado no período e unidade selecionados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-slate-200">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 print:bg-slate-200 print:text-black">
                          <tr>
                            <th className="py-2 px-3 border-r border-slate-200">Abertura</th>
                            <th className="py-2 px-3 border-r border-slate-200">Equipamento</th>
                            <th className="py-2 px-3 border-r border-slate-200">UBS</th>
                            <th className="py-2 px-3 border-r border-slate-200">Prioridade</th>
                            <th className="py-2 px-3 border-r border-slate-200">Técnico Designado</th>
                            <th className="py-2 px-3 text-center">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredTickets.map((t) => (
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
                                      t.status === "concluido"
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : t.status === "em_atendimento"
                                        ? "bg-amber-50 text-amber-800 border border-amber-200"
                                        : "bg-rose-50 text-rose-800 border border-rose-200"
                                    }`}
                                  >
                                    {t.status.replace("_", " ")}
                                  </span>
                                </td>
                              </tr>
                              {/* Sub-row with technical details and AI diagnosis */}
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
                                  {t.relatorioTecnico && (
                                    <p className="text-emerald-900 font-semibold">
                                      ✓ Laudo Técnico de Conclusão: {t.relatorioTecnico}
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
                )}
              </div>
            )}

            {/* Institutional Signatures Section for Official Document Print */}
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
              OdontoGov Municipal • Sistema Integrado de Saúde Bucal • Relatório gerado eletronicamente em conformidade com as diretrizes do SUS.
            </div>

          </div>
        </div>

        {/* Modal Bottom Bar (Hidden on Print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
          <span className="text-slate-500">
            Dica: Para gerar um PDF limpo, clique em <strong>Imprimir / Salvar PDF</strong> e selecione "Salvar como PDF" como destino.
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
