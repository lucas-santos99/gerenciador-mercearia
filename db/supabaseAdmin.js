// ========================
//  supabaseAdmin.js (corrigido)
// ========================

const { createClient } = require('@supabase/supabase-js');

// 🔒 Carrega variáveis localmente apenas fora da produção
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // 🔑 CHAVE SERVICE ROLE (Admin)

// -------------------------------------------------------
// 🔍 VERIFICAÇÃO CRÍTICA — IMPOSSÍVEL RODAR SEM ESSAS VARIÁVEIS
// -------------------------------------------------------
if (!supabaseUrl || !supabaseKey) {
    console.error("\n❌ ERRO FATAL: Variáveis de ambiente do SUPABASE não foram encontradas.");
    console.error(" Necessário definir no backend:");
    console.error("   ➥ SUPABASE_URL");
    console.error("   ➥ SUPABASE_SERVICE_KEY\n");

    throw new Error("Variáveis SUPABASE_URL ou SUPABASE_SERVICE_KEY faltando no backend");
}

// -------------------------------------------------------
// 🔥 CRIA O CLIENTE ADMIN (IGNORA RLS)
// -------------------------------------------------------
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// -------------------------------------------------------
// 🔐 LOG SEGURO
// -------------------------------------------------------
if (process.env.NODE_ENV !== 'production') {
    console.log("[INFO] Supabase Admin inicializado no backend.");
} else {
    console.log("[INFO] Supabase Admin pronto (produção).");
}

// -------------------------------------------------------
module.exports = supabaseAdmin;
