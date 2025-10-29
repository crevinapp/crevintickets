require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTableAndAdmin() {
  console.log('🔧 Criando estrutura administrativa...\n');

  try {
    // 1. Criar a tabela admin_users diretamente
    console.log('📝 Criando tabela admin_users...');
    
    const createTableQuery = `
      -- Criar tabela admin_users
      CREATE TABLE IF NOT EXISTS public.admin_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        access_level TEXT NOT NULL CHECK (access_level IN ('admin', 'super_admin', 'moderator')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

    const { error: tableError } = await supabase.rpc('exec', { sql: createTableQuery });
    
    if (tableError) {
      console.log('⚠️ Aviso na criação da tabela:', tableError.message);
    } else {
      console.log('✅ Tabela admin_users criada');
    }

    // 2. Habilitar RLS
    console.log('🔒 Configurando segurança...');
    const rlsQuery = `
      ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
      
      -- Política para leitura
      DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
      CREATE POLICY "Admins can read admin_users" ON public.admin_users
        FOR SELECT USING (auth.role() = 'authenticated');
    `;

    const { error: rlsError } = await supabase.rpc('exec', { sql: rlsQuery });
    
    if (rlsError) {
      console.log('⚠️ Aviso na configuração RLS:', rlsError.message);
    } else {
      console.log('✅ RLS configurado');
    }

    // 3. Buscar o usuário existente
    console.log('👤 Buscando usuário...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError.message);
      return;
    }

    const adminUser = users.users.find(user => user.email === 'mayconreis2030@gmail.com');
    
    if (!adminUser) {
      console.error('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', adminUser.id);

    // 4. Inserir na tabela admin_users usando SQL direto
    console.log('👑 Adicionando privilégios administrativos...');
    
    const insertAdminQuery = `
      INSERT INTO public.admin_users (user_id, name, access_level, is_active)
      VALUES ('${adminUser.id}', 'Desenvolvedor', 'super_admin', true)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        access_level = EXCLUDED.access_level,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `;

    const { error: insertError } = await supabase.rpc('exec', { sql: insertAdminQuery });
    
    if (insertError) {
      console.error('❌ Erro ao inserir administrador:', insertError.message);
      return;
    }

    console.log('✅ Privilégios administrativos configurados!');

    // 5. Verificar se foi inserido corretamente
    console.log('🔍 Verificando configuração...');
    const { data: adminCheck, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', adminUser.id)
      .single();

    if (checkError) {
      console.log('⚠️ Não foi possível verificar via client, mas SQL foi executado');
    } else {
      console.log('✅ Verificação concluída:', adminCheck);
    }

    console.log('\n🎉 Usuário administrativo configurado com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('- Email: mayconreis2030@gmail.com');
    console.log('- Senha: Brava1997');
    console.log('- Nome: Desenvolvedor');
    console.log('- Nível: super_admin');
    console.log('\n🔗 Acesse o painel administrativo em: http://localhost:5173/admin');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTableAndAdmin();