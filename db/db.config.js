const { Pool } = require('pg');

const pool = new Pool({
    // Lê as novas variáveis (Host, Usuário, Porta) do Render
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    
    // Voltamos à configuração de SSL padrão do Supabase
    ssl: {
        rejectUnauthorized: false
    }
    
    // A linha 'family: 4' FOI REMOVIDA
    // A linha 'server: ...' FOI REMOVIDA
});

// O restante do arquivo (module.exports) permanece igual
module.exports = {
  query: (text, params) => pool.query(text, params),
  
  connect: async () => {
    try {
      const client = await pool.connect();
      console.log("\n[INFO] Conexão com o Supabase (PostgreSQL) estabelecida com sucesso!");
      client.release();
    } catch (err) {
      console.error("[ERRO] Falha ao conectar ao Supabase:", err.message);
      console.error("[ERRO DETALHE] Verifique as variáveis de ambiente do Pooler.");
    }
  }
};