require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔧 Aplicando migração admin_users...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241201000000_create_admin_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar a migração
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Erro ao aplicar migração:', error);
      return false;
    }
    
    console.log('✅ Migração aplicada com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

async function createAdminRecord() {
  try {
    console.log('👤 Criando registro administrativo...');
    
    // Buscar o usuário criado
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError);
      return false;
    }
    
    const adminUser = users.users.find(user => user.email === 'mayconreis2030@gmail.com');
    
    if (!adminUser) {
      console.error('❌ Usuário não encontrado');
      return false;
    }
    
    // Inserir registro na tabela admin_users
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        user_id: adminUser.id,
        name: 'Desenvolvedor',
        access_level: 'super_admin',
        is_active: true
      });
    
    if (error) {
      console.error('❌ Erro ao criar registro administrativo:', error);
      return false;
    }
    
    console.log('✅ Registro administrativo criado com sucesso!');
    console.log(`📧 Email: mayconreis2030@gmail.com`);
    console.log(`🔑 Senha: Brava1997`);
    console.log(`👑 Acesso: Super Admin`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Configurando acesso administrativo...\n');
  
  const migrationSuccess = await applyMigration();
  
  if (migrationSuccess) {
    await createAdminRecord();
  }
  
  console.log('\n🎉 Processo concluído!');
}

main();