const { Pool } = require('pg');
require('dotenv').config();

// const url = new URL(process.env.DATABASE_URL); // REMOVA OU COMENTE ESTA LINHA

const pool = new Pool({
    // Use as variáveis de ambiente separadas
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    
    ssl: {
        rejectUnauthorized: false
    },
    
    // Mantenha a correção do IPv4
    family: 4 
});

// ... (o restante do código permanece igual)

// Exporta as funções para o restante da aplicação
module.exports = {
  query: (text, params) => pool.query(text, params),
  
  // Função 'connect' para testar a conexão na inicialização
  connect: async () => {
    try {
      const client = await pool.connect();
      console.log("\n[INFO] Conexão com o Supabase (PostgreSQL) estabelecida com sucesso!");
      client.release();
    } catch (err) {
      console.error("[ERRO] Falha ao conectar ao Supabase:", err.message);
      console.error("[ERRO DETALHE] Verifique se a DATABASE_URL no seu .env está correta e limpa.");
    }
  }
};