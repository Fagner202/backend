import express from "express";
import { create, list, getById, gerarASO } from "../controllers/atendimento.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", list);
router.get("/:id", getById);
router.get("/:id/aso", gerarASO);

export default router;