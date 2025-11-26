// ============================================================
//  clienteRoutes.js (COMPLETO, OTIMIZADO E ORGANIZADO)
// ============================================================

const express = require('express');
const db = require('../db/db.config');
const router = express.Router();


// ============================================================
// 1) BUSCAR CLIENTES POR TERMO (PDV / BUSCA RÁPIDA)
// ============================================================
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
        console.error(`[ERRO] Busca rápida clientes:`, error.message);
        res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});


// ============================================================
// 2) ROTA PRINCIPAL — LISTAR CLIENTES (TELA CLIENTES / FIADO)
// ============================================================
// ❗ ESSA É A ROTA QUE SEU FRONTEND CHAMA EM "/Clientes"
router.get('/:merceariaId', async (req, res) => {
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
        console.error(`[ERRO] GET /api/clientes/${merceariaId}:`, error.message);
        res.status(500).json({ error: 'Erro ao carregar clientes.' });
    }
});


// ============================================================
// 3) LISTAR APENAS CLIENTES COM DÍVIDA (FIADO)
// ============================================================
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
        console.error(`[ERRO] Listar dívidas:`, error.message);
        res.status(500).json({ error: 'Erro ao listar dívidas.' });
    }
});


// ============================================================
// 4) CRIAR CLIENTE
// ============================================================
router.post('/criar', async (req, res) => {
    const { merceariaId, nome, telefone } = req.body;

    if (!merceariaId || !nome)
        return res.status(400).json({ error: 'Mercearia ID e Nome são obrigatórios.' });

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

        res.status(201).json(data);

    } catch (error) {
        console.error(`[ERRO] Criar cliente:`, error.message);
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
});


// ============================================================
// 5) LISTAR ITENS DO FIADO (DETALHES)
// ============================================================
router.get('/:clienteId/itens-fiado', async (req, res) => {
    const { clienteId } = req.params;

    try {
        const { data, error } = await db.rpc('listar_itens_fiado', {
            p_cliente_id: clienteId
        });

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
        console.error(`[ERRO] Itens fiado:`, error.message);
        res.status(500).json({ error: 'Erro ao listar itens do fiado.' });
    }
});


// ============================================================
// 6) LIQUIDAR FIADO (RPC NOVA LIQUIDAR_FIADO)
// ============================================================
router.post('/liquidar', async (req, res) => {
    const { clienteId, merceariaId, valorPago, meioPagamento } = req.body;

    if (!clienteId || !merceariaId || !valorPago || !meioPagamento)
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

    try {
        const { data: novoSaldo, error } = await db.rpc('liquidar_fiado', {
            p_cliente_id: clienteId,
            p_mercearia_id: merceariaId,
            p_valor_pago: parseFloat(valorPago),
            p_meio_pagamento: meioPagamento
        });

        if (error) return res.status(400).json({ error: error.message });

        res.status(200).json({
            message: 'Pagamento registrado com sucesso.',
            novo_saldo: novoSaldo
        });

    } catch (error) {
        console.error(`[ERRO] Liquidar fiado:`, error.message);
        res.status(500).json({ error: 'Erro ao registrar pagamento.' });
    }
});


// ============================================================
// 7) ATUALIZAR CLIENTE
// ============================================================
router.put('/atualizar/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    const { nome, telefone, limiteCredito, dataVencimento } = req.body;

    if (!nome)
        return res.status(400).json({ error: 'Nome é obrigatório.' });

    try {
        const { data, error } = await db
            .from('clientes')
            .update({
                nome,
                telefone: telefone || null,
                limite_credito: parseFloat(limiteCredito) || 0,
                data_vencimento: dataVencimento || null
            })
            .eq('id', clienteId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json(data);

    } catch (error) {
        console.error(`[ERRO] Atualizar cliente:`, error.message);
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
});


// ============================================================
// 8) EXCLUIR CLIENTE (RPC deletar_cliente_seguro)
// ============================================================
router.delete('/deletar/:clienteId', async (req, res) => {
    const { clienteId } = req.params;
    const { merceariaId } = req.query;

    if (!merceariaId)
        return res.status(400).json({ error: 'Mercearia ID é obrigatório.' });

    try {
        const { data, error } = await db.rpc('deletar_cliente_seguro', {
            p_cliente_id: clienteId,
            p_mercearia_id: merceariaId
        });

        if (error) throw error;

        if (data === true) {
            return res.status(200).json({ message: 'Cliente excluído com sucesso.' });
        } else {
            return res.status(400).json({ error: 'Não é possível excluir cliente com saldo pendente.' });
        }

    } catch (error) {
        console.error(`[ERRO] Excluir cliente:`, error.message);
        res.status(400).json({
            error: error.message.includes('Não é possível') ? error.message : 'Erro ao excluir cliente.'
        });
    }
});


// ============================================================
// 9) LISTAR TODOS OS CLIENTES (CADERNINHO)
// ============================================================
router.get('/:merceariaId/todos-clientes', async (req, res) => {
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
        console.error(`[ERRO] Listar todos clientes:`, error.message);
        res.status(500).json({ error: 'Erro ao listar todos os clientes.' });
    }
});


// ============================================================
module.exports = router;
