// ====== merceariaRoutes.js (COMPLETO) =======
const express = require('express');
const db = require('../db/db.config'); // Cliente Supabase Admin
const router = express.Router();

// --- Rota GET: /:id/produtos/buscar-global ---
router.get('/:id/produtos/buscar-global', async (req, res) => {
    const { id: merceariaId } = req.params;
    const { termo } = req.query; 

    if (!merceariaId || !termo) {
        return res.status(400).json({ error: 'ID da mercearia e Termo de busca são obrigatórios.' });
    }
    try {
        const { data, error } = await db
            .rpc('buscar_produtos_sem_acento', {
                p_mercearia_id: merceariaId,
                p_termo: termo
            });
        if (error) throw error;
        res.status(200).json(data); 
    } catch (error) {
        console.error(`[ERRO] GET /api/mercearias/${merceariaId}/produtos/buscar-global:`, error.message);
        return res.status(500).json({ error: 'Erro ao buscar produto (global).' });
    }
});

// --- Rota GET: /status/:userId (Verificar Assinatura - ATUALIZADA) ---
router.get('/status/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    try {
        const { data: mercearia, error } = await db
            .from('mercearias')
            // 🎯 AGORA TAMBÉM SELECIONA A 'logo_url'
            .select('id, nome_fantasia, status_assinatura, data_vencimento, logo_url')
            .eq('id', userId)
            .single(); 
            
        if (error || !mercearia) return res.status(404).json({ error: 'Mercearia não encontrada.' });
        
        let statusFinal = mercearia.status_assinatura;
        const dataVencimento = mercearia.data_vencimento ? new Date(mercearia.data_vencimento) : null;
        const hoje = new Date();

        if (dataVencimento && dataVencimento < hoje && mercearia.status_assinatura === 'ativa') {
            console.log(`[AVISO] Assinatura expirada para ${mercearia.nome_fantasia}. Atualizando para 'bloqueada'.`);
            await db.from('mercearias').update({ status_assinatura: 'bloqueada' }).eq('id', userId);
            statusFinal = 'bloqueada';
        }
        
        // 🎯 AGORA TAMBÉM RETORNA A 'logo_url'
        res.status(200).json({ 
            status: statusFinal, 
            nome: mercearia.nome_fantasia, 
            logo_url: mercearia.logo_url 
        });
        
    } catch (error) {
        console.error(`[ERRO] GET /api/mercearias/status/${userId}:`, error.message);
        return res.status(500).json({ error: 'Erro ao verificar status da assinatura.' });
    }
});

// --- Rota GET /:id/produtos (Listar) ---
router.get('/:id/produtos', async (req, res) => {
    const merceariaId = req.params.id;
    if (!merceariaId) return res.status(400).json({ error: 'ID da mercearia é obrigatório.' });
    try {
        const { data, error } = await db
            .from('produtos')
            .select(`id, nome, estoque_atual, estoque_minimo, preco_venda, preco_custo, codigo_barras, categoria_id, unidade_medida, categorias ( nome ) `)
             .eq('mercearia_id', merceariaId)
            .order('nome', { ascending: true });
        if (error) throw error; 
        const produtosFormatados = data.map(p => ({...p, nome_categoria: p.categorias ? p.categorias.nome : null }));
        res.status(200).json(produtosFormatados);
    } catch (error) {
        console.error(`[ERRO CRÍTICO] Falha na rota GET produtos:`, error.message);
        return res.status(500).json({ error: 'Erro interno do servidor ao buscar produtos.' });
    }
});

// --- Rota POST /:id/produtos (Adicionar) ---
router.post('/:id/produtos', async (req, res) => {
    const merceariaId = req.params.id;
    const { nome, codigo_barras, estoque_atual, estoque_minimo, preco_custo, preco_venda, categoria_id, unidade_medida } = req.body;
    if (!nome || !preco_venda || estoque_atual === undefined) return res.status(400).json({ error: 'Nome, Preço de Venda e Estoque Atual são obrigatórios.' });
    try {
        const { data, error } = await db
            .from('produtos')
             .insert({
                mercearia_id: merceariaId, nome: nome, codigo_barras: codigo_barras || null,
                estoque_atual: parseFloat(estoque_atual) || 0,
                estoque_minimo: parseFloat(estoque_minimo) || 10,
                preco_custo: parseFloat(preco_custo) || 0,
                 preco_venda: parseFloat(preco_venda),
                categoria_id: categoria_id || null,
                unidade_medida: unidade_medida || 'un'
            })
            .select().single();
        if (error) throw error;
        console.log(`[INFO] Novo produto adicionado: ${data.nome}`);
        res.status(201).json(data);
    } catch (error) {
        console.error(`[ERRO] POST /api/mercearias/${merceariaId}/produtos:`, error.message);
        res.status(500).json({ error: 'Erro ao adicionar produto.' });
    }
});

// --- Rota PUT /:id/produtos/:produtoId (Atualizar) ---
router.put('/:id/produtos/:produtoId', async (req, res) => {
    const { id: merceariaId, produtoId } = req.params;
    const { nome, codigo_barras, estoque_atual, estoque_minimo, preco_custo, preco_venda, categoria_id, unidade_medida } = req.body;
    if (!nome || !preco_venda || estoque_atual === undefined) return res.status(400).json({ error: 'Nome, Preço de Venda e Estoque Atual são obrigatórios.' });
    try {
        const { data, error } = await db
             .from('produtos')
            .update({
                nome: nome, codigo_barras: codigo_barras || null,
                estoque_atual: parseFloat(estoque_atual) || 0,
                estoque_minimo: parseFloat(estoque_minimo) || 10,
                preco_custo: parseFloat(preco_custo) || 0,
                 preco_venda: parseFloat(preco_venda),
                categoria_id: categoria_id || null, 
                unidade_medida: unidade_medida || 'un'
            })
            .eq('id', produtoId)
            .eq('mercearia_id', merceariaId) 
            .select().single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Produto não encontrado.' });
        console.log(`[INFO] Produto atualizado: ${data.nome}`);
        res.status(200).json(data);
    } catch (error) {
        console.error(`[ERRO] PUT /api/mercearias/.../produtos/${produtoId}:`, error.message);
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
});

// --- Rota DELETE /:id/produtos/:produtoId (Excluir) ---
router.delete('/:id/produtos/:produtoId', async (req, res) => {
    const { id: merceariaId, produtoId } = req.params;
    try {
        const { data, error } = await db
            .rpc('deletar_produto', {
                p_produto_id: produtoId,
                p_mercearia_id: merceariaId
             });
        if (error) {
            console.error(`[ERRO] DELETE (RPC) .../produtos/${produtoId}:`, error.message);
            return res.status(500).json({ error: error.message });
        }
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado ou não pertence a esta mercearia.' });
         }
        console.log(`[INFO] Produto excluído (via RPC): ${data[0].nome}`);
        res.status(200).json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
        console.error(`[ERRO] DELETE (Catch) .../produtos/${produtoId}:`, error.message);
        return res.status(500).json({ error: 'Erro ao excluir produto.' });
    }
});

// --- Rota GET /:id/produtos/buscar (Busca PDV) ---
router.get('/:id/produtos/buscar', async (req, res) => {
    const { id: merceariaId } = req.params;
    const { termo } = req.query; 
    if (!merceariaId || !termo) return res.status(400).json({ error: 'ID da mercearia e Termo de busca são obrigatórios.' });
    try {
        const { data, error } = await db
            .from('produtos')
             .select('id, nome, preco_venda, estoque_atual, unidade_medida')
            .eq('mercearia_id', merceariaId)
            .or(`codigo_barras.eq.${termo},nome.ilike.${termo}%`) 
            .limit(10);
        if (error) throw error;
        res.status(200).json(data); 
    } catch (error) {
        console.error(`[ERRO] GET /api/mercearias/${merceariaId}/produtos/buscar:`, error.message);
        return res.status(500).json({ error: 'Erro ao buscar produto.' });
    }
});

// --- Rota POST /register (Registro de Mercearia) ---
router.post('/register', async (req, res) => {
    const { userId, nomeFantasia } = req.body;
    if (!userId || !nomeFantasia) return res.status(400).json({ error: 'ID do usuário e Nome Fantasia são obrigatórios.' });
    try {
        const { data, error } = await db
            .from('mercearias')
            .insert({ id: userId, nome_fantasia: nomeFantasia })
             .select().single();
        if (error) throw error;
        console.log(`[INFO] Nova mercearia registrada: ${data.nome_fantasia}`);
        res.status(201).json({ message: 'Mercearia registrada com sucesso!', mercearia: data });
    } catch (error) {
        console.error("[ERRO] /api/mercearias/register:", error.message);
        if (error.code === '23505') return res.status(409).json({ error: 'Este usuário já possui uma mercearia registrada.' }); 
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// --- ROTA 1: BUSCAR DADOS DA MERCEARIA ---
router.get('/dados/:merceariaId', async (req, res) => {
    const { merceariaId } = req.params;
    if (!merceariaId) return res.status(400).json({ error: 'ID da mercearia é obrigatório.' });

    try {
        const { data, error } = await db
            .from('mercearias')
            .select('nome_fantasia, cnpj, telefone, email_contato, endereco_completo, logo_url')
            .eq('id', merceariaId)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Dados da mercearia não encontrados.' });

        res.status(200).json(data);

    } catch (error) {
        console.error(`[ERRO] GET /api/mercearias/dados/${merceariaId}:`, error.message);
        return res.status(500).json({ error: 'Erro ao buscar dados da mercearia.' });
    }
});

// --- ROTA 2: ATUALIZAR DADOS DA MERCEARIA ---
router.put('/dados/:merceariaId', async (req, res) => {
    const { merceariaId } = req.params;
    const { nome_fantasia, cnpj, telefone, email_contato, endereco_completo, logo_url } = req.body;

    if (!nome_fantasia) return res.status(400).json({ error: 'Nome Fantasia é obrigatório.' });

    try {
        const { data, error } = await db
            .from('mercearias')
            .update({
                nome_fantasia,
                cnpj: cnpj || null,
                telefone: telefone || null,
                email_contato: email_contato || null,
                endereco_completo: endereco_completo || null,
                logo_url: logo_url || null 
            })
            .eq('id', merceariaId)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Mercearia não encontrada para atualizar.' });

        console.log(`[INFO] Dados da mercearia ${data.nome_fantasia} atualizados.`);
        res.status(200).json(data);

    } catch (error) {
        console.error(`[ERRO] PUT /api/mercearias/dados/${merceariaId}:`, error.message);
        return res.status(500).json({ error: 'Erro ao atualizar dados da mercearia.' });
    }
});


module.exports = router;