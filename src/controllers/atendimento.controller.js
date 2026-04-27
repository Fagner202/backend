import PDFDocument from "pdfkit";
import { criarAtendimento } from "../services/atendimento.service.js";
import { listarAtendimentos } from "../services/atendimento.service.js";
import { buscarAtendimentoPorId } from "../services/atendimento.service.js";

export const create = async (req, res) => {
  try {
    const {
      nome_paciente,
      data_atendimento,
      tipo_exame,
      resultado,
      observacoes,
    } = req.body;

    if (!nome_paciente || !data_atendimento || !tipo_exame || !resultado) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    if (!["APTO", "INAPTO"].includes(resultado)) {
      return res.status(400).json({ error: "Resultado inválido" });
    }

    const atendimento = await criarAtendimento({
      nome_paciente,
      data_atendimento,
      tipo_exame,
      resultado,
      observacoes,
    });

    res.status(201).json(atendimento);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar atendimento" });
  }
};

export const list = async (req, res) => {
  try {
    const atendimentos = await listarAtendimentos();
    res.json(atendimentos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar atendimentos" });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const atendimento = await buscarAtendimentoPorId(id);

    if (!atendimento) {
      return res.status(404).json({ error: "Atendimento não encontrado" });
    }

    res.json(atendimento);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar atendimento" });
  }
};

const fmt = (data) => data ? new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";

const asoLabel = (t) =>
({
  ADMISSIONAL: "Admissional", PERIODICO: "Periódico", DEMISSIONAL: "Demissional",
  RETORNO: "Retorno", MUDANCA_FUNCAO: "Mudança de Função"
}[t] ?? t ?? "—");

const sexoLabel = (s) => ({ M: "Masculino", F: "Feminino", Outro: "Outro" }[s] ?? "—");


// ─── helpers de desenho ───────────────────────────────────────────────────────

function drawTable(doc, rows, x, y, colWidths) {
  const rowH = 24;
  const [w1, w2] = colWidths;

  rows.forEach(([label, value], i) => {
    const ry = y + i * rowH;

    // fundo da célula label
    doc.rect(x, ry, w1, rowH).fillAndStroke("#f9fafb", "#e5e7eb");
    // fundo da célula valor
    doc.rect(x + w1, ry, w2, rowH).fillAndStroke("#ffffff", "#e5e7eb");

    // texto label
    doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold")
      .text(label, x + 8, ry + 7, { width: w1 - 12, ellipsis: true });

    // texto valor
    doc.fillColor("#111827").fontSize(10).font("Helvetica")
      .text(String(value ?? "—"), x + w1 + 8, ry + 7, { width: w2 - 12, ellipsis: true });
  });

  return y + rows.length * rowH;
}

function sectionTitle(doc, text, x, y) {
  doc.fillColor("#9ca3af").fontSize(8).font("Helvetica-Bold")
    .text(text.toUpperCase(), x, y, { characterSpacing: 1.2 });
  doc.moveTo(x, y + 11).lineTo(x + 495, y + 11).lineWidth(0.5).strokeColor("#eeeeee").stroke();
  return y + 18;
}

// ─── controller ──────────────────────────────────────────────────────────────

export const gerarASO = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await buscarAtendimentoPorId(id);

    if (!a) return res.status(404).json({ error: "Atendimento não encontrado" });

    const doc = new PDFDocument({ size: "A4", margin: 0 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=aso-${id}.pdf`);
    doc.pipe(res);

    const M = 52;   // margem lateral
    const W = 495;  // largura útil
    const PAGE_H = 841;

    // ── CABEÇALHO ──────────────────────────────────────────────────────────
    // faixa escura
    doc.rect(0, 0, 595, 80).fill("#0d0f14");

    // nome da clínica
    doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold")
       .text("Clínica Ocupacional", M, 22);
    doc.fillColor("#9ca3af").fontSize(9).font("Helvetica")
       .text("Medicina do Trabalho · CNPJ 00.000.000/0001-00", M, 42);

    // lado direito
    doc.fillColor("#9ca3af").fontSize(8).font("Helvetica")
       .text("DOCUMENTO OFICIAL", 0, 22, { align: "right", width: 595 - M });
    doc.fillColor("#ffffff").fontSize(12).font("Helvetica-Bold")
       .text("Atestado de Saúde Ocupacional", 0, 36, { align: "right", width: 595 - M });
    doc.fillColor("#6b7080").fontSize(9).font("Helvetica")
       .text(`#ASO-${String(id).slice(0, 8).toUpperCase()}`, 0, 52, { align: "right", width: 595 - M });

    // linha separadora
    doc.moveTo(0, 80).lineTo(595, 80).lineWidth(2).strokeColor("#4f8ef7").stroke();

    // ── BANNER DE RESULTADO ────────────────────────────────────────────────
    const isApto = a.resultado === "APTO";
    const bannerColor = isApto ? "#ecfdf5" : "#fef2f2";
    const bannerBorder = isApto ? "#6ee7b7" : "#fca5a5";
    const resultColor  = isApto ? "#059669" : "#dc2626";

    doc.rect(M, 96, W, 52).fillAndStroke(bannerColor, bannerBorder);

    doc.fillColor("#6b7080").fontSize(8).font("Helvetica")
       .text("RESULTADO DO EXAME", M + 14, 104, { characterSpacing: 1 });
    doc.fillColor(resultColor).fontSize(20).font("Helvetica-Bold")
       .text(a.resultado, M + 14, 115);

    doc.fillColor("#6b7080").fontSize(9).font("Helvetica")
       .text(`Emitido em: ${fmt(a.data_atendimento)}`, M + 280, 108)
       .text(`Válido até: ${fmt(a.data_validade) || "—"}`, M + 280, 122);

    // ── SEÇÕES COM TABELAS ─────────────────────────────────────────────────
    let y = 168;

    // Dados do Paciente
    y = sectionTitle(doc, "Dados do Paciente", M, y);
    y = drawTable(doc, [
      ["Nome completo",      a.nome_paciente],
      ["CPF",               a.cpf_paciente],
      ["Data de nascimento", fmt(a.data_nascimento)],
      ["Sexo",              sexoLabel(a.sexo)],
    ], M, y, [180, 315]);
    y += 18;

    // Empresa
    y = sectionTitle(doc, "Empresa", M, y);
    y = drawTable(doc, [
      ["Razão social", a.empresa_nome],
      ["CNPJ",        a.empresa_cnpj],
      ["Cargo",       a.cargo],
      ["Setor",       a.setor],
    ], M, y, [180, 315]);
    y += 18;

    // Exame
    y = sectionTitle(doc, "Exame Realizado", M, y);
    y = drawTable(doc, [
      ["Tipo de ASO",        asoLabel(a.tipo_aso)],
      ["Tipo de exame",      a.tipo_exame],
      ["Data do atendimento", fmt(a.data_atendimento)],
      ["Data de validade",   fmt(a.data_validade)],
    ], M, y, [180, 315]);
    y += 18;

    // Observações
    if (a.observacoes) {
      y = sectionTitle(doc, "Observações", M, y);
      doc.rect(M, y, W, 36).fillAndStroke("#ffffff", "#e5e7eb");
      doc.fillColor("#374151").fontSize(10).font("Helvetica")
         .text(a.observacoes, M + 8, y + 8, { width: W - 16 });
      y += 46;
    }

    // ── ASSINATURAS ────────────────────────────────────────────────────────
    y += 20;
    const sigY = y + 40;
    const sig1x = M;
    const sig2x = M + W / 2 + 20;
    const sigW  = W / 2 - 20;

    doc.moveTo(sig1x, sigY).lineTo(sig1x + sigW, sigY).lineWidth(0.8).strokeColor("#0d0f14").stroke();
    doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold")
       .text(a.medico_nome || "Médico Responsável", sig1x, sigY + 6, { width: sigW, align: "center" });
    doc.fillColor("#888").fontSize(9).font("Helvetica")
       .text(`${a.crm_medico || "CRM"} · Médico Responsável`, sig1x, sigY + 20, { width: sigW, align: "center" });

    doc.moveTo(sig2x, sigY).lineTo(sig2x + sigW, sigY).lineWidth(0.8).strokeColor("#0d0f14").stroke();
    doc.fillColor("#111827").fontSize(11).font("Helvetica-Bold")
       .text(a.nome_paciente, sig2x, sigY + 6, { width: sigW, align: "center" });
    doc.fillColor("#888").fontSize(9).font("Helvetica")
       .text("Paciente", sig2x, sigY + 20, { width: sigW, align: "center" });

    // ── RODAPÉ ─────────────────────────────────────────────────────────────
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    doc.moveTo(M, PAGE_H - 44).lineTo(M + W, PAGE_H - 44).lineWidth(0.5).strokeColor("#eeeeee").stroke();
    doc.fillColor("#bbb").fontSize(9).font("Helvetica")
       .text(`Documento gerado eletronicamente em ${now}`, M, PAGE_H - 34)
       .text("Clínica Ocupacional", 0, PAGE_H - 34, { align: "right", width: 595 - M });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar ASO" });
  }
};