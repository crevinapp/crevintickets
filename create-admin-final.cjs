require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔧 Iniciando criação do usuário administrativo...\n');

  const adminData = {
    email: 'mayconreis2030@gmail.com',
    password: 'Brava1997',
    name: 'Desenvolvedor',
    access_level: 'super_admin'
  };

  console.log('📋 Dados do administrador:');
  console.log(`- Email: ${adminData.email}`);
  console.log(`- Nome: ${adminData.name}`);
  console.log(`- Nível de acesso: ${adminData.access_level}\n`);

  try {
    // 1. Verificar se a tabela admin_users existe
    console.log('🔍 Verificando estrutura da tabela admin_users...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      console.log('📝 Criando tabela admin_users...');
      
      const createTableSQL = `
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

        -- Habilitar RLS
        ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

        -- Criar função para verificar se é admin
        CREATE OR REPLACE FUNCTION public.is_admin()
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() 
            AND is_active = true
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Criar função para obter nível de acesso
        CREATE OR REPLACE FUNCTION public.get_admin_access_level()
        RETURNS TEXT AS $$
        DECLARE
          access_level TEXT;
        BEGIN
          SELECT au.access_level INTO access_level
          FROM public.admin_users au
          WHERE au.user_id = auth.uid() AND au.is_active = true;
          
          RETURN COALESCE(access_level, 'none');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Políticas RLS para admin_users
        CREATE POLICY "Admins can read admin_users" ON public.admin_users
          FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM public.admin_users 
              WHERE user_id = auth.uid() 
              AND access_level = 'super_admin' 
              AND is_active = true
            )
          );

        -- Trigger para updated_at
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_admin_users_updated_at
          BEFORE UPDATE ON public.admin_users
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.log('📝 Tentando criar tabela com método alternativo...');
        // Tentar criar a tabela diretamente
        const { error: directError } = await supabase
          .from('admin_users')
          .insert([]);
        
        if (directError && !directError.message.includes('new row violates')) {
          console.error('❌ Erro ao criar estrutura:', directError.message);
        }
      }
    }

    console.log('✅ Estrutura da tabela verificada\n');

    // 2. Verificar se o usuário já existe no auth
    console.log('🔍 Verificando se o usuário já existe...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const existingUser = existingUsers.users.find(user => user.email === adminData.email);
    let userId;

    if (existingUser) {
      console.log('✅ Usuário já existe no sistema de autenticação');
      userId = existingUser.id;
    } else {
      // 3. Criar usuário no auth
      console.log('📝 Criando usuário no sistema de autenticação...');
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true
      });

      if (createUserError) {
        console.error('❌ Erro ao criar usuário:', createUserError.message);
        return;
      }

      console.log('✅ Usuário criado no sistema de autenticação');
      userId = newUser.user.id;
    }

    // 4. Verificar se já existe na tabela admin_users
    console.log('🔍 Verificando se já é administrador...');
    const { data: existingAdmin, error: checkAdminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      console.log('✅ Usuário já é administrador');
      console.log(`- Nível atual: ${existingAdmin.access_level}`);
      console.log(`- Status: ${existingAdmin.is_active ? 'Ativo' : 'Inativo'}`);
      
      if (existingAdmin.access_level !== adminData.access_level) {
        console.log('📝 Atualizando nível de acesso...');
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ 
            access_level: adminData.access_level,
            name: adminData.name,
            is_active: true 
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Erro ao atualizar administrador:', updateError.message);
        } else {
          console.log('✅ Nível de acesso atualizado');
        }
      }
    } else {
      // 5. Inserir na tabela admin_users
      console.log('📝 Adicionando privilégios administrativos...');
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert([{
          user_id: userId,
          name: adminData.name,
          access_level: adminData.access_level,
          is_active: true
        }]);

      if (insertError) {
        console.error('❌ Erro ao inserir administrador:', insertError.message);
        return;
      }

      console.log('✅ Privilégios administrativos adicionados');
    }

    console.log('\n🎉 Usuário administrativo configurado com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log(`- Email: ${adminData.email}`);
    console.log(`- Senha: ${adminData.password}`);
    console.log(`- Nome: ${adminData.name}`);
    console.log(`- Nível: ${adminData.access_level}`);
    console.log('\n🔗 Acesse o painel administrativo em: http://localhost:5173/admin');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createAdminUser();