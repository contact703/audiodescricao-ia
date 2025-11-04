/**
 * Router para upload de arquivos para S3
 */

import express from "express";
import multer from "multer";
import { storagePut } from "./storage";
import crypto from "crypto";

const router = express.Router();

// Configurar multer para armazenar em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

/**
 * Endpoint para upload de arquivos
 */
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Gerar nome único para o arquivo
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    const extension = req.file.originalname.split(".").pop();
    const key = `audiodescription/videos/${Date.now()}_${randomSuffix}.${extension}`;

    // Upload para S3
    const result = await storagePut(key, req.file.buffer, req.file.mimetype);

    res.json({
      url: result.url,
      key,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro ao fazer upload do arquivo" });
  }
});

export default router;
