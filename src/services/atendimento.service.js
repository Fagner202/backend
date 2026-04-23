import { pool } from "../db/index.js";

export const criarAtendimento = async (data) => {
  const query = `
    INSERT INTO atendimentos 
    (nome_paciente, data_atendimento, tipo_exame, resultado, observacoes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    data.nome_paciente,
    data.data_atendimento,
    data.tipo_exame,
    data.resultado,
    data.observacoes,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};