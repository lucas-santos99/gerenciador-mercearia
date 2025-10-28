if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');

// 1. IMPORTA A CONFIGURAÇÃO DO BANCO DE DADOS
const db = require('./db/db.config'); 

const app = express();
// Usamos a porta definida no .env ou a 3001 como padrão
const PORT = process.env.PORT || 3001; 

// 2. Configura Middlewares
app.use(express.json()); 
app.use(cors());

// 3. Rota de Teste
app.get('/', (req, res) => {
    res.status(200).send('Servidor do Gerenciador de Mercearias online!');
});

// 4. Inicia o Servidor e Testa o Banco de Dados
// (Tornamos a função 'async' para poder usar 'await')
app.listen(PORT, async () => { 
    console.log(`\n\n[INFO] Servidor rodando na porta ${PORT}`);
    console.log(`[STATUS] Acesse: http://localhost:${PORT}`);
    
    // 2. CHAMA A FUNÇÃO DE TESTE DE CONEXÃO
    await db.connect(); 

    console.log('\n----------------------------------------\n');
});