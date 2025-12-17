// routes/operadoresRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/supabaseAdmin");
const { v4: uuidv4 } = require("uuid");

/* ============================================================
   FUNÇÕES AUXILIARES
============================================================ */
async function buscarOperadorPorId(id) {
  const q = await db.query("SELECT * FROM operadores WHERE id = $1", [id]);
  return q.rows[0];
}

/* ============================================================
   🔐 VALIDAR ACESSO DO OPERADOR (LOGIN)
   POST /operadores/validar-acesso
============================================================ */
router.post("/validar-acesso", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Usuário inválido" });
  }

  try {
    const q = await db.query(
      `SELECT id, status
       FROM operadores
       WHERE id = $1`,
      [userId]
    );

    const operador = q.rows[0];

    if (!operador) {
      return res.status(403).json({
        error: "Usuário não vinculado a um operador",
      });
    }

    if (operador.status !== "ativo") {
      return res.status(403).json({
        error:
          "Seu acesso está desativado. Entre em contato com o administrador.",
      });
    }

    // ✅ acesso liberado
    res.json({ success: true });
  } catch (err) {
    console.error("Erro validar acesso:", err);
    res.status(500).json({ error: "Erro interno ao validar acesso" });
  }
});

/* ============================================================
   1) LISTAR OPERADORES DE UMA MERCEARIA (ADMIN + MERCHANT)
============================================================ */
router.get("/admin/operadores/:merceariaId", async (req, res) => {
  const { merceariaId } = req.params;
  try {
    const q = await db.query(
      `SELECT id, mercearia_id, nome, email, telefone, status, created_at
       FROM operadores
       WHERE mercearia_id = $1
       ORDER BY nome`,
      [merceariaId]
    );
    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar operadores" });
  }
});

/* ============================================================
   2) DETALHES DO OPERADOR
============================================================ */
router.get("/admin/operadores/detalhes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const op = await buscarOperadorPorId(id);
    if (!op) return res.status(404).json({ error: "Operador não encontrado" });

    res.json(op);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar operador" });
  }
});

/* ============================================================
   3) CRIAR OPERADOR (ADMIN)
============================================================ */
router.post("/admin/operadores/criar", async (req, res) => {
  const { mercearia_id, nome, email, telefone, senha } = req.body;

  if (!nome || !email)
    return res.status(400).json({ error: "Nome e email são obrigatórios" });

  try {
    const newId = uuidv4();

    await db.query(
      `INSERT INTO operadores (id, mercearia_id, nome, email, telefone, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ativo', NOW())`,
      [newId, mercearia_id, nome, email, telefone || null]
    );

    res.status(201).json({ sucesso: true, id: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar operador" });
  }
});

/* ============================================================
   4) EDITAR OPERADOR
============================================================ */
router.put("/admin/operadores/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, status } = req.body;

  try {
    const op = await buscarOperadorPorId(id);
    if (!op) return res.status(404).json({ error: "Operador não encontrado" });

    await db.query(
      `UPDATE operadores
       SET nome=$1, email=$2, telefone=$3, status=$4, updated_at = NOW()
       WHERE id=$5`,
      [nome, email, telefone || null, status, id]
    );

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao editar operador" });
  }
});

/* ============================================================
   5) ALTERAR STATUS
============================================================ */
router.put("/admin/operadores/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["ativo", "inativo"].includes(status))
    return res.status(400).json({ error: "Status inválido" });

  try {
    await db.query(
      `UPDATE operadores
       SET status=$1, updated_at = NOW()
       WHERE id=$2`,
      [status, id]
    );

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

/* ============================================================
   6) RESETAR SENHA (placeholder)
============================================================ */
router.put("/admin/operadores/:id/resetar-senha", async (req, res) => {
  res.json({
    sucesso: true,
    msg: "Integração com Auth será feita depois",
  });
});

/* ============================================================
   7) EXCLUIR OPERADOR
============================================================ */
router.delete("/admin/operadores/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM operadores WHERE id = $1", [id]);
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir operador" });
  }
});

/* ============================================================
   8) ROTAS MERCHANT
============================================================ */
router.get("/mercearia/:id/operadores", async (req, res) => {
  const { id: merceariaId } = req.params;

  try {
    const q = await db.query(
      `SELECT id, nome, email, telefone, status, created_at
       FROM operadores
       WHERE mercearia_id = $1
       ORDER BY nome`,
      [merceariaId]
    );

    res.json(q.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar operadores da mercearia" });
  }
});

router.post("/mercearia/:id/operadores/criar", async (req, res) => {
  const { id: merceariaId } = req.params;
  const { nome, email, telefone } = req.body;

  if (!nome || !email)
    return res.status(400).json({ error: "Nome e email são obrigatórios" });

  try {
    const newId = uuidv4();

    await db.query(
      `INSERT INTO operadores (id, mercearia_id, nome, email, telefone, status, created_at)
       VALUES ($1,$2,$3,$4,$5,'ativo',NOW())`,
      [newId, merceariaId, nome, email, telefone || null]
    );

    res.status(201).json({ sucesso: true, id: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar operador (merchant)" });
  }
});

module.exports = router;
