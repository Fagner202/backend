import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import atendimentoRoutes from "./src/routes/atendimento.routes.js";
import { pool } from "./src/db/index.js";


// dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/atendimentos", atendimentoRoutes);

const PORT = process.env.PORT || 3000;

// Teste de conexão com o banco
const startServer = async () => {
  try {
    await pool.connect();
    console.log("Banco conectado com sucesso");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
  }
};

startServer();