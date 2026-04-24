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

export const gerarASO = async (req, res) => {
  try {
    const { id } = req.params;

    const atendimento = await buscarAtendimentoPorId(id);

    if (!atendimento) {
      return res.status(404).json({ error: "Atendimento não encontrado" });
    }

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=aso-${id}.pdf`
    );

    doc.pipe(res);

    // Conteúdo do PDF
    doc.fontSize(18).text("ASO - Atestado de Saúde Ocupacional", {
      align: "center",
    });

    doc.moveDown();

    doc.fontSize(12).text(`Nome: ${atendimento.nome_paciente}`);
    doc.text(`Data: ${atendimento.data_atendimento}`);
    doc.text(`Tipo de exame: ${atendimento.tipo_exame}`);
    doc.text(`Resultado: ${atendimento.resultado}`);
    doc.text(`Observações: ${atendimento.observacoes || "-"}`);

    doc.end();
  } catch (error) {
    res.status(500).json({ error: "Erro ao gerar ASO" });
  }
};