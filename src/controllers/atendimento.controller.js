import { criarAtendimento } from "../services/atendimento.service.js";

export const create = async (req, res) => {
  try {
    const atendimento = await criarAtendimento(req.body);
    res.status(201).json(atendimento);
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar atendimento" });
  }
};