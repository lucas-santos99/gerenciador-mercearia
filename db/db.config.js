// Adicione esta linha: 
const { Pool } = require('pg');

// Carrega as variáveis de ambiente (do .env)
require('dotenv').config();

// Transforma a URL de conexão (do .env) em um objeto
const url = new URL(process.env.DATABASE_URL);

// Configura o 'Pool' de conexões usando as partes da URL
const pool = new Pool({
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port,
    database: url.pathname.substring(1),
    
    // Configuração de SSL para o Supabase
    ssl: {
        rejectUnauthorized: false
    }
});

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