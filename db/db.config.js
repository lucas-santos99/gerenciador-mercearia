const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // 🎯 Usa a Chave Secreta

if (!supabaseUrl || !supabaseKey) {
    console.error("[ERRO CRÍTICO] Variáveis SUPABASE_URL ou SUPABASE_SERVICE_KEY não encontradas no .env do Backend.");
    throw new Error("Faltam variáveis de ambiente no Backend.");
}

// 🎯 Cria o Cliente Admin (Ignora RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

console.log("[INFO] Cliente Admin Supabase (Backend) inicializado.");

// Exporta o cliente admin para ser usado nas rotas
module.exports = supabaseAdmin;

//teste