// ===== clienteRoutes.js (ATUALIZADO PARA USAR RPC) ======
const express = require('express');
const db = require('../db/db.config'); // Cliente Supabase Admin
const router = express.Router();

// --- Rota GET: Buscar clientes (PDV Ágil) ---
// (Sem alteração)
router.get('/buscar/:merceariaId', async (req, res) => {
    const { merceariaId } = req.params;
    const { termo } = req.query;
    if (!termo) return res.status(400).json({ error: 'Termo de busca é obrigatório.' });
    try {
        const { data, error } = await db
            .from('clientes')
            .select('id, nome, telefone, saldo_devedor, limite_credito')
            .eq('mercearia_id', merceariaId)
            .or(`nome.ilike.${termo}%,telefone.ilike.${termo}%`)
            .limit(10);
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error(`[ERRO] GET /api/clientes/buscar/${merceariaId}:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});

// --- Rota POST: Criar novo cliente ---
// (Sem alteração)
router.post('/criar', async (req, res) => {
    const { merceariaId, nome, telefone } = req.body;
    if (!merceariaId || !nome) return res.status(400).json({ error: 'Mercearia ID e Nome são obrigatórios.' });
    try {
        const { data, error } = await db
            .from('clientes')
            .insert({ 
                mercearia_id: merceariaId, 
                nome: nome, 
                telefone: telefone || null 
            })
            .select()
            .single();
        if (error) throw error;
        console.log(`[INFO] Novo cliente criado: ${data.nome}`);
        res.status(201).json(data);
    } catch (error) {
        console.error(`[ERRO] POST /api/clientes/criar:`, error.message);
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
});

// --- Rota GET: Listar TODAS as dívidas (Contas a Receber) ---
// (Sem alteração)
router.get('/:merceariaId/dividas', async (req, res) => {
    const { merceariaId } = req.params;
    try {
        const { data, error } = await db
            .from('clientes')
            .select('id, nome, telefone, saldo_devedor, limite_credito, data_vencimento') 
            .eq('mercearia_id', merceariaId)
            .gt('saldo_devedor', 0.01)
            .order('saldo_devedor', { ascending: false });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error(`[ERRO] GET /api/clientes/${merceariaId}/dividas:`, error.message);
        res.status(500).json({ error: 'Erro ao listar dívidas.' });
    }
});

// --- 🎯 Rota POST: Liquidar uma dívida (ATUALIZADA) ---
router.post('/liquidar', async (req, res) => {
    // 1. Recebe TODOS os dados do body
    const { clienteId, merceariaId, valorPago, meioPagamento } = req.body;
    
    if (!clienteId || !valorPago || !meioPagamento || !merceariaId) {
        return res.status(400).json({ error: 'Todos os campos (cliente, mercearia, valor, meio) são obrigatórios.' });
    }

    try {
        // 2. Chama a nova função RPC
        const { data: novoSaldo, error } = await db.rpc('liquidar_fiado', {
            p_cliente_id: clienteId,
            p_mercearia_id: merceariaId,
            p_valor_pago: parseFloat(valorPago),
            p_meio_pagamento: meioPagamento
        });

        if (error) {
            // Se a RPC falhar, repassa o erro (ex: "O valor pago excede...")
            console.error(`[ERRO RPC] /api/clientes/liquidar:`, error.message);
            return res.status(400).json({ error: error.message });
        }
        
        // 3. Sucesso!
        res.status(200).json({ 
            message: 'Pagamento registrado com sucesso.', 
            novo_saldo: novoSaldo 
        });

    } catch (error) {
        // Erro genérico de conexão/servidor
        console.error(`[ERRO] POST /api/clientes/liquidar:`, error.message);
        return res.status(500).json({ error: 'Erro ao registrar pagamento.' });
    }
});

// --- Rota GET: Listar Itens da Dívida (Produtos) ---
// (Sem alteração)
router.get('/:clienteId/itens-fiado', async (req, res) => {
    // ... (código existente)
    const { clienteId } = req.params;
    try {
        const { data, error } = await db
            .rpc('listar_itens_fiado', { p_cliente_id: clienteId });
        if (error) throw error;
        const vendasAgrupadas = data.reduce((acc, item) => {
            if (!acc[item.venda_id]) {
                acc[item.venda_id] = {
                    venda_id: item.venda_id,
                    data_venda: item.data_venda,
                    valor_total: item.valor_total,
                    itens: []
                };
            }
            if (item.produto_nome) { 
                acc[item.venda_id].itens.push({
                    produto_nome: item.produto_nome,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario
                });
            }
            return acc;
        }, {});
        res.status(200).json(Object.values(vendasAgrupadas));
    } catch (error) {
        console.error(`[ERRO] GET /api/clientes/${clienteId}/itens-fiado:`, error.message);
        res.status(500).json({ error: `Erro ao listar itens fiados: ${error.message}` });
    }
});

// --- Rota PUT: Atualizar Cliente ---
// (Sem alteração)
router.put('/atualizar/:clienteId', async (req, res) => {
    // ... (código existente)
    const { clienteId } = req.params;
    const { nome, telefone, limiteCredito, dataVencimento } = req.body; 
    if (!nome) return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
    try {
        const { data, error } = await db
            .from('clientes')
            .update({ 
                nome: nome,
                telefone: telefone || null,
                limite_credito: parseFloat(limiteCredito) || 0,
                data_vencimento: dataVencimento || null
            })
            .eq('id', clienteId)
            .select()
            .single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Cliente não encontrado.' });
        console.log(`[INFO] Cliente atualizado: ${data.nome}`);
        res.status(200).json(data);
    } catch (error) {
        console.error(`[ERRO] PUT /api/clientes/atualizar/${clienteId}:`, error.message);
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
});

// --- Rota DELETE: Excluir Cliente ---
// (Sem alteração)
router.delete('/deletar/:clienteId', async (req, res) => {
    // ... (código existente)
    const { clienteId } = req.params;
    const { merceariaId } = req.query; 
    if (!merceariaId) return res.status(400).json({ error: 'Mercearia ID é obrigatório.' });
    try {
        const { data, error } = await db
            .rpc('deletar_cliente_seguro', {
                p_cliente_id: clienteId,
                p_mercearia_id: merceariaId
            });
        if (error) throw new Error(error.message);
        if (data === true) {
            console.log(`[INFO] Cliente ID ${clienteId} excluído com sucesso.`);
            return res.status(200).json({ message: 'Cliente excluído com sucesso.' });
        } else {
             return res.status(400).json({ error: 'Falha na exclusão. Saldo pendente?' });
        }
    } catch (error) {
        const customError = error.message.includes('Não é possível excluir') 
                            ? error.message 
                            : 'Erro ao tentar excluir cliente.';
        console.error(`[ERRO] DELETE /api/clientes/deletar/${clienteId}:`, error.message);
        return res.status(400).json({ error: customError });
    }
});

// --- Rota GET: Listar TODOS os clientes (O "Caderninho") ---
// (Sem alteração)
router.get('/:merceariaId/todos-clientes', async (req, res) => {
    // ... (código existente)
    const { merceariaId } = req.params;
    try {
        const { data, error } = await db
            .from('clientes')
            .select('id, nome, telefone, saldo_devedor, limite_credito, data_vencimento') 
            .eq('mercearia_id', merceariaId)
            .order('nome', { ascending: true }); 
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error(`[ERRO] GET /api/clientes/${merceariaId}/todos-clientes:`, error.message);
        res.status(500).json({ error: 'Erro ao listar todos os clientes.' });
    }
});

module.exports = router;