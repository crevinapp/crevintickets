import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔧 Criando estrutura administrativa...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY estão definidas');
  process.exit(1);
}

// Cria cliente Supabase com chave anon
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminStructure() {
  try {
    console.log('📋 Informações do administrador:');
    console.log('- Email: mayconreis2030@gmail.com');
    console.log('- Nome: Desenvolvedor');
    console.log('- Acesso: Máximo (super_admin)\n');

    // Primeiro, vamos tentar fazer login para verificar se o usuário já existe
    console.log('🔍 Verificando se o usuário já existe...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'mayconreis2030@gmail.com',
      password: 'Brava1997'
    });

    if (loginData?.user) {
      console.log('✅ Usuário já existe e pode fazer login!');
      console.log(`   ID do usuário: ${loginData.user.id}`);
      
      // Verificar se já é admin
      const { data: adminData, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', loginData.user.id)
        .single();

      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        console.log('⚠️ Erro ao verificar status de admin:', adminCheckError.message);
      }

      if (adminData) {
        console.log('✅ Usuário já é administrador');
        console.log(`   Nível de acesso: ${adminData.access_level}`);
        console.log(`   Status: ${adminData.is_active ? 'Ativo' : 'Inativo'}`);
      } else {
        console.log('ℹ️ Usuário existe mas não é administrador ainda');
        console.log('📝 Para tornar este usuário administrador, você precisa:');
        console.log('   1. Criar a tabela admin_users no Supabase');
        console.log('   2. Inserir o registro administrativo manualmente');
      }

      // Fazer logout
      await supabase.auth.signOut();
      
    } else if (loginError) {
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('❌ Usuário não existe ou senha incorreta');
        console.log('📝 Para criar o usuário administrativo, você precisa:');
        console.log('   1. Acessar o painel do Supabase');
        console.log('   2. Ir em Authentication > Users');
        console.log('   3. Criar o usuário manualmente com:');
        console.log('      - Email: mayconreis2030@gmail.com');
        console.log('      - Senha: Brava1997');
        console.log('   4. Executar este script novamente');
      } else {
        console.log('❌ Erro ao tentar fazer login:', loginError.message);
      }
    }

    console.log('\n🏗️ Verificando estrutura de tabelas...');
    
    // Verificar se a tabela admin_users existe
    const { data: tables, error: tableError } = await supabase
      .from('admin_users')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      if (tableError.code === 'PGRST106') {
        console.log('❌ Tabela admin_users não existe');
        console.log('📝 SQL para criar a tabela:');
        console.log(`
-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'admin' CHECK (access_level IN ('admin', 'super_admin', 'moderator')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admin users can read admin_users"
ON public.admin_users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);
        `);
      } else {
        console.log('⚠️ Erro ao verificar tabela admin_users:', tableError.message);
      }
    } else {
      console.log('✅ Tabela admin_users existe');
    }

    console.log('\n📋 Resumo das ações necessárias:');
    console.log('1. ✅ Configuração do Supabase verificada');
    console.log('2. 📝 Criar usuário no painel do Supabase (se não existir)');
    console.log('3. 📝 Criar tabela admin_users (se não existir)');
    console.log('4. 📝 Inserir registro administrativo');
    
    console.log('\n🔗 Links úteis:');
    console.log(`   Painel Supabase: https://supabase.com/dashboard/project/${process.env.VITE_SUPABASE_PROJECT_ID}`);
    console.log('   Authentication: https://supabase.com/dashboard/project/' + process.env.VITE_SUPABASE_PROJECT_ID + '/auth/users');
    console.log('   SQL Editor: https://supabase.com/dashboard/project/' + process.env.VITE_SUPABASE_PROJECT_ID + '/sql');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
}

createAdminStructure();