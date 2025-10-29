import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Criando usuário administrativo...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

// Cria cliente Supabase com service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('📋 Dados do administrador:');
    console.log('- Email: mayconreis2030@gmail.com');
    console.log('- Nome: Desenvolvedor');
    console.log('- Acesso: Máximo (super_admin)\n');

    // 1. Primeiro, criar as tabelas necessárias
    console.log('🏗️ Criando estrutura de administradores...');
    
    const createTableQuery = `
      -- Create admin_users table if not exists
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

      -- Enable RLS on admin_users
      ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

      -- Create function to check if user is admin
      CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.admin_users 
          WHERE user_id = user_uuid 
          AND is_active = true
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: tableError } = await supabase.rpc('exec', { sql: createTableQuery });
    if (tableError) {
      console.log('⚠️ Aviso ao criar tabela:', tableError.message);
    } else {
      console.log('✅ Estrutura de administradores criada');
    }

    // 2. Criar o usuário no auth
    console.log('👤 Criando usuário de autenticação...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'mayconreis2030@gmail.com',
      password: 'Brava1997',
      email_confirm: true,
      user_metadata: {
        name: 'Desenvolvedor',
        role: 'super_admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Usuário já existe, tentando obter dados...');
        
        // Tentar obter o usuário existente
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          throw listError;
        }
        
        const existingUser = users.users.find(u => u.email === 'mayconreis2030@gmail.com');
        if (existingUser) {
          console.log('✅ Usuário encontrado:', existingUser.id);
          
          // Verificar se já é admin
          const { data: adminData, error: adminCheckError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', existingUser.id)
            .single();

          if (adminCheckError && adminCheckError.code !== 'PGRST116') {
            throw adminCheckError;
          }

          if (adminData) {
            console.log('✅ Usuário já é administrador');
            console.log(`   Nível de acesso: ${adminData.access_level}`);
            console.log(`   Status: ${adminData.is_active ? 'Ativo' : 'Inativo'}`);
            return;
          }

          // Adicionar como admin
          const { error: insertError } = await supabase
            .from('admin_users')
            .insert({
              user_id: existingUser.id,
              name: 'Desenvolvedor',
              access_level: 'super_admin',
              is_active: true
            });

          if (insertError) {
            throw insertError;
          }

          console.log('✅ Usuário existente promovido a super administrador!');
          return;
        }
      } else {
        throw authError;
      }
    }

    if (authData?.user) {
      console.log('✅ Usuário de autenticação criado:', authData.user.id);

      // 3. Adicionar à tabela de administradores
      console.log('🔐 Adicionando privilégios administrativos...');
      
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          user_id: authData.user.id,
          name: 'Desenvolvedor',
          access_level: 'super_admin',
          is_active: true
        });

      if (adminError) {
        throw adminError;
      }

      console.log('✅ Privilégios administrativos concedidos!');
    }

    console.log('\n🎉 Usuário administrativo criado com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('   Email: mayconreis2030@gmail.com');
    console.log('   Senha: Brava1997');
    console.log('   Nível: Super Administrador');
    console.log('\n🔗 Acesse: http://localhost:8080/admin');

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrativo:', error.message);
    process.exit(1);
  }
}

createAdminUser();