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
    email: 'walrezende@hotmail.com',
    password: 'Admin@2025!',
    name: 'Waleria Afonso Rezende',
    access_level: 'super_admin'
  };

  console.log('📋 Dados do administrador:');
  console.log(`- Email: ${adminData.email}`);
  console.log(`- Nome: ${adminData.name}`);
  console.log(`- Nível de acesso: ${adminData.access_level}\n`);

  try {
    // 1. Verificar se o usuário já existe no auth
    console.log('🔍 Verificando se usuário já existe...');
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
      // 2. Criar usuário no auth
      console.log('📝 Criando usuário no sistema de autenticação...');
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true,
        user_metadata: {
          name: adminData.name
        }
      });

      if (createUserError) {
        console.error('❌ Erro ao criar usuário:', createUserError.message);
        return;
      }

      console.log('✅ Usuário criado no sistema de autenticação');
      userId = newUser.user.id;
    }

    // 3. Verificar se já existe na tabela admin_users
    console.log('🔍 Verificando se já é administrador...');
    const { data: existingAdmin, error: checkAdminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingAdmin) {
      console.log('✅ Usuário já é administrador');
      console.log(`- Nível atual: ${existingAdmin.access_level || 'admin'}`);
      console.log(`- Status: ${existingAdmin.is_active ? 'Ativo' : 'Inativo'}`);
      
      // Atualizar se necessário
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          access_level: adminData.access_level,
          is_active: true 
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Erro ao atualizar administrador:', updateError.message);
      } else {
        console.log('✅ Dados do administrador atualizados');
      }
    } else {
      // 4. Inserir na tabela admin_users (usando apenas campos básicos)
      console.log('📝 Adicionando privilégios administrativos...');
      
      // Primeiro, vamos tentar inserir com campos mínimos
      const insertData = {
        user_id: userId,
        email: adminData.email,
        access_level: adminData.access_level,
        is_active: true
      };

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert(insertData);

      if (insertError) {
        console.error('❌ Erro ao inserir administrador:', insertError.message);
        
        // Tentar com campos ainda mais básicos
        console.log('🔄 Tentando inserção com campos básicos...');
        const basicData = {
          user_id: userId,
          email: adminData.email
        };
        
        const { error: basicInsertError } = await supabase
          .from('admin_users')
          .insert(basicData);
          
        if (basicInsertError) {
          console.error('❌ Erro na inserção básica:', basicInsertError.message);
          return;
        } else {
          console.log('✅ Privilégios administrativos adicionados (básicos)');
        }
      } else {
        console.log('✅ Privilégios administrativos adicionados');
      }
    }

    console.log('\n🎉 Usuário administrativo configurado com sucesso!');
    console.log('📋 Resumo:');
    console.log(`- Email: ${adminData.email}`);
    console.log(`- Nome: ${adminData.name}`);
    console.log(`- Nível de acesso: ${adminData.access_level}`);
    console.log(`- Status: Ativo`);
    console.log('\n✅ O usuário pode agora fazer login no sistema como administrador.');

    // Verificar o resultado final
    console.log('\n🔍 Verificação final...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (finalError) {
      console.log('❌ Erro na verificação final:', finalError.message);
    } else {
      console.log('✅ Administrador criado com sucesso:', finalCheck);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

createAdminUser();