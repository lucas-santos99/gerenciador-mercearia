// ===== server.js (CORRIGIDO) =====

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const db = require('./db/db.config'); //

// --- 1. IMPORTAÇÃO DAS ROTAS ---
const merceariaRoutes = require('./routes/merceariaRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const clienteRoutes = require('./routes/clienteRoutes'); 
const financeiroRoutes = require('./routes/financeiroRoutes'); // 🎯 LINHA ADICIONADA

const app = express();
const PORT = process.env.PORT || 3001;

// --- 2. MIDDLEWARES ---
app.use(express.json({ limit: '10mb' })); 
app.use(cors());

// --- 3. USO DAS ROTAS ---
app.use('/api/mercearias', merceariaRoutes); 
app.use('/api/categorias', categoriaRoutes);
app.use('/api/vendas', vendaRoutes); //
app.use('/api/clientes', clienteRoutes); 
app.use('/api/financeiro', financeiroRoutes); // 🎯 LINHA ADICIONADA

// --- 4. ROTA DE TESTE ---
app.get('/', (req, res) => {
    res.status(200).send('Servidor do Gerenciador de Mercearias online!');
});

// --- 5. INÍCIO DO SERVIDOR ---
app.listen(PORT, () => { 
    console.log(`\n\n[INFO] Servidor rodando na porta ${PORT}`);
    console.log(`[STATUS] Acesse: http://localhost:${PORT}`);
    console.log('\n----------------------------------------\n');
});