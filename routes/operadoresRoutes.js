// routes/operadoresRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db/supabaseAdmin"); // seu cliente PostgreSQL
const { v4: uuidv4 } = require("uuid");

/* ============================================================
   FUNÇÕES AUXILIARES
   ============================================================ */
async function buscarOperadorPorId(id) {
  const q = await db.query("SELECT * FROM operadores WHERE id = $1", [id]);
  return q.rows[0];
}

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
    // Se usar Supabase Auth — ADAPTAR
    // const { data: user, error } = await supabaseAdmin.auth.api.createUser({
    //   email, password: senha
    // });

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
   5) ALTERAR STATUS: ATIVAR / INATIVAR
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
   6) RESETAR SENHA (ADMIN — MANUAL)
   ============================================================ */
router.put("/admin/operadores/:id/resetar-senha", async (req, res) => {
  const { id } = req.params;
  const { novaSenha } = req.body;

  if (!novaSenha || novaSenha.length < 6)
    return res
      .status(400)
      .json({ error: "Senha deve ter no mínimo 6 caracteres" });

  try {
    // ADAPTAR PARA SUPABASE AUTH → implementar aqui.
    // Exemplo:
    // const op = await buscarOperadorPorId(id);
    // await supabaseAdmin.auth.api.updateUserById(op.auth_id, { password: novaSenha })

    res.json({
      sucesso: true,
      msg: "Senha alterada — implemente a integração com o Auth",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao resetar senha" });
  }
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
   8) ROTAS PARA MERCHANT
   ============================================================ */

// Listar operadores dentro da própria mercearia
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

// Criar operador (merchant)
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

/* ============================================================
   🔍 DIAGNÓSTICO DE USUÁRIO (SEM BLOQUEIO)
   POST /operadores/diagnostico
============================================================ */
router.post("/diagnostico", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "E-mail não informado" });
  }

  try {
    /* ===============================
       1️⃣ VERIFICA OPERADOR
    =============================== */
    const operadorQ = await db.query(
      `SELECT status FROM operadores WHERE email = $1`,
      [email]
    );

    if (operadorQ.rows.length > 0) {
      return res.json({
        tipo: "operador",
        status: operadorQ.rows[0].status,
      });
    }

    /* ===============================
       2️⃣ VERIFICA MERCEARIA
    =============================== */
    const merceariaQ = await db.query(
      `SELECT id FROM mercearias WHERE email = $1`,
      [email]
    );

    if (merceariaQ.rows.length > 0) {
      return res.json({
        tipo: "mercearia",
      });
    }

    /* ===============================
       3️⃣ SE NÃO FOR NENHUM → ADMIN
    =============================== */
    return res.json({
      tipo: "admin",
    });

  } catch (err) {
    console.error("Erro diagnóstico usuário:", err);
    res.status(500).json({ error: "Erro interno no diagnóstico" });
  }
});


module.exports = router;
