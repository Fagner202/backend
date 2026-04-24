import express from "express";
import { create, list, getById } from "../controllers/atendimento.controller.js";

const router = express.Router();

router.post("/", create);
router.get("/", list);
router.get("/:id", getById);

export default router;